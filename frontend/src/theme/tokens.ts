/**
 * AI360 全局设计令牌
 * 
 * 所有视觉参数集中在这里管理。
 * 改全站配色/间距/圆角 = 只改这一个文件。
 */

export const tokens = {
  // ===== 品牌色 =====
  colors: {
    primary: '#6366f1',       // indigo-500
    primaryDark: '#4f46e5',   // indigo-600
    secondary: '#8b5cf6',     // violet-500
    accent: '#ec4899',        // pink-500
    success: '#10b981',       // emerald-500
    
    // 渐变
    brandGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
    heroGradient: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 40%, #fdf2f8 100%)',
    ctaGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
    
    // 分类卡片背景色（9个分类各一个）
    categories: {
      memory: '#eff6ff',       // 蓝
      search: '#ecfdf5',       // 绿
      file: '#fffbeb',         // 橙
      connect: '#faf5ff',      // 紫
      ecommerce: '#fdf2f8',    // 粉
      content: '#ecfeff',      // 青
      data: '#f0fdfa',         // 薄荷
      design: '#f5f3ff',       // 淡紫
      video: '#fef2f2',        // 红
    },
    
    // 文字
    text: {
      primary: '#1a1a2e',      // 主标题
      secondary: '#6b7280',    // 描述
      tertiary: '#9ca3af',     // 辅助
      disabled: '#d1d5db',     // 禁用
    },
    
    // 背景
    bg: {
      page: '#fafafa',
      card: '#ffffff',
      hover: '#f5f3ff',
    },
    
    // 边框
    border: {
      light: '#f0f0f0',
      medium: '#e5e7eb',
      focus: '#c7d2fe',
    },
  },

  // ===== 圆角 =====
  radius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
  },

  // ===== 间距 =====
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    section: 64,     // 区块间距
    card: 20,        // 卡片内边距
  },

  // ===== 字体 =====
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  // ===== 阴影 =====
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.05)',
    lg: '0 8px 25px -5px rgba(0,0,0,0.1)',
    card: '0 2px 8px -2px rgba(0,0,0,0.04)',
    hover: '0 12px 24px -8px rgba(99,102,241,0.15)',
    focus: '0 0 0 4px rgba(99,102,241,0.1)',
  },

  // ===== 过渡 =====
  transition: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.25s cubic-bezier(0.4,0,0.2,1)',
  },
} as const
