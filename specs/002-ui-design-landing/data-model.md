# Data Model: UI Design Document & Creative Landing Page

**Feature**: `002-ui-design-landing` | **Date**: 2026-02-26

## Overview

This feature introduces no database entities or persistent data changes. The "data model" consists of two static artifacts: a design document and a landing page component. No backend changes, migrations, or API modifications are required.

## Design Tokens (CSS Custom Properties)

The design document defines these as the shared vocabulary between documentation and implementation. They live in `frontend/src/index.css` under `:root`.

### Color Tokens

| Token | Purpose | Constraint |
|-------|---------|------------|
| `--color-bg-primary` | Main background (dark) | Near-black base |
| `--color-bg-secondary` | Section background variation | Subtle contrast from primary |
| `--color-text-primary` | Body text | >=7:1 contrast vs bg-primary |
| `--color-text-secondary` | Supporting text | >=4.5:1 contrast vs bg-primary |
| `--color-accent-1` | Primary accent (CTAs, highlights) | >=4.5:1 contrast vs bg-primary |
| `--color-accent-2` | Secondary accent (hover, emphasis) | >=4.5:1 contrast vs bg-primary |
| `--color-accent-3` | Tertiary accent (subtle details) | >=3:1 contrast vs bg-primary |

### Typography Tokens

| Token | Purpose |
|-------|---------|
| `--font-display` | Headings / hero text (display font) |
| `--font-body` | Body text / paragraphs (sans-serif) |
| `--font-size-hero` | Hero headline size |
| `--font-size-h2` | Section heading size |
| `--font-size-body` | Body paragraph size (>=16px) |
| `--font-size-small` | Captions / secondary text |
| `--line-height-body` | Body text line height (1.5-1.8) |

### Spacing Tokens

| Token | Purpose |
|-------|---------|
| `--space-xs` | Tight spacing (4-8px) |
| `--space-sm` | Small spacing (8-16px) |
| `--space-md` | Medium spacing (16-24px) |
| `--space-lg` | Large spacing (32-48px) |
| `--space-xl` | Section spacing (64-96px) |

## Landing Page Structure

```
Landing Page
├── Hero Section
│   ├── Headline (value proposition)
│   ├── Tagline (benefit-oriented subtext)
│   └── Visual element (decorative/atmospheric)
├── Benefits Section
│   ├── Benefit 1 (outcome-focused)
│   ├── Benefit 2 (outcome-focused)
│   └── Benefit 3 (outcome-focused)
└── CTA Section
    ├── Sign Up button (primary action)
    └── Sign In link (secondary action)
```

## State Transitions

None. The landing page is stateless — it renders the same content for all visitors. Authentication state determines whether the page is shown (unauthenticated visitors) or redirected (authenticated users route to Dashboard, per existing app logic).
