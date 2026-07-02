/**
 * 历史处方详情对话框组件。
 * 以只读模式展示处方完整信息，并支持重新打印。
 *
 * V2 变更：
 * - 药品表格："用法用量"拆分为"用量" + "用法"两列
 * - 医师姓名为空时显示 "____________"
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import type { PrescriptionWithMedicines } from '../types';
import { formatDateTime } from '../utils/format';

interface PrescriptionDetailProps {
  /** 是否打开 */
  open: boolean;
  /** 处方 ID */
  prescriptionId: number | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 打印回调（打开打印预览） */
  onPrint?: (prescription: PrescriptionWithMedicines) => void;
}

/**
 * 历史处方详情对话框。
 * 根据处方 ID 从主进程获取详情并只读展示。
 */
export default function PrescriptionDetail({
  open,
  prescriptionId,
  onClose,
  onPrint,
}: PrescriptionDetailProps): React.ReactElement {
  const [data, setData] = useState<PrescriptionWithMedicines | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 当对话框打开且 prescriptionId 变化时，加载处方详情 */
  useEffect(() => {
    if (!open || prescriptionId === null) {
      setData(null);
      setError(null);
      return;
    }

    const fetchDetail = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        if (!window.electronAPI?.getPrescriptionDetail) {
          throw new Error('electronAPI 不可用');
        }
        const result = (await window.electronAPI.getPrescriptionDetail(
          prescriptionId
        )) as PrescriptionWithMedicines;
        if (!result) {
          throw new Error('处方不存在');
        }
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载失败';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, prescriptionId]);

  /** 处理打印 */
  const handlePrint = (): void => {
    if (data && onPrint) {
      onPrint(data);
    }
  };

  // V2: 医师姓名为空时显示下划线
  const doctorNameDisplay = data?.doctor_name?.trim() || '____________';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          bgcolor: 'medical.light',
          color: 'medical.dark',
        }}
      >
        处方详情
        {data && (
          <Chip
            label={data.prescription_no}
            size="small"
            sx={{ ml: 2, fontWeight: 'bold' }}
          />
        )}
      </DialogTitle>

      <DialogContent dividers>
        {/* 加载中 */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 处方内容 */}
        {data && !loading && (
          <Box
            sx={{
              border: '1.5px solid #000',
              p: 2.5,
              mx: 'auto',
              maxWidth: 500,
              fontFamily: '"STKaiti","KaiTi","华文楷体",serif',
              fontSize: '16px',
              color: '#000',
              bgcolor: '#fff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 标题 */}
            <Box textAlign="center" mb={1.5}>
              <Typography variant="subtitle1" fontWeight="bold" fontSize="20px" letterSpacing={2}>
                安康高新区社区卫生服务中心
              </Typography>
              <Typography variant="h6" fontWeight="bold" fontSize="20px" letterSpacing={4} mt={0.5}>
                处 方 笺
              </Typography>
              <Divider sx={{ mt: '15px', borderColor: '#000' }} />
            </Box>

            {/* 内容区域 — 固定顶部间距 */}
            <Box flex={1} display="flex" flexDirection="column">

            {/* 处方编号 + 日期 */}
            <Box display="flex" justifyContent="space-between" mb={1} mr={'5px'}>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>处方编号：</strong>
                {data.prescription_no}
              </Typography>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>开具日期：</strong>
                {data.prescription_date}
              </Typography>
            </Box>

            {/* 患者信息 */}
            <Box display="flex" flexWrap="wrap" gap={2} mb={1} mr={'5px'}>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>姓名：</strong>
                {data.patient_name}
              </Typography>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>性别：</strong>
                {data.patient_gender}
              </Typography>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>年龄：</strong>
                {data.patient_age || '-'}
              </Typography>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>科别：</strong>
                {data.department}
              </Typography>
            </Box>

            <Typography variant="body2" mb={1} lineHeight={2.2} mr={'5px'}>
              <strong>临床诊断：</strong>
              {data.clinical_diagnosis}
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={2} mb={'15px'} mr={'5px'}>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>电话：</strong>
                {data.patient_phone || '-'}
              </Typography>
              <Typography variant="body2" lineHeight={2.2}>
                <strong>住址：</strong>
                {data.patient_address || '-'}
              </Typography>
            </Box>

            {/* 分隔线 + 药品明细 — 无表头，两行显示 */}
            <Divider sx={{ mt: 0, mb: 2, borderColor: '#000' }} />

            {data.medicines.map((med, idx) => (
              <Box key={idx} mb={2}>
                {/* 第一行：药品名称 + 规格 */}
                <Box display="flex" gap={1} mb={0.8}>
                  <Typography variant="body2" fontWeight="bold" fontSize="18px">
                    {med.medicine_name}
                  </Typography>
                  <Typography variant="body2" fontSize="16px">
                    {med.specification || '-'}
                  </Typography>
                </Box>
                {/* 第二行：用量、用法、医嘱 */}
                <Box display="flex" gap={4} pl={1}>
                  <Typography variant="body2" fontSize="16px" lineHeight={2.0}>
                    <strong>用量：</strong>{med.dosage || '-'}
                  </Typography>
                  <Typography variant="body2" fontSize="16px" lineHeight={2.0}>
                    <strong>用法：</strong>{med.usage_method || '-'}
                  </Typography>
                  <Typography variant="body2" fontSize="16px" lineHeight={2.0}>
                    <strong>医嘱：</strong>{med.instructions || '-'}
                  </Typography>
                </Box>
                {/* 药品间虚线分隔 */}
                {idx < data.medicines.length - 1 && (
                  <Divider sx={{ mt: 1.5, borderStyle: 'dashed', borderColor: '#ccc' }} />
                )}
              </Box>
            ))}

            </Box>

            {/* 医师签名 — V2: 空值显示下划线 */}
            <Box display="flex" justifyContent="space-between" mt="auto" pb={2} pt={2}>
              <Typography variant="body2">
                <strong>医师：</strong>
                <Box
                  component="span"
                  sx={{
                    minWidth: 80,
                    display: 'inline-block',
                    ml: 1,
                    px: 1,
                  }}
                >
                  {doctorNameDisplay}
                </Box>
              </Typography>
              <Typography variant="body2">
                <strong>科室：</strong>
                <Box
                  component="span"
                  sx={{
                    borderBottom: '1px solid #000',
                    minWidth: 80,
                    display: 'inline-block',
                    ml: 1,
                    px: 1,
                  }}
                >
                  {data.doctor_department}
                </Box>
              </Typography>
            </Box>

            {/* 创建时间 */}
            {data.created_at && (
              <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                创建时间：{formatDateTime(data.created_at)}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>关闭</Button>
        {data && (
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            重新打印
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
