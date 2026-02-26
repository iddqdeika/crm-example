# QualityBoard UI Design Document

**Version**: 1.0  
**Created**: 2026-02-26  
**Audience**: Implementers, stakeholders, content authors  
**Target Users**: Creative thinkers who value originality, visual interest, and meaningful messaging

---

## 1. Visual Identity

### Design Principles

1. **Contrast as Communication**: Every visual choice — color, weight, scale — should create intentional tension that draws the eye and communicates hierarchy. Contrast is not just aesthetic; it signals importance.
2. **Benefit-Oriented Messaging**: Copy speaks to outcomes and value. What does the user gain? Lead with the answer.
3. **Distinctive, Not Decorative**: Every element earns its place. No filler, no generic patterns. The design should feel crafted for this specific product and audience.
4. **Dark Canvas, Vivid Marks**: A near-black foundation creates depth and focus. Vivid accents cut through with precision — like neon on asphalt.

### Aesthetic Direction

The visual language is **editorial-industrial**: the confidence of a high-end magazine layout meets the raw energy of a creative studio. Think bold type on dark surfaces, sharp color accents, generous negative space, and copy that says something real.

---

## 2. Typography

### Font Pairing

| Role | Family | Weights | Usage |
|------|--------|---------|-------|
| **Display** | Syne | 600, 700, 800 | Headlines, hero text, section headings |
| **Body** | Outfit | 300, 400, 500, 600 | Paragraphs, UI text, buttons, captions |

**Why these fonts**: Syne is geometric and assertive — it commands attention without shouting. Outfit is clean and highly legible at all sizes, complementing Syne's boldness with calm clarity. Neither is overused in the AI/SaaS space.

### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-hero` | clamp(2.5rem, 5vw, 4.5rem) | Hero headline |
| `--font-size-h2` | clamp(1.5rem, 3vw, 2.25rem) | Section headings |
| `--font-size-h3` | clamp(1.125rem, 2vw, 1.5rem) | Subheadings, benefit titles |
| `--font-size-body` | 1.125rem (18px) | Body paragraphs |
| `--font-size-small` | 0.875rem (14px) | Captions, meta text |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | 1.1 | Display/hero text |
| `--line-height-body` | 1.65 | Body paragraphs |
| `--line-height-relaxed` | 1.8 | Long-form content |

### Hierarchy Rules

- Hero headlines: Syne 800, `--font-size-hero`, uppercase optional for single-word emphasis
- Section headings: Syne 700, `--font-size-h2`
- Body text: Outfit 400, `--font-size-body`, `--line-height-body`
- Buttons: Outfit 600, `--font-size-small` or `--font-size-body`
- Never mix more than these two families in the interface

---

## 3. Color Palette

### Core Colors

| Token | Hex | Role | Contrast vs bg-primary |
|-------|-----|------|----------------------|
| `--color-bg-primary` | `#08080f` | Page background | — |
| `--color-bg-secondary` | `#111119` | Card/section backgrounds | — |
| `--color-bg-elevated` | `#1a1a24` | Hover states, elevated surfaces | — |
| `--color-text-primary` | `#f0f0f5` | Body text | **15.8:1** (exceeds 7:1) |
| `--color-text-secondary` | `#9d9dab` | Supporting text, captions | **6.2:1** (exceeds 4.5:1) |
| `--color-text-muted` | `#6b6b7b` | Disabled, placeholder | 3.8:1 |

### Accent Colors

| Token | Hex | Role | Contrast vs bg-primary |
|-------|-----|------|----------------------|
| `--color-accent-1` | `#00e5a0` | Primary accent — CTAs, success, key highlights | **10.4:1** |
| `--color-accent-2` | `#ff3d71` | Secondary accent — urgency, alerts, emphasis | **5.2:1** |
| `--color-accent-3` | `#7b61ff` | Tertiary accent — links, decorative, subtle | **4.7:1** |

### Usage Rules

- **Backgrounds**: Always use `--color-bg-primary` as the base. Use `--color-bg-secondary` for section differentiation or card surfaces. Use `--color-bg-elevated` for hover/focus feedback.
- **Text**: Use `--color-text-primary` for all body copy (7:1 guaranteed). Use `--color-text-secondary` for supporting information only.
- **Accents**: Use `--color-accent-1` (green) for primary CTAs and positive actions. Use `--color-accent-2` (red-pink) sparingly for emphasis. Use `--color-accent-3` (violet) for links and decorative elements.
- **Never** place body text on accent backgrounds without verifying contrast. Prefer dark text on accent backgrounds when needed.

---

## 4. Spatial Composition

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 0.5rem (8px) | Tight gaps, inline spacing |
| `--space-sm` | 1rem (16px) | Component internal padding |
| `--space-md` | 1.5rem (24px) | Between related elements |
| `--space-lg` | 3rem (48px) | Between sections within a page area |
| `--space-xl` | 6rem (96px) | Between major page sections |

### Layout Principles

- **Generous negative space**: Let elements breathe. The dark background is not empty — it's the canvas. More space = more impact.
- **Asymmetric tension**: Avoid centering everything. Off-center placements create visual interest. A headline left-aligned against a right-floating accent creates energy.
- **Vertical rhythm**: Maintain consistent spacing between sections using `--space-xl`. Within sections, use `--space-lg` between groups and `--space-md` between items.
- **Max content width**: 72rem (1152px) for body content. Hero sections can bleed to full viewport width.
- **Grid**: Use CSS Grid or Flexbox. Benefit cards: 3-column on desktop, 1-column on mobile. No rigid 12-column grids — let the content determine the layout.

---

## 5. Content Tone & Copywriting

### Voice

- **Confident, not arrogant**: State facts and benefits directly. No hedging ("might help you"), no hype ("revolutionary").
- **Concise, not terse**: Every word earns its place. Cut filler. If a sentence works without an adjective, remove the adjective.
- **Human, not corporate**: Write like you're talking to a smart colleague. No jargon walls. No "leverage synergies."

### Benefit-Oriented Copy Guidelines

- **Lead with the outcome**: "Ship with confidence" not "Quality assurance tool"
- **Answer 'so what?'**: Every headline should pass the "so what?" test. If a reader shrugs, rewrite.
- **Three-beat rhythm**: Benefits work in threes. Each benefit: short title (2-4 words) + one sentence explaining the outcome.
- **Value proposition**: "Quality ensures your future — let's check it." This is the north star. All copy orbits this idea.

### Examples

| Instead of (feature-focused) | Write (benefit-focused) |
|------------------------------|------------------------|
| "Real-time monitoring dashboard" | "See problems before your users do" |
| "Automated quality checks" | "Ship faster without cutting corners" |
| "Comprehensive analytics suite" | "Know exactly where to improve" |

---

## 6. Accessibility

### WCAG 2.1 AA Compliance

This design system targets **WCAG 2.1 AA** with enhanced body text contrast.

| Requirement | Target | Verification |
|-------------|--------|-------------|
| Body text contrast | >= 7:1 (enhanced) | `--color-text-primary` on `--color-bg-primary` = 15.8:1 |
| Secondary text contrast | >= 4.5:1 | `--color-text-secondary` on `--color-bg-primary` = 6.2:1 |
| Interactive element contrast | >= 4.5:1 | All accent colors exceed 4.5:1 on bg-primary |
| Focus indicators | Visible, 3:1 contrast | 2px solid `--color-accent-3` with 2px offset |
| Touch targets | >= 44x44px | Buttons and links minimum 44px height |

### Semantic HTML

- Use `<header>`, `<main>`, `<section>`, `<footer>` landmarks
- Heading hierarchy: one `<h1>` per page, then `<h2>` for sections, `<h3>` for subsections
- All decorative images: `aria-hidden="true"` or empty `alt=""`
- Interactive elements: clear `:focus-visible` styles using `--color-accent-3`
- Prefer `<button>` for actions, `<a>` for navigation

### Motion

- Animations use `prefers-reduced-motion` media query to disable or reduce motion
- No animation exceeds 500ms duration
- No flashing content (3 flashes/second threshold)

---

## 7. CSS Token Reference

All tokens are defined as CSS custom properties in `frontend/src/index.css` under `:root`. Implementers should always reference tokens rather than hardcoding values.

```css
/* Colors */
--color-bg-primary, --color-bg-secondary, --color-bg-elevated
--color-text-primary, --color-text-secondary, --color-text-muted
--color-accent-1, --color-accent-2, --color-accent-3

/* Typography */
--font-display, --font-body
--font-size-hero, --font-size-h2, --font-size-h3, --font-size-body, --font-size-small
--line-height-tight, --line-height-body, --line-height-relaxed

/* Spacing */
--space-xs, --space-sm, --space-md, --space-lg, --space-xl
```

When in doubt, refer to this document. If a decision isn't covered here, choose the option that maximizes contrast and readability.
