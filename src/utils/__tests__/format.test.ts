/**
 * 工具函数模块 - 单元测试。
 * 覆盖 format.ts 中所有导出函数。
 *
 * V2 变更：医师姓名不再必填，去掉相关测试用例。
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  getTodayStr,
  getDatePrefix,
  truncate,
  validatePrescriptionForm,
} from '../format';

describe('formatDate', () => {
  it('应该格式化 Date 对象为 YYYY-MM-DD', () => {
    const date = new Date(2025, 0, 15); // 2025-01-15
    expect(formatDate(date)).toBe('2025-01-15');
  });

  it('应该格式化日期字符串为 YYYY-MM-DD', () => {
    expect(formatDate('2025-06-30')).toBe('2025-06-30');
  });

  it('应该正确处理月份和日期补零', () => {
    const date = new Date(2025, 0, 5); // 2025-01-05
    expect(formatDate(date)).toBe('2025-01-05');
  });

  it('应该正确处理年末日期', () => {
    const date = new Date(2025, 11, 31); // 2025-12-31
    expect(formatDate(date)).toBe('2025-12-31');
  });
});

describe('formatDateTime', () => {
  it('应该格式化 Date 对象为 YYYY-MM-DD HH:mm:ss', () => {
    const date = new Date(2025, 5, 15, 14, 30, 45); // 2025-06-15 14:30:45
    expect(formatDateTime(date)).toBe('2025-06-15 14:30:45');
  });

  it('应该正确补零时分秒', () => {
    const date = new Date(2025, 0, 1, 8, 5, 3); // 2025-01-01 08:05:03
    expect(formatDateTime(date)).toBe('2025-01-01 08:05:03');
  });

  it('应该格式化日期字符串', () => {
    const result = formatDateTime('2025-03-20T10:30:00');
    expect(result).toBe('2025-03-20 10:30:00');
  });
});

describe('getTodayStr', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该返回今天日期的 YYYY-MM-DD 格式', () => {
    const mockDate = new Date(2025, 6, 22); // 2025-07-22
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    expect(getTodayStr()).toBe('2025-07-22');
  });
});

describe('getDatePrefix', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该返回 YYYYMMDD 格式的日期前缀', () => {
    const mockDate = new Date(2025, 6, 22); // 2025-07-22
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    expect(getDatePrefix()).toBe('20250722');
  });

  it('应该正确补零月份和日期', () => {
    const mockDate = new Date(2025, 0, 5); // 2025-01-05
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    expect(getDatePrefix()).toBe('20250105');
  });
});

describe('truncate', () => {
  it('应该原样返回短字符串', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('应该截断超长字符串并添加省略号', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello worl...');
  });

  it('应该处理空字符串', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('应该处理 null/undefined 输入', () => {
    expect(truncate(null as unknown as string, 10)).toBe('');
    expect(truncate(undefined as unknown as string, 10)).toBe('');
  });

  it('应该在长度等于 maxLen 时返回原字符串', () => {
    expect(truncate('1234567890', 10)).toBe('1234567890');
  });
});

describe('validatePrescriptionForm', () => {
  const validFormData = {
    prescription_no: '202507220001',
    patient_name: '张三',
    patient_gender: '男',
    department: '内科',
    doctor_name: '李医生',
    doctor_department: '中医科',
    prescription_date: '2025-07-22',
    medicines: [{ medicine_name: '阿莫西林' }],
  };

  it('应该通过完整有效数据的验证', () => {
    const result = validatePrescriptionForm(validFormData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // V2: 医师姓名为空时应该通过验证（不再必填）
  it('V2: 医师姓名为空时应该通过验证', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      doctor_name: '',
    });
    expect(result.valid).toBe(true);
  });

  it('应该在患者姓名为空时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      patient_name: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('患者姓名不能为空');
  });

  it('应该在患者姓名只有空白时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      patient_name: '   ',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('患者姓名不能为空');
  });

  it('应该在患者姓名超过50个字符时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      patient_name: '张'.repeat(51),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('患者姓名不能超过50个字符');
  });

  it('应该在性别为无效值时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      patient_gender: '未知',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('请选择性别（男/女）');
  });

  it('应该在性别为空时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      patient_gender: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('请选择性别（男/女）');
  });

  it('应该在科别为空时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      department: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('科别不能为空');
  });

  it('应该在科室为空时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      doctor_department: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('科室不能为空');
  });

  it('应该在开具日期为空时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      prescription_date: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('开具日期不能为空');
  });

  it('应该在没有药品时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      medicines: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('请至少添加一种药品');
  });

  it('应该在有药品但名称为空时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      medicines: [{ medicine_name: '' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  it('应该在有药品但名称为空白时返回错误', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      medicines: [{ medicine_name: '   ' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('药品名称不能为空');
  });

  it('应该同时返回多个验证错误', () => {
    const result = validatePrescriptionForm({
      prescription_no: '',
      patient_name: '',
      patient_gender: '',
      department: '',
      doctor_name: '',
      doctor_department: '',
      prescription_date: '',
      medicines: [],
    });
    expect(result.valid).toBe(false);
    // V2: 新增 prescription_no 必填后，最少6个错误
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
  });

  it('应该接受性别为"女"', () => {
    const result = validatePrescriptionForm({
      ...validFormData,
      patient_gender: '女',
    });
    expect(result.valid).toBe(true);
  });
});
