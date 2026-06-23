/**
 * 患者信息表单组件。
 * 包含：姓名、性别、科别（下拉选择）、电话、住址。
 *
 * V2 变更：科别改为 MUI Select 下拉选择（DEPARTMENT_OPTIONS）。
 */

import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  type SelectChangeEvent,
} from '@mui/material';
import { usePrescription } from '../context/PrescriptionContext';
import { DEPARTMENT_OPTIONS } from '../constants/dictionaries';

/** 患者信息表单 */
export default function PatientInfo(): React.ReactElement {
  const { formData, setField } = usePrescription();

  const handleTextChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setField(field, e.target.value);
    };

  const handleGenderChange = (e: SelectChangeEvent<string>): void => {
    setField('patient_gender', e.target.value);
  };

  /** 科别下拉选择 */
  const handleDepartmentChange = (e: SelectChangeEvent<string>): void => {
    setField('department', e.target.value);
  };

  return (
    <Grid container spacing={2}>
      {/* 姓名 */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="患者姓名"
          value={formData.patient_name}
          onChange={handleTextChange('patient_name')}
          required
          fullWidth
          size="small"
          inputProps={{ maxLength: 50 }}
          placeholder="请输入患者姓名"
          InputLabelProps={{ sx: { fontSize: '16px', color: '#263238', fontWeight: 'bold' } }}
        />
      </Grid>

      {/* 性别 */}
      <Grid item xs={12} sm={3}>
        <FormControl fullWidth size="small" required>
          <InputLabel id="gender-label" sx={{ fontSize: '16px', color: '#263238', fontWeight: 'bold' }}>性别</InputLabel>
          <Select
            labelId="gender-label"
            value={formData.patient_gender}
            label="性别"
            onChange={handleGenderChange}
          >
            <MenuItem value="男">男</MenuItem>
            <MenuItem value="女">女</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* 年龄 */}
      <Grid item xs={12} sm={3}>
        <TextField
          label="患者年龄"
          value={(formData as { patient_age?: string }).patient_age || ''}
          onChange={(e) => setField('patient_age', e.target.value)}
          fullWidth
          size="small"
          placeholder="选填"
          InputLabelProps={{ sx: { fontSize: '16px', color: '#263238', fontWeight: 'bold' } }}
        />
      </Grid>

      {/* 科别 — V2: 改为下拉选择 */}
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small" required>
          <InputLabel id="department-label" sx={{ fontSize: '16px', color: '#263238', fontWeight: 'bold' }}>科别</InputLabel>
          <Select
            labelId="department-label"
            value={formData.department}
            label="科别"
            onChange={handleDepartmentChange}
          >
            {DEPARTMENT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* 电话 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="患者电话"
          value={formData.patient_phone}
          onChange={handleTextChange('patient_phone')}
          fullWidth
          size="small"
          placeholder="请输入联系电话"
          InputLabelProps={{ sx: { fontSize: '16px', color: '#263238', fontWeight: 'bold' } }}
        />
      </Grid>

      {/* 住址 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="患者住址"
          value={formData.patient_address}
          onChange={handleTextChange('patient_address')}
          fullWidth
          size="small"
          placeholder="请输入住址"
          InputLabelProps={{ sx: { fontSize: '16px', color: '#263238', fontWeight: 'bold' } }}
        />
      </Grid>
    </Grid>
  );
}
