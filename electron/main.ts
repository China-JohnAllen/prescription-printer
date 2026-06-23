import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { initDatabase } from './database';
import { createPrintWindow } from './print-handler';

let mainWindow: BrowserWindow | null = null;

/** 创建主窗口 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: '疫苗开方系统 - 安康高新区社区卫生服务中心',
    // icon 不指定，使用 Electron 默认图标
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // 窗口美化
    autoHideMenuBar: true,
    backgroundColor: '#F5F7FA',
  });

  // 开发模式加载 Vite 开发服务器，生产模式加载打包文件
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 注册所有 IPC 处理器。
 * 将数据库操作和打印操作通过 ipcMain.handle 暴露给渲染进程。
 */
function registerIpcHandlers(): void {
  const { db, operations } = initDatabase();

  // ---- 数据库操作 ----

  /** 生成新的处方编号 */
  ipcMain.handle('db:generate-prescription-no', async () => {
    return operations.generatePrescriptionNo();
  });

  /** 获取指定日期前缀的下一个流水号 */
  ipcMain.handle('db:get-next-seq', async (_event, datePrefix: string) => {
    return operations.getNextSeq(datePrefix);
  });

  /** 保存处方（含药品明细），返回保存后的处方对象 */
  ipcMain.handle('db:save-prescription', async (_event, data: {
    prescription: {
      prescription_no: string;
      patient_name: string;
      patient_gender: string;
      department: string;
      patient_phone?: string;
      patient_address?: string;
      clinical_diagnosis: string;
      prescription_date: string;
      doctor_name?: string;
      doctor_department: string;
    };
    medicines: Array<{
      medicine_name: string;
      specification?: string;
      dosage?: string;
      usage_method?: string;
      instructions?: string;
      sort_order: number;
    }>;
  }) => {
    try {
      console.log('[main] db:save-prescription 收到请求:', data.prescription.prescription_no);
      const result = operations.savePrescription(data.prescription, data.medicines);
      console.log('[main] db:save-prescription 保存成功, id=', (result as { id?: number })?.id);
      return result;
    } catch (err) {
      console.error('[main] db:save-prescription 保存失败:', err);
      throw err;
    }
  });

  /** 分页查询处方列表（支持姓名模糊搜索、日期范围筛选） */
  ipcMain.handle('db:get-prescriptions', async (_event, params: {
    page: number;
    pageSize: number;
    patientName?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return operations.getPrescriptions(params);
  });

  /** 根据 ID 获取处方详情（含药品列表） */
  ipcMain.handle('db:get-prescription-detail', async (_event, id: number) => {
    return operations.getPrescriptionDetail(id);
  });

  // ---- 打印操作 ----

  /** 直接打印处方 */
  ipcMain.handle('print:direct', async (_event, prescriptionData: unknown) => {
    const printWindow = createPrintWindow(prescriptionData);
    // 等待窗口内容加载完成后执行打印
    return new Promise<void>((resolve, reject) => {
      if (!printWindow) {
        reject(new Error('无法创建打印窗口'));
        return;
      }
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print(
          {
            silent: false,       // 显示系统打印对话框
            printBackground: true,
            pageSize: 'A5',
            margins: {
              marginType: 'custom',
              top: '5mm',
              bottom: '5mm',
              left: '5mm',
              right: '5mm',
            },
          },
          (success: boolean, failureReason: string) => {
            // 打印完成后关闭隐藏窗口
            if (printWindow && !printWindow.isDestroyed()) {
              printWindow.close();
            }
            if (success) {
              resolve();
            } else {
              reject(new Error(failureReason || '打印取消或失败'));
            }
          }
        );
      });
    });
  });
}

// ---- 应用生命周期 ----

app.whenReady().then(() => {
  try {
    registerIpcHandlers();
  } catch (err) {
    console.error('[main] 数据库初始化失败，应用将以只读模式运行:', err);
    // 即使数据库失败，也继续创建窗口（降级运行）
  }
  createMainWindow();

  app.on('activate', () => {
    // macOS: 点击 dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
