/**
 * 处方开具页面。
 * 组合 PatientInfo、DiagnosisInfo、MedicineList、DoctorInfo 四个表单组件，
 * 提供"保存"、"打印预览"、"清空"三个操作按钮。
 *
 * V2 变更：
 * - 保存/预览时药品数据包含 usage_method 字段
 * - 医师姓名可为空，校验不再检查 doctor_name
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Stack,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/ClearAll';
import { usePrescription } from '../context/PrescriptionContext';
import PatientInfo from '../components/PatientInfo';
import DiagnosisInfo from '../components/DiagnosisInfo';
import MedicineList from '../components/MedicineList';
import DoctorInfo from '../components/DoctorInfo';
import PreviewDialog from '../components/PreviewDialog';
import { validatePrescriptionForm } from '../utils/format';
import type { PrescriptionWithMedicines, SavePrescriptionPayload } from '../types';

/** 处方开具页面 */
export default function PrescribePage(): React.ReactElement {
  const { formData, clearForm, setPrescriptionNo } = usePrescription();

  // 预览对话框状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PrescriptionWithMedicines | null>(null);

  // 保存中状态（防重复提交）
  const [saving, setSaving] = useState(false);

  // 页面加载时自动生成处方编号
  useEffect(() => {
    if (!formData.prescription_no && window.electronAPI?.generatePrescriptionNo) {
      window.electronAPI.generatePrescriptionNo().then((newNo) => {
        setPrescriptionNo(newNo);
      }).catch((err) => {
        console.error('自动生成处方编号失败:', err);
      });
    }
  }, []); // 仅首次加载执行

  // 提示消息
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  /** 显示提示 */
  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' = 'success'
  ): void => {
    setSnackbar({ open: true, message, severity });
  };

  /** 关闭提示 */
  const handleCloseSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /** 保存处方（带超时保护） */
  const handleSave = async (): Promise<void> => {
    // 防止重复提交
    if (saving) {
      console.log('[保存处方] 已在保存中，忽略重复点击');
      return;
    }

    // 表单校验
    const validation = validatePrescriptionForm(formData);
    if (!validation.valid) {
      showSnackbar(validation.errors[0], 'warning');
      return;
    }

    console.log('[保存处方] 表单校验通过，开始保存...');
    setSaving(true);

    try {
      if (!window.electronAPI?.savePrescription) {
        showSnackbar('系统通信异常，请重启应用', 'error');
        return;
      }

      const payload: SavePrescriptionPayload = {
        prescription: {
          prescription_no: formData.prescription_no,
          patient_name: formData.patient_name.trim(),
          patient_gender: formData.patient_gender,
          patient_age: formData.patient_age?.trim() || '',
          department: formData.department.trim(),
          patient_phone: formData.patient_phone.trim(),
          patient_address: formData.patient_address.trim(),
          clinical_diagnosis: formData.clinical_diagnosis.trim() || '预防措施',
          prescription_date: formData.prescription_date,
          doctor_name: formData.doctor_name?.trim() || '',
          doctor_department: formData.doctor_department.trim(),
        },
        medicines: formData.medicines.map((m, i) => ({
          medicine_name: m.medicine_name.trim(),
          specification: m.specification?.trim() ?? '',
          dosage: m.dosage?.trim() ?? '',
          usage_method: m.usage_method?.trim() ?? '',
          instructions: m.instructions?.trim() ?? '',
          sort_order: i,
        })),
      };

      console.log('[保存处方] 发送保存请求:', payload.prescription.prescription_no);

      // 添加超时保护 — 15 秒内未响应则超时
      const savePromise = window.electronAPI.savePrescription(payload);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('保存超时，请检查数据库连接后重试')), 15000)
      );

      const result = (await Promise.race([savePromise, timeoutPromise])) as PrescriptionWithMedicines;

      console.log('[保存处方] 保存成功:', result?.prescription_no);
      showSnackbar(`处方 ${result.prescription_no} 保存成功`, 'success');

      // 清空表单，准备下一张处方
      clearForm();

      // 自动生成下一个处方编号
      if (window.electronAPI?.generatePrescriptionNo) {
        setTimeout(async () => {
          try {
            const newNo = await window.electronAPI?.generatePrescriptionNo();
            if (newNo) setPrescriptionNo(newNo);
          } catch (genErr) {
            console.error('生成下一个处方编号失败:', genErr);
          }
        }, 100);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败';
      console.error('[保存处方] 保存失败:', err);
      showSnackbar(`保存失败：${message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  /** 打印预览 */
  const handlePreview = (): void => {
    // 表单校验
    const validation = validatePrescriptionForm(formData);
    if (!validation.valid) {
      showSnackbar(validation.errors[0], 'warning');
      return;
    }

    // 构建预览数据
    const data: PrescriptionWithMedicines = {
      prescription_no: formData.prescription_no,
      patient_name: formData.patient_name.trim(),
      patient_gender: formData.patient_gender,
      patient_age: formData.patient_age?.trim() || '',
      department: formData.department.trim(),
      patient_phone: formData.patient_phone.trim(),
      patient_address: formData.patient_address.trim(),
      clinical_diagnosis: formData.clinical_diagnosis.trim() || '预防措施',
      prescription_date: formData.prescription_date,
      doctor_name: formData.doctor_name?.trim() || '',
      doctor_department: formData.doctor_department.trim(),
      medicines: formData.medicines.map((m, i) => ({
        medicine_name: m.medicine_name,
        specification: m.specification,
        dosage: m.dosage,
        usage_method: m.usage_method,
        instructions: m.instructions,
        sort_order: i,
      })),
    };

    setPreviewData(data);
    setPreviewOpen(true);
  };

  /** 清空表单 */
  const handleClear = (): void => {
    clearForm();
    showSnackbar('表单已清空', 'success');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* 页面标题 */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold" color="medical.dark">
          处方开具
        </Typography>
        <Typography variant="body2" color="text.secondary">
          填写患者信息、诊断信息、药品明细和医师信息，完成后保存或打印
        </Typography>
      </Box>

      {/* 患者信息卡片 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography fontSize="18px" fontWeight="bold" mb={1.5} color="#1a1a1a">
          患者信息
        </Typography>
        <PatientInfo />
      </Paper>

      {/* 诊断信息卡片 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography fontSize="18px" fontWeight="bold" mb={1.5} color="#1a1a1a">
          诊断信息
        </Typography>
        <DiagnosisInfo />
      </Paper>

      {/* 药品列表卡片 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <MedicineList />
      </Paper>

      {/* 医师信息卡片 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography fontSize="18px" fontWeight="bold" mb={1.5} color="#1a1a1a">
          医师信息
        </Typography>
        <DoctorInfo />
      </Paper>

      {/* 操作按钮 */}
      <Paper sx={{ p: 2 }} elevation={1}>
        {saving && (
          <Box mb={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                正在保存处方，请稍候...
              </Typography>
            </Stack>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        )}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            disabled={saving}
          >
            清空表单
          </Button>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
            disabled={saving}
          >
            打印预览
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存处方'}
          </Button>
        </Stack>
      </Paper>

      {/* 打印预览对话框 */}
      <PreviewDialog
        open={previewOpen}
        prescription={previewData}
        onClose={() => setPreviewOpen(false)}
      />

      {/* 操作提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
