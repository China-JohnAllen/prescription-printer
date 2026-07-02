/**
 * 打印处理模块 — 创建隐藏 BrowserWindow 并执行 A5 处方打印。
 *
 * V2 变更：
 * - 药品表格："用法用量"单列 → "用量" + "用法"两列
 * - doctor_name 为空时显示 "____________"
 * - CSS @page { size: A5 } 锁定 A5 纸张
 */

import { BrowserWindow } from 'electron';

/**
 * 生成处方笺的完整 HTML 内容。
 * 按照 A5 纸张比例（148mm × 210mm）排版。
 *
 * @param {unknown} data - 处方完整数据（含药品列表）
 * @returns {string} 处方 HTML 字符串
 */
function generatePrescriptionHtml(data: unknown): string {
  const prescription = data as Record<string, unknown>;
  const medicines = (prescription.medicines as Array<Record<string, unknown>>) ?? [];

  // 医师姓名：空时显示 6 个下划线
  const doctorName = String(prescription.doctor_name ?? '').trim();
  const doctorNameDisplay = doctorName || '____________';

  // 生成药品块 HTML — 无需表头，两行显示
  const medicineBlocks = medicines
    .map(
      (med, idx) => `
    <div class="med-block">
      <div class="med-row-name">
        <span class="med-name">${escapeHtml(String(med.medicine_name ?? ''))}</span>
        <span class="med-spec">${escapeHtml(String(med.specification ?? ''))}</span>
      </div>
      <div class="med-row-detail">
        <span>用量：${escapeHtml(String(med.dosage ?? ''))}</span>
        <span>用法：${escapeHtml(String(med.usage_method ?? ''))}</span>
        <span>医嘱：${escapeHtml(String(med.instructions ?? ''))}</span>
      </div>
    </div>
    ${idx < medicines.length - 1 ? '<hr class="med-sep">' : ''}`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>处方笺</title>
  <style>
    @page { size: A5; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "STKaiti", "KaiTi", "华文楷体", serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 8mm;
      width: 148mm;
    }
    .prescription {
      border: 1.5px solid #000;
      padding: 6mm 6mm;
      min-height: 190mm;
      display: flex;
      flex-direction: column;
    }
    .header {
      text-align: center;
      margin-bottom: 2mm;
    }
    .header .hospital {
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 2pt;
      margin-bottom: 1.5mm;
    }
    .header .title {
      font-size: 18pt;
      font-weight: bold;
      letter-spacing: 4pt;
    }
    .header .divider {
      border: none;
      border-top: 1px solid #000;
      margin: 4mm 0 0 0;
    }
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .info-row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 4mm;
      font-size: 12pt;
      line-height: 2.2;
    }
    .info-row .label {
      font-weight: bold;
      margin-right: 1mm;
    }
    .info-row .value {
      margin-right: 8mm;
      border-bottom: 1px solid #000;
      min-width: 30mm;
      padding: 0 1mm;
    }
    .info-row .value.wide {
      min-width: 50mm;
    }
    .med-divider {
      border: none;
      border-top: 1px solid #000;
      margin: 0 0 5mm 0;
    }
    .med-area {
      text-align: left;
    }
    .med-block {
      margin-bottom: 4mm;
      font-size: 12pt;
      line-height: 2.0;
      text-align: left;
    }
    .med-row-name {
      font-weight: bold;
      margin-bottom: 1.5mm;
    }
    .med-row-name .med-name {
      font-size: 14pt;
    }
    .med-row-name .med-spec {
      font-size: 12pt;
      font-weight: normal;
      margin-left: 4mm;
    }
    .med-row-detail {
      font-size: 12pt;
      padding-left: 2mm;
    }
    .med-row-detail span {
      margin-right: 6mm;
    }
    .med-sep {
      border: none;
      border-top: 0.5px dashed #999;
      margin: 2.5mm 0;
    }
    .footer {
      margin-top: auto;
      padding-bottom: 3mm;
      padding-top: 4mm;
      font-size: 12pt;
      line-height: 2;
    }
    .footer .sign-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2mm;
    }
    .footer .sign-item {
      min-width: 50mm;
      padding: 0 2mm;
      border-bottom: 1px solid #000;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="prescription">
    <div class="header">
      <div class="hospital">安康高新区社区卫生服务中心</div>
      <div class="title">处 方 笺</div>
      <hr class="divider">
    </div>

    <div class="content-area">

    <div class="info-row">
      <span class="label">处方编号：</span>
      <span class="value">${escapeHtml(String(prescription.prescription_no ?? ''))}</span>
      <span class="label">开具日期：</span>
      <span class="value">${escapeHtml(String(prescription.prescription_date ?? ''))}</span>
    </div>

    <div class="info-row">
      <span class="label">姓名：</span>
      <span class="value">${escapeHtml(String(prescription.patient_name ?? ''))}</span>
      <span class="label">性别：</span>
      <span class="value">${escapeHtml(String(prescription.patient_gender ?? ''))}</span>
      <span class="label">年龄：</span>
      <span class="value">${escapeHtml(String(prescription.patient_age ?? ''))}</span>
      <span class="label">科别：</span>
      <span class="value">${escapeHtml(String(prescription.department ?? ''))}</span>
    </div>

    <div class="info-row">
      <span class="label">临床诊断：</span>
      <span class="value wide">${escapeHtml(String(prescription.clinical_diagnosis ?? ''))}</span>
    </div>

    <div class="info-row">
      <span class="label">电话：</span>
      <span class="value">${escapeHtml(String(prescription.patient_phone ?? ''))}</span>
      <span class="label">住址：</span>
      <span class="value wide">${escapeHtml(String(prescription.patient_address ?? ''))}</span>
    </div>

    <hr class="med-divider">

    <div class="med-area">
    ${medicineBlocks}
    </div>

    </div>

    <div class="footer">
      <div class="sign-row">
        <span class="label">医师：</span>
        <span class="sign-item">${escapeHtml(doctorNameDisplay)}</span>
        <span class="label">科室：</span>
        <span class="sign-item">${escapeHtml(String(prescription.doctor_department ?? ''))}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * HTML 转义函数，防止 XSS 攻击。
 *
 * @param {string} str - 原始字符串
 * @returns {string} 转义后的安全字符串
 */
function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/**
 * 创建隐藏的打印 BrowserWindow。
 * 加载处方 HTML 内容后返回窗口引用，由调用方触发打印。
 *
 * @param {unknown} prescriptionData - 处方数据
 * @returns {BrowserWindow} 隐藏的打印窗口
 */
export function createPrintWindow(prescriptionData: unknown): BrowserWindow {
  const html = generatePrescriptionHtml(prescriptionData);

  const printWindow = new BrowserWindow({
    width: 595,   // A5 宽度 (px @ 96dpi)
    height: 842,  // A5 高度 (px @ 96dpi)
    show: false,  // 隐藏窗口
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 使用 data URL 加载 HTML 内容，避免文件依赖
  printWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  );

  return printWindow;
}
