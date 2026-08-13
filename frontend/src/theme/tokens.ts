/**
 * AI360 全局设计令牌 — proto7 紫色玻璃态
 * 所有视觉参数集中管理，改全站只改这一个文件
 */

export const designTokens = {
  // ===== 主色系 =====
  colors: {
    // 紫色主系
    primary: '#7C3AED',        // 主紫
    primaryDark: '#6D28D9',    // 深紫
    primaryLight: '#A78BFA',   // 浅紫
    indigo: '#6366F1',         // 蓝紫（渐变第二色）
    indigoDark: '#4F46E5',

    // 背景
    bg: '#FAFAFE',             // 极浅冷紫灰
    bgPure: '#FFFFFF',
    bgFaint: '#F5F3FF',        // 极浅紫
    bgTable: '#F8F7FC',        // 表头极浅紫灰

    // 文字
    textPrimary: '#1A1A1A',
    textBody: '#374151',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // 边框/分隔
    border: '#E5E7EB',
    borderLight: '#F0F0F0',
    borderPurple: 'rgba(124,58,237,0.1)',

    // 标签
    tagOfficialBg: 'rgba(99,102,241,0.1)',
    tagOfficialText: '#6366F1',
    tagTestedBg: 'rgba(16,185,129,0.1)',
    tagTestedText: '#059669',
    tagFreeBg: 'rgba(124,58,237,0.1)',
    tagFreeText: '#7C3AED',
    tagMcpBg: 'rgba(99,102,241,0.1)',
    tagMcpText: '#6366F1',
  },

  // ===== 玻璃态 =====
  glass: {
    card: {
      background: 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.4)',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(99,102,241,0.06), 0 1px 4px rgba(0,0,0,0.04)',
    },
    hero: {
      background: 'rgba(255,255,255,0.5)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    },
    topbar: {
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(124,58,237,0.1)',
    },
    sidebar: {
      background: 'transparent',
      borderRight: '1px solid #F0F0F0',
    },
  },

  // ===== 按钮 =====
  button: {
    // 金属质感紫色渐变
    primary: {
      background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #5B21B6 100%)',
      color: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid rgba(124,58,237,0.5)',
      // 金属质感：顶部高光 + 底部暗线 + 外发光
      boxShadow: [
        'inset 0 1px 0 rgba(255,255,255,0.25)',   // 顶部高光
        'inset 0 -1px 0 rgba(0,0,0,0.15)',         // 底部暗线
        '0 4px 12px rgba(124,58,237,0.3)',         // 外发光
      ].join(', '),
      transition: 'all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
    },
    primaryHover: {
      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
      boxShadow: [
        'inset 0 1px 0 rgba(255,255,255,0.3)',
        'inset 0 -1px 0 rgba(0,0,0,0.2)',
        '0 6px 20px rgba(124,58,237,0.4)',
      ].join(', '),
    },
    secondary: {
      background: 'transparent',
      color: '#374151',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
    },
    secondaryHover: {
      background: '#F5F3FF',
      borderColor: '#7C3AED',
      color: '#7C3AED',
    },
  },

  // ===== Tab =====
  tab: {
    activeColor: '#7C3AED',
    activeBorderBottom: '2px solid #7C3AED',
    inactiveColor: '#6B7280',
  },

  // ===== 背景光斑 =====
  bgGlow: `
    body::before {
      content: "";
      position: fixed;
      top: 10%; left: 5%;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: -1;
    }
    body::after {
      content: "";
      position: fixed;
      bottom: 20%; right: 10%;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: -1;
    }
  `,

  // ===== 字体 =====
  font: {
    family: '-apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
    sizes: {
      h1: '26px',
      h2: '20px',
      cardTitle: '16px',
      nav: '14px',
      sidebar: '14px',
      body: '15px',
      desc: '13px',
      aux: '13px',
      tag: '11px',
    },
    weights: {
      h1: '700',
      h2: '600',
      cardTitle: '600',
      tag: '500',
    },
    letterSpacing: '0.02em',
    lineHeight: '1.7',
    numericVariant: 'tabular-nums',
  },

  // ===== 间距 =====
  spacing: {
    pageX: '32px',
    cardPadding: '20px',
    cardGap: '16px',
    blockGap: '32px',
    sidebarWidth: '240px',
    topbarHeight: '56px',
    tabBarHeight: '44px',
  },

  // ===== 圆角 =====
  radius: {
    card: '16px',
    button: '12px',
    tag: '6px',
    sidebarActive: '10px',
    modal: '20px',
  },

  // ===== 动画 =====
  animation: {
    transition: 'all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
    cardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
    },
  },
} as const
