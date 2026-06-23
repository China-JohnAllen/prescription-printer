/**
 * 历史查询页面。
 * 支持按患者姓名模糊搜索、按日期范围筛选，结果分页展示。
 * 点击行可查看处方详情，详情中支持重新打印。
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import type { Prescription, PaginatedResult, PrescriptionWithMedicines } from '../types';
import PrescriptionDetail from '../components/PrescriptionDetail';
import PreviewDialog from '../components/PreviewDialog';
import { formatDateTime } from '../utils/format';
import * as XLSX from 'xlsx';

/** 历史查询页面 */
export default function HistoryPage(): React.ReactElement {
  // 查询参数
  const [patientName, setPatientName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // 查询结果
  const [result, setResult] = useState<PaginatedResult<Prescription> | null>(null);
  const [loading, setLoading] = useState(false);

  // 详情对话框
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 打印预览（从详情中触发）
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PrescriptionWithMedicines | null>(null);

  /**
   * 执行查询。
   * 通过 IPC 调用主进程的分页查询接口。
   */
  const fetchPrescriptions = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      if (!window.electronAPI?.getPrescriptions) {
        throw new Error('electronAPI 不可用');
      }

      const data = await window.electronAPI.getPrescriptions({
        page: page + 1,
        pageSize: rowsPerPage,
        patientName: patientName.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setResult(data);
    } catch (err) {
      console.error('查询处方列表失败:', err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, patientName, dateFrom, dateTo]);

  /** 页面首次加载和分页变化时触发查询 */
  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  /** 搜索按钮点击 */
  const handleSearch = (): void => {
    setPage(0);
    fetchPrescriptions();
  };

  /** 导出当前筛选结果为 .xlsx */
  const handleExport = async (): Promise<void> => {
    try {
      if (!window.electronAPI?.getPrescriptions) {
        throw new Error('electronAPI 不可用');
      }

      const data = await window.electronAPI.getPrescriptions({
        page: 1,
        pageSize: 99999,
        patientName: patientName.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (!data || data.list.length === 0) {
        alert('没有可导出的数据');
        return;
      }

          const rows = data.list.map((r) => ({
            '处方编号': r.prescription_no,
            '患者姓名': r.patient_name,
            '性别': r.patient_gender,
            '年龄': r.patient_age || '',
            '科别': r.department,
            '电话': r.patient_phone || '',
            '住址': r.patient_address || '',
            '临床诊断': r.clinical_diagnosis,
            '开具日期': r.prescription_date,
            '医师': r.doctor_name || '',
            '科室': r.doctor_department,
          }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '处方记录');
      XLSX.writeFile(wb, `处方导出_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    }
  };

  /** 查看详情 */
  const handleViewDetail = (id: number): void => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  /** 从详情中触发打印预览 */
  const handlePrintFromDetail = (prescription: PrescriptionWithMedicines): void => {
    setDetailOpen(false);
    setPreviewData(prescription);
    setPreviewOpen(true);
  };

  /** 分页变化 */
  const handleChangePage = (_: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 页面标题 */}
      <Box mb={2}>
        <Typography variant="h5" fontWeight="bold" color="medical.dark">
          历史查询
        </Typography>
        <Typography variant="body2" color="text.secondary">
          查询和查看已开具的处方记录，支持重新打印
        </Typography>
      </Box>

      {/* 搜索栏 */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            label="患者姓名"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            size="small"
            placeholder="模糊搜索"
            sx={{ minWidth: 180 }}
          />
          <TextField
            label="起始日期"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="截止日期"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            查询
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            导出Excel
          </Button>
        </Stack>
      </Paper>

      {/* 结果表格 */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} elevation={1}>
        <TableContainer sx={{ flex: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>处方编号</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>患者姓名</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>性别</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>年龄</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>科别</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>开具日期</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>医师</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>临床诊断</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 60 }} align="center">
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : !result || result.list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    暂无处方记录
                  </TableCell>
                </TableRow>
              ) : (
                result.list.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => row.id && handleViewDetail(row.id)}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {row.prescription_no}
                    </TableCell>
                    <TableCell>{row.patient_name}</TableCell>
                    <TableCell>{row.patient_gender}</TableCell>
                    <TableCell>{row.patient_age || '-'}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.prescription_date}</TableCell>
                    <TableCell>{row.doctor_name}</TableCell>
                    <TableCell>{row.clinical_diagnosis}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="查看详情">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            row.id && handleViewDetail(row.id);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 分页控件 */}
        {result && (
          <TablePagination
            component="div"
            count={result.total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="每页行数："
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / 共 ${count} 条`
            }
          />
        )}
      </Paper>

      {/* 处方详情对话框 */}
      <PrescriptionDetail
        open={detailOpen}
        prescriptionId={selectedId}
        onClose={() => setDetailOpen(false)}
        onPrint={handlePrintFromDetail}
      />

      {/* 打印预览对话框（从详情触发） */}
      <PreviewDialog
        open={previewOpen}
        prescription={previewData}
        onClose={() => setPreviewOpen(false)}
      />
    </Box>
  );
}
