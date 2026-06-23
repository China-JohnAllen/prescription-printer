/**
 * 根组件 — Tab 切换布局。
 * 包含"处方开具"和"历史查询"两个标签页。
 * 使用 MUI Tabs + Tab 组件，蓝色医疗主题。
 */

import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Typography,
  Box,
} from '@mui/material';
import type { } from '@mui/material/styles';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import HistoryIcon from '@mui/icons-material/History';
import { PrescriptionProvider } from './context/PrescriptionContext';
import PrescribePage from './pages/PrescribePage';
import HistoryPage from './pages/HistoryPage';

/** MUI 主题模块扩充 — 添加自定义 medical 调色板 */
declare module '@mui/material/styles' {
  interface Palette {
    medical: Palette['primary'];
  }
  interface PaletteOptions {
    medical?: PaletteOptions['primary'];
  }
}

/** Tab 类型 */
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

/** TabPanel 辅助组件 */
function TabPanel({ children, value, index }: TabPanelProps): React.ReactElement {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ flex: 1, overflow: 'hidden', display: value === index ? 'flex' : 'none' }}
    >
      {value === index && (
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {children}
        </Box>
      )}
    </Box>
  );
}

/** 医疗蓝色主题 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#26A69A',
    },
    medical: {
      dark: '#1565C0',
      light: '#E3F2FD',
      main: '#1976D2',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#263238',
      secondary: '#607D8B',
    },
  },
  typography: {
    fontFamily: [
      '"STKaiti"',
      '"KaiTi"',
      '"华文楷体"',
      '"Microsoft YaHei"',
      '"PingFang SC"',
      'serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          minWidth: 140,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

/** 根组件 */
export default function App(): React.ReactElement {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PrescriptionProvider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          {/* 顶部导航栏 */}
          <AppBar position="static" elevation={2}>
            <Toolbar sx={{ minHeight: 56 }}>
              {/* Logo 标题 */}
              <LocalHospitalIcon sx={{ mr: 1.5, fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 4 }}>
                疫苗开方系统
              </Typography>

              {/* Tab 导航 */}
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="secondary"
                textColor="inherit"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#FFFFFF',
                    height: 3,
                  },
                }}
              >
                <Tab
                  label="处方开具"
                  icon={<NoteAddIcon />}
                  iconPosition="start"
                  id="tab-0"
                  aria-controls="tabpanel-0"
                />
                <Tab
                  label="历史查询"
                  icon={<HistoryIcon />}
                  iconPosition="start"
                  id="tab-1"
                  aria-controls="tabpanel-1"
                />
              </Tabs>
            </Toolbar>
          </AppBar>

          {/* 内容区 */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <TabPanel value={tabValue} index={0}>
              <PrescribePage />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <HistoryPage />
            </TabPanel>
          </Box>

          {/* 底部状态栏 */}
          <Box
            sx={{
              py: 0.5,
              px: 3,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
            }}
          >
            <Typography variant="caption">
              安康高新区社区卫生服务中心
            </Typography>
            <Typography variant="caption">
              疫苗开方系统 v1.0
            </Typography>
          </Box>
        </Box>
      </PrescriptionProvider>
    </ThemeProvider>
  );
}
