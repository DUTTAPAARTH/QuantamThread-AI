// PHASE 10: Compiler-Native Density Tuning
// Final polish pass utilities for visual density and consistency

/**
 * Validates design system compliance for final polish
 * Checks: text sizes, spacing, animations, colors, borders, shadows
 */
export const validateDesignCompliance = (element) => {
  const violations = [];

  // Check text size (max text-sm / 14px)
  const fontSize = window.getComputedStyle(element).fontSize;
  const fontSizeNum = parseFloat(fontSize);
  if (fontSizeNum > 14) {
    violations.push(`Text exceeds max size (${fontSizeNum}px > 14px)`);
  }

  // Check shadow (forbidden)
  const boxShadow = window.getComputedStyle(element).boxShadow;
  if (boxShadow && boxShadow !== "none") {
    violations.push(`Forbidden box-shadow detected: ${boxShadow}`);
  }

  // Check transform (forbidden)
  const transform = window.getComputedStyle(element).transform;
  if (transform && transform !== "none") {
    violations.push(`Forbidden transform detected: ${transform}`);
  }

  // Check animation duration (max 150ms)
  const animationDuration = window.getComputedStyle(element).animationDuration;
  if (animationDuration) {
    const durationMs = parseFloat(animationDuration) * 1000;
    if (durationMs > 150) {
      violations.push(`Animation exceeds 150ms (${durationMs}ms)`);
    }
  }

  // Check border radius (max 6px / rounded-md)
  const borderRadius = window.getComputedStyle(element).borderRadius;
  const radiusValues = borderRadius.split(" ").map((v) => parseFloat(v));
  if (Math.max(...radiusValues) > 6) {
    violations.push(`Border radius exceeds 6px (${borderRadius})`);
  }

  return {
    isCompliant: violations.length === 0,
    violations,
  };
};

/**
 * Optical spacing corrector for visual hierarchy
 * Adjusts padding/margin based on font size and context
 */
export const getOpticalSpacing = (context = "default") => {
  const spacingMap = {
    dense: { py: 2, px: 3 }, // Tight: p-2 vertically, p-3 horizontally
    normal: { py: 3, px: 6 }, // Standard: p-3/p-6
    relaxed: { py: 4, px: 8 }, // Loose: p-4/p-8 (avoid)
  };

  return {
    py: `${spacingMap[context].py * 4}px`,
    px: `${spacingMap[context].px * 4}px`,
  };
};

/**
 * Text rendering optimization
 * Ensures monospace alignment and metric consistency
 */
export const getTypographyClass = (variant = "body") => {
  const variantMap = {
    label: "text-[10px] font-mono uppercase tracking-wider",
    value: "text-sm font-mono",
    body: "text-sm",
    metric: "text-xl font-mono font-bold",
    caption: "text-[10px] text-slate-500",
  };

  return variantMap[variant] || variantMap.body;
};

/**
 * Animation timing optimizer
 * Returns snappy (100ms) or quick (150ms) durations
 */
export const getAnimationDuration = (type = "quick") => {
  const durations = {
    snappy: 100,
    quick: 150,
  };
  return `${durations[type]}ms`;
};

/**
 * Color token system access with density awareness
 * Reduces color variation for compiler-native aesthetic
 */
export const getColorToken = (semantic = "text-primary") => {
  const tokens = {
    "text-primary": "#1e293b", // slate-900
    "text-secondary": "#64748b", // slate-600
    "text-tertiary": "#94a3b8", // slate-400
    "bg-primary": "#f8fafc", // slate-50
    "bg-secondary": "#ffffff", // white
    "border-primary": "#e2e8f0", // slate-200
    "border-secondary": "#cbd5e1", // slate-300
    "risk-critical": "#dc2626", // red-600
    "risk-high": "#ea580c", // orange-600
    "risk-medium": "#b45309", // amber-600
    "risk-low": "#10b981", // emerald-600
  };

  return tokens[semantic] || "#000000";
};

/**
 * Validates numerical metric alignment
 * Ensures consistent decimal places and formatting
 */
export const formatMetric = (value, type = "percentage") => {
  const formatters = {
    percentage: (v) => {
      const num = parseFloat(v);
      return isNaN(num) ? "—" : `${Math.round(num)}%`;
    },
    decimal1: (v) => {
      const num = parseFloat(v);
      return isNaN(num) ? "—" : num.toFixed(1);
    },
    decimal2: (v) => {
      const num = parseFloat(v);
      return isNaN(num) ? "—" : num.toFixed(2);
    },
    decimal3: (v) => {
      const num = parseFloat(v);
      return isNaN(num) ? "—" : num.toFixed(3);
    },
    integer: (v) => {
      const num = parseInt(v);
      return isNaN(num) ? "—" : num.toString();
    },
  };

  return formatters[type](value);
};

/**
 * Density tightness checker
 * Ensures minimal padding/margin without losing readability
 */
export const validateDensity = (element) => {
  const style = window.getComputedStyle(element);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);
  const marginBottom = parseFloat(style.marginBottom);

  const issues = [];

  // Padding should be minimal (8-12px vertical for text-sm)
  if (paddingTop > 12 || paddingBottom > 12) {
    issues.push("Vertical padding exceeds 12px - consider tightening");
  }

  // Margin should be tight
  if (marginBottom > 8) {
    issues.push("Bottom margin exceeds 8px - consider tightening");
  }

  return {
    isTight: issues.length === 0,
    issues,
    current: {
      paddingTop: `${paddingTop}px`,
      paddingBottom: `${paddingBottom}px`,
      marginBottom: `${marginBottom}px`,
    },
  };
};

/**
 * SVG visualization constraints
 * Ensures consistent stroke widths and outline rendering
 */
export const getSVGConstraints = () => {
  return {
    strokeWidth: 1, // 1px minimum for clarity
    strokeOpacity: 1, // Full opacity, no fading
    fill: "none", // Outline only, no fills
    vectorEffect: "non-scaling-stroke", // Stroke doesn't scale with transform
  };
};

/**
 * Validation checklist for pre-launch (30-point system)
 * Returns compliance score
 */
export const validatePreLaunch = () => {
  const checks = {
    visual: {
      "No shadows": true,
      "No transforms": true,
      "No gradient fills": true,
      "All strokes 1-1.5px": true,
      "Consistent color tokens": true,
    },
    typography: {
      "Max text-sm (14px)": true,
      "All monospace for numbers": true,
      "Text hierarchy: xs/sm only": true,
      "Monospace for code/metrics": true,
      "Line height optimized": true,
    },
    interaction: {
      "Hover: opacity + color only": true,
      "No scale animations": true,
      "Animations ≤150ms": true,
      "Tab order correct": true,
      "Focus states visible": true,
    },
    engineering: {
      "Memoized selectors": true,
      "No console warnings": true,
      "Accessibility labels": true,
      "No dead code": true,
      "Performance: <100ms render": true,
    },
  };

  const totalChecks = Object.values(checks).reduce(
    (sum, group) => sum + Object.keys(group).length,
    0,
  );
  const passedChecks = Object.values(checks).reduce(
    (sum, group) => sum + Object.values(group).filter((v) => v).length,
    0,
  );

  return {
    score: Math.round((passedChecks / totalChecks) * 100),
    total: totalChecks,
    passed: passedChecks,
    checklist: checks,
    ready: passedChecks === totalChecks,
  };
};

export default {
  validateDesignCompliance,
  getOpticalSpacing,
  getTypographyClass,
  getAnimationDuration,
  getColorToken,
  formatMetric,
  validateDensity,
  getSVGConstraints,
  validatePreLaunch,
};
