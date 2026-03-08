/\*\*

- QuantumThread AI — Design System Reference (PHASE 2)
-
- All developers must follow these rules WITHOUT EXCEPTION.
- This is an engineering console, not a SaaS dashboard.
  \*/

// ==================== USAGE GUIDE ====================

/\*\*

- 1.  COLORS
-
- Import from designSystem.js:
- import { colors } from "@/designSystem";
-
- Use color tokens for consistency:
- - colors.risk.low → "#059669" (emerald, text only)
- - colors.risk.high → "#dc2626" (red, text only)
- - colors.text.primary → slate-900
- - colors.text.secondary → slate-500
-
- RULES:
- ✓ Always use monochrome borders (#e2e8f0)
- ✓ Text colors ONLY for risk indication
- ✗ NEVER fill backgrounds with risk colors
- ✗ NEVER use more than 3 simultaneous colors
  \*/

// ==================== TYPOGRAPHY ====================

/\*\*

- RULE: text-sm (14px) is the MAXIMUM size
-
- Sizes:
- - text-xs (12px) → Labels, meta information
- - text-sm (14px) → Body text, table cells
- - text-base+ → FORBIDDEN
-
- Font families:
- - system-ui (default) → Body, labels
- - font-mono → ALL numeric values, timestamps, identifiers
-
- Example:
- <p className="text-xs text-slate-500 font-mono">Risk Score: {score}</p>
- <p className="text-sm font-medium text-slate-900">Module Name</p>
-
- RULES:
- ✓ Numbers ALWAYS monospace
- ✓ Labels uppercase + font-mono
- ✓ 3-level hierarchy: primary/secondary/tertiary
- ✗ NEVER exceed text-sm
- ✗ NEVER use decorative fonts
  \*/

// ==================== SPACING ====================

/\*\*

- RULE: Dense vertical rhythm, no void zones
-
- Vertical:
- - space-y-1 (0.25rem) → Tight grouping
- - space-y-2 (0.5rem) → Default rhythm
- - space-y-3 (0.75rem) → Section separation
-
- Horizontal (section padding):
- - px-6 (1.5rem) → Standard padding
- - py-3 (0.75rem) → Tight vertical
-
- Gaps:
- - gap-1 (0.25rem) → Inline elements
- - gap-3 (0.75rem) → Default
- - gap-8 (2rem) → Zone separation (MAX)
-
- Example:
- <div className="space-y-2">
- <div className="flex gap-3">...</div>
- </div>
-
- RULES:
- ✓ Keep spacing tight (avoid space-y-4+)
- ✓ Use implicit spacing, not explicit padding
- ✗ NEVER create empty void zones
  \*/

// ==================== ANIMATIONS ====================

/\*\*

- RULE: Max 150ms, only opacity/color/border
-
- Allowed transitions:
- - opacity (fade)
- - border-color (focus)
- - background-color (hover)
- - color (text change)
-
- Duration:
- - 150ms (quick) → default
- - 100ms (snappy) → interactive feedback
- - NEVER exceed 200ms
-
- Timing: linear (for analytical UI)
-
- Example (good):
- <button className="transition-colors duration-150 hover:bg-slate-50">
-
- Example (bad):
- <button className="transition-all duration-500 scale-110"> // FORBIDDEN
-
- RULES:
- ✓ Only opacity/color/border transitions
- ✓ Max 150ms duration
- ✗ NEVER scale, rotate, or transform
- ✗ NEVER bounce, ping, or pulse
- ✗ NEVER use box-shadow animation
  \*/

// ==================== COMPONENTS ====================

/\*\*

- TABLES
-
- ✓ border-collapse
- ✓ 1px row dividers (border-b border-slate-200)
- ✓ hover:bg-slate-50 (no zebra striping)
- ✓ selected: bg-slate-100 + border-l-2
- ✓ font-mono for numeric data
- ✗ No cell borders
- ✗ No card-style rows
-
- Example:
- <table className="w-full border-collapse">
- <tbody>
-     <tr className="border-b border-slate-200 hover:bg-slate-50">
-       <td className="px-6 py-3 font-mono">{risk}</td>
-     </tr>
- </tbody>
- </table>
  */

/\*\*

- PANELS / INSPECTOR
-
- ✓ Fixed width (360px)
- ✓ border-l only (no shadows)
- ✓ opacity transition on show/hide
- ✓ Hairline borders
- ✗ No box-shadow
- ✗ No drop-shadow
-
- Example:
- <aside className="w-[360px] border-l border-slate-200 bg-white">
  */

/\*\*

- DIAGNOSTIC STRIPS
-
- ✓ h-14 height (56px)
- ✓ grid-cols-N layout
- ✓ text-xs labels + text-sm values
- ✓ All monospace
- ✓ Uppercase labels with tracking-wider
- ✓ border-b border-slate-200
- ✗ No cards, no containers
-
- Example:
- <div className="h-14 border-b border-slate-200 grid grid-cols-3">
- <div>
-     <p className="text-xs text-slate-500 uppercase font-mono">LABEL</p>
-     <p className="text-sm font-mono font-bold">{value}</p>
- </div>
- </div>
  */

/\*\*

- VISUALIZATIONS (SVG-based)
-
- ✓ Thin strokes (1-1.5px)
- ✓ Outline only (no fill)
- ✓ Subtle grid lines (#e2e8f0)
- ✓ No anti-aliasing artifacts
- ✗ No heavy fills
- ✗ No glow effects
-
- Example:
- <svg className="w-full h-8">
- <polyline
-     points={...}
-     fill="none"
-     stroke="#dc2626"
-     strokeWidth="1.5"
- />
- </svg>
  */

// ==================== VALIDATION CHECKLIST ====================

/\*\*

- Before shipping ANY component:
-
- Visual:
- □ No drop shadows (use borders only)
- □ No gradients
- □ No glow effects
- □ Max rounded-md (6px)
- □ All borders #e2e8f0 or #2563eb
-
- Typography:
- □ No text larger than text-sm
- □ All numbers in font-mono
- □ Labels uppercase
- □ 3-level text hierarchy
-
- Interaction:
- □ No layout shifts on state change
- □ Max 150ms animation duration
- □ Only opacity/color/border transitions
- □ No scaling or transforms
-
- Engineering Feel:
- □ Looks like compiler output
- □ Looks like CI logs
- □ Dense, not spacious
- □ Deterministic, not flashy
  \*/

// ==================== IMPORTS ====================

/\*\*

- Use design tokens in your components:
-
- import { colors, typography, spacing, animations, dimensions } from "@/designSystem";
-
- For CSS custom properties, they're globally available:
- - var(--color-text-primary)
- - var(--color-risk-high)
- - var(--duration-quick)
- - etc.
    \*/

export default {
description: "Design System Reference for QuantumThread AI",
phase: "PHASE 2",
status: "LOCKED - All constraints final",
};
