# Research: Sign Up / Sign In at Top of Landing with Design-Document UI

**Feature**: 015-landing-top-signin-signup  
**Purpose**: Map the project design document to the top-of-landing auth controls and confirm placement.

---

## 1. Where the “top” controls live

**Decision**: The top of the landing page is the **visitor header/nav** rendered when the user is not authenticated (e.g. AppHeader when `!user`). It already includes Blog, Sign in, and Sign up per spec 014. This feature does not add a new top bar; it ensures the existing Sign up and Sign in in that header conform to the design document.

**Rationale**: Spec 014 added Sign in/Sign up to both hero and a persistent header. Spec 015 requires those same top-area controls to have “good UI design according to design document.” So the implementation target is the visitor header (AppHeader or equivalent), not a new component.

**Alternatives considered**: A separate “landing header” component would duplicate nav and styling; reusing the existing visitor nav keeps one source of truth.

---

## 2. Design document token mapping for top auth buttons

**Decision**: Apply the following from the project design document to the top-of-landing Sign up and Sign in controls:

- **Typography**: Buttons use **Outfit** (body family), weight **600**, and font size from `--font-size-small` or `--font-size-body` (design doc: “Buttons: Outfit 600, --font-size-small or --font-size-body”).
- **Primary action (Sign up)**: Background `--color-accent-1`, text on dark (design doc: primary CTAs use accent-1). Ensure contrast (e.g. dark text on accent if needed per doc).
- **Secondary action (Sign in)**: Transparent or outline style using `--color-text-secondary` or `--color-accent-3` for border/link (design doc: tertiary accent for links; secondary for supporting emphasis).
- **Spacing**: Use spacing scale (`--space-xs`, `--space-sm`, `--space-md`) for padding and gaps between the two buttons.
- **Touch targets**: Minimum **44px** height (design doc: “Touch targets >= 44x44px”).
- **Focus**: Visible focus indicator with `--color-accent-3`, 2px solid, 2px offset (design doc: “Focus indicators: Visible, 3:1 contrast”).

**Rationale**: The design document explicitly defines typography for buttons, color usage for primary/secondary actions, spacing scale, and accessibility (touch target, focus). Using these tokens ensures “100% token/convention alignment” per success criteria.

**Alternatives considered**: Hard-coded colors or fonts would violate FR-003 and SC-002; custom values not in the design doc were rejected.

---

## 3. Responsive and accessibility

**Decision**: Top auth controls must remain visible and usable on narrow viewports (e.g. stack or shrink to icon only only if design doc allows). Preserve minimum 44px touch target and focus visibility. Respect `prefers-reduced-motion` if any animation is applied (design doc: motion section).

**Rationale**: Spec edge cases and design doc require accessible, operable controls; WCAG 2.1 AA and touch-target guidance are already in the design document.
