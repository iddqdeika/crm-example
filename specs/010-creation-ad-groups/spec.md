# Feature Specification: Ad Groups and Creatives on Campaign Creation

**Feature Branch**: `010-creation-ad-groups`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "user can add ad groups and creatives during campaign creation as well as during editing. ad groups and creatives ui design remains same as in edit."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add Ad Groups During Campaign Creation (Priority: P1)

A buyer fills in a new campaign form (name, budget, status) and wants to define the campaign structure upfront — without having to first create a bare campaign, navigate to the edit page, and then return to add ad groups. The creation form exposes the same collapsible accordion ad-group section that exists on the edit page. The buyer can add one or more ad groups (each with its targeting fields) and one or more creatives per ad group, all before submitting. When the form is submitted, the new campaign is created with its full ad-group and creative structure in a single operation.

**Why this priority**: This is the primary user-visible gap. Campaign creation currently produces structurally incomplete campaigns, forcing a mandatory two-step flow (create → edit) for any campaign that needs ad groups. Fixing this in creation unlocks the full workflow in one step.

**Independent Test**: Can be fully tested by navigating to `/campaigns/new`, adding at least one ad group with one creative, submitting, then verifying the resulting edit page shows the ad group and creative intact.

**Acceptance Scenarios**:

1. **Given** a buyer is on the `/campaigns/new` page, **When** they click "Add ad group", **Then** a new collapsible accordion ad-group section appears — identical in layout to the one on the campaign edit page.
2. **Given** a buyer has added an ad group, **When** they fill in targeting fields and add a creative with name, ad type, and click URL, **Then** those values are preserved when they submit the form.
3. **Given** a buyer fills in the campaign header fields (name, budget, status) with at least one ad group and creative, **When** they submit, **Then** they are redirected to the edit page for the newly created campaign and the ad group and creative are visible there.
4. **Given** a buyer submits the creation form with an ad group but no creative name, **When** the form validates, **Then** the form prevents submission and highlights the missing required creative field.

---

### User Story 2 — Ad Groups Section Parity (Edit Page Unchanged) (Priority: P2)

The edit page ad-group/creative section already exists and works. This story represents a validation constraint: the creation page must behave identically in visual design, interaction patterns, and field set — the same accordion expand/collapse, the same field labels, the same button hierarchy, the same validation rules — so users encounter no learning curve when moving between create and edit.

**Why this priority**: Parity reduces implementation risk (reuse of logic rather than a parallel implementation) and ensures the user experience is consistent. It is secondary to the creation functionality itself.

**Independent Test**: Can be verified by side-by-side comparison of create and edit pages: accordion open/close behavior, field labels, button labels, and validation messages must match exactly.

**Acceptance Scenarios**:

1. **Given** the creation page has an ad group open, **When** a user clicks the ad group header, **Then** the fields collapse — same as on the edit page.
2. **Given** the creation page ad group section, **When** a user clicks "Add creative", **Then** a new creative row appears with the same three fields (name, ad type, click URL) as on the edit page.
3. **Given** the creation page, **When** a user clicks "Delete ad group" on an ad group that has been added, **Then** that ad group and all its creatives are removed — same behavior as on the edit page.
4. **Given** the creation page, **When** a user views it on a mobile-sized viewport, **Then** the ad group section stacks to a single-column layout — same responsive behavior as the edit page.

---

### Edge Cases

- What happens when the user adds an ad group, fills it partially, then removes all ad groups before submitting? → The campaign is created without ad groups (valid — same as current behavior).
- What happens if a user adds 10 or more ad groups? → The page must remain functional with no performance degradation or layout breakage.
- What happens if the backend rejects the creation due to a validation error inside an ad group? → The error is displayed on the form and the user is not redirected; their ad group data is preserved in the form.
- What if a user submits with a creative row where only the ad type is set (name is empty)? → The form prevents submission; the name field is required per existing edit-page rules.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The campaign creation form MUST include an "Ad groups" section below the campaign header fields (name, budget, status), using the same collapsible accordion layout, field set, and interaction patterns as the campaign edit page.
- **FR-002**: Users MUST be able to add one or more ad groups to the creation form before submitting, using an "Add ad group" button.
- **FR-003**: Each ad group on the creation form MUST expose the same targeting fields as on the edit page: country targets, platform targets, browser targets, timezone targets, SSP ID whitelist, SSP ID blacklist, source ID whitelist, source ID blacklist.
- **FR-004**: Users MUST be able to add one or more creatives per ad group on the creation form, each with: name (required), ad type (required, defaults to `banner`), and click URL (optional).
- **FR-005**: Users MUST be able to remove an ad group (and all its creatives) from the creation form before submitting.
- **FR-006**: Users MUST be able to remove an individual creative from within an ad group on the creation form before submitting.
- **FR-007**: On form submission, all ad groups and creatives entered on the creation form MUST be persisted as part of the new campaign in a single request — no separate edit step required.
- **FR-008**: The backend campaign creation endpoint MUST accept ad groups (with nested creatives) in the creation payload, not only in the update payload.
- **FR-009**: If any required field within an ad group or creative is missing or invalid, the form MUST prevent submission and indicate the specific invalid field — consistent with existing edit-page validation behavior.
- **FR-010**: New ad groups added during creation MUST default to the expanded (open) state — consistent with the edit page behavior for newly added groups.
- **FR-011**: The visual design of the ad groups and creatives section on the creation page MUST be identical to that on the edit page (same CSS classes, colors, typography, spacing, responsive breakpoints).

### Key Entities

- **Campaign**: Top-level entity. Creation payload now optionally includes a list of ad groups.
- **Ad Group**: Belongs to a campaign. Contains targeting fields and a list of creatives. Can be included at creation time.
- **Creative**: Belongs to an ad group. Has name, ad type, click URL, and sort order. Can be included at creation time as part of an ad group.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A buyer can create a fully structured campaign (with at least one ad group and one creative) in a single form submission, without navigating to the edit page afterward.
- **SC-002**: The creation form and the edit form share ad-group/creative UI behavior; a user who learns the interaction on one page requires no re-learning on the other.
- **SC-003**: Form validation on the creation page rejects submission when any creative name is empty, displaying a visible indication on the offending field.
- **SC-004**: The backend accepts campaign creation payloads containing ad groups and creatives and persists them correctly, verifiable by fetching the campaign detail immediately after creation.
- **SC-005**: The creation page with up to 10 ad groups (each with 5 creatives) loads and responds to user interaction without noticeable lag.

---

## Assumptions

- The existing edit-page accordion component logic (expanded state per ad group, add/remove handlers) will be extracted or duplicated into the creation page. No new UI patterns are introduced.
- The `CampaignCreate` backend schema will be extended to accept an optional `ad_groups` list — mirroring the `AdGroupUpsert` structure already used in the update schema.
- Ad groups added during creation do not have pre-existing IDs; the backend treats them as new inserts.
- Sort order for ad groups and creatives added during creation is determined by their position in the submitted array (0-indexed).
- The buyer role permission model does not change; any user who can create campaigns can also include ad groups at creation time.
