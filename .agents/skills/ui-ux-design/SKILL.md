---
name: ui-ux-design
description: >-
  Expert guide and workflow for modern UI/UX design, visual hierarchy, curated color palettes,
  design tokens, typography, micro-interactions, responsive layouts, accessibility (WCAG),
  and geospatial / dashboard UX patterns. Use this skill whenever the user asks for UI/UX design,
  styling, layout improvements, interface components, or modern aesthetics.
---

# UI/UX Design System & Experience Skill

This skill equips Antigravity with senior UI/UX designer and product designer capabilities. It guides the creation of visually stunning, highly intuitive, and accessible user interfaces, particularly for modern web apps, dashboards, and WebGIS platforms.

---

## 1. Core Design Principles

1. **Visual Hierarchy & Clarity**:
   - Establish a distinct reading flow: Primary focal points (e.g., interactive map, key KPIs), secondary controls (e.g., layer toggles, filters), and tertiary context (e.g., metadata, attribution).
   - Use size, contrast, weight, and whitespace to guide attention effortlessly.

2. **Modern Curated Aesthetics (Anti-Boring UI)**:
   - **Never** use raw default colors (e.g., pure `#ff0000`, `#0000ff`, `#00ff00`).
   - Use refined, HSL-tailored color palettes: rich slates, deep midnight blues, emerald accents, and amber warnings.
   - Support dark mode / glassmorphism (`backdrop-filter: blur(12px)`) with subtle borders (`rgba(255, 255, 255, 0.08)`) and multi-layered soft shadows.
   - Premium modern typography: Prefer Google Fonts like *Plus Jakarta Sans*, *Inter*, *Outfit*, or *Cabinet Grotesk*.

3. **Spatial System & Layout**:
   - Strictly follow the **8px / 4px Grid System** for margins, paddings, and sizing (4px, 8px, 12px, 16px, 24px, 32px, 48px).
   - Responsive layouts using fluid flexbox and CSS Grid.
   - Maintain comfortable touch/click targets (minimum 40x40px, ideally 44x44px for touch).

4. **Dynamic Micro-Interactions**:
   - Smooth hover states (`transform: translateY(-2px)`, subtle glow, or elevation change).
   - Micro-transitions: use `cubic-bezier(0.4, 0, 0.2, 1)` with durations between `150ms` and `250ms`.
   - Clear loading feedback: skeleton loaders and pulse indicators instead of harsh blank screens.

5. **Accessibility (WCAG 2.1 AA)**:
   - Ensure contrast ratios of at least 4.5:1 for normal text and 3:1 for large text and UI components.
   - Meaningful focus outlines for keyboard navigation (`:focus-visible`).
   - Appropriate ARIA labels on icon buttons and interactive controls.

---

## 2. Design System Tokens (CSS Variables)

When implementing or reviewing CSS in any project, ensure standard CSS token variables exist:

```css
:root {
  /* Brand & Accents */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-subtle: rgba(59, 130, 246, 0.12);
  --color-accent: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;

  /* Surfaces & Backgrounds */
  --bg-page: #0b0f19;
  --bg-surface: #111827;
  --bg-surface-elevated: #1f2937;
  --bg-glass: rgba(17, 24, 39, 0.75);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: #3b82f6;

  /* Typography */
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --font-family-base: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;

  /* Shadows & Elevation */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 3. WebGIS & Dashboard UX Workflow

When working on map-based and data-dense dashboards:

1. **Map Viewport Dominance**:
   - The interactive map should take 100% of the main canvas or full screen.
   - UI elements (layer switcher, legend, timeline slider, info drawer) should float as elegant glassmorphic panels or collapsible sidebars.

2. **Layer Control UX**:
   - Group layers logically: *Base Maps*, *Thematic / Satelit Layers (Sentinel, DEM, NDVI)*, *Administrative Boundaries*, *Hazard Zones*.
   - Each layer toggle should feature:
     - Clear visibility switch (toggle/checkbox).
     - Layer opacity slider for multi-layer comparison.
     - Color swatch / legend preview.
     - Loading spinner while tile data or GeoJSON is fetching.

3. **Time-Series / Year Selector UX**:
   - Place temporal controls (e.g., 2021-2025) in a clean floating toolbar or segmented button group at the top or bottom-center of the viewport.
   - Highlight the active period clearly with active pill styling.

4. **Legend & Metadata Inspection**:
   - Provide an expandable/collapsible floating Legend card at the bottom-right.
   - Interactive popups or side drawers when clicking polygons or grid points with clean key-value formatting and units (e.g., `Curah Hujan: 2,450 mm/thn`).

---

## 4. UI/UX Verification Checklist

Before finalizing any UI implementation:
- [ ] Are colors harmonious and contrasts high enough for readability?
- [ ] Is spacing consistent (multiples of 4px/8px)?
- [ ] Do all buttons, links, and inputs have hover, active, and focus-visible states?
- [ ] Are interactive icons accompanied by tooltips or descriptive labels?
- [ ] Does the layout adapt gracefully to desktop, tablet, and mobile screen sizes?
- [ ] Are map controls (zoom, reset, layers) easily reachable without obscuring key map regions?

For in-depth references, see:
- [WebGIS & Dashboard UX Patterns](./references/webgis-dashboard-ux.md)
- [Design Tokens & Theme Guide](./references/design-system-guidelines.md)
