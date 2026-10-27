---
trigger: always_on
description: Mandatory rules for modern UI/UX aesthetics, responsive layout, clean component architecture, and modular code standards.
---

# UI/UX & Architecture Guidelines

When developing features, UI components, or refactoring in this project:

1. **Design Aesthetics & UI/UX**:
   - Never use raw default colors (e.g. pure red, blue, green). Always use refined, modern color palettes with semantic tokens (dark theme / glassmorphic surfaces, subtle borders, sleek shadows).
   - Maintain the 8px/4px spatial grid system.
   - Use modern typography with clear visual hierarchy (display, headings, body, metadata captions).
   - Every interactive element must feature smooth micro-interactions (hover, active, focus-visible states) with standard transitions (~150-250ms).
   - Ensure the map canvas is prominent, with floating HUD controls (layers, legend, year selector) that are clean and responsive.

2. **Code & Component Architecture**:
   - Strictly separate presentation (UI components) from business logic and data fetching (custom hooks, services).
   - Keep files focused and modular (avoid monoliths > 250-300 lines).
   - Organize code into standardized folders: `components/`, `hooks/`, `services/`, `constants/`, `utils/`, and `styles/`.
   - Ensure resilient state management, smooth asynchronous data loading with spinners/skeletons, and comprehensive error handling.
