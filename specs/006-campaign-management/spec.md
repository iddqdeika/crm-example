# Feature Specification: Advertising Campaign Management

**Feature Branch**: `006-campaign-management`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "add buyer role. also add advertising campaign with CRUD + listing. campaign has name, budget, status (pause, active, archive) and owner. by default belongs to buyer/admin created it. only owner can change ownership of his campaigns. campaign has list of ad groups: each has targets (country, platform, browser, timezone, white/blacklists by sspID/sourceID) and list of creatives: they have name, adtype, clickurl, icon, image. in detail/edit page adgroups presented one after another as separate blocks with creation and deletion possibillity. within ad group block is list of creatives with their parameters with create, delete buttons and editable fields. campaign listing supports search by any campaign field, sorting by up to two fields. supports column-setup (saved per user) to choose columns to show (and their order). column-setup is in popup. listing items supports archiving (with confirmation popup), editing (to open edit page by button). administrator can see all campaigns and filter/order by user. buyer sees only his campaigns."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Buyer Role Access (Priority: P1)

A new "buyer" role is available in the system. A user assigned the buyer role can log in and access the campaign section but cannot access admin-only areas (user management, all campaigns). An administrator can assign or revoke the buyer role from any user. The buyer role is the default role for new self-registered users going forward.

**Why this priority**: The buyer role is a prerequisite for all campaign ownership and visibility rules. Without it, no other story can be scoped correctly.

**Independent Test**: Create a new user, assign the buyer role via admin panel, log in as that user, and confirm access to the campaigns section only — user management and other users' campaigns are inaccessible.

**Acceptance Scenarios**:

1. **Given** a standard user account, **When** an admin assigns the buyer role, **Then** the user can access the campaigns section and sees only their own campaigns.
2. **Given** a buyer user, **When** they attempt to visit the admin user list, **Then** they are redirected or shown an access-denied message.
3. **Given** a buyer and an admin are both logged in, **When** the buyer views the campaign list, **Then** only campaigns where the buyer is the owner are shown.

---

### User Story 2 — Campaign CRUD (Priority: P1)

A buyer or admin can create a new advertising campaign with a name, budget, and status. The campaign is automatically owned by the user who created it. The owner can edit all campaign fields, transfer ownership to another user, and archive the campaign. Admins can manage any campaign regardless of ownership.

**Why this priority**: Core data entry capability. All downstream features (ad groups, creatives, listing) depend on campaigns existing.

**Independent Test**: Log in as a buyer, create a campaign, verify it appears in the list owned by that buyer, edit its name and budget, then archive it with confirmation.

**Acceptance Scenarios**:

1. **Given** a logged-in buyer, **When** they create a campaign with name, budget, and status "active", **Then** the campaign is saved with them as owner and appears in their list.
2. **Given** a campaign owner, **When** they edit the campaign name and budget, **Then** the changes persist and are reflected in the listing.
3. **Given** a campaign owner, **When** they transfer ownership to another user, **Then** the new user becomes the owner and the original owner can no longer transfer it.
4. **Given** a non-owner buyer, **When** they attempt to change campaign ownership, **Then** the ownership field is not editable for them.
5. **Given** a campaign in any status, **When** the owner (or admin) archives it via the listing confirmation popup, **Then** the campaign status changes to "archive".

---

### User Story 3 — Ad Groups Within a Campaign (Priority: P2)

Within a campaign's detail/edit page, ad groups are displayed as separate sequential blocks. Each ad group has targeting parameters (country, platform, browser, timezone, SSP/source white/blacklists). The user can add new ad groups, delete existing ones, and edit their targeting fields inline within each block.

**Why this priority**: Ad groups are the structural layer inside a campaign. They must exist before creatives can be attached.

**Independent Test**: Open a campaign, add two ad groups with different country targets, save, reload — both blocks appear with correct targeting. Delete one block and confirm it is removed.

**Acceptance Scenarios**:

1. **Given** a campaign edit page, **When** the user clicks "Add ad group", **Then** a new empty ad group block appears at the bottom of the list.
2. **Given** an ad group block, **When** the user fills in country, platform, browser, timezone, and whitelist/blacklist IDs, **Then** those values are saved with the ad group.
3. **Given** an existing ad group block, **When** the user clicks "Delete" on that block, **Then** the block is removed and the campaign saves without it.
4. **Given** multiple ad group blocks, **When** the page loads, **Then** each block is shown sequentially with its individual targeting values.

---

### User Story 4 — Creatives Within an Ad Group (Priority: P2)

Within each ad group block on the campaign edit page, there is an inline list of creatives. Each creative has a name, ad type, click URL, icon, and image. The user can add new creatives, delete existing ones, and edit all fields directly within the block without navigating away.

**Why this priority**: Creatives are the deliverable content. They live inside ad groups and complete the campaign data model.

**Independent Test**: Open a campaign with one ad group, add two creatives with different ad types, edit one creative's click URL inline, delete the other, and save — verify changes persist on reload.

**Acceptance Scenarios**:

1. **Given** an ad group block, **When** the user clicks "Add creative", **Then** a new creative row with empty editable fields appears in that block.
2. **Given** a creative row, **When** the user enters name, ad type, click URL, and uploads icon and image, **Then** all fields are saved with the creative.
3. **Given** an existing creative, **When** the user edits the click URL field inline and saves, **Then** the updated URL is persisted.
4. **Given** a creative row, **When** the user clicks "Delete creative", **Then** that creative is removed from the ad group.

---

### User Story 5 — Campaign Listing with Search, Sort, and Column Setup (Priority: P3)

The campaign listing page provides a table of campaigns. The buyer sees only their own; the admin sees all with a filter by owner. Users can search across all campaign fields, sort by up to two columns simultaneously, and configure which columns are visible and in what order via a popup. Column configuration is saved per user and persists across sessions.

**Why this priority**: The listing enhances usability and scalability but campaigns are functional without it. Buyers can still create and manage campaigns without advanced listing features.

**Independent Test**: Log in as a buyer with 5 campaigns, search by campaign name to filter results, sort by budget descending, open the column-setup popup and reorder two columns, reload the page — column order is preserved from the saved configuration.

**Acceptance Scenarios**:

1. **Given** a buyer with multiple campaigns, **When** they enter a search term matching a campaign name, **Then** only campaigns matching that term are shown.
2. **Given** the campaign listing, **When** the user clicks a sortable column header once, **Then** results are sorted ascending by that field; clicking again sorts descending.
3. **Given** two sort fields are active, **When** a third column is sorted, **Then** the oldest sort field is replaced (max 2 active sort fields).
4. **Given** the user opens the column-setup popup, **When** they reorder and hide certain columns and confirm, **Then** the listing reflects the new column arrangement.
5. **Given** the user saved a custom column setup, **When** they log out and log back in, **Then** the same column layout is restored.
6. **Given** an admin on the listing, **When** they apply a "filter by owner" control, **Then** only campaigns belonging to the selected user are shown.

---

### Edge Cases

- What happens when a buyer is deleted — do their campaigns become ownerless or transfer to an admin?
- What happens when a campaign is archived — can it still be edited or only viewed?
- What happens if a budget value of zero or negative is entered?
- How many ad groups / creatives can a single campaign hold before performance degrades noticeably?
- What happens when a user clears all columns in column-setup — does a minimum of one column remain?
- What happens when two users try to transfer the same campaign's ownership simultaneously?

---

## Requirements *(mandatory)*

### Functional Requirements

**Role Management**
- **FR-001**: System MUST support a "buyer" role distinct from "standard" and "admin" roles.
- **FR-002**: Admins MUST be able to assign or change any user's role including "buyer".
- **FR-003**: Buyers MUST only see and interact with campaigns they own.
- **FR-004**: Admins MUST be able to see all campaigns and filter the listing by owner.

**Campaign Lifecycle**
- **FR-005**: System MUST allow buyers and admins to create campaigns with: name (required), budget (required, positive number), and status (active, pause, archive).
- **FR-006**: System MUST automatically set the authenticated user as the campaign owner on creation.
- **FR-007**: Only the campaign owner (or an admin) MUST be able to edit or delete a campaign.
- **FR-008**: Only the campaign owner MUST be able to transfer campaign ownership to another user.
- **FR-009**: System MUST allow campaigns to be archived from the listing with a confirmation popup before the action is executed.
- **FR-010**: Campaign status transitions MUST be: active ↔ pause, active/pause → archive (archive is one-way).

**Ad Groups**
- **FR-011**: Each campaign MUST support one or more ad groups.
- **FR-012**: Each ad group MUST support targeting by: country, platform, browser, timezone, and SSP ID / source ID white/blacklists.
- **FR-013**: Ad groups MUST be creatable and deletable from the campaign detail/edit page without leaving the page.
- **FR-014**: Each ad group's targeting fields MUST be editable inline within its block on the edit page.

**Creatives**
- **FR-015**: Each ad group MUST support one or more creatives.
- **FR-016**: Each creative MUST have: name, ad type, click URL, icon (image upload), and image (image upload).
- **FR-017**: Creatives MUST be addable and deletable inline within their parent ad group block.
- **FR-018**: All creative fields MUST be editable inline within the ad group block.

**Campaign Listing**
- **FR-019**: The listing MUST support full-text search across all campaign fields (name, status, owner, budget).
- **FR-020**: The listing MUST support multi-column sorting by up to two fields simultaneously.
- **FR-021**: Users MUST be able to configure visible columns and their display order via a popup dialog.
- **FR-022**: Column configuration MUST be saved per user and restored on next login.
- **FR-023**: Each listing row MUST include an "Edit" button that navigates to the campaign edit page.
- **FR-024**: Each listing row MUST include an "Archive" action that triggers a confirmation popup before archiving.

### Key Entities

- **User**: Existing entity; gains a new role value "buyer". Existing roles (standard, admin) remain.
- **Campaign**: Name, budget (decimal), status (active/pause/archive), owner (user reference), created-at, updated-at.
- **Ad Group**: Parent campaign reference, country targets, platform targets, browser targets, timezone targets, SSP ID whitelist, SSP ID blacklist, source ID whitelist, source ID blacklist.
- **Creative**: Parent ad group reference, name, ad type, click URL, icon (media reference), image (media reference).
- **Column Configuration**: User reference, listing context (campaigns), ordered list of visible column identifiers. Persists per user.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A buyer can create a complete campaign with one ad group and one creative in under 3 minutes.
- **SC-002**: A buyer sees only their own campaigns; zero campaigns belonging to other users appear in their listing.
- **SC-003**: An admin can locate any campaign by searching or filtering by owner within 30 seconds.
- **SC-004**: Column configuration persists correctly for 100% of users across logout/login cycles.
- **SC-005**: Archiving a campaign from the listing requires exactly one confirmation step before taking effect.
- **SC-006**: Ownership transfer works correctly — after transfer, the new owner can transfer again and the original owner cannot.
- **SC-007**: The listing correctly applies multi-column sort on any two selected fields without data integrity errors.

---

## Assumptions

- Budget is stored as a decimal number in the application's base currency; no multi-currency conversion is in scope.
- Ad type is a free-text or enumerated field; the exact list of ad types is defined during planning.
- Icon and image uploads for creatives reuse the existing media/storage infrastructure (MinIO).
- Archiving is irreversible from the UI; no "un-archive" functionality is in scope for this feature.
- The "buyer" role has the same authentication mechanism as existing roles (session-based).
- White/blacklists for SSP ID and source ID accept comma-separated or newline-separated ID values.
- Deleted users' campaigns are reassigned to an admin as a fallback owner (assumption; may need clarification in planning).
