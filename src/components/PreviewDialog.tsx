/**
 * 打印预览对话框组件。
 * 以 A5 比例（148mm × 210mm）渲染处方笺预览 HTML。
 * 提供"确认打印"和"关闭"按钮。
 *
 * V2 变更：
 * - 药品表格："用法用量"拆分为"用量" + "用法"两列
 * - 医师姓名为空时显示 "____________"
 * - 预览容器按 A5 比例（aspect-ratio）固定
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import type { PrescriptionWithMedicines } from '../types';

interface PreviewDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 处方完整数据 */
  prescription: PrescriptionWithMedicines | null;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * A5 处方笺打印预览对话框。
 * 在对话框内以 A5 比例渲染完整的处方信息。
 */
export default function PreviewDialog({
  open,
  prescription,
  onClose,
}: PreviewDialogProps): React.ReactElement {
  const [printing, setPrinting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /** 确认打印：调用主进程 print:direct */
  const handlePrint = async (): Promise<void> => {
    if (!prescription) return;
    setPrinting(true);
    setError(null);
    try {
      if (window.electronAPI?.printDirect) {
        await window.electronAPI.printDirect(prescription);
      } else {
        // 降级：使用浏览器 print API
        window.print();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '打印失败';
      setError(message);
    } finally {
      setPrinting(false);
    }
  };

  if (!prescription) return <React.Fragment />;

  const { medicines } = prescription;
  // V2: 医师姓名为空时显示下划线
  const doctorNameDisplay = prescription.doctor_name?.trim() || '____________';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          // A5 比例 ≈ 1:1.414，maxWidth 模拟
          maxWidth: 580,
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          bgcolor: 'medical.light',
          color: 'medical.dark',
        }}
      >
        处方笺预览
      </DialogTitle>

      <DialogContent dividers>
        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 处方笺内容 — A5 比例渲染 */}
        <Box
          sx={{
            border: '1.5px solid #000',
            p: 2.5,
            mx: 'auto',
            maxWidth: 480,
            aspectRatio: '1 / 1.414',
            fontFamily: '"STKaiti","KaiTi","华文楷体",serif',
            fontSize: '16px',
            color: '#000',
            bgcolor: '#fff',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 标题 */}
          <Box textAlign="center" mb={1.5}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              fontSize="20px"
              letterSpacing={2}
            >
              安康高新区社区卫生服务中心
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              fontSize="20px"
              letterSpacing={4}
              mt={0.5}
            >
              处 方 笺
            </Typography>
            <Divider sx={{ mt: '15px', borderColor: '#000' }} />
          </Box>

          {/* 内容区域 — 固定顶部间距 */}
          <Box flex={1} display="flex" flexDirection="column">

          {/* 处方编号 + 日期 */}
          <Box display="flex" justifyContent="space-between" mb={1} mr={'5px'}>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>处方编号：</strong>
              {prescription.prescription_no}
            </Typography>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>开具日期：</strong>
              {prescription.prescription_date}
            </Typography>
          </Box>

          {/* 患者信息 */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={1} mr={'5px'}>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>姓名：</strong>
              {prescription.patient_name}
            </Typography>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>性别：</strong>
              {prescription.patient_gender}
            </Typography>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>年龄：</strong>
              {prescription.patient_age || '-'}
            </Typography>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>科别：</strong>
              {prescription.department}
            </Typography>
          </Box>

          {/* 诊断 */}
          <Typography variant="body2" fontSize="16px" mb={1} lineHeight={2.2} mr={'5px'}>
            <strong>临床诊断：</strong>
            {prescription.clinical_diagnosis}
          </Typography>

          {/* 联系方式 */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={'15px'} mr={'5px'}>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>电话：</strong>
              {prescription.patient_phone || '-'}
            </Typography>
            <Typography variant="body2" fontSize="16px" lineHeight={2.2}>
              <strong>住址：</strong>
              {prescription.patient_address || '-'}
            </Typography>
          </Box>

          {/* 分隔线 + 药品明细 — 无表头，两行显示 */}
          <Divider sx={{ mt: 0, mb: 2, borderColor: '#000' }} />

          {medicines.map((med, idx) => (
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
              {idx < medicines.length - 1 && (
                <Divider sx={{ mt: 1.5, borderStyle: 'dashed', borderColor: '#ccc' }} />
              )}
            </Box>
          ))}

          </Box>

          {/* 医师签名 — 固定在底部 */}
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
                {prescription.doctor_department}
              </Box>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={printing}>
          关闭
        </Button>
        <Button
          variant="contained"
          startIcon={printing ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
          onClick={handlePrint}
          disabled={printing}
        >
          {printing ? '正在打印...' : '确认打印'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
