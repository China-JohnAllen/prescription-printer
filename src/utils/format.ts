/**
 * 工具函数模块 — 日期格式化、编号生成等辅助函数。
 *
 * V2 变更：
 * - validatePrescriptionForm：去掉 doctor_name 必填校验，新增 prescription_no 校验
 */

/**
 * 格式化日期为 YYYY-MM-DD 字符串。
 *
 * @param {Date | string} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 字符串。
 *
 * @param {Date | string} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取今天的日期字符串（YYYY-MM-DD）。
 *
 * @returns {string} 今天的日期
 */
export function getTodayStr(): string {
  return formatDate(new Date());
}

/**
 * 获取当前日期前缀（YYYYMMDD），用于处方编号生成。
 *
 * @returns {string} 日期前缀
 */
export function getDatePrefix(): string {
  const now = new Date();
  return (
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  );
}

/**
 * 截断字符串到指定长度，超出部分用省略号代替。
 *
 * @param {string} str - 原始字符串
 * @param {number} maxLen - 最大长度
 * @returns {string} 截断后的字符串
 */
export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/**
 * 验证处方表单数据的完整性。
 *
 * V2 变更：医师姓名不再必填。
 *
 * @param {object} formData - 处方表单数据
 * @returns {{ valid: boolean; errors: string[] }} 验证结果
 */
export function validatePrescriptionForm(formData: {
  prescription_no?: string;
  patient_name: string;
  patient_gender: string;
  department: string;
  doctor_name?: string;
  doctor_department: string;
  prescription_date: string;
  medicines: Array<{ medicine_name: string }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!formData.prescription_no || !formData.prescription_no.trim()) {
    errors.push('请先生成处方编号');
  }

  if (!formData.patient_name || !formData.patient_name.trim()) {
    errors.push('患者姓名不能为空');
  } else if (formData.patient_name.trim().length > 50) {
    errors.push('患者姓名不能超过50个字符');
  }

  if (!formData.patient_gender || !['男', '女'].includes(formData.patient_gender)) {
    errors.push('请选择性别（男/女）');
  }

  if (!formData.department || !formData.department.trim()) {
    errors.push('科别不能为空');
  }

  // V2: 医师姓名不再必填

  if (!formData.doctor_department || !formData.doctor_department.trim()) {
    errors.push('科室不能为空');
  }

  if (!formData.prescription_date) {
    errors.push('开具日期不能为空');
  }

  if (!formData.medicines || formData.medicines.length === 0) {
    errors.push('请至少添加一种药品');
  } else {
    const hasEmptyName = formData.medicines.some(
      (m) => !m.medicine_name || !m.medicine_name.trim()
    );
    if (hasEmptyName) {
      errors.push('药品名称不能为空');
    }
  }

  return { valid: errors.length === 0, errors };
}
