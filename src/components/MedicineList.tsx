/**
 * 药品列表组件。
 * 动态表格：支持添加药品行、删除药品行、编辑药品信息。
 *
 * V3 变更：
 * - 药品名称改为 Autocomplete 下拉选择，支持自由输入（手动录入）
 * - 选择药品后自动填充规格、用法、用量
 * - 用量改为 Select 下拉（1支/2支）
 * - 列顺序：药品名称、规格、用法、用量、医嘱、操作
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Paper,
  Tooltip,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePrescription } from '../context/PrescriptionContext';
import {
  USAGE_METHOD_OPTIONS,
  DOSAGE_OPTIONS,
  MEDICINE_DICT,
  findMedicineByName,
} from '../constants/dictionaries';
import type { Medicine } from '../types';

/** 药品列表组件 */
export default function MedicineList(): React.ReactElement {
  const { formData, addMedicine, removeMedicine, updateMedicine } = usePrescription();
  const { medicines } = formData;

  /** 处理药品名称变更（Autocomplete） */
  const handleMedicineNameChange = (index: number) => (
    _event: React.SyntheticEvent,
    value: string | null
  ): void => {
    const name = value ?? '';
    updateMedicine(index, 'medicine_name', name);

    // 自动填充关联字段
    const dictItem = findMedicineByName(name);
    if (dictItem) {
      updateMedicine(index, 'specification', dictItem.specification);
      updateMedicine(index, 'usage_method', dictItem.usage_method);
      updateMedicine(index, 'dosage', dictItem.dosage);
    }
  };

  /** 处理普通文本字段变更 */
  const handleMedicineChange =
    (index: number, field: keyof Medicine) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      updateMedicine(index, field, e.target.value);
    };

  /** 处理用法下拉选择变更 */
  const handleUsageMethodChange =
    (index: number) =>
    (e: SelectChangeEvent<string>): void => {
      updateMedicine(index, 'usage_method', e.target.value);
    };

  /** 处理用量下拉选择变更 */
  const handleDosageChange =
    (index: number) =>
    (e: SelectChangeEvent<string>): void => {
      updateMedicine(index, 'dosage', e.target.value);
    };

  return (
    <Box>
      {/* 标题行 */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography fontSize="18px" fontWeight="bold" color="#1a1a1a">
          药品明细（共 {medicines.length} 种）
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={addMedicine}
        >
          添加药品
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 180 }}>
                药品名称 *
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>
                规格
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>
                用法
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>
                用量
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>
                医嘱
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 60 }} align="center">
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  暂无药品，请点击"添加药品"按钮
                </TableCell>
              </TableRow>
            ) : (
              medicines.map((med, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Autocomplete
                      freeSolo
                      size="small"
                      options={MEDICINE_DICT.map((m) => m.name)}
                      value={med.medicine_name}
                      onChange={handleMedicineNameChange(index)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          fullWidth
                          placeholder="请输入或选择药品"
                          required
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={med.specification}
                      onChange={handleMedicineChange(index, 'specification')}
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="规格"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" variant="standard">
                      <Select
                        value={med.usage_method}
                        onChange={handleUsageMethodChange(index)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>请选择</em>
                        </MenuItem>
                        {USAGE_METHOD_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" variant="standard">
                      <Select
                        value={med.dosage}
                        onChange={handleDosageChange(index)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>请选择</em>
                        </MenuItem>
                        {DOSAGE_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={med.instructions}
                      onChange={handleMedicineChange(index, 'instructions')}
                      size="small"
                      variant="standard"
                      fullWidth
                      placeholder="医嘱说明"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="删除此药品">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeMedicine(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
