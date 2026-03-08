# QuantumThread AI - Engineering Console

A comprehensive intelligence platform for repository analysis built with React, featuring risk assessment, security scanning, dependency mapping, and evolution tracking.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.

## Architecture

### Core Pages (6 Total)

1. **Dashboard** (`/`)
   - Home page with repository intelligence overview
   - Minimal compiler-native aesthetic
   - Entry point for all analysis

2. **Architecture Map** (`/architecture`)
   - Interactive graph visualization of module dependencies
   - Heatmap mode for risk-based tinting
   - Evolution timeline (v1.0 → Current)
   - Intelligence overlays:
     - Heat Strip: Risk ranking
     - Entropy Ring: Complexity distribution
     - Blast Radius: Impact zones
     - Focus Mode: Selective visibility

3. **Bug & Risk Analysis** (`/bug-risk`)
   - Risk scoring with Shannon entropy calculation
   - Gravity model for cascade effects
   - Risk topology sorting (3 modes)
   - Engineering table with inspector panel

4. **Security Scanner** (`/security`)
   - CVE vulnerability tracking
   - Threat exposure metrics
   - Patch coverage analysis
   - Attack surface mapping

5. **Dependency Intelligence** (`/dependencies`)
   - Gravity-based module ranking
   - Hub identification
   - Circular dependency detection
   - Structural imbalance analysis

6. **Repository Evolution** (`/evolution`)
   - Risk trending over versions
   - Entropy evolution tracking
   - Vulnerability accumulation
   - Development activity metrics

## Technology Stack

- **Frontend**: React 19.2.0
- **Routing**: React Router v6
- **State Management**: Zustand
- **Graph Visualization**: React Flow 11.11.4
- **Animations**: Framer Motion 11.18.2
- **Styling**: TailwindCSS 3.4.17
- **Icons**: Material Symbols
- **Build**: Vite

## Design System

### Constraints

- **Text**: Max 14px (text-sm), labels 10px (text-xs)
- **Colors**: 12 predefined tokens only
- **Spacing**: Dense (2-8px vertical, max space-y-3)
- **Animations**: ≤150ms, opacity/color/border only
- **Borders**: 1-1.5px strokes, no shadows
- **Radius**: Max 6px (rounded-md)
- **Numbers**: 100% monospace, consistent decimal places

### Structure

```
designSystem.js         → Token definitions
globals.css            → CSS constraint enforcement
index.css              → TailwindCSS integration
DESIGN_SYSTEM_REFERENCE.md → Developer guide
```

## Global State (Zustand)

Located in `src/store/intelligence.store.js`

### Data Collections

- `modules`: 7 modules with risk metrics
- `vulnerabilities`: 5 CVEs with exploitability
- `dependencies`: 6 modules with gravity/volatility
- `timePeriods`: 6 versions with evolution metrics

### Memoized Selectors

- `getModuleById()`
- `calculateEntropy()`
- `calculateGravity()`
- `getSecurityScore()`
- `getHubModules()`
- `getRiskTrend()`

## Algorithms

### Shannon Entropy

Measures bug distribution concentration across modules.

```
H = -Σ(p_i × log₂(p_i))
Normalized to 0-100% scale
Interpretation: concentrated/distributed/uniform
```

### Gravity Model

Risk cascade weighting based on downstream dependencies.

```
gravity_i = riskScore_i × (1 + 0.5 × downstreamAffectedCount)
```

### Risk Topology Sorting

Three ranking modes for module prioritization.

```
Cascade: riskScore × (1 + impactRadius/10)
Volatility: riskScore × (1 + dependencyCount/10)
Standard: level > score > dependencies
```

## Performance Utilities

Located in `src/utils/performance.js`

### Available Hooks

- `useDebouncedState()`: Debounced state updates (150ms)
- `useMemoizedSelector()`: Memoized calculations
- `useBatchedState()`: Batch multiple updates
- `renderTableRowsVirtually()`: Virtual list rendering
- `useMemoizedSort()`: Cached sort operations
- `useIntersectionObserver()`: Lazy-load on scroll
- `useMemoizedClass()`: CSS class caching
- `useRAF()`: 60fps animation alignment

## Compiler-Native Utilities

Located in `src/utils/compiler-native.js`

### Validation Functions

- `validateDesignCompliance()`: Element constraint checking
- `validatePreLaunch()`: 30-point compliance checklist
- `validateDensity()`: Padding/margin verification
- `formatMetric()`: Consistent number formatting
- `getColorToken()`: Color system access
- `getSVGConstraints()`: SVG rule enforcement

## File Structure

```
src/
├── pages/
│   ├── Dashboard.jsx
│   ├── ArchitectureMap.jsx (840 lines + overlays)
│   ├── BugRisk.jsx
│   ├── SecurityScanner.jsx
│   ├── DependencyIntelligence.jsx
│   └── RepositoryEvolution.jsx
├── components/
│   └── Layout.jsx (shared shell)
├── store/
│   └── intelligence.store.js (Zustand)
├── utils/
│   ├── performance.js
│   └── compiler-native.js
├── Router.jsx
├── designSystem.js
├── globals.css
├── index.css
└── main.jsx
```

## Key Features

### Data Visualization

- ✅ Risk-based heatmapping
- ✅ Complexity rings (entropy)
- ✅ Sparkline trends (risk, entropy, vulns)
- ✅ Histogram distributions
- ✅ Segmented severity bars
- ✅ Blast radius impact zones

### Intelligence Analysis

- ✅ Shannon entropy calculation
- ✅ Gravity-based cascade modeling
- ✅ Topology sorting (3 modes)
- ✅ Hub module identification
- ✅ Circular dependency detection
- ✅ Structural imbalance scoring

### Engineering Tables

- ✅ Sortable/filterable columns
- ✅ Row selection with inspector
- ✅ Monospace metric formatting
- ✅ Color-coded severity
- ✅ Hover states
- ✅ Virtual rendering ready

## Usage Examples

### Accessing Global State

```javascript
import useIntelligenceStore from '@/store/intelligence.store.js';

function MyComponent() {
  const modules = useIntelligenceStore(state => state.modules);
  const entropy = useIntelligenceStore(state => state.calculateEntropy());

  return (
    // Use modules and entropy
  );
}
```

### Using Performance Utilities

```javascript
import { useDebouncedState, useMemoizedSelector } from '@/utils/performance.js';

function MyComponent() {
  const [hovered, setHovered] = useDebouncedState(null, 150);

  const sortedModules = useMemoizedSelector(
    () => modules.sort((a, b) => b.riskScore - a.riskScore),
    [modules]
  );

  return (
    // Use with optimized performance
  );
}
```

### Validation

```javascript
import { validateDesignCompliance } from "@/utils/compiler-native.js";

const element = document.querySelector(".my-component");
const { isCompliant, violations } = validateDesignCompliance(element);

if (!isCompliant) {
  console.warn("Design violations:", violations);
}
```

## Constraints & Rules

### CSS Forbidden

- ❌ box-shadow
- ❌ filter
- ❌ transform
- ❌ clip-path
- ❌ backdrop-filter

### Typography Forbidden

- ❌ text-base (16px)
- ❌ text-lg (18px)
- ❌ text-xl+ (20px+)
- ❌ system fonts (use system-ui or monospace)

### Animation Forbidden

- ❌ scale, rotate, skew
- ❌ @keyframes bounce/pulse/ping
- ❌ duration > 150ms
- ❌ easing: cubic-bezier (use linear/ease-in-out)

### Spacing Forbidden

- ❌ space-y-4+ (>12px vertical)
- ❌ p-8+ (>32px padding)
- ❌ gap-16+ (>64px gap)

## Performance Targets

- Table render: <100ms (with virtualization)
- Hover response: 150ms (debounced)
- Animation frame rate: 60fps (RAF-aligned)
- Memory usage: Minimal re-renders (memoized)
- Bundle size: <300KB (gzipped)

## Pre-Launch Checklist

- ✅ All pages render without errors
- ✅ Zero console warnings
- ✅ All animations ≤150ms
- ✅ No box-shadows anywhere
- ✅ No text larger than 14px
- ✅ All metrics properly formatted
- ✅ Focus states on interactive elements
- ✅ Mobile responsiveness verified
- ✅ Accessibility audit passed
- ✅ Performance profiled

## Debugging

### View Design Compliance

```javascript
import { validateDesignCompliance } from "@/utils/compiler-native.js";
const violations = validateDesignCompliance(document.body);
console.log(violations);
```

### Check Pre-Launch Status

```javascript
import { validatePreLaunch } from "@/utils/compiler-native.js";
const status = validatePreLaunch();
console.log(`Launch Score: ${status.score}/100`);
```

### Profile Performance

```javascript
import { useRAF } from "@/utils/performance.js";
const updateFn = useRAF(() => {
  console.time("update");
  // Your update code
  console.timeEnd("update");
});
```

## Troubleshooting

**Tables rendering slowly?**

- Use `renderTableRowsVirtually()` from performance utilities
- Memoize row components with `useMemo()`
- Implement `useIntersectionObserver()` for lazy-loading

**High re-render count?**

- Check component memoization
- Use `useMemoizedSelector()` for derived state
- Profile with React DevTools Profiler

**Animations janky?**

- Ensure animations ≤150ms
- Use `useRAF()` for smooth 60fps
- Check for transform animations (forbidden)

**Design looks off?**

- Validate with `validateDesignCompliance()`
- Check CSS custom properties in `globals.css`
- Review `DESIGN_SYSTEM_REFERENCE.md`

## Contributing

When adding new features:

1. Follow design system constraints
2. Add memoized selectors to store if needed
3. Use performance utilities for optimization
4. Validate with compiler-native utilities
5. Update pre-launch checklist
6. Test on multiple browsers
7. Profile performance impact

## License

Proprietary - QuantumThread AI

## Support

For issues or questions, refer to:

- `PHASE_SUMMARY.md` → Full phase breakdown
- `DESIGN_SYSTEM_REFERENCE.md` → Design rules
- `designSystem.js` → Token definitions
- `src/store/intelligence.store.js` → Data structure

---

**Status**: 🟢 Production Ready  
**Version**: 2.0  
**Last Updated**: February 28, 2026
