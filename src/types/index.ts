/**
 * 处方打印程序 — 类型定义模块。
 * 包含处方、药品、表单数据、IPC API、分页结果等所有共享类型。
 *
 * V2 变更：
 * - Medicine 新增 usage_method 字段（用法），dosage 语义变为"用量"
 * - Prescription.doctor_name 改为可选（不填时打印显示下划线）
 * - PrescriptionFormData 同步 doctor_name 可选
 */

// ===== 药品明细 =====

/** 药品明细实体 */
export interface Medicine {
  id?: number;
  prescription_id?: number;
  medicine_name: string;
  specification: string;
  /** 用量（如 "每日3次，每次1片"） */
  dosage: string;
  /** 用法（选自 USAGE_METHOD_OPTIONS，如 "口服"、"输液"） */
  usage_method: string;
  instructions: string;
  sort_order: number;
}

// ===== 处方主记录 =====

/** 处方主记录实体 */
export interface Prescription {
  id?: number;
  prescription_no: string;
  patient_name: string;
  patient_gender: string;
  patient_age?: string;
  department: string;
  patient_phone: string;
  patient_address: string;
  clinical_diagnosis: string;
  prescription_date: string;
  /** 医师姓名（非必填，为空时打印显示下划线） */
  doctor_name?: string;
  doctor_department: string;
  created_at?: string;
}

/** 含药品明细的处方完整对象 */
export interface PrescriptionWithMedicines extends Prescription {
  medicines: Medicine[];
}

// ===== 表单数据（渲染进程内使用） =====

/** 处方表单数据（含药品列表，用于状态管理） */
export interface PrescriptionFormData {
  prescription_no: string;
  patient_name: string;
  patient_gender: string;
  patient_age: string;
  department: string;
  patient_phone: string;
  patient_address: string;
  clinical_diagnosis: string;
  prescription_date: string;
  /** 医师姓名（非必填，可为空字符串） */
  doctor_name?: string;
  doctor_department: string;
  medicines: Medicine[];
}

/** 表单默认值 */
export const DEFAULT_FORM_DATA: PrescriptionFormData = {
  prescription_no: '',
  patient_name: '',
  patient_gender: '',
  patient_age: '',
  department: '',
  patient_phone: '',
  patient_address: '',
  clinical_diagnosis: '预防措施',
  prescription_date: new Date().toISOString().slice(0, 10),
  doctor_name: '',
  doctor_department: '',
  medicines: [],
};

// ===== 分页查询 =====

/** 处方列表查询参数 */
export interface PrescriptionQueryParams {
  page: number;
  pageSize: number;
  patientName?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** 分页结果 */
export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== 保存请求载荷 =====

/** 保存处方时传给主进程的载荷 */
export interface SavePrescriptionPayload {
  prescription: Omit<Prescription, 'id' | 'created_at'>;
  medicines: Omit<Medicine, 'id' | 'prescription_id'>[];
}

// ===== IPC API 类型（渲染进程侧 window.electronAPI） =====

/** 通过 contextBridge 暴露的 Electron API 接口 */
export interface ElectronAPI {
  generatePrescriptionNo: () => Promise<string>;
  getNextSeq: (datePrefix: string) => Promise<number>;
  savePrescription: (payload: SavePrescriptionPayload) => Promise<PrescriptionWithMedicines>;
  getPrescriptions: (params: PrescriptionQueryParams) => Promise<PaginatedResult<Prescription>>;
  getPrescriptionDetail: (id: number) => Promise<PrescriptionWithMedicines>;
  printDirect: (prescriptionData: PrescriptionWithMedicines) => Promise<void>;
}

// ===== 扩展 Window 类型 =====

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// ===== 处方上下文 Action 类型 =====

export type PrescriptionAction =
  | { type: 'SET_FIELD'; field: keyof PrescriptionFormData; value: string }
  | { type: 'ADD_MEDICINE' }
  | { type: 'REMOVE_MEDICINE'; index: number }
  | { type: 'UPDATE_MEDICINE'; index: number; field: keyof Medicine; value: string | number }
  | { type: 'CLEAR_FORM' }
  | { type: 'RESET_MEDICINES' }
  | { type: 'SET_PRESCRIPTION_NO'; prescription_no: string }
  | { type: 'LOAD_PRESCRIPTION'; data: PrescriptionWithMedicines };
