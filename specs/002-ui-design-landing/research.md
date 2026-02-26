# Research: UI Design Document & Creative Landing Page

**Feature**: `002-ui-design-landing` | **Date**: 2026-02-26

## 1. Typography for Dark Theme Creative Interfaces

**Decision**: Use Google Fonts — a display font for headings and a clean sans-serif for body text. Specific families will be chosen during design document creation, avoiding overused fonts (Inter, Roboto, Arial, Space Grotesk) per the frontend-design skill guidelines.

**Rationale**: Google Fonts are free, widely supported, and load via `<link>` with no build step. The existing project uses no custom fonts, so this is the simplest path. Display + body pairing creates the typographic contrast the spec demands.

**Alternatives considered**:
- Self-hosted fonts: More control over loading, but adds build complexity for a single landing page. Deferred until performance profiling justifies it.
- System font stack: Zero loading cost but contradicts the "distinctive typography" requirement.

## 2. Dark Theme Color System with WCAG 2.1 AA + 7:1 Body Text

**Decision**: Define a dark palette using CSS custom properties in `index.css`. Background near-black (#0a0a0f or similar), body text white/near-white (#f0f0f5 or similar) ensuring >=7:1 ratio, and 2-3 vivid accent colors (chosen during design document creation) that pass 4.5:1 against the dark background for interactive elements.

**Rationale**: CSS custom properties are already the project's implicit pattern (plain CSS + BEM). Defining tokens in `:root` makes them available everywhere without a build-time framework. The 7:1 body text target exceeds AA requirements and aligns with the enhanced contrast clarification.

**Alternatives considered**:
- Tailwind CSS: Powerful utility system but introducing a new framework for one feature contradicts the constraint of keeping plain CSS + BEM.
- CSS-in-JS (styled-components): Would require a dependency addition and break the project's styling convention.

## 3. Landing Page Animation/Motion Approach

**Decision**: Use CSS-only animations (keyframes, transitions) for page load reveals and hover states. No JavaScript animation library.

**Rationale**: The landing page is a static marketing page with no complex interactive state. CSS animations are performant (GPU-accelerated transforms/opacity), require no additional dependencies, and align with the project's zero-framework CSS approach. A staggered reveal on page load (using `animation-delay`) creates a polished first impression.

**Alternatives considered**:
- Framer Motion / Motion library: Powerful but adds ~30KB+ to the bundle for effects achievable in CSS.
- GSAP: Industry-standard but overkill for a 3-section landing page.

## 4. Design Document Format and Location

**Decision**: Markdown file at `docs/design.md`, structured with sections for visual identity, typography, color palette, spatial composition, content tone, and accessibility. Includes CSS variable names so implementers can directly reference tokens.

**Rationale**: Markdown is already the project's documentation format (specs, README). Keeping the design document in `docs/` alongside `README.md` makes it discoverable. Including CSS variable names bridges the gap between design intent and implementation.

**Alternatives considered**:
- Figma/design tool: Provides richer visual representation but requires external tooling and wouldn't be version-controlled in the repo.
- Storybook: Good for component documentation but heavy for a design system that currently spans one page.

## 5. BEM Naming Convention for Landing Page

**Decision**: Follow the existing BEM pattern. Block: `landing`. Elements: `landing__hero`, `landing__benefits`, `landing__cta`, `landing__headline`, `landing__tagline`, etc. Modifiers: `landing__btn--primary`, `landing__btn--secondary`.

**Rationale**: The existing `Landing.tsx` already uses BEM-style classes (`landing`, `landing__hero`, `landing__tagline`, `landing__cta`, `landing__btn`). Continuing this pattern ensures consistency and requires no migration.

**Alternatives considered**:
- CSS Modules: Would provide scoping but break consistency with all existing components.
- New naming convention: No benefit; the existing pattern works.

## 6. Testing Strategy for Visual/Design Compliance

**Decision**: Automated Vitest + Testing Library tests verify structural correctness (sections present, text content, CTAs, semantic HTML). Visual compliance (colors, fonts, spacing) is verified manually via a design-audit checklist derived from the design document. Optional: Playwright screenshot tests for regression.

**Rationale**: Testing Library tests are reliable for DOM structure and content. Visual properties (computed styles) are fragile to test in jsdom. A checklist-based manual review is more effective for design fidelity. Playwright screenshot tests can be added later for regression prevention.

**Alternatives considered**:
- Snapshot testing: Brittle for styling changes; provides false confidence.
- Visual regression tools (Percy, Chromatic): External services; overkill for a single page at this stage.
