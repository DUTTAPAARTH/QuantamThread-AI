# QuantumThread AI — Design System Reference

> Complete token specification for the compiler-native design system.  
> All pages MUST conform to these tokens. No exceptions for decorative UI.

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Animation & Transitions](#animation--transitions)
5. [Dimensions & Layout](#dimensions--layout)
6. [Elevation & Depth](#elevation--depth)
7. [Component Patterns](#component-patterns)
8. [Constraint Checklist](#constraint-checklist)

---

## Color System

### CSS Custom Properties

defined in `globals.css` and `index.css`:

```css
:root {
  /* Backgrounds */
  --color-bg-primary:         #f8fafc;  /* slate-50 — page background */
  --color-bg-secondary:       #ffffff;  /* white — cards/panels */

  /* Borders */
  --color-border-primary:     #e2e8f0;  /* slate-200 — hairline dividers */
  --color-border-secondary:   #cbd5e1;  /* slate-300 — subtle emphasis */
  --color-border-accent:      #2563eb;  /* blue-600 — interaction states */

  /* Text */
  --color-text-primary:       rgb(15, 23, 42);    /* slate-900 */
  --color-text-secondary:     rgb(100, 116, 139);  /* slate-500 */
  --color-text-tertiary:      rgb(148, 163, 184);  /* slate-400 */

  /* Risk (text color only — never as backgrounds) */
  --color-risk-low:           #059669;  /* emerald-600 */
  --color-risk-medium:        #d97706;  /* amber-600 */
  --color-risk-high:          #dc2626;  /* red-600 */

  /* Interaction */
  --color-interaction-primary: #2563eb; /* blue-600 */
  --color-interaction-hover:   #1e40af; /* blue-700 */
}
```

### JavaScript Tokens (`designSystem.js`)

```javascript
export const colors = {
  background:   "#f8fafc",
  bgSecondary:  "#ffffff",
  border: {
    primary:   "#e2e8f0",
    secondary: "#cbd5e1",
    accent:    "#2563eb",
  },
  text: {
    primary:   "rgb(15, 23, 42)",
    secondary: "rgb(100, 116, 139)",
    tertiary:  "rgb(148, 163, 184)",
    muted:     "rgb(203, 213, 225)",
  },
  interaction: {
    blue: "#2563eb",
    hover: "#1e40af",
  },
  risk: {
    low:     "#059669",
    medium:  "#d97706",
    high:    "#dc2626",
    neutral: "rgb(15, 23, 42)",
  },
  success: "#10b981",
  warning: "#f59e0b",
  error:   "#ef4444",
};
```

### Tailwind Extensions (`tailwind.config.js`)

```javascript
colors: {
  brand: {
    blue:    '#2563eb',
    indigo:  '#4f46e5',
    success: '#16a34a',
  },
},
```

### Color Usage Rules

| Context | Allowed | Forbidden |
|---------|---------|-----------|
| Risk severity | Text color only (`text-red-600`) | Background fills (`bg-red-100`) |
| Interactive elements | `text-blue-600` / `border-blue-600` | `ring-blue-500/50`, shadow glow |
| Status badges | `bg-emerald-50 text-emerald-600` (minimal tint) | Full-color backgrounds |
| Backgrounds | `#f8fafc` (page), `#ffffff` (panels) | Gradients, patterns |
| Disabled states | `opacity-60` | `bg-gray-100` |

---

## Typography

### Font Stacks

| Token | Value | Use |
|-------|-------|-----|
| `--font-family-system` | `system-ui, -apple-system, sans-serif` | All UI text |
| `--font-family-mono` | `Menlo, Monaco, "Courier New", monospace` | Numbers, code, metrics |

Tailwind config extends with: `Inter, ui-sans-serif, system-ui, sans-serif`

### Font Sizes (STRICT: 14px Maximum)

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| `--font-size-xs` | `0.75rem` (12px) | `text-xs` | Labels, meta, badges, timestamps |
| `--font-size-sm` | `0.875rem` (14px) | `text-sm` | Body text, table data, metric values |

**Forbidden sizes:** `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), and all larger sizes.

The only exceptions are SVG-internal text and Material Symbols icons (which use CSS `font-size` for sizing).

### Font Weights

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| `--font-weight-normal` | 400 | `font-normal` | Body text |
| `--font-weight-medium` | 500 | `font-medium` | Nav items, emphasis |
| `--font-weight-semibold` | 600 | `font-semibold` | Section headers, names |
| `--font-weight-bold` | 700 | `font-bold` | Metric values, key numbers |

### Line Heights

| Token | Value | Use |
|-------|-------|-----|
| `--line-height-tight` | 1.2 | Headings, compact labels |
| `--line-height-normal` | 1.5 | Body text, standard content |

### Typography Patterns

| Pattern | Classes | Example |
|---------|---------|---------|
| Section label | `text-[10px] font-mono uppercase tracking-wider text-slate-500` | `RISK DISTRIBUTION` |
| Metric value | `text-sm font-mono font-bold text-slate-900` | `92.4%` |
| Metric label | `text-[10px] font-mono uppercase tracking-wider text-slate-500` | `ENTROPY` |
| Body text | `text-sm text-slate-900` | Module description |
| Secondary text | `text-xs text-slate-500` | Timestamps, badges |
| Caption | `text-[10px] text-slate-500` | Footnotes |

### Typography Variants (from `compiler-native.js`)

```javascript
const variantMap = {
  label:   "text-[10px] font-mono uppercase tracking-wider",
  value:   "text-sm font-mono",
  body:    "text-sm",
  metric:  "text-xl font-mono font-bold",
  caption: "text-[10px] text-slate-500",
};
```

---

## Spacing

### CSS Spacing Tokens

```css
:root {
  --space-xs:  0.25rem;  /*  4px */
  --space-sm:  0.5rem;   /*  8px */
  --space-md:  0.75rem;  /* 12px */
  --space-lg:  1rem;     /* 16px */
  --space-xl:  1.5rem;   /* 24px */
  --space-2xl: 2rem;     /* 32px */
}
```

### Tailwind Gap Classes

| Token | Class | Value | Use |
|-------|-------|-------|-----|
| xs | `gap-1` | 4px | Inline element spacing |
| sm | `gap-2` | 8px | Tight group spacing |
| md | `gap-3` | 12px | Standard spacing |
| lg | `gap-4` | 16px | Section internal spacing |
| xl | `gap-6` | 24px | Zone separation |
| 2xl | `gap-8` | 32px | Maximum zone separation |

### Vertical Rhythm

| Token | Class | Use |
|-------|-------|-----|
| xs | `space-y-1` | Tight stacking (badges, tags) |
| sm | `space-y-2` | Standard stacking (list items, rows) |
| md | `space-y-3` | Section stacking |
| lg | `space-y-4` | Major section stacking |

### Optical Spacing Contexts

Provided by `getOpticalSpacing()` in `compiler-native.js`:

| Context | Vertical | Horizontal |
|---------|----------|------------|
| `dense` | 8px | 12px |
| `normal` | 12px | 24px |
| `relaxed` | 16px | 32px (avoid) |

### Spacing Rules

- **No void zones** — avoid empty padding that wastes viewport space
- **Dense vertical rhythm** — prefer `space-y-2` or `space-y-3`
- **Maximum gap** — `gap-8` for zone separation, `gap-1` for inline elements
- **Section padding** — `px-6 py-3` as default section pad

---

## Animation & Transitions

### Duration Tokens

```css
:root {
  --duration-quick:  150ms;  /* Default transition */
  --duration-snappy: 100ms;  /* UI feedback, button presses */
}
```

### Timing Function

```css
--timing-function: linear;
```

Linear only. No `ease-in-out`, no `cubic-bezier`. Analytical tools should feel deterministic.

### Allowed Transition Properties

| Property | Use |
|----------|-----|
| `opacity` | Fade in/out panels, show/hide elements |
| `border-color` | Focus states, selection changes |
| `background-color` | Hover/active states |
| `color` | Text color transitions |

### Forbidden Animation Properties

| Property | Reason |
|----------|--------|
| `transform` | No scaling, translating, or rotating |
| `box-shadow` | No glow or stacking shadows |
| `scale` | No zoom effects |
| `rotate` | No spinning animations |
| `blur` | No motion blur |
| `filter` | No dynamic visual effects |

### CSS Enforcement

```css
/* From index.css */
* {
  box-shadow: none !important;
  filter: none !important;
}

/* From globals.css */
.animate-bounce,
.animate-pulse,
.animate-ping {
  animation: none !important;
}
```

### Framer Motion Usage

Framer Motion is used for lightweight enter/exit animations only:

```javascript
// Allowed: opacity-only fade
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.15 }}
/>

// Allowed: staggered list entry (very brief)
transition={{ delay: i * 0.02, duration: 0.15 }}

// Forbidden: scale, translateY, bounce
```

---

## Dimensions & Layout

### Layout Tokens

```css
:root {
  --sidebar-width:   256px;
  --inspector-width: 360px;
  --header-height:   56px;
  --max-border-radius: 6px;
}
```

### Border Radius (STRICT: 6px Maximum)

| Token | Value | Tailwind | Status |
|-------|-------|----------|--------|
| none | 0px | `rounded-none` | Allowed |
| sm | 3px | `rounded-sm` | Allowed |
| md | 6px | `rounded-md` | **Maximum** |
| lg | — | `rounded-lg` | **FORBIDDEN** |
| xl | — | `rounded-xl` | **FORBIDDEN** |
| full | — | `rounded-full` | **FORBIDDEN** |

CSS enforcement resets all `rounded-lg` and above to `0 !important`.

### Shell Dimensions

| Element | Size | Class |
|---------|------|-------|
| Sidebar | 256px wide | `w-64` |
| Header | 56px tall | `h-14` (Layout) / `h-16` (actual) |
| Inspector panel | 360px wide | `w-[360px] shrink-0` |
| Content area | Fills remaining | `flex-1 min-w-0 overflow-hidden` |

### Z-Index Hierarchy

| Layer | Value | Class |
|-------|-------|-------|
| Default | 0 | `z-0` |
| Interactive | 10 | `z-10` |
| Overlay | 20 | `z-20` |
| Modal | 40 | `z-40` |
| Tooltip | 50 | `z-50` |

---

## Elevation & Depth

### Separation Methods

Depth and visual hierarchy are achieved through:

| Method | Implementation | Use case |
|--------|---------------|----------|
| Hairline border | `border border-slate-200` (1px) | Panel/card boundaries |
| Background contrast | `bg-white` on `bg-[#f8fafc]` | Panel vs. page background |
| Opacity reduction | `opacity-60` | Disabled/inactive states |
| Left accent border | `border-l-2 border-blue-600` | Selection indicator |

### Forbidden Depth Methods

- `box-shadow` of any kind
- `drop-shadow` filter
- Glow effects
- Multi-layer elevation (`shadow-sm`, `shadow-md`, `shadow-lg`)
- Background gradients for depth simulation

---

## Component Patterns

### Data Tables

```
- No cell borders — row dividers only (border-b border-slate-200)
- No zebra striping
- No card-style row wrappers
- All numeric data in font-mono
- Hover state: bg-slate-50 (barely visible)
- Selected state: bg-slate-100 + border-l-2 border-blue-600
```

### Inspector Panels

```
- Fixed width: 360px (shrink-0)
- Fixed position in layout — no reflow
- Enter/exit: opacity transition only (no slide-in)
- Left border separator (border-l border-slate-200)
```

### Metric Diagnostic Strips

```
- Labels: text-[10px] font-mono uppercase tracking-wider text-slate-500
- Values: text-sm font-mono font-bold text-slate-900
- No container styling — implicit spacing only
- No card wrappers around individual metrics
```

### ReactFlow Visualizations

```
- Stroke width: 1px to 1.5px maximum
- Outline rendering only (fill: none)
- Grid lines: subtle (#e2e8f0)
- Cursor: grab/grabbing for canvas
- Scrollbar: 6px thin, slate-colored
```

### SVG Constraints (from `compiler-native.js`)

```javascript
{
  strokeWidth: 1,
  strokeOpacity: 1,
  fill: "none",
  vectorEffect: "non-scaling-stroke",
}
```

### Buttons

```css
/* Base */
font-size: 0.875rem;
border: 1px solid var(--color-border-primary);
padding: 0.375rem 0.75rem;
background-color: var(--color-bg-secondary);
border-radius: 3px;

/* Hover */
background-color: var(--color-bg-primary);
border-color: var(--color-border-secondary);
```

### Inputs

```css
font-size: 0.875rem;
border: 1px solid var(--color-border-primary);
padding: 0.375rem 0.75rem;
border-radius: 3px;

/* Focus */
outline: none;
border-color: var(--color-interaction-primary);
```

---

## Constraint Checklist

### Visual (8 checks)
- [x] No decorative UI
- [x] No gradients
- [x] No shadows
- [x] No glow effects
- [x] No animated backgrounds
- [x] No floating cards
- [x] No excessive rounded corners
- [x] Hairline borders only

### Interaction (6 checks)
- [x] No layout shifts on state change
- [x] No container resizing
- [x] No geometry recalculation
- [x] Opacity-only transitions for panels
- [x] Max 150ms animation duration
- [x] No scaling transforms

### Typography (5 checks)
- [x] text-sm maximum size (14px)
- [x] Monospace for all numbers
- [x] Uppercase for section labels
- [x] 3-level text hierarchy (primary/secondary/tertiary)
- [x] No decorative fonts

### Engineering (5 checks)
- [x] Feels like compiler output
- [x] Feels like CI logs
- [x] Feels like a static analysis tool
- [x] Deterministic, not flashy
- [x] Dense, not spacious

### Pre-Launch Validation (20-point system)

The `validatePreLaunch()` function in `compiler-native.js` runs a 20-point compliance check:

| Category | Checks |
|----------|--------|
| Visual | No shadows, no transforms, no gradient fills, all strokes 1-1.5px, consistent color tokens |
| Typography | Max text-sm, all monospace for numbers, text hierarchy xs/sm only, monospace for metrics, line height optimized |
| Interaction | Hover opacity+color only, no scale animations, animations ≤150ms, tab order correct, focus states visible |
| Engineering | Memoized selectors, no console warnings, accessibility labels, no dead code, <100ms render time |

Score: `(passed / total) × 100` — target is 100%.
