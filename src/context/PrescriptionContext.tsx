/**
 * 处方状态管理 — React Context + useReducer。
 *
 * 管理处方表单的所有状态：患者信息、诊断信息、药品列表、医师信息。
 * 提供添加/删除药品、修改字段、清空表单等操作。
 *
 * V2 变更：
 * - ADD_MEDICINE 新增 usage_method: '' 字段
 * - LOAD_PRESCRIPTION 映射药品时保留 usage_method
 */

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import {
  type PrescriptionFormData,
  type Medicine,
  type PrescriptionWithMedicines,
  type PrescriptionAction,
  DEFAULT_FORM_DATA,
} from '../types';

// ===== Context 类型 =====

interface PrescriptionContextValue {
  /** 当前处方表单数据 */
  formData: PrescriptionFormData;
  /** 设置表单字段值 */
  setField: (field: keyof PrescriptionFormData, value: string) => void;
  /** 添加空药品行 */
  addMedicine: () => void;
  /** 删除指定位置的药品 */
  removeMedicine: (index: number) => void;
  /** 更新指定药品的字段 */
  updateMedicine: (index: number, field: keyof Medicine, value: string | number) => void;
  /** 设置处方编号 */
  setPrescriptionNo: (no: string) => void;
  /** 从已有处方加载数据（编辑/回显） */
  loadPrescription: (data: PrescriptionWithMedicines) => void;
  /** 清空所有表单字段 */
  clearForm: () => void;
  /** 重置药品列表（保留其他字段） */
  resetMedicines: () => void;
}

// ===== Reducer =====

function prescriptionReducer(
  state: PrescriptionFormData,
  action: PrescriptionAction
): PrescriptionFormData {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'ADD_MEDICINE': {
      const newMedicine: Medicine = {
        medicine_name: '',
        specification: '',
        dosage: '',
        usage_method: '',
        instructions: '',
        sort_order: state.medicines.length,
      };
      return { ...state, medicines: [...state.medicines, newMedicine] };
    }

    case 'REMOVE_MEDICINE': {
      const updated = state.medicines.filter((_, i) => i !== action.index);
      // 重新调整 sort_order
      const reordered = updated.map((m, i) => ({ ...m, sort_order: i }));
      return { ...state, medicines: reordered };
    }

    case 'UPDATE_MEDICINE': {
      const updatedMedicines = state.medicines.map((m, i) => {
        if (i !== action.index) return m;
        return { ...m, [action.field]: action.value };
      });
      return { ...state, medicines: updatedMedicines };
    }

    case 'SET_PRESCRIPTION_NO':
      return { ...state, prescription_no: action.prescription_no };

    case 'CLEAR_FORM':
      return {
        ...DEFAULT_FORM_DATA,
        prescription_no: state.prescription_no,  // 保留处方编号不变
        prescription_date: new Date().toISOString().slice(0, 10),
      };

    case 'RESET_MEDICINES':
      return { ...state, medicines: [] };

    case 'LOAD_PRESCRIPTION': {
      const { medicines, ...prescription } = action.data;
      return {
        prescription_no: prescription.prescription_no,
        patient_name: prescription.patient_name,
        patient_gender: prescription.patient_gender,
        patient_age: prescription.patient_age ?? '',
        department: prescription.department,
        patient_phone: prescription.patient_phone,
        patient_address: prescription.patient_address,
        clinical_diagnosis: prescription.clinical_diagnosis,
        prescription_date: prescription.prescription_date,
        doctor_name: prescription.doctor_name ?? '',
        doctor_department: prescription.doctor_department,
        medicines: medicines.map((m, i) => ({
          ...m,
          usage_method: m.usage_method ?? '',
          sort_order: m.sort_order ?? i,
        })),
      };
    }

    default:
      return state;
  }
}

// ===== Context =====

const PrescriptionContext = createContext<PrescriptionContextValue | null>(null);

// ===== Provider =====

interface PrescriptionProviderProps {
  children: ReactNode;
}

export function PrescriptionProvider({ children }: PrescriptionProviderProps): React.ReactElement {
  const [formData, dispatch] = useReducer(prescriptionReducer, {
    ...DEFAULT_FORM_DATA,
    prescription_date: new Date().toISOString().slice(0, 10),
  });

  const setField = useCallback(
    (field: keyof PrescriptionFormData, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    []
  );

  const addMedicine = useCallback(() => {
    dispatch({ type: 'ADD_MEDICINE' });
  }, []);

  const removeMedicine = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_MEDICINE', index });
  }, []);

  const updateMedicine = useCallback(
    (index: number, field: keyof Medicine, value: string | number) => {
      dispatch({ type: 'UPDATE_MEDICINE', index, field, value });
    },
    []
  );

  const setPrescriptionNo = useCallback((no: string) => {
    dispatch({ type: 'SET_PRESCRIPTION_NO', prescription_no: no });
  }, []);

  const loadPrescription = useCallback((data: PrescriptionWithMedicines) => {
    dispatch({ type: 'LOAD_PRESCRIPTION', data });
  }, []);

  const clearForm = useCallback(() => {
    dispatch({ type: 'CLEAR_FORM' });
  }, []);

  const resetMedicines = useCallback(() => {
    dispatch({ type: 'RESET_MEDICINES' });
  }, []);

  const value: PrescriptionContextValue = {
    formData,
    setField,
    addMedicine,
    removeMedicine,
    updateMedicine,
    setPrescriptionNo,
    loadPrescription,
    clearForm,
    resetMedicines,
  };

  return React.createElement(
    PrescriptionContext.Provider,
    { value },
    children
  );
}

// ===== Hook =====

/**
 * 获取处方上下文。必须在 PrescriptionProvider 内部使用。
 *
 * @returns {PrescriptionContextValue}
 * @throws {Error} 如果在 Provider 外部调用
 */
export function usePrescription(): PrescriptionContextValue {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescription 必须在 PrescriptionProvider 内部使用');
  }
  return context;
}

export default PrescriptionContext;
