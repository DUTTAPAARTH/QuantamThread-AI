# QuantumThread AI — Design Philosophy

> The interface should feel like compiler output, not a marketing dashboard.

---

## Core Philosophy

QuantumThread AI adopts a **compiler-native aesthetic** — the visual language of static analysis tools, CI/CD logs, and terminal diagnostics. Every pixel serves an analytical purpose. There is no decorative UI.

The design answers one question: *What would a code analysis tool look like if it were designed by engineers who value density, precision, and determinism over visual appeal?*

---

## Five Design Principles

### 1. Density Over Spaciousness

Every screen must maximize information density. White space is not "breathing room" — it is wasted viewport. Content should fill the available area with tightly packed, readable data.

- Vertical rhythm: `space-y-2` (8px) or `space-y-3` (12px) between elements
- Section padding: `px-6 py-3` — horizontal breathing room, minimal vertical
- No empty "hero sections" or decorative spacers
- Tables use row dividers only (no cell borders, no card wrappers)

### 2. Precision Over Approximation

All numeric values must be rendered in monospace (`font-mono`) to maintain columnar alignment. Metrics display exact values, not rounded approximations.

- Risk scores: `92`, not `~90`
- Entropy: `2.847`, not `~2.8`
- Percentages: `73%`, not `about 70%`
- Timestamps: `2h ago`, not `recently`

### 3. Determinism Over Animation

Transitions exist only to communicate state changes (hover, selection, load). They must be fast enough to feel instantaneous — never slow enough to be noticed.

- Maximum animation duration: **150ms**
- Timing function: **linear** (not ease-in-out, not cubic-bezier)
- Allowed properties: `opacity`, `border-color`, `background-color`, `color`
- Forbidden: `transform`, `scale`, `rotate`, `blur`, `box-shadow` animations

### 4. Borders Over Shadows

Depth is communicated through **1px hairline borders** (`border-slate-200`), not box-shadows or elevation. The interface is flat by design — not "flat design" as a trend, but flat as an engineering constraint.

- Panel separation: `border-r`, `border-b`, `border-l`
- Card containers: `border border-slate-200` — never `shadow-md`
- Active/focus states: `border-blue-600` — never `ring-2 ring-blue-500/50`
- Disabled states: `opacity-60` — never `bg-gray-100`

### 5. Function Over Decoration

No element exists without a functional purpose. If removing an element doesn't reduce the user's ability to analyze code, it shouldn't be there.

**Forbidden:**
- Gradients (background or text)
- Glow effects
- Animated backgrounds
- Decorative icons without informational value
- Rounded corners beyond 6px (`rounded-md` maximum)
- Floating cards with drop shadows
- Zebra-striped table rows
- Color-coded backgrounds for status (use text color only)

---

## Visual Language

### Color Usage

Color is used **sparingly and semantically**:

| Purpose | Color | Token |
|---------|-------|-------|
| Primary text | `slate-900` | `--color-text-primary` |
| Secondary text | `slate-500` | `--color-text-secondary` |
| Tertiary/disabled | `slate-400` | `--color-text-tertiary` |
| Primary action | `blue-600` | `--color-interaction-primary` |
| Low risk | `emerald-600` | `--color-risk-low` |
| Medium risk | `amber-600` | `--color-risk-medium` |
| High/Critical risk | `red-600` | `--color-risk-high` |

Risk colors are applied **to text only** — never as background fills. A critical vulnerability is `text-red-600`, not `bg-red-100 text-red-800`.

### Typography Hierarchy

The entire application uses exactly **two font sizes**:

| Size | Token | Use |
|------|-------|-----|
| 12px (`text-xs`) | `--font-size-xs` | Labels, meta text, badges, timestamps |
| 14px (`text-sm`) | `--font-size-sm` | Body text, table data, metric values |

There is no `text-base` (16px), `text-lg` (18px), or larger. Headings are styled with `font-semibold` or `uppercase tracking-wider`, never with increased font size.

### Section Labels

All section headers follow the pattern:
```
uppercase · font-mono · text-xs · tracking-wider · text-slate-500
```

Example: `RISK DISTRIBUTION`, `SECURITY METRICS`, `MODULE INSPECTOR`

### Numeric Display

All numbers use monospace rendering for columnar alignment:
```
font-mono text-sm text-slate-900
```

Metric labels use the diagnostic pattern:
```
text-[10px] font-mono uppercase tracking-wider text-slate-500
```

---

## Interaction Design

### Hover States

- Table rows: `bg-slate-50` (barely visible tint)
- Buttons: `bg-slate-50 border-slate-300` (subtle border darkening)
- Links: `text-blue-700` (one shade darker)
- No transform, no scale, no shadow changes

### Selection States

- Selected row: `bg-slate-100` + `border-l-2 border-blue-600`
- Selected nav item: `bg-blue-600/8 text-blue-600 border-r-2 border-blue-600`
- No ring effects, no glow

### Focus States

- Input focus: `border-blue-600` (accent border only)
- No `ring` utility, no `outline` glow
- Keyboard focus must be visible but not decorative

### Loading States

- Boolean `loading` flag in Zustand store
- Content area shows minimal skeleton or nothing (not animated spinners)
- No shimmer effects, no pulsing placeholders

---

## Layout Principles

### Shell Structure

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (256px)  │           Header (56px)               │
│                  ├──────────────────────────────────────  │
│  Logo            │                                       │
│  Nav Items (7)   │    Page Content (scrollable)           │
│  Settings        │                                       │
│                  │                                       │
└─────────────────────────────────────────────────────────┘
```

- Sidebar: fixed 256px, `bg-white`, `border-r`
- Header: fixed 56px, `bg-white`, `border-b`
- Content: fills remaining space, `overflow-y-auto`
- No floating panels, no overlay navigation

### Page Internal Structure

Each page follows a consistent zone layout:

1. **Diagnostic Strip** — Top row of key metrics (4-6 items, `text-xs` labels + `text-sm font-mono` values)
2. **Primary Zone** — Main data view (table, graph, or list)
3. **Inspector Panel** — Optional 360px right panel for detail view (fixed, not sliding)

### Responsive Behavior

The application is **not responsive**. It targets desktop engineering workstations (1440px+ viewports). The layout uses fixed widths and `overflow-hidden` to prevent layout shifts.

---

## Anti-Patterns (Explicitly Forbidden)

| Pattern | Why Forbidden |
|---------|--------------|
| `box-shadow` on any element | Creates visual noise; borders provide cleaner separation |
| `border-radius` > 6px | Rounded corners are decorative, not functional |
| `transform: scale()` on hover | Causes layout reflow and looks "consumer-app" |
| `transition-duration` > 150ms | Slow transitions feel sluggish in analytical tools |
| `background: linear-gradient()` | Gradients are decorative |
| `filter: blur()` | Motion blur is decorative |
| `animate-bounce`, `animate-pulse` | Play animations have no analytical purpose |
| `text-base` or larger | Violates the 14px max constraint |
| Card-style wrappers with shadows | Use border-separated sections instead |
| Color-coded row backgrounds | Use text color for severity, not background fills |

---

## Reference Implementation

The design philosophy is enforced through CSS:

1. **CSS Constraint Layer** (`index.css`, `globals.css`) — Global `!important` overrides that prevent forbidden properties even if component code attempts to use them
2. **Tailwind Config** (`tailwind.config.js`) — Extended color palette, font families, and shadow definitions that align with design constraints

This enforcement ensures the aesthetic remains consistent as the codebase grows.
