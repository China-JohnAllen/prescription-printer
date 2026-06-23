/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 医疗蓝色主题色
        medical: {
          primary: '#1565C0',
          light: '#E3F2FD',
          dark: '#0D47A1',
          accent: '#42A5F5',
        },
      },
      fontFamily: {
        sans: ['"Microsoft YaHei"', '"PingFang SC"', 'sans-serif'],
      },
    },
  },
  // 确保 MUI 和 Tailwind 不冲突
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
