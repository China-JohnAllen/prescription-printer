import { contextBridge, ipcRenderer } from 'electron';

/**
 * 处方数据接口（preload 侧轻量定义，与渲染进程类型保持一致）
 *
 * V2 变更：
 * - PrescriptionInput.doctor_name 改为可选
 * - MedicineInput 新增 usage_method 字段
 */
interface PrescriptionInput {
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
}

interface MedicineInput {
  medicine_name: string;
  specification?: string;
  dosage?: string;
  usage_method?: string;
  instructions?: string;
  sort_order: number;
}

interface SavePrescriptionPayload {
  prescription: PrescriptionInput;
  medicines: MedicineInput[];
}

interface GetPrescriptionsParams {
  page: number;
  pageSize: number;
  patientName?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * 通过 contextBridge 暴露安全的 IPC API 给渲染进程。
 * 渲染进程通过 window.electronAPI 调用这些方法。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ---- 数据库操作 ----

  /** 生成新的处方编号 */
  generatePrescriptionNo: (): Promise<string> =>
    ipcRenderer.invoke('db:generate-prescription-no'),

  /** 获取指定日期前缀的下一个流水号 */
  getNextSeq: (datePrefix: string): Promise<number> =>
    ipcRenderer.invoke('db:get-next-seq', datePrefix),

  /** 保存处方（含药品明细），返回保存后的处方对象 */
  savePrescription: (payload: SavePrescriptionPayload): Promise<unknown> =>
    ipcRenderer.invoke('db:save-prescription', payload),

  /** 分页查询处方列表 */
  getPrescriptions: (params: GetPrescriptionsParams): Promise<{
    list: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> => ipcRenderer.invoke('db:get-prescriptions', params),

  /** 根据 ID 获取处方详情（含药品列表） */
  getPrescriptionDetail: (id: number): Promise<unknown> =>
    ipcRenderer.invoke('db:get-prescription-detail', id),

  // ---- 打印操作 ----

  /** 直接打印处方（弹出系统打印对话框） */
  printDirect: (prescriptionData: unknown): Promise<void> =>
    ipcRenderer.invoke('print:direct', prescriptionData),
});
