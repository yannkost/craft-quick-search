# Craft Quick Search - Feature Ideas

## Guiding Principle

Craft 5 already has slide-out editors, element indexes with bulk actions, and a native search bar. This plugin should NOT try to be an editor or a change-tracker. It should be a **navigator, discoverer, and workflow accelerator** — the keyboard-first power tool that makes the CP feel instant.

---

## Implemented

- Tabbed universal search (Entries, Categories, Assets, Users, Globals, Admin)
- Type prefixes (`entries:`, `cats:`, `users:`, etc.)
- Admin search (sections, entry types, fields, category groups, volumes, plugins)
- Multi-site filtering
- Favorites system with drag-and-drop reordering
- Entry visit history (server-side, per-user)
- Related entries (bi-directional, including CKEditor reference tag scanning)
- Entry outline (block structure inspector)
- Dashboard widget
- Copy actions (URL, Title, ID)

---

## Saved Searches (High Priority)

The single most requested missing feature. Editors repeat the same searches daily — "my drafts in Blog", "disabled products", "pending reviews". Let them save and recall these instantly.

### How It Works

1. Editor searches for something (e.g. types "newsletter" in the Entries tab)
2. A "Save search" button appears next to the results header
3. Editor names it (e.g. "Newsletters") and saves
4. Saved searches appear as a new section in the overlay, below the search bar

### Overlay Integration

```
┌─ Quick Access ─────────────── Ctrl+G ─ ✕ ─┐
│                                             │
│  [Entries] [Cats] [Assets] [Users] ...      │
│  [Search input...]                          │
│                                             │
│  ── Saved Searches ──────────────────────── │
│  ★ Newsletters              [▶ Run] [✕ Del] │
│  ★ Pending Reviews          [▶ Run] [✕ Del] │
│  ★ Draft Blog Posts         [▶ Run] [✕ Del] │
│                                             │
│  ── Search Results (12) ─────────────────── │
│  ...                                        │
│                                             │
│  ┌─ History ──────┬─ Favorites ───────────┐ │
│  │ ...            │ ...                   │ │
└─┴─────────────────┴───────────────────────┴─┘
```

### What Gets Saved

| Field | Example | Notes |
|-------|---------|-------|
| Name | "Newsletters" | User-chosen label |
| Query | "newsletter" | The search text |
| Tab | entries | Which element type tab was active |
| Site | all / specific | Which site filter was active |

Saved searches are **per-user**, stored server-side (survives browser clears, works across devices).

### Keyboard Access

- Saved searches are numbered in the UI: `1. Newsletters`, `2. Pending Reviews`, etc.
- When the overlay opens, pressing `1`-`9` (when search input is empty) runs the corresponding saved search instantly
- Or type `saved:` prefix to filter saved searches by name

### Management

- Drag-and-drop reorder (same pattern as favorites)
- Rename inline
- Delete with confirmation
- Max 20 saved searches per user (configurable in settings)

### Database

New table: `quicksearch_saved_searches`

| Column | Type | Notes |
|--------|------|-------|
| id | int | PK |
| userId | int | FK to users |
| name | varchar(255) | Display name |
| query | varchar(255) | Search query text |
| type | varchar(50) | Element type tab (entries, categories, etc.) |
| siteId | int / null | null = all sites |
| sortOrder | smallint | For drag-and-drop ordering |
| dateCreated | datetime | |

### Future Enhancement: Filter Syntax

Later iterations could support richer filter syntax within saved searches:

- `status:draft` → Only drafts
- `section:blog` → Only Blog section entries
- `author:me` → Only current user's entries
- `modified:this-week` → Recently modified

This would make saved searches into dynamic smart collections. But v1 is just query + tab + site — simple and useful.

---

## Command Palette (High Priority)

Typing `>` as the first character in the search input switches to command mode. Shows a filtered list of available commands.

### System Commands (v1)

These are the real time-savers — things that currently require 3-5 clicks through menus:

| Command | Action |
|---------|--------|
| `> clear caches` | Show sub-menu: All, Data, Template, Asset Transform, etc. |
| `> clear template caches` | Direct trigger |
| `> clear data caches` | Direct trigger |
| `> rebuild search index` | Trigger Craft's search index rebuild |
| `> run queue` | Process pending queue jobs |
| `> purge blitz` | Purge all Blitz caches (if Blitz installed) |
| `> purge blitz /about` | Purge specific URI in Blitz |

### Navigation Commands (v1)

| Command | Action |
|---------|--------|
| `> settings` | Go to Settings page |
| `> settings fields` | Go to Settings > Fields |
| `> settings sections` | Go to Settings > Sections |
| `> settings general` | Go to Settings > General |
| `> plugins` | Go to Plugins page |
| `> dashboard` | Go to Dashboard |
| `> utilities` | Go to Utilities |

### Content Commands (v1)

| Command | Action |
|---------|--------|
| `> my drafts` | Show all current user's provisional drafts |
| `> expiring soon` | Entries expiring within 7 days |
| `> recently published` | Entries published in last 24h |

### Quick Create (v2)

`> new ` followed by typing triggers an **autocomplete dropdown of section names** (not handles). Editor types `> new Bl` and sees "Blog" as a suggestion. Selecting it opens a new entry in that section in Craft's native editor.

- Autocomplete uses section names (what editors see in the sidebar)
- If a section has multiple entry types, show a sub-menu to pick the type
- Respects `createEntries` permissions per section

This avoids the "nobody remembers handles" problem.

---

## Relations Button on Search Results

We already have bi-directional relation discovery (Related Entries feature). Currently it's only accessible from the entry editor toolbar. **Surface it in search results too.**

### Implementation

Add a relations button (chain-link icon) to each entry search result item, alongside the existing copy/newtab buttons. Clicking it opens the same related entries panel showing:

- **Links to** — entries this one references
- **Linked from** — entries that reference this one

### Why

Editors searching for an entry often want to understand its context — "what is this connected to?" — before deciding to click into it. Having relations one click away from search results is faster than opening the entry first.

---

## Content Audit: Missing Images

A lightweight content audit accessible from the overlay as a command or a built-in saved search.

### `> audit images`

Scans entries for missing featured/hero image fields and shows results. Implementation:

1. Backend queries entries where a specific Asset field (configurable) is empty
2. Shows results grouped by section
3. Each result links to the entry editor

### Configuration

In plugin settings, the admin picks which Asset field(s) represent "featured image" per section. The audit checks if those fields are populated.

### Why

This is the single most common content quality issue. Editors publish entries without images and only notice when the frontend shows a broken layout. A quick audit catches these before they go live.

---

## Favorites Keyboard Shortcuts (Ctrl+1 to Ctrl+9)

The top 9 favorites should be directly accessible via keyboard shortcuts without opening the overlay.

### Implementation

- Favorites are already ordered (drag-and-drop)
- The first 9 favorites map to `Ctrl+1` through `Ctrl+9` (or `Cmd+1` through `Cmd+9` on Mac)
- Pressing the shortcut navigates directly to that entry's CP edit page
- A small, brief toast appears: "→ Blog: My Favorite Post" (so the user knows where they're going)

### Display

In the favorites panel, show the shortcut hint next to each of the first 9 items:

```
★ Homepage                    Ctrl+1
★ About Us                    Ctrl+2
★ Contact Page                Ctrl+3
★ Blog Settings               Ctrl+4
```

### Settings

- Enable/disable in plugin settings (default: enabled)
- Configurable modifier key: Ctrl, Alt, or Ctrl+Shift
- Important: must not conflict with browser shortcuts (Ctrl+1-9 switches tabs in most browsers). Default should probably be `Ctrl+Shift+1-9` or `Alt+1-9` to avoid conflicts.

---

## Dark Mode (Essential)

Currently all CSS is hard-coded to light theme colors. Craft 5 supports dark mode. The plugin must respect it.

### Approach

Use Craft's CSS custom properties where available. For plugin-specific colors, define a dark palette triggered by Craft's `[data-color-scheme="dark"]` body attribute (or however Craft 5 signals dark mode).

### Key Color Mappings

| Element | Light | Dark |
|---------|-------|------|
| Modal background | #fff | #1e1e2e |
| Panel background | #f8f9fb | #252535 |
| Text primary | #1c2e36 | #e0e0e0 |
| Text secondary | #8496ab | #888899 |
| Borders | #e3eaf0 | #333345 |
| Hover background | #f3f7fc | #2a2a3a |
| Selected background | #e3f0ff | #1a3a5c |
| Primary accent | #0d78f2 | #4da6ff |
| Status live | #d4f1e8 / #0e844d | #1a3a2a / #4ade80 |
| Status draft | #e0e7ff / #4338ca | #2a2a4a / #818cf8 |

### Scope

This affects every CSS file in the plugin:
- Quick Access overlay
- Search dropdown
- Related entries panel
- Entry outline popup
- Dashboard widget
- All buttons, inputs, menus

---

## Blitz Integration (Nice-to-Have)

If the Blitz plugin is installed, add a "Purge cache" button to entry search results.

### Implementation

- Detect Blitz installation at runtime
- Add a small cache icon button to entry result items (only when Blitz is active)
- Clicking it purges the Blitz cache for that specific entry's URI
- Toast confirmation: "Cache purged for /about-us"
- Also available via command palette: `> purge blitz`

### Why

Content editors frequently update an entry and want to see the change immediately on the frontend. Currently they have to navigate to Blitz utilities or wait for the cache to expire. One-click purge from search results eliminates this friction.

---

## Custom Links in Favorites

Allow users to add arbitrary URLs (not just Craft entries) to their favorites. Useful for bookmarking external tools, staging URLs, documentation, or frequently visited non-Craft pages.

### Implementation

- "Add custom link" button at the bottom of the favorites panel
- Fields: Title (required), URL (required)
- Stored in the same `quicksearch_favorites` table with a `type` column (`entry` vs `custom`)
- Custom links show a globe/link icon instead of the entry section badge
- Same drag-and-drop ordering, same Ctrl+Shift+1-9 shortcuts
- No edit drawer for custom links (no Craft entry to edit)

### Why

Editors often work across multiple tools — Google Docs for briefs, Figma for designs, staging sites, analytics dashboards. Having these one keystroke away alongside Craft favorites is genuinely useful.

---

## Summary: Priority Roadmap

### Next Up (v1.7)
1. **Saved Searches** — highest impact, most requested
2. **Dark Mode** — essential for professional use

### Soon After (v1.8)
3. **Command Palette** — system commands + navigation
4. **Favorites Keyboard Shortcuts** — Ctrl+Shift+1-9

### Later (v1.9+)
5. **Relations in Search Results** — surface existing feature
6. **Content Audit: Missing Images** — lightweight quality check
7. **Command Palette: Quick Create** — with section autocomplete
8. **Blitz Integration** — cache purge from results

### Dropped Ideas
- ~~Edit drawer on entries index pages~~ → Craft 5's native slide-out editor handles this (but keep the edit drawer in Quick Access overlay — the overlay is available from any CP page where native slide-out isn't)
- ~~Reference tag builder~~ → Editors don't manually write reference tags
- ~~"What changed since last visit"~~ → Needs a separate change-tracking plugin
- ~~Multi-site translation tools~~ → Out of scope for a search plugin
- ~~Commerce/SEOmatic/Navigation integrations~~ → Too niche, maintain separately
- ~~Alt+Tab entry switching~~ → Over-engineered
- ~~Vim jump marks~~ → Wrong audience
- ~~Search analytics~~ → Nice but not core to the plugin's mission
