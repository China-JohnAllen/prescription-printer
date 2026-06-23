/**
 * 诊断信息表单组件。
 * 包含：处方编号、开具日期、临床诊断。
 */

import React from 'react';
import { TextField, Grid, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePrescription } from '../context/PrescriptionContext';

/** 诊断信息表单 */
export default function DiagnosisInfo(): React.ReactElement {
  const { formData, setField, setPrescriptionNo } = usePrescription();

  const handleTextChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setField(field, e.target.value);
    };

  /** 生成新的处方编号 */
  const handleGenerateNo = async (): Promise<void> => {
    try {
      if (window.electronAPI?.generatePrescriptionNo) {
        const newNo = await window.electronAPI.generatePrescriptionNo();
        setPrescriptionNo(newNo);
      }
    } catch (err) {
      console.error('生成处方编号失败:', err);
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      {/* 处方编号 */}
      <Grid item xs={12} sm={5}>
        <TextField
          label="处方编号"
          value={formData.prescription_no}
          onChange={handleTextChange('prescription_no')}
          fullWidth
          size="small"
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Tooltip title="生成新编号">
                <IconButton
                  size="small"
                  onClick={handleGenerateNo}
                  edge="end"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ),
          }}
          placeholder="点击刷新按钮生成"
        />
      </Grid>

      {/* 开具日期 */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="开具日期"
          type="date"
          value={formData.prescription_date}
          onChange={handleTextChange('prescription_date')}
          required
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* 临床诊断 */}
      <Grid item xs={12} sm={3}>
        <TextField
          label="临床诊断"
          value={formData.clinical_diagnosis}
          onChange={handleTextChange('clinical_diagnosis')}
          fullWidth
          size="small"
          placeholder="临床诊断"
        />
      </Grid>
    </Grid>
  );
}
