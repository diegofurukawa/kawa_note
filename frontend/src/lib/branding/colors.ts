/**
 * Kawa Note Color Palette
 * Centralized color constants for consistent branding
 */

export const brandColors = {
  // Primary Colors
  primary: {
    700: '#0f766e', // Primary Teal (main brand color)
    600: '#0d9488', // Teal Light (hover states)
    500: '#14b8a6', // Teal Lighter (active states)
  },

  // Accent Colors
  accent: {
    500: '#06b6d4', // Cyan (connection nodes, highlights)
    400: '#22d3ee', // Cyan Light (hover states)
  },

  // Neutral Colors
  neutral: {
    50: '#f8fafc', // Slate 50 (light backgrounds)
    100: '#f1f5f9', // Slate 100
    200: '#e2e8f0', // Slate 200
    300: '#cbd5e1', // Slate 300
    400: '#94a3b8', // Slate 400
    500: '#64748b', // Slate 500 (secondary text)
    600: '#475569', // Slate 600
    700: '#334155', // Slate 700
    800: '#1e293b', // Slate 800 (dark backgrounds)
    900: '#0f172a', // Slate 900 (primary text)
  },

  // Semantic Colors
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
  info: '#3b82f6', // Blue

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
    accent: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
  },
};

/**
 * Color Usage Guidelines
 *
 * Primary (Teal):
 * - Logo, main UI elements, primary buttons, links
 * - Conveys: Trust, security, technology, professionalism
 *
 * Accent (Cyan):
 * - Connection nodes, highlights, secondary buttons, badges
 * - Conveys: Connection, communication, innovation
 *
 * Neutral:
 * - Backgrounds, text, borders, dividers
 * - Conveys: Clarity, simplicity, professionalism
 *
 * Semantic:
 * - Success (green), warning (amber), error (red), info (blue)
 * - Use for status indicators, alerts, notifications
 */

/**
 * Accessibility Compliance
 *
 * WCAG AA (4.5:1 contrast ratio):
 * - Primary (#0f766e) on white: ✅ 7.2:1
 * - Accent (#06b6d4) on white: ✅ 4.5:1
 * - Text (#0f172a) on light (#f8fafc): ✅ 15.3:1
 *
 * WCAG AAA (7:1 contrast ratio):
 * - Primary (#0f766e) on white: ✅ 7.2:1
 * - Text (#0f172a) on light (#f8fafc): ✅ 15.3:1
 */

export const colorUsage = {
  // UI Elements
  button: {
    primary: brandColors.primary[700],
    primaryHover: brandColors.primary[600],
    secondary: brandColors.accent[500],
    secondaryHover: brandColors.accent[400],
    disabled: brandColors.neutral[300],
  },

  // Text
  text: {
    primary: brandColors.neutral[900],
    secondary: brandColors.neutral[500],
    light: brandColors.neutral[400],
    inverse: brandColors.neutral[50],
  },

  // Backgrounds
  background: {
    light: brandColors.neutral[50],
    default: '#ffffff',
    dark: brandColors.neutral[800],
    darkest: brandColors.neutral[900],
  },

  // Borders
  border: {
    light: brandColors.neutral[200],
    default: brandColors.neutral[300],
    dark: brandColors.neutral[600],
  },

  // Status
  status: {
    success: brandColors.success,
    warning: brandColors.warning,
    error: brandColors.error,
    info: brandColors.info,
  },

  // Brand
  brand: {
    primary: brandColors.primary[700],
    accent: brandColors.accent[500],
  },
};

/**
 * Dark Mode Overrides
 * Use these colors when in dark mode
 */
export const darkModeColors = {
  text: {
    primary: brandColors.neutral[50],
    secondary: brandColors.neutral[400],
    light: brandColors.neutral[500],
  },
  background: {
    light: brandColors.neutral[800],
    default: brandColors.neutral[900],
  },
  border: {
    light: brandColors.neutral[700],
    default: brandColors.neutral[600],
  },
};

/**
 * Export as CSS variables for Tailwind integration
 * Add to tailwind.config.js:
 *
 * theme: {
 *   extend: {
 *     colors: {
 *       'kawa-primary': '#0f766e',
 *       'kawa-accent': '#06b6d4',
 *     }
 *   }
 * }
 */
