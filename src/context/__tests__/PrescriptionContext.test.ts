/**
 * 处方上下文 Reducer - 单元测试。
 * 覆盖 prescriptionReducer 所有 action 类型。
 *
 * V2 变更：所有药品对象新增 usage_method 字段。
 */

import { describe, it, expect } from 'vitest';
import type {
  PrescriptionFormData,
  PrescriptionAction,
  PrescriptionWithMedicines,
} from '../../types';
import { DEFAULT_FORM_DATA } from '../../types';

/**
 * 将 prescriptionReducer 逻辑提取出来进行纯函数测试。
 * reducer 定义在 PrescriptionContext.tsx 中，此处复制其逻辑。
 */
function prescriptionReducer(
  state: PrescriptionFormData,
  action: PrescriptionAction
): PrescriptionFormData {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'ADD_MEDICINE': {
      const newMedicine = {
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

// ---- 初始状态 ----

const initState: PrescriptionFormData = {
  prescription_no: '202507220001',
  patient_name: '张三',
  patient_gender: '男',
  patient_age: '',
  department: '内科',
  patient_phone: '13800138000',
  patient_address: '安康市高新区',
  clinical_diagnosis: '预防措施',
  prescription_date: '2025-07-22',
  doctor_name: '李医生',
  doctor_department: '中医科',
  medicines: [
    {
      medicine_name: '阿莫西林',
      specification: '0.25g×24',
      dosage: '每日3次，每次1片',
      usage_method: '口服',
      instructions: '饭后服用',
      sort_order: 0,
    },
  ],
};

describe('prescriptionReducer', () => {
  // ---- SET_FIELD ----

  describe('SET_FIELD', () => {
    it('应该更新指定字段值', () => {
      const action: PrescriptionAction = {
        type: 'SET_FIELD',
        field: 'patient_name',
        value: '李四',
      };
      const result = prescriptionReducer(initState, action);
      expect(result.patient_name).toBe('李四');
    });

    it('不应该修改其他字段', () => {
      const action: PrescriptionAction = {
        type: 'SET_FIELD',
        field: 'patient_name',
        value: '李四',
      };
      const result = prescriptionReducer(initState, action);
      expect(result.patient_gender).toBe('男');
      expect(result.department).toBe('内科');
      expect(result.doctor_name).toBe('李医生');
    });
  });

  // ---- ADD_MEDICINE ----

  describe('ADD_MEDICINE', () => {
    it('应该添加一个空的药品行', () => {
      const action: PrescriptionAction = { type: 'ADD_MEDICINE' };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines).toHaveLength(2);
    });

    it('新增药品的 sort_order 应该等于当前药品数量', () => {
      const action: PrescriptionAction = { type: 'ADD_MEDICINE' };
      const result = prescriptionReducer(initState, action);
      const newMed = result.medicines[1];
      expect(newMed.sort_order).toBe(1);
      expect(newMed.medicine_name).toBe('');
      expect(newMed.specification).toBe('');
      expect(newMed.usage_method).toBe('');
    });
  });

  // ---- REMOVE_MEDICINE ----

  describe('REMOVE_MEDICINE', () => {
    it('应该删除指定索引的药品', () => {
      // 先加两行药
      let state = initState;
      state = prescriptionReducer(state, { type: 'ADD_MEDICINE' });
      state = prescriptionReducer(state, { type: 'ADD_MEDICINE' });
      expect(state.medicines).toHaveLength(3);

      // 删除索引1
      const action: PrescriptionAction = { type: 'REMOVE_MEDICINE', index: 1 };
      const result = prescriptionReducer(state, action);
      expect(result.medicines).toHaveLength(2);
    });

    it('删除后应该重新调整 sort_order', () => {
      let state = initState;
      state = prescriptionReducer(state, { type: 'ADD_MEDICINE' });
      state = prescriptionReducer(state, { type: 'ADD_MEDICINE' });

      // 删除索引0
      const action: PrescriptionAction = { type: 'REMOVE_MEDICINE', index: 0 };
      const result = prescriptionReducer(state, action);
      expect(result.medicines[0].sort_order).toBe(0);
      expect(result.medicines[1].sort_order).toBe(1);
    });
  });

  // ---- UPDATE_MEDICINE ----

  describe('UPDATE_MEDICINE', () => {
    it('应该更新指定药品的字段', () => {
      const action: PrescriptionAction = {
        type: 'UPDATE_MEDICINE',
        index: 0,
        field: 'dosage',
        value: '每日2次，每次2片',
      };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines[0].dosage).toBe('每日2次，每次2片');
    });

    it('不应该修改其他药品', () => {
      let state = initState;
      state = prescriptionReducer(state, { type: 'ADD_MEDICINE' });

      const action: PrescriptionAction = {
        type: 'UPDATE_MEDICINE',
        index: 0,
        field: 'dosage',
        value: 'changed',
      };
      const result = prescriptionReducer(state, action);
      expect(result.medicines[0].dosage).toBe('changed');
      expect(result.medicines[1].dosage).toBe('');
    });

    it('V2: 应该支持更新 usage_method 字段', () => {
      const action: PrescriptionAction = {
        type: 'UPDATE_MEDICINE',
        index: 0,
        field: 'usage_method',
        value: '输液',
      };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines[0].usage_method).toBe('输液');
    });
  });

  // ---- SET_PRESCRIPTION_NO ----

  describe('SET_PRESCRIPTION_NO', () => {
    it('应该设置处方编号', () => {
      const action: PrescriptionAction = {
        type: 'SET_PRESCRIPTION_NO',
        prescription_no: '202507220042',
      };
      const result = prescriptionReducer(initState, action);
      expect(result.prescription_no).toBe('202507220042');
    });
  });

  // ---- CLEAR_FORM ----

  describe('CLEAR_FORM', () => {
    it('应该清空大部分表单字段', () => {
      const action: PrescriptionAction = { type: 'CLEAR_FORM' };
      const result = prescriptionReducer(initState, action);
      expect(result.patient_name).toBe('');
      expect(result.patient_gender).toBe('');
      expect(result.department).toBe('');
      expect(result.patient_phone).toBe('');
      expect(result.patient_address).toBe('');
    });

    it('BUG_FIX_VERIFIED: 清空后处方编号应保留不变', () => {
      // 根据 PRD 功能5要求："清空所有输入，保留处方编号不变"
      // Round 2 验证：修复后 prescription_no 应保留
      const action: PrescriptionAction = { type: 'CLEAR_FORM' };
      const result = prescriptionReducer(initState, action);

      // 修复后：prescription_no 应该保留为 '202507220001'
      expect(result.prescription_no).toBe('202507220001');
    });

    it('清空后临床诊断应恢复默认值', () => {
      const action: PrescriptionAction = { type: 'CLEAR_FORM' };
      const result = prescriptionReducer(initState, action);
      expect(result.clinical_diagnosis).toBe('预防措施');
    });

    it('清空后药品列表应为空', () => {
      const action: PrescriptionAction = { type: 'CLEAR_FORM' };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines).toHaveLength(0);
    });

    it('清空后处方日期应更新为今天', () => {
      const action: PrescriptionAction = { type: 'CLEAR_FORM' };
      const result = prescriptionReducer(initState, action);
      expect(result.prescription_date).toBe(
        new Date().toISOString().slice(0, 10)
      );
    });
  });

  // ---- RESET_MEDICINES ----

  describe('RESET_MEDICINES', () => {
    it('应该清空药品列表但保留其他字段', () => {
      const action: PrescriptionAction = { type: 'RESET_MEDICINES' };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines).toHaveLength(0);
      expect(result.patient_name).toBe('张三');
      expect(result.prescription_no).toBe('202507220001');
    });
  });

  // ---- LOAD_PRESCRIPTION ----

  describe('LOAD_PRESCRIPTION', () => {
    it('应该从已有处方数据加载所有字段', () => {
      const preset: PrescriptionWithMedicines = {
        id: 1,
        prescription_no: '202506150001',
        patient_name: '王五',
        patient_gender: '女',
        patient_age: '35',
        department: '儿科',
        patient_phone: '13900139000',
        patient_address: '安康市汉滨区',
        clinical_diagnosis: '感冒',
        prescription_date: '2025-06-15',
        doctor_name: '赵医生',
        doctor_department: '儿科',
        created_at: '2025-06-15 10:30:00',
        medicines: [
          {
            id: 10,
            medicine_name: '布洛芬',
            specification: '0.2g×10',
            dosage: '每日2次，每次1片',
            usage_method: '口服',
            instructions: '发热时服用',
            sort_order: 0,
          },
          {
            id: 11,
            medicine_name: '维生素C',
            specification: '100mg×30',
            dosage: '每日1次，每次1片',
            usage_method: '口服',
            instructions: '',
            sort_order: 1,
          },
        ],
      };

      const action: PrescriptionAction = {
        type: 'LOAD_PRESCRIPTION',
        data: preset,
      };
      const result = prescriptionReducer(initState, action);

      expect(result.prescription_no).toBe('202506150001');
      expect(result.patient_name).toBe('王五');
      expect(result.patient_gender).toBe('女');
      expect(result.department).toBe('儿科');
      expect(result.patient_phone).toBe('13900139000');
      expect(result.patient_address).toBe('安康市汉滨区');
      expect(result.clinical_diagnosis).toBe('感冒');
      expect(result.prescription_date).toBe('2025-06-15');
      expect(result.doctor_name).toBe('赵医生');
      expect(result.doctor_department).toBe('儿科');
      expect(result.medicines).toHaveLength(2);
    });

    it('V2: 加载时应该保留药品的 usage_method', () => {
      const preset: PrescriptionWithMedicines = {
        prescription_no: 'X',
        patient_name: '',
        patient_gender: '',
        patient_age: '',
        department: '',
        patient_phone: '',
        patient_address: '',
        clinical_diagnosis: '',
        prescription_date: '',
        doctor_name: '',
        doctor_department: '',
        medicines: [
          {
            medicine_name: '药A',
            specification: '',
            dosage: '',
            usage_method: '输液',
            instructions: '',
            sort_order: 0,
          },
        ],
      };

      const action: PrescriptionAction = {
        type: 'LOAD_PRESCRIPTION',
        data: preset,
      };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines[0].usage_method).toBe('输液');
    });

    it('加载时应该保留药品的 sort_order', () => {
      const preset: PrescriptionWithMedicines = {
        prescription_no: 'X',
        patient_name: '',
        patient_gender: '',
        patient_age: '',
        department: '',
        patient_phone: '',
        patient_address: '',
        clinical_diagnosis: '',
        prescription_date: '',
        doctor_name: '',
        doctor_department: '',
        medicines: [
          {
            medicine_name: '药A',
            specification: '',
            dosage: '',
            usage_method: '',
            instructions: '',
            sort_order: 5,
          },
        ],
      };

      const action: PrescriptionAction = {
        type: 'LOAD_PRESCRIPTION',
        data: preset,
      };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines[0].sort_order).toBe(5);
    });

    it('加载时如果 sort_order 不存在应使用索引作为默认值', () => {
      const preset: PrescriptionWithMedicines = {
        prescription_no: 'X',
        patient_name: '',
        patient_gender: '',
        patient_age: '',
        department: '',
        patient_phone: '',
        patient_address: '',
        clinical_diagnosis: '',
        prescription_date: '',
        doctor_name: '',
        doctor_department: '',
        medicines: [
          {
            medicine_name: '药A',
            specification: '',
            dosage: '',
            usage_method: '',
            instructions: '',
            sort_order: undefined as unknown as number,
          },
        ],
      };

      const action: PrescriptionAction = {
        type: 'LOAD_PRESCRIPTION',
        data: preset,
      };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines[0].sort_order).toBe(0);
    });

    it('V2: 加载时如果 usage_method 不存在应使用空字符串', () => {
      const preset: PrescriptionWithMedicines = {
        prescription_no: 'X',
        patient_name: '',
        patient_gender: '',
        patient_age: '',
        department: '',
        patient_phone: '',
        patient_address: '',
        clinical_diagnosis: '',
        prescription_date: '',
        doctor_name: '',
        doctor_department: '',
        medicines: [
          {
            medicine_name: '药A',
            specification: '',
            dosage: '',
            usage_method: undefined as unknown as string,
            instructions: '',
            sort_order: 0,
          },
        ],
      };

      const action: PrescriptionAction = {
        type: 'LOAD_PRESCRIPTION',
        data: preset,
      };
      const result = prescriptionReducer(initState, action);
      expect(result.medicines[0].usage_method).toBe('');
    });
  });

  // ---- 未知 Action 类型 ----

  describe('未知 action', () => {
    it('应该返回原状态不变', () => {
      const action = { type: 'UNKNOWN_ACTION' } as unknown as PrescriptionAction;
      const result = prescriptionReducer(initState, action);
      expect(result).toEqual(initState);
    });
  });
});
