# 疫苗开方系统

> 安康高新区社区卫生服务中心 — 处方管理与打印系统

## 功能

- 患者信息管理（姓名、性别、年龄、电话、地址）
- 药品处方开具（多药品、剂量、用法、天数）
- 处方历史查询与 Excel 导出
- A5 处方打印（支持 Windows 系统任意打印机）
- 数据本地存储（SQLite）

## 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 22 |
| 前端 | React 18 + TypeScript + Vite 5 |
| UI 组件库 | MUI (Material-UI) 5 |
| CSS 框架 | TailwindCSS 3 |
| 数据库 | better-sqlite3（SQLite） |
| 打包工具 | electron-builder |

## 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev

# TypeScript 编译
npm run build
```

## 打包

```bash
npm run build:electron
```

输出目录：`release/`

## 系统要求

- Windows 7 SP1+ / Windows 10 / Windows 11
- 32位或64位系统

## 项目结构

```
prescription_printer/
├── electron/           # Electron 主进程
│   ├── main.ts         # 应用入口 + 窗口管理
│   ├── preload.ts      # 预加载脚本（IPC 桥接）
│   ├── database.ts     # SQLite 数据库操作
│   └── print-handler.ts # 处方打印处理
├── src/                # React 前端
│   ├── components/     # 共享组件
│   ├── pages/          # 页面组件
│   ├── context/        # React Context 状态管理
│   ├── types/          # TypeScript 类型定义
│   └── App.tsx         # 根组件
├── docs/               # 设计文档
├── electron-builder.yml # 打包配置
└── package.json
```
