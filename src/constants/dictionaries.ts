/**
 * 字典常量模块 — 科别、用法、所在科室的下拉选项。
 * 所有选项均为前端常量，不可由用户自定义输入。
 */

/** 科别下拉选项 */
export const DEPARTMENT_OPTIONS = [
  { value: '内科', label: '内科' },
  { value: '外科', label: '外科' },
] as const;

/** 用法下拉选项 */
export const USAGE_METHOD_OPTIONS = [
  { value: '口服', label: '口服' },
  { value: '输液', label: '输液' },
  { value: '治疗', label: '治疗' },
  { value: '注射', label: '注射' },
  { value: '雾化', label: '雾化' },
  { value: '其他', label: '其他' },
] as const;

/** 所在科室下拉选项 */
export const DOCTOR_DEPARTMENT_OPTIONS = [
  { value: '内科门诊', label: '内科门诊' },
  { value: '外科门诊', label: '外科门诊' },
  { value: '预防接种科', label: '预防接种科' },
  { value: '体检科', label: '体检科' },
] as const;
