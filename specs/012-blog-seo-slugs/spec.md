# Feature Specification: SEO-Friendly Blog (Slugs & Meta Tags)

**Feature Branch**: `012-blog-seo-slugs`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "lets blog urls be editable (but unique) and let app to suppose urls to user when creating blog post. we need seo-friendly blog"

## User Scenarios & Testing *(mandatory)*

### User Story 0 — Draft / Published Post States (Priority: P1)

This feature introduces a two-state lifecycle for blog posts: **Draft** and **Published**. A post saved as a draft is not visible to the public and does not reserve its slug. A post that is explicitly published becomes publicly accessible at its slug URL and its slug is locked into the uniqueness pool. Content managers can save work-in-progress posts as drafts and publish when ready.

**Why this priority**: The draft/published distinction is a prerequisite for slug uniqueness semantics, the real-time conflict check, and the SEO meta tag delivery. All other user stories depend on this state model being in place.

**Independent Test**: Can be fully tested by saving a post as a draft, verifying it is not publicly accessible, then publishing it and verifying it is accessible at `/blog/post/<slug>`.

**Acceptance Scenarios**:

1. **Given** a content manager saves a new post without publishing, **When** an unauthenticated visitor navigates to `/blog/post/<slug>`, **Then** a 404 is returned (draft is not publicly accessible).
2. **Given** a draft post exists, **When** the content manager clicks "Publish", **Then** the post becomes publicly accessible at its slug URL and the slug is added to the uniqueness pool.
3. **Given** a published post, **When** the content manager clicks "Revert to draft" (or equivalent), **Then** the post is no longer publicly accessible and its slug is removed from the uniqueness pool.
4. **Given** a published post is reverted to draft, **When** another post attempts to use the same slug, **Then** the slug is now available (no conflict).
5. **Given** a content manager views the blog management list, **When** looking at posts, **Then** each post clearly shows its current state (Draft or Published).

---

### User Story 1 — Auto-Suggested Slug on Post Creation (Priority: P1)

When a content manager creates a new blog post, the system automatically suggests a URL slug derived from the post title as they type. The suggested slug is human-readable, lowercase, and uses hyphens instead of spaces. The author may accept the suggestion or customise it before saving as draft or publishing.

**Why this priority**: This is the core of the feature — every new post must have a clean, SEO-friendly URL from creation time. Without this, all other stories have no foundation.

**Independent Test**: Can be fully tested by creating a new blog post with a title and observing the slug field pre-fill; delivers immediately usable SEO-friendly URLs for all new content.

**Acceptance Scenarios**:

1. **Given** a content manager is on the "New Post" form, **When** they type a title (e.g., "My First Campaign Guide"), **Then** the slug field auto-populates with a sanitised suggestion (e.g., `my-first-campaign-guide`).
2. **Given** an auto-suggested slug is displayed, **When** the author edits the slug field manually, **Then** the manual value is preserved and the auto-suggestion stops overwriting it.
3. **Given** a title contains special characters, numbers, or accented letters, **When** the slug is generated, **Then** the slug contains only lowercase ASCII letters, digits, and hyphens — no spaces, underscores, or special characters.
4. **Given** the title is cleared after a slug was auto-suggested, **When** the form is in an untouched-slug state, **Then** the slug field clears as well.

---

### User Story 2 — Unique, Editable Slug Validation (Priority: P1)

When publishing a blog post (new or updated), the system enforces that the slug is unique across all currently published posts. Draft posts are free to share slugs with one another; the conflict is surfaced only at publish time. If a duplicate is detected, the author receives an inline error and must resolve it before the post goes live.

**Why this priority**: URL uniqueness is a hard constraint — two posts sharing the same URL breaks routing and SEO simultaneously. This must be enforced at creation and edit time. Real-time feedback while editing prevents wasted effort at publish time.

**Independent Test**: Can be fully tested by typing a slug that matches a published post's slug, pausing 500 ms, and verifying an inline warning appears — then attempting to publish and verifying the publish is blocked with an error.

**Acceptance Scenarios**:

1. **Given** a slug not currently held by any published post, **When** the author publishes the post, **Then** the post is published successfully and accessible at its slug URL.
2. **Given** the author types a slug that matches a published post, **When** they pause typing for ~500 ms, **Then** an inline warning appears immediately (e.g., "This URL is already taken") — before the author attempts to publish.
3. **Given** a slug already used by another published post, **When** the author attempts to publish despite the warning, **Then** the system blocks publish with the same duplicate-slug error.
4. **Given** an author is editing an already-published post, **When** they publish/save without changing the slug, **Then** the post saves successfully (the existing slug does not conflict with itself).
5. **Given** an author edits a published post and changes its slug to one already held by a different published post, **When** they pause typing, **Then** a real-time inline warning appears within 500 ms.
6. **Given** two draft posts share the same slug, **When** the first is published successfully, **Then** the second author sees a real-time conflict warning the next time they type in the slug field, and is blocked from publishing until they resolve it.

---

### User Story 3 — Posts Accessible via Slug URL (Priority: P1)

Blog posts are publicly accessible at a URL that uses the pattern `/blog/post/<slug>` (e.g., `/blog/post/my-first-campaign-guide`) rather than an opaque numeric or UUID-based identifier. The `/blog/post/` prefix structurally separates post URLs from all other routes under `/blog/` (such as `/blog/manage`), eliminating any routing collision without the need for a blocklist.

**Why this priority**: This is the direct SEO outcome of the feature — search engines index the slug-based URL, and the URL itself communicates post content to both crawlers and humans.

**Independent Test**: Can be fully tested by publishing a post with a known slug and navigating to `/blog/<slug>` in a browser without authentication.

**Acceptance Scenarios**:

1. **Given** a published post with slug `campaign-basics`, **When** a visitor navigates to `/blog/post/campaign-basics`, **Then** the post content is displayed correctly.
2. **Given** a post whose slug has been changed from `old-slug` to `new-slug`, **When** a visitor navigates to `/blog/post/old-slug`, **Then** they are permanently redirected (301) to `/blog/post/new-slug`.
3. **Given** a visitor navigates to `/blog/post/nonexistent-slug`, **Then** a clear "Post not found" page is shown (404).

---

### User Story 4 — SEO Meta Fields on Post Editor (Priority: P2)

A content manager or admin can set a custom SEO page title, meta description, and the canonical URL is automatically generated from the post's slug. These fields appear in a dedicated "SEO" section of the post editor. When set, they are rendered in the page's `<head>` for search engine crawlers.

**Why this priority**: Meta tags multiply the value of clean slugs — they control the snippet shown in search results (title and description) and signal the canonical URL to search engines. Without slugs (P1), meta tags are incomplete; hence P2.

**Independent Test**: Can be fully tested by setting a custom SEO title and description on a post, publishing it, viewing the page source, and verifying the correct `<title>` and `<meta name="description">` tags appear.

**Acceptance Scenarios**:

1. **Given** a content manager is editing a post, **When** they open the SEO section, **Then** they see fields for "SEO title" and "Meta description", both pre-populated with sensible defaults (post title and a body excerpt respectively).
2. **Given** a custom SEO title is entered, **When** the post is published and a visitor views the post page, **Then** the `<title>` tag in the page `<head>` matches the custom SEO title.
3. **Given** a custom meta description is entered, **When** the post is published, **Then** `<meta name="description">` in the page `<head>` matches the entered description.
4. **Given** a post has a valid slug, **When** the post page is rendered, **Then** a `<link rel="canonical">` tag is automatically included in `<head>` pointing to the post's current slug-based URL.
5. **Given** no custom SEO title is entered, **When** the post is published, **Then** the `<title>` tag defaults to the post title.
6. **Given** no custom meta description is entered, **When** the post is published, **Then** `<meta name="description">` defaults to a truncated excerpt of the post body.

---

### User Story 5 — Slug Editing on Existing Posts (Priority: P2)

A content manager or admin can update the slug of an already-published post through the post edit form. The slug field is visible and editable alongside the title and body.

**Why this priority**: Content evolves; titles get refined and slugs may need correction post-publish. This is a secondary workflow — all posts need creation-time slugs first (P1) and SEO meta fields (P2/US4) before slug editing is necessary.

**Independent Test**: Can be fully tested by opening an existing post in the editor, changing its slug, saving, and verifying the post is now accessible at the new URL.

**Acceptance Scenarios**:

1. **Given** an existing post opened in edit mode, **When** the author modifies the slug field and saves, **Then** the post is accessible at the new `/blog/post/<new-slug>` URL.
2. **Given** the slug is changed on a published post, **When** the save completes, **Then** `/blog/post/<old-slug>` permanently redirects (301) to `/blog/post/<new-slug>`.
3. **Given** the author clears the slug field entirely, **When** they attempt to save, **Then** an inline validation error prevents saving ("URL slug cannot be empty").

---

### Edge Cases

- What happens when two concurrent users attempt to save posts with the same slug simultaneously? (Last writer wins or first writer wins — system must not allow both to persist with the same slug.)
- How does the slug suggestion handle very long titles? (Slug should be truncated to a reasonable maximum length, e.g., 100 characters.)
- What if the title consists entirely of special characters or non-ASCII text? (System must either produce a valid fallback slug or prompt the author to enter one manually.)
- What happens to existing posts (created before this feature) that have no slug? They must be assigned auto-generated slugs based on their titles as a migration step. If two posts produce the same base slug, a numeric suffix is appended to disambiguate (`campaign-management`, `campaign-management-2`, etc.), ordered by creation date (oldest post gets the unsuffixed slug). Old ID-based URLs under `/blog/<id>` return 404 after migration (no redirect, as the old ID-based routes are replaced entirely by `/blog/post/<slug>`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-000**: Blog posts MUST exist in one of two states: **Draft** (not publicly accessible, slug not reserved) or **Published** (publicly accessible, slug reserved). Content managers MUST be able to save a post as a draft and explicitly publish it when ready. A published post MAY be reverted to draft.
- **FR-000a**: The blog management list MUST display the current state (Draft / Published) of each post.
- **FR-001**: Every blog post MUST have a unique slug — a URL-safe, human-readable string used as its public identifier.
- **FR-002**: The system MUST auto-generate a slug suggestion from the post title when the author types in the title field on the create post form.
- **FR-003**: The slug suggestion MUST convert the title to lowercase, replace spaces with hyphens, strip special characters, and remove consecutive or leading/trailing hyphens.
- **FR-004**: The auto-generated slug suggestion MUST stop auto-updating once the author manually edits the slug field.
- **FR-005**: The slug field MUST be editable by the content manager or admin at any time (creation or editing).
- **FR-006**: The slug field MUST perform a real-time uniqueness check against all **published** posts after the author pauses typing for approximately 500 ms (debounced). A duplicate MUST be indicated with an inline warning immediately in the editor. Draft posts are not included in this check.
- **FR-006a**: The system MUST validate slug uniqueness as a hard gate at the moment a post is **published**; publishing with a slug already held by another published post MUST be rejected with a clear, inline error message. Saving as draft bypasses this check entirely.
- **FR-007**: Slug validation MUST exclude the post's own slug when editing (a post does not conflict with itself).
- **FR-008**: The system MUST enforce that the slug field is non-empty; saving with an empty slug MUST be rejected.
- **FR-009**: Blog post public URLs MUST follow the pattern `/blog/post/<slug>` (e.g., `/blog/post/my-first-campaign-guide`), not a numeric ID or UUID. The `/blog/post/` prefix ensures structural separation from all other routes under `/blog/` with no need for a reserved-slug blocklist.
- **FR-010**: Slug characters MUST be limited to lowercase letters (a–z), digits (0–9), and hyphens (`-`); no other characters are permitted.
- **FR-011**: Slugs MUST NOT start or end with a hyphen.
- **FR-012**: Slugs MUST have a maximum length of 100 characters.
- **FR-013**: Existing posts without a slug MUST receive an auto-generated slug (derived from their title) upon deployment of this feature. If two posts produce the same base slug, a numeric suffix MUST be appended to all but the first (e.g. `campaign-management`, `campaign-management-2`), with the oldest post (by creation date) receiving the unsuffixed slug. All existing posts are migrated to **Published** status.
- **FR-014**: When a post's slug is changed, the old slug URL MUST issue a 301 permanent redirect to the new slug URL. The system MUST store a history of all previous slugs per post to support this redirect for any past slug, not just the immediately preceding one.
- **FR-015**: The post editor MUST include an "SEO" section with two optional free-text fields: "SEO title" (max 60 characters) and "Meta description" (max 160 characters).
- **FR-016**: When a post is rendered, the page `<title>` tag MUST use the custom SEO title if set, otherwise fall back to the post title.
- **FR-017**: When a post is rendered, a `<meta name="description">` tag MUST be present, using the custom meta description if set, otherwise a truncated excerpt of the post body (max 160 characters).
- **FR-018**: Every blog post page MUST include a `<link rel="canonical">` tag in `<head>` pointing to the post's current public URL (pattern: `/blog/post/<slug>`).
- **FR-019**: The SEO title and meta description fields MUST display a live character counter to help authors stay within recommended limits (60 and 160 characters respectively).

### Key Entities

- **Blog Post**: Extended with a `slug`, `seo_title`, `meta_description`, and `status` attribute. The slug is unique and URL-safe; `seo_title` and `meta_description` are optional free-text fields for the page `<head>`; `status` is either **Draft** or **Published**.
- **Draft**: A blog post state in which the post is not publicly accessible and its slug is not reserved in the uniqueness pool.
- **Published**: A blog post state in which the post is publicly accessible at its slug URL and its slug is reserved in the uniqueness pool.
- **Slug**: A derived, editable string: auto-generated from the title, validated for uniqueness and format, stored persistently against the post.
- **Slug History**: A record of all previous slugs that a post has held. Used exclusively to serve 301 permanent redirects to the post's current slug URL.
- **SEO Title**: Optional override for the page `<title>` tag; max 60 characters. Defaults to the post title when empty.
- **Meta Description**: Optional override for `<meta name="description">`; max 160 characters. Defaults to a body excerpt when empty.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-000**: Content managers can save a post as a draft and publish it as two distinct actions; the post management list shows each post's current state.
- **SC-001**: 100% of blog posts published after this feature launches have a unique, non-empty, human-readable URL slug.
- **SC-002**: The slug field on the create-post form auto-populates within 300 ms of the author pausing typing in the title field.
- **SC-003**: A duplicate slug warning appears in the slug field within 500 ms of the author pausing typing — before they attempt to publish. Attempting to publish with a known duplicate is blocked with a visible inline error, no page reload required.
- **SC-004**: All blog posts are publicly accessible via their `/blog/post/<slug>` URL with zero 404 errors for correctly formed slugs.
- **SC-005**: Existing posts that lacked slugs before the migration are each assigned a unique slug with no manual intervention required; collisions are resolved by appending a numeric suffix ordered by creation date.
- **SC-006**: A content manager can update a post's slug and see the change reflected at the new URL within one page navigation.
- **SC-007**: 100% of published blog post pages include a `<title>`, `<meta name="description">`, and `<link rel="canonical">` tag in the page `<head>`.
- **SC-008**: Authors receive live character-count feedback while typing SEO title and meta description, enabling them to stay within recommended limits without guessing.

## Clarifications

### Session 2026-02-26

- Q: Does the app currently have a draft/published distinction, or does this feature introduce it? → A: This feature introduces the draft/published state — "Save as draft" keeps the post private; "Publish" makes it live and reserves its slug.
- Q: Should blog post pages include Open Graph meta tags for social sharing? → A: No — OG tags are out of scope; deferred to a future SEO feature.
- Q: When migrating existing posts, how should slug collisions (identical titles) be resolved? → A: Append numeric suffix (`-2`, `-3`, …) ordered by creation date; oldest post gets the unsuffixed slug.
- Q: When a post's slug is changed on a published post, what should happen to the old URL? → A: 301 permanent redirect to the new slug; all previous slugs per post are stored in a slug history record.
- Q: Does this feature include SEO meta tags (page title, meta description, canonical URL) in addition to slug-based URLs? → A: Yes — full SEO meta: editable SEO title (max 60 chars) and meta description (max 160 chars) added to post editor, plus auto-generated canonical tag from slug.
- Q: Does a draft post's slug block other posts from using the same slug? → A: No — uniqueness is enforced only at publish time against published posts; drafts are exempt and may share slugs until one publishes.
- Q: Should the slug field check uniqueness in real time as the author types, or only at publish? → A: Debounced real-time check (~500 ms after pause in typing), plus a hard gate at publish time.
- Q: How should routing collisions between post slugs and other `/blog/` app routes be avoided? → A: Post URLs use the prefix `/blog/post/<slug>` — structural separation eliminates all collision risk with no blocklist needed.

## Assumptions

- This feature introduces a **Draft / Published** lifecycle for blog posts. Previously all saved posts were immediately live; after this feature, content managers have an explicit "Save as draft" and "Publish" action. Existing live posts are treated as Published in the migrated state.
- Slug uniqueness is enforced only among published posts. Draft posts do not participate in uniqueness checks — a slug is reserved only when a post is published. Two drafts may hold the same intended slug; the first to publish wins and the second will receive an inline conflict error at publish time.
- The redirect behaviour for changed slugs (FR-014) is a 301 permanent redirect; a slug history table stores all past slugs per post so that any historical slug redirects correctly — not just the immediately preceding one.
- The slug auto-generation runs client-side (in the browser) for immediate feedback; server-side uniqueness validation still applies on save.
- No multi-language / i18n slug transliteration is required at this stage — non-ASCII characters are stripped to produce ASCII-only slugs.
- Open Graph meta tags (`og:title`, `og:description`, `og:url`) are explicitly out of scope for this feature. Social media sharing previews are deferred to a future SEO iteration.
- The maximum slug length of 100 characters is a reasonable SEO best practice (Google recommends short, descriptive URLs).
