# Design System Guidelines

A rigorous design system guarantees visual consistency, accessibility, and high perceived quality across the application.

## 1. Color System Architecture

### Semantic Roles
- **Primary / Brand**: Used for key CTAs, active states, brand identity (`#3b82f6` or `#2563eb`).
- **Success / Safe**: Used for low risk, positive indicators, verified status (`#10b981`).
- **Warning / Caution**: Used for moderate hazard, warning states, attention notes (`#f59e0b`).
- **Danger / Critical**: Used for high landslide susceptibility, critical errors, destructive actions (`#ef4444`).
- **Surfaces**:
  - Dark Theme:
    - Base: `#0b0f19` (Deep obsidian)
    - Surface: `#111827` (Rich dark slate)
    - Elevated Surface: `#1f2937` (Card / modal / dropdown)
    - Border: `rgba(255, 255, 255, 0.08)`
  - Light Theme (if toggled):
    - Base: `#f8fafc`
    - Surface: `#ffffff`
    - Elevated Surface: `#f1f5f9`
    - Border: `rgba(0, 0, 0, 0.08)`

### The 60-30-10 Rule
- **60%**: Neutral dominant color (canvas background, map background, cards).
- **30%**: Secondary tone (sidebars, borders, cards, secondary typography).
- **10%**: Accent color (buttons, active pills, badges, critical alerts).

## 2. Typography Scale

Using modern geometric grotesque sans-serif fonts:
- **Display / Hero**: `28px - 36px` | Font weight `700` | Line height `1.2`
- **Section Heading (H1/H2)**: `20px - 24px` | Font weight `600` | Line height `1.3`
- **Subheading (H3/H4)**: `16px - 18px` | Font weight `600` | Line height `1.4`
- **Body / Normal**: `14px` | Font weight `400` | Line height `1.5`
- **Small / Metadata / Caption**: `12px` | Font weight `500` | Line height `1.4`
- **Badge / Micro-label**: `11px` | Font weight `600` | Uppercase tracking `0.05em`

## 3. Elevation & Glassmorphism

```css
/* Glassmorphism Panel */
.glass-panel {
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border-radius: 12px;
}
```

## 4. Micro-Interactions & Animation Specs

- **Button Hover**:
  ```css
  .btn {
    transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  .btn:active {
    transform: translateY(0);
  }
  ```
- **Fade / Slide Transition for Modals and Drawers**:
  ```css
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  ```
