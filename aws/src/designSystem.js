/**
 * QuantumThread AI — Design System Foundation (PHASE 2)
 *
 * Strict UI tokens for compiler-native aesthetic.
 * All pages MUST conform to these rules.
 * No exceptions for decorative UI.
 */

// ==================== COLOR PALETTE ====================
export const colors = {
  // Background
  background: "#f8fafc", // Neutral gray, calming but not white
  bgSecondary: "#ffffff", // Pure white for cards/panels

  // Borders
  border: {
    primary: "#e2e8f0", // slate-200 - hairline dividers
    secondary: "#cbd5e1", // slate-300 - subtle emphasis
    accent: "#2563eb", // blue-600 - interaction only
  },

  // Text Hierarchy
  text: {
    primary: "rgb(15, 23, 42)", // slate-900 - main content
    secondary: "rgb(100, 116, 139)", // slate-500 - labels, meta
    tertiary: "rgb(148, 163, 184)", // slate-400 - disabled, hints
    muted: "rgb(203, 213, 225)", // slate-300 - very light text
  },

  // Interaction
  interaction: {
    blue: "#2563eb", // Primary action
    hover: "#1e40af", // Blue-700 - darker on hover
  },

  // Risk Colors (Text Only — No Backgrounds)
  risk: {
    low: "#059669", // emerald-600 - muted green
    medium: "#d97706", // amber-600 - muted orange
    high: "#dc2626", // red-600 - muted red
    neutral: "rgb(15, 23, 42)", // fallback to primary text
  },

  // Special
  success: "#10b981", // emerald-500
  warning: "#f59e0b", // amber-500
  error: "#ef4444", // red-500
};

// ==================== TYPOGRAPHY ====================
export const typography = {
  // Font families
  fontFamily: {
    system: "system-ui, -apple-system, sans-serif",
    mono: "Menlo, Monaco, 'Courier New', monospace",
  },

  // Sizes (STRICT: text-sm MAXIMUM)
  size: {
    xs: "0.75rem", // 12px - very small labels
    sm: "0.875rem", // 14px - body text, standard
    base: "1rem", // 16px - NEVER USE (violates text-sm maximum)
    lg: "1.125rem", // 18px - NEVER USE
  },

  // Weight
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line height
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Rules
  rules: {
    maxSize: "text-sm (14px)", // NEVER EXCEED
    numericFont: "font-mono", // All numbers must be monospace
    sectionLabels:
      "uppercase, font-mono, text-xs, tracking-wider, text-slate-500",
    body: "text-sm, text-slate-900, font-system",
  },
};

// ==================== SPACING ====================
export const spacing = {
  // Vertical rhythm (dense, no void zones)
  section: {
    paddingX: "px-6", // Horizontal padding
    paddingY: "py-3", // Vertical padding (tight)
  },

  // Gap sizes
  gap: {
    xs: "gap-1", // 0.25rem
    sm: "gap-2", // 0.5rem
    md: "gap-3", // 0.75rem
    lg: "gap-4", // 1rem
    xl: "gap-6", // 1.5rem
    "2xl": "gap-8", // 2rem
  },

  // Space between elements (vertical)
  stack: {
    xs: "space-y-1", // 0.25rem
    sm: "space-y-2", // 0.5rem
    md: "space-y-3", // 0.75rem
    lg: "space-y-4", // 1rem
  },

  // Rules
  rules: {
    noPadding: "AVOID empty void zones",
    denseVertical: "Keep vertical rhythm tight (space-y-2 or space-y-3)",
    noExcessGap: "Max gap-8 for zone separation, gap-1 for inline elements",
  },
};

// ==================== ANIMATIONS ====================
export const animations = {
  // Duration (STRICT: max 200ms)
  duration: {
    quick: "150ms", // Default transition
    snappy: "100ms", // UI feedback
  },

  // Allowed properties
  allowedProperties: [
    "opacity", // Fade in/out
    "border-color", // Focus states
    "background-color", // Hover/active states
    "color", // Text color transitions
  ],

  // FORBIDDEN properties
  forbidden: [
    "transform", // No scaling, no bouncing
    "box-shadow", // No glow, no stacking shadows
    "scale", // No zoom
    "rotate", // No spinning
    "blur", // No motion blur
    "filter", // No dynamic effects
  ],

  // Transition function (linear for analytical UI)
  timingFunction: "linear",

  // Rules
  rules: {
    maxDuration: "150ms (quick) or 100ms (snappy)",
    noAnimationOnLoad: "Transitions only on state change",
    noScale: "NEVER scale nodes or elements",
    noBounce: "NEVER bounce or elastic animation",
    noGlow: "NEVER use box-shadow for glow effect",
  },
};

// ==================== DIMENSIONS ====================
export const dimensions = {
  // Layout
  sidebar: {
    width: "w-64", // 256px fixed
  },

  inspector: {
    width: "w-[360px]", // Fixed right panel
  },

  header: {
    height: "h-14", // 56px
  },

  // Border radius (STRICT: max-md)
  radius: {
    none: "0px",
    sm: "0.375rem", // rounded-sm
    md: "0.375rem", // rounded-md (MAX)
    lg: "NEVER USE",
    full: "NEVER USE",
  },

  // Rules
  rules: {
    maxRadius: "rounded-md (6px)",
    noFloatingCards: "Use border-based separation only",
    noShadow: "Border-based depth only",
  },
};

// ==================== ELEVATION & DEPTH ====================
export const depth = {
  // Z-index hierarchy
  zIndex: {
    default: "z-0",
    interactive: "z-10",
    overlay: "z-20",
    modal: "z-40",
    tooltip: "z-50",
  },

  // Separation methods
  methods: {
    border: "border-slate-200 (1px hairline)", // Primary separator
    background: "bg-white for panels, bg-[#f8fafc] for background",
    opacity: "opacity-60 for disabled/inactive states",
  },

  // FORBIDDEN
  forbidden: [
    "box-shadow (use border instead)",
    "drop-shadow",
    "glow effects",
    "elevation-based depth",
  ],
};

// ==================== COMPONENT PATTERNS ====================
export const patterns = {
  // Data tables
  table: {
    noBorder: "No cell borders — use row dividers only (border-b)",
    noZebra: "No alternating row colors",
    noCards: "No card-style rows",
    monospaceNumbers: "All numeric data in font-mono",
    hoverState: "bg-slate-50 on hover only",
    selectedState: "bg-slate-100 + left-border accent",
  },

  // Inspector panels
  inspector: {
    width: "w-[360px] shrink-0",
    fixed: "Fixed position, no reflow",
    opacity: "opacity transition only (no slide)",
    noShadow: "border-l only",
  },

  // Metrics & diagnostic strips
  diagnostic: {
    denseType: "text-xs for labels, text-sm for values",
    allMono: "All values in font-mono",
    uppercase: "Labels uppercase, tracking-wider",
    noCards: "No container styling, implicit spacing only",
  },

  // Visualization (SVG-based)
  visualization: {
    strokeWidth: "1px to 1.5px max",
    noFill: "Outline only for minimalism",
    gridLines: "Optional subtle grid (#e2e8f0)",
  },
};

// ==================== CONSTRAINT CHECKLIST ====================
export const constraints = {
  visual: [
    "✓ No decorative UI",
    "✓ No gradients",
    "✓ No shadows",
    "✓ No glow effects",
    "✓ No animated backgrounds",
    "✓ No floating cards",
    "✓ No excessive rounded corners",
    "✓ Hairline borders only",
  ],

  interaction: [
    "✓ No layout shifts on state change",
    "✓ No container resizing",
    "✓ No geometry recalculation",
    "✓ opacity-only transitions for panels",
    "✓ Max 150ms animation duration",
    "✓ No scaling transforms",
  ],

  typography: [
    "✓ text-sm maximum size",
    "✓ Monospace for all numbers",
    "✓ Uppercase for section labels",
    "✓ 3-level text hierarchy (primary/secondary/tertiary)",
    "✓ No decorative fonts",
  ],

  engineering: [
    "✓ Feels like compiler output",
    "✓ Feels like CI logs",
    "✓ Feels like static analysis tool",
    "✓ Deterministic, not flashy",
    "✓ Dense, not spacious",
    "✓ Precise, not approximated",
  ],
};

// ==================== EXPORT HELPER ====================
export default {
  colors,
  typography,
  spacing,
  animations,
  dimensions,
  depth,
  patterns,
  constraints,
};
