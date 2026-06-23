/**
 * 医师信息表单组件。
 * 包含：医师姓名（非必填）、所在科室（下拉选择）。
 *
 * V2 变更：
 * - 医师姓名去掉必填标记
 * - 所在科室改为 MUI Select 下拉选择（DOCTOR_DEPARTMENT_OPTIONS）
 */

import React from 'react';
import {
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material';
import { usePrescription } from '../context/PrescriptionContext';
import { DOCTOR_DEPARTMENT_OPTIONS } from '../constants/dictionaries';

/** 医师信息表单 */
export default function DoctorInfo(): React.ReactElement {
  const { formData, setField } = usePrescription();

  const handleTextChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setField(field, e.target.value);
    };

  /** 所在科室下拉选择 */
  const handleDoctorDepartmentChange = (e: SelectChangeEvent<string>): void => {
    setField('doctor_department', e.target.value);
  };

  return (
    <Grid container spacing={2}>
      {/* 医师姓名 — V2: 非必填 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="医师姓名"
          value={formData.doctor_name ?? ''}
          onChange={handleTextChange('doctor_name')}
          fullWidth
          size="small"
          placeholder="请输入医师姓名（选填）"
        />
      </Grid>

      {/* 所在科室 — V2: 改为下拉选择 */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small" required>
          <InputLabel id="doctor-department-label">所在科室</InputLabel>
          <Select
            labelId="doctor-department-label"
            value={formData.doctor_department}
            label="所在科室"
            onChange={handleDoctorDepartmentChange}
          >
            {DOCTOR_DEPARTMENT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}
