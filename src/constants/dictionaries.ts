/**
 * 字典常量模块 — 科别、用法、所在科室、药品的下拉选项。
 * 所有选项均为前端常量，不可由用户自定义输入。
 */

/** 科别下拉选项 */
export const DEPARTMENT_OPTIONS = [
  { value: '内科', label: '内科' },
  { value: '外科', label: '外科' },
  { value: '中医科', label: '中医科' },
  { value: '儿科', label: '儿科' },
  { value: '妇科', label: '妇科' },
  { value: '体检科', label: '体检科' },
] as const;

/** 用法下拉选项 */
export const USAGE_METHOD_OPTIONS = [
  { value: '肌内注射', label: '肌内注射' },
  { value: '皮下注射', label: '皮下注射' },
  { value: '口服', label: '口服' },
] as const;

/** 用量下拉选项 */
export const DOSAGE_OPTIONS = [
  { value: '1支', label: '1支' },
  { value: '2支', label: '2支' },
] as const;

/** 所在科室下拉选项 */
export const DOCTOR_DEPARTMENT_OPTIONS = [
  { value: '内科门诊', label: '内科门诊' },
  { value: '外科门诊', label: '外科门诊' },
  { value: '中医科门诊', label: '中医科门诊' },
  { value: '儿科门诊', label: '儿科门诊' },
  { value: '妇科门诊', label: '妇科门诊' },
  { value: '体检科', label: '体检科' },
] as const;

/** 药品字典项 */
export interface MedicineDictItem {
  name: string;
  specification: string;
  usage_method: string;
  dosage: string;
}

/** 药品字典（疫苗明细） */
export const MEDICINE_DICT: MedicineDictItem[] = [
  { name: '乙肝疫苗(CHO)', specification: '20μg/1.0ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '乙肝疫苗(汉逊酵母)', specification: '10μg/0.5ml/瓶', usage_method: '肌内注射', dosage: '1支' },
  { name: '水痘疫苗', specification: '0.5ml/瓶', usage_method: '皮下注射', dosage: '1支' },
  { name: '带状疱疹疫苗(CHO细胞)', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '23价肺炎球菌疫苗', specification: '0.5ml/瓶', usage_method: '肌内注射', dosage: '1支' },
  { name: '9价HPV疫苗', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '2价HPV疫苗(大肠杆菌)', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '脊灰灭活疫苗(Sabin株)', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '流脑A+C结合', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: 'ACYW135流脑疫苗(多糖)', specification: '200μg/0.5ml', usage_method: '皮下注射', dosage: '1支' },
  { name: '甲肝灭活疫苗(二倍体)', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: 'Hib疫苗', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '轮状病毒疫苗', specification: '3.0ml/瓶', usage_method: '口服', dosage: '1支' },
  { name: '五价轮状病毒疫苗', specification: '2.0ml/支', usage_method: '口服', dosage: '1支' },
  { name: '13价肺炎疫苗', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: 'DTaP-Hib四联疫苗', specification: '0.5ml/瓶+10μg/0.5ml/瓶', usage_method: '肌内注射', dosage: '1支' },
  { name: 'DTaP-IPV-Hib五联疫苗', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: 'EV71型疫苗(Vero细胞)', specification: '0.5ml/瓶', usage_method: '肌内注射', dosage: '1支' },
  { name: '人狂犬病疫苗', specification: '0.5ml/支', usage_method: '肌内注射', dosage: '1支' },
  { name: '人狂犬病疫苗(冻干)', specification: '0.5ml/瓶', usage_method: '肌内注射', dosage: '1支' },
];

/** 根据药品名称查找字典项 */
export function findMedicineByName(name: string): MedicineDictItem | undefined {
  return MEDICINE_DICT.find((m) => m.name === name);
}
