// ===== COLOR PALETTE =====
export const COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#F1F5FB',
    100: '#DFE7F5',
    200: '#BCCBE6',
    300: '#91A7D0',
    400: '#607FB7',
    500: '#345B9B', // Main primary
    600: '#243E78', // Current primary
    700: '#1F3566',
    800: '#1B2D55',
    900: '#18264A',
  },

  // Neutral/Gray Scale
  neutral: {
    50: '#F9FAFB', // Current LIGHT_BG
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF', // Current INACTIVE_COLOR
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Current ERROR_COLOR
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Current WARNING_COLOR
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#374151',
    tertiary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
};

// ===== LEGACY SUPPORT (Backward Compatibility) =====
export const PRIMARY_COLOR = COLORS.primary[600];
export const LIGHT_BG = COLORS.background.secondary;
export const INACTIVE_COLOR = COLORS.neutral[400];
export const ERROR_COLOR = COLORS.error[500];
export const WARNING_COLOR = COLORS.warning[500];

// ===== TYPOGRAPHY =====
export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    regular: 'System', // React Native default
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 14,
    xl: 18,
    '2xl': 21,
    '3xl': 24,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ===== SPACING =====
export const SPACING = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// ===== BORDER RADIUS =====
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// ===== SHADOWS =====
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  '2xl': {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

// Legacy shadow support
export const CARD_SHADOW = SHADOWS.md;

// ===== STATUS COLORS =====
export const STATUS_COLORS = {
  approved: COLORS.success[600],
  rejected: COLORS.error[500],
  partially_approved: COLORS.warning[500],
  pending: COLORS.neutral[400],
  in_progress: COLORS.info[500],
  draft: COLORS.neutral[300],
};

// ===== COMPONENT STYLES =====
export const COMPONENT_STYLES = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: COLORS.primary[600],
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      ...SHADOWS.sm,
    },
    secondary: {
      backgroundColor: COLORS.background.primary,
      borderColor: COLORS.border.medium,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
    },
  },

  // Card Styles
  card: {
    default: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      ...SHADOWS.md,
    },
    elevated: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      marginBottom: SPACING.lg,
      ...SHADOWS.lg,
    },
    flat: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.border.light,
    },
  },

  // Input Styles
  input: {
    default: {
      backgroundColor: COLORS.background.primary,
      borderColor: COLORS.border.medium,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.lg,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.text.primary,
    },
    focused: {
      borderColor: COLORS.primary[500],
      borderWidth: 2,
      ...SHADOWS.sm,
    },
    error: {
      borderColor: COLORS.error[500],
      borderWidth: 1,
    },
  },
};

// ===== LAYOUT CONSTANTS =====
export const LAYOUT = {
  // Screen padding
  screenPadding: SPACING.lg,

  // Header heights
  headerHeight: 50,
  tabBarHeight: 52,

  // Common dimensions
  buttonHeight: 44,
  inputHeight: 44,
  avatarSize: {
    sm: 32,
    md: 36,
    lg: 48,
    xl: 60,
  },

  // Breakpoints (for responsive design)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

// ===== ANIMATION CONSTANTS =====
export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// ===== UTILITY FUNCTIONS =====
export const getStatusColor = status => {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
};

export const getTextColor = (variant = 'primary') => {
  return COLORS.text[variant] || COLORS.text.primary;
};

export const getSpacing = (...values) => {
  return values.map(value => SPACING[value] || value);
};

// ===== THEME OBJECT (Complete theme export) =====
export const THEME = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  components: COMPONENT_STYLES,
  layout: LAYOUT,
  animations: ANIMATIONS,
  statusColors: STATUS_COLORS,
};

export default THEME;
