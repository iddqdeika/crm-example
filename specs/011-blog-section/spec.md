# Feature Specification: Blog Section

**Feature Branch**: `011-blog-section`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "blog section. blog section is visible in landing without login as well. blog content is managed by users with content-manager. this user cant crud campaigns and users, only blog posts. blog post list supports search and sort with edit/delete buttons in elements. blog post edit page supports preview. post has title, creation date, body, creator and author. author by-default is empty, creator - user created post. on landing there are blogs section visible and there user can select latest blogs to read. dedicated blogs page can be opend by dedicated button. blogs page contains section 'latest', but is ready to add other sections (e.g. by groups) later. also blogs page supports fulltext search with search result listing with highliting of text founded. all ui is designed accordingly to design."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Public Blog Reading (Priority: P1)

Any visitor — authenticated or not — can browse blog posts on the landing page and navigate to a dedicated blogs page to read the latest posts and search across all content.

**Why this priority**: This is the primary public-facing value of the blog feature. No login is required, making it the widest-reaching story. It delivers immediate value the moment the first post is published.

**Independent Test**: Open the app in an incognito browser (no session). Verify the landing page displays a "Latest posts" section with post cards. Click through to the dedicated blogs page. Read a full post. Run a search and confirm matching text is highlighted in results.

**Acceptance Scenarios**:

1. **Given** a visitor is on the landing page (not logged in), **When** the page loads, **Then** a blog section is visible showing the latest published posts (cards with title, date, and author if set).
2. **Given** a visitor sees the landing page blog section, **When** they click a post card, **Then** they are taken to the full blog post reading page.
3. **Given** a visitor is on the landing page, **When** they click the "All posts" / "See all" button, **Then** they are taken to the dedicated blogs page.
4. **Given** a visitor is on the dedicated blogs page, **When** the page loads, **Then** a "Latest" section is displayed listing the most recent published posts.
5. **Given** a visitor is on the dedicated blogs page, **When** they type in the search box (after a short debounce pause), **Then** matching posts are displayed live with the matched query text highlighted within the title and body snippet.
6. **Given** a visitor searches for a term with no matching posts, **When** results are shown, **Then** an "No results found" message is displayed and no post cards appear.

---

### User Story 2 — Content Manager Authoring (Priority: P2)

A user with the `content-manager` role can create, edit, and delete blog posts through a dedicated management interface, including a live preview of rendered post content before publishing.

**Why this priority**: No content = no blog. The authoring workflow is essential but only affects internal users — it unblocks public reading (P1) once posts exist.

**Independent Test**: Log in as a content-manager user. Create a new post, preview it, save it. Verify it appears in the public blog. Edit and delete an existing post. Confirm changes are reflected publicly.

**Acceptance Scenarios**:

1. **Given** a content-manager is logged in, **When** they navigate to the blog management area, **Then** they see a list of all existing posts with title, creation date, creator, and author (if set), plus Search, Sort, Edit, and Delete controls.
2. **Given** a content-manager is on the post list, **When** they search by keyword, **Then** the list filters to show only matching posts (title or body match).
3. **Given** a content-manager is on the post list, **When** they sort by a column (e.g., date, title), **Then** the list reorders accordingly.
4. **Given** a content-manager is creating or editing a post, **When** they click "Preview", **Then** a rendered preview of the post (title, body formatted, author, date) is shown alongside or below the editor without saving.
5. **Given** a content-manager fills in title and body and saves a new post, **When** the save succeeds, **Then** the post appears on the public blogs page under "Latest".
6. **Given** a content-manager edits an existing post and saves, **When** the save succeeds, **Then** the updated content is reflected on the public blog post page.
7. **Given** a content-manager clicks Delete on a post, **When** they confirm the deletion, **Then** the post is removed from the list and from the public blog.
8. **Given** a content-manager tries to access campaign or user management pages, **When** navigating to those routes, **Then** access is denied and they are redirected (content-manager role cannot manage campaigns or users).
9. **Given** a content-manager or admin is logged in, **When** the app header renders, **Then** a "Blog" navigation item is visible that links to the blog management interface.

---

### User Story 3 — Blog Post Reading Page (Priority: P3)

Any visitor can open a full blog post and read its complete content, including formatted body text, the post's author (or creator if no author is set), and the creation date.

**Why this priority**: Essential for a functional blog, but derived from P1 — once the list works, the detail page is a natural extension. It is a distinct implementable slice.

**Independent Test**: Navigate directly to a post URL (without going through the list). Confirm all fields are rendered correctly. Confirm a non-logged-in user can access it.

**Acceptance Scenarios**:

1. **Given** a visitor opens a blog post URL, **When** the page loads, **Then** the full post is displayed: title, formatted body, creation date, author name (falling back to creator's display name if author is empty), and — only if the post has been edited — a "last updated" date.
2. **Given** a post has no author set, **When** it is displayed publicly, **Then** the creator's display name is shown in the author position.
3. **Given** a visitor is on the post reading page, **When** they finish reading, **Then** a "Back to blog" / "All posts" navigation link is available.

---

### Edge Cases

- What happens when a content-manager tries to save a post with an empty title or empty body? → Form validation prevents submission; error message is shown.
- What happens when a search query matches no posts? → "No results found" state is shown on the blogs page.
- What happens if a post is deleted while a visitor is reading it? → A "Post not found" or similar message is shown on the reading page.
- What happens when the blog section on the landing page has no published posts yet? → An empty state is shown (e.g., "No posts yet" or the section is hidden), not a broken layout.
- What happens if an author name is not set on a post? → The creator's display name is used as the public-facing author.
- What happens when a content-manager tries to access `/admin` or `/campaigns`? → They are redirected to their permitted area (blog management or dashboard).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a blog section on the landing page visible to unauthenticated visitors, showing the latest published posts (minimum 3, maximum configurable).
- **FR-002**: The landing page blog section MUST include a button that navigates to a dedicated blogs page.
- **FR-003**: The dedicated blogs page MUST contain a "Latest" section listing the most recently published posts in reverse-chronological order.
- **FR-004**: The dedicated blogs page architecture MUST be extensible to support additional named sections (e.g., "By category") in a future release without a full redesign.
- **FR-005**: The dedicated blogs page MUST provide a full-text search input that triggers live as the user types, after a short debounce pause; results MUST highlight the matched query text within the post title and body snippet.
- **FR-006**: Each blog post MUST store: title (required), body (required, rich/formatted text including support for embedded images uploaded via the existing media storage), creation date (auto-set on creation), last-updated date (auto-updated on each save), creator (the logged-in user who created it, auto-set), and author (optional free-text; defaults to empty).
- **FR-007**: When a post's author field is empty, the public display MUST fall back to the creator's display name.
- **FR-007b**: The public post reading page MUST display the last-updated date only when it differs from the creation date (i.e., the post has been edited after initial save). When no edits have been made, only the creation date is shown.
- **FR-008**: A `content-manager` role MUST exist in the system with the following permissions: create, read, update, and delete blog posts only. This role MUST NOT have access to campaign management or user/admin management. Users with the `admin` role MUST also have full blog post management access (admin is a superset of all roles).
- **FR-008b**: The application header MUST display a "Blog" (or "Posts") navigation item visible to users with the `content-manager` or `admin` role. This item navigates to the blog management interface. It MUST NOT be visible to `buyer` or unauthenticated users.
- **FR-009**: The blog management interface (for content-managers) MUST provide a paginated/searchable list of all posts with columns for title, creation date, creator, and author.
- **FR-010**: The post list MUST support sorting by title and creation date in ascending and descending order.
- **FR-011**: The post list MUST support keyword search filtering (filtering displayed rows by title or body match).
- **FR-012**: Each row in the post list MUST have Edit and Delete action controls.
- **FR-013**: The post creation and edit form MUST include a "Preview" control that renders a live preview of the formatted post (title, body, author/creator, date) without saving.
- **FR-014**: Deleting a post MUST require a confirmation step before the record is permanently removed.
- **FR-015**: The full post reading page MUST be accessible to unauthenticated visitors via a direct URL.
- **FR-016**: All blog-related UI (landing section, blogs page, post reading page, management interface) MUST conform to the established design system (dark canvas, Syne/Outfit typography, accent color palette, spacing tokens, accessibility standards as defined in `docs/design.md`).

### Key Entities

- **BlogPost**: Represents a single blog post. Key attributes: title, body (rich formatted text including embedded images stored via media storage), creation date (auto-assigned), last-updated date (auto-updated on each save; equals creation date when never edited), creator (reference to the user who created it), author (optional free-text override for the displayed author name), published status.
- **ContentManager**: A system user with the `content-manager` role. Can perform CRUD operations on BlogPosts only. Cannot access campaigns, user admin, or other restricted areas.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unauthenticated visitor can land on the homepage, see the latest blog posts section, and open a full post to read within 3 clicks.
- **SC-002**: A content-manager can create a new blog post (including preview) and publish it in under 2 minutes from a standing start.
- **SC-003**: Full-text search on the blogs page returns results with highlighted matches within 2 seconds for a corpus of up to 500 posts.
- **SC-004**: A content-manager has zero access to campaign management or user administration pages — all such routes redirect or deny.
- **SC-005**: All blog-facing pages pass WCAG 2.1 AA contrast checks (body text ≥ 7:1, interactive elements ≥ 4.5:1 against the page background).
- **SC-006**: The dedicated blogs page renders the "Latest" section and supports at minimum one additional section type being added in a future sprint without requiring a page-level architecture change.

---

## Clarifications

### Session 2026-03-02

- Q: Can users with the `admin` role also manage blog posts, or is it exclusively `content-manager`? → A: Admin has full blog management access (admin is a superset of all roles).
- Q: Can blog post bodies contain embedded images, or is body text-only? → A: Post body supports embedded images uploaded via the existing media storage.
- Q: Should a "last updated" date be stored and shown publicly when a post is edited? → A: Store last-updated date; show it publicly only when it differs from the creation date.
- Q: Where does a content-manager navigate to reach the blog management interface? → A: Dedicated "Blog" nav item in the app header, visible to `content-manager` and `admin` roles.
- Q: How is search triggered on the public blogs page — live/debounced or on explicit submit? → A: Live search with a short debounce pause as the user types.

---

## Assumptions

- Rich-text body formatting means at minimum: paragraphs, headings, bold/italic, links, and embedded images. The specific editor widget and image upload mechanism are implementation decisions.
- "Published" status is implicit — all saved posts are public. A draft/unpublished state is out of scope for this feature.
- The "author" field is a free-text string (e.g., a person's name or pen name). It is not a foreign key to another user record.
- The landing page blog section shows a fixed number of the most recent posts (3–6 cards); the exact count is an implementation decision.
- Post deletion is hard (permanent) deletion, not soft delete, unless a future spec adds archiving.
- The content-manager role is additive — existing roles (admin, buyer) are unchanged by this feature.
- Fulltext search on the blogs page searches only published posts (same set visible publicly).
