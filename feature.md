# Quick Search - Feature Plan: Quick Access Overlay

## Overview

A keyboard-triggered overlay that provides instant access to History, Favorites, and Search in a unified, full-screen modal. This feature enhances productivity by allowing users to quickly navigate to entries without using the mouse.

---

## Core Feature: Quick Access Overlay (Ctrl+G / Cmd+G)

### Description
A full-screen overlay (with grayed-out background) that displays History, Favorites, and integrated Search, triggered by a configurable keyboard shortcut.

### User Flow
1. User presses `Ctrl+G` (Windows/Linux) or `Cmd+G` (Mac) - auto-detected
2. Full-screen overlay appears with dimmed background
3. Focus is on the search/filter input
4. Two panels below: **History** (left) and **Favorites** (right)
5. User can:
   - Type to filter history & favorites instantly
   - Press `Enter` with text to perform full search (results appear below)
   - Navigate with `↑`/`↓` arrow keys between items
   - Switch between panels with `Tab` or `←`/`→`
   - Press `Enter` to open selected entry
   - Press `Escape` to close overlay
   - Click any entry to navigate

### UI Design
```
┌─────────────────────────────────────────────────────────────────┐
│  Quick Access                              [Ctrl+G] [×] Esc     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│            🔍 Search all entries...                [Enter ↵]   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │ 📜 Recent History       │  │ ⭐ Favorites                │  │
│  │ 🔍 Filter...            │  │ 🔍 Filter...                │  │
│  ├─────────────────────────┤  ├─────────────────────────────┤  │
│  │ • Entry Title 1         │  │ • Favorite Entry 1          │  │
│  │   Section • live        │  │   Section • live            │  │
│  │ • Entry Title 2         │  │ • Favorite Entry 2          │  │
│  │   Section • draft       │  │   Section • pending         │  │
│  │ • Entry Title 3         │  │ • Favorite Entry 3          │  │
│  │   ...                   │  │   ...                       │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│  ─────────────────── Search Results ───────────────────        │
│  (appears below when entry search is performed)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Search Areas
1. **Entry Search** (top, centered, prominent)
   - Placeholder: "Search all entries..."
   - Press Enter to search
   - Results appear in a section below the panels
   - Full search with section/site filters available

2. **Panel Filters** (within each panel)
   - Small filter input in each panel header
   - Filters only that panel's items (history or favorites)
   - Instant filtering as you type

### Keyboard Behavior
| Key | Action |
|-----|--------|
| `Ctrl+G` / `Cmd+G` | Open overlay |
| `Escape` | Close overlay |
| `↑` / `↓` | Navigate items in current panel |
| `←` / `→` or `Tab` | Switch between History/Favorites panels |
| `Enter` | Open selected entry, OR search if text entered and nothing selected |
| `Ctrl+Enter` | Open selected entry in new tab |
| Any letter/number | Start filtering/searching |

### Shortcut Disabled When
- User is focused on any input field, textarea, or contenteditable
- A modal/slideout is already open
- User is in a text editing context

### Settings (Plugin Settings Page)
- **Enable Quick Access Overlay**: Toggle (default: enabled)
- **Keyboard Shortcut**: Key capture input (default: `Ctrl+G` / `Cmd+G`)
  - Auto-detects Mac and shows `Cmd` instead of `Ctrl`
  - Support for: `Ctrl`, `Alt`, `Shift`, `Meta/Cmd` + any key
  - Validation to prevent conflicts with common browser shortcuts
- **Default Panel Focus**: Radio (History / Favorites) - which panel is focused first
- **Show Search Results Section**: Toggle (default: enabled) - whether pressing Enter performs full search

---

## Feature 2: Dashboard Widget

### Description
A Craft CMS dashboard widget that displays recent history and favorites, providing quick access directly from the dashboard.

### UI Design
```
┌─────────────────────────────────────────┐
│  Quick Search                     [⚙️]  │
├─────────────────────────────────────────┤
│  📜 Recent                              │
│  ├─ Entry Title 1 (Section)             │
│  ├─ Entry Title 2 (Section)             │
│  └─ Entry Title 3 (Section)             │
│                                         │
│  ⭐ Favorites                           │
│  ├─ Favorite 1 (Section)                │
│  ├─ Favorite 2 (Section)                │
│  └─ Favorite 3 (Section)                │
│                                         │
│  [Open Quick Access (Ctrl+G)]           │
└─────────────────────────────────────────┘
```

### Widget Settings
- **Number of recent entries to show**: 5-20 (default: 10)
- **Number of favorites to show**: 5-20 (default: 10)
- **Show sections**: History only / Favorites only / Both (default: Both)

### Widget Features
- "Show more" link at bottom of each section → opens Quick Access Overlay
- Click entry to navigate
- Compact display with entry title and section name

### Implementation
- Create `QuickSearchWidget.php` extending `craft\base\Widget`
- Widget template with AJAX loading for history/favorites
- Click on entry navigates to it
- "Open Quick Access" button triggers the overlay

---

## Future Feature Ideas (Lower Priority)

### 1. Search Query History
- Remember last 10-20 search queries
- Show as dropdown suggestions when search input is focused
- "Clear search history" option in settings
- **Implementation**: Store in user preferences or localStorage

### 2. Entry Preview (v2 - Complex)
- Show preview card on hover with 300ms delay
- Content: thumbnail, last modified, author, excerpt
- **Challenge**: Entries have different field layouts
- **Implementation approach**:
  - New controller endpoint: `quick-search/preview/entry?id=X`
  - Returns: title, thumbnail (first asset field), postDate, author, excerpt (first text/richtext field truncated)
  - Frontend: Tooltip-style popup positioned near hovered item
- **Recommendation**: Defer to v2, significant complexity

### 3. Section Quick Filter
- In Quick Access Overlay, add section tabs/pills above results
- Click to filter history/favorites/search by section
- **Implementation**: Reuse existing section filter logic

---

## Implementation Plan

### Phase 1: Quick Access Overlay - Backend Settings
1. Add new settings to `Settings.php`:
   - `quickAccessEnabled` (bool, default: true)
   - `quickAccessShortcut` (string, default: 'ctrl+g')
   - `quickAccessDefaultPanel` (string: 'history'|'favorites')
   - `quickAccessShowSearch` (bool, default: true)

2. Update `settings.twig` template with new options

3. Pass settings to JavaScript via `QuickSearchSettings`

### Phase 2: Quick Access Overlay - JavaScript
1. Create `quick-access-overlay.js`:
   - Full-screen overlay component
   - Keyboard shortcut listener (with Mac detection for Cmd)
   - Shortcut disabled when in input/textarea/contenteditable
   - History and Favorites panels (side-by-side)
   - Filter input that filters both lists
   - Optional: Full search on Enter
   - Keyboard navigation between panels and items

2. Update `quick-search-init.js` to initialize overlay

3. Update `QuickSearchAsset.php` to include new JS file

### Phase 3: Quick Access Overlay - Styling
1. Add CSS for overlay in `quick-search.css`:
   - Full-screen backdrop with blur/dim
   - Centered modal container
   - Two-column responsive layout
   - Smooth animations (fade in/out, scale)
   - Compact mode support

### Phase 4: Dashboard Widget
1. Create `src/widgets/QuickSearchWidget.php`
2. Create widget settings model
3. Create widget template `src/templates/widgets/quick-search.twig`
4. Register widget in `Plugin.php`
5. Add widget-specific CSS

### Phase 5: Testing & Polish
1. Test keyboard shortcuts across browsers (Chrome, Firefox, Safari)
2. Test Mac vs Windows/Linux shortcut detection
3. Test with different Craft CP themes
4. Ensure no conflicts with existing Craft shortcuts
5. Test widget on dashboard
6. Handle empty states gracefully
7. Accessibility: ARIA labels, focus management

---

## File Changes Required

### New Files
- `src/assetbundles/quicksearch/dist/js/quick-access-overlay.js`
- `src/widgets/QuickSearchWidget.php`
- `src/templates/widgets/quick-search.twig`

### Modified Files
- `src/models/Settings.php` - Add Quick Access settings
- `src/templates/settings.twig` - Add settings UI
- `src/assetbundles/quicksearch/QuickSearchAsset.php` - Include new JS
- `src/assetbundles/quicksearch/dist/css/quick-search.css` - Add overlay & widget styles
- `src/assetbundles/quicksearch/dist/js/quick-search-init.js` - Initialize overlay
- `src/Plugin.php` - Register widget

---

## Priority Order

1. **High**: Quick Access Overlay (Phases 1-3)
2. **Medium**: Dashboard Widget (Phase 4)
3. **Low**: Search Query History (future)
4. **Low**: Entry Preview (v2)

---

## Decisions Made

- ✅ Auto-detect Mac and use `Cmd` instead of `Ctrl`
- ✅ Disable shortcut when user is in input/textarea/contenteditable
- ✅ Include search in Quick Access Overlay (filter + full search on Enter)
- ✅ Dashboard widget with history + favorites
- ❌ No `Ctrl+K` shortcut (conflicts with browser)
- ❌ No vim-style navigation
- ❌ No command palette (too advanced for most users)
- ⏸️ Pinned entries - deferred (favorites already serve this purpose)
- ⏸️ Entry preview - deferred to v2 (complex implementation)

---

## Notes

- Existing history/favorites buttons in header remain (overlay is complementary)
- All keyboard shortcuts documented in plugin README
- Accessibility: ARIA labels, focus trap in overlay, screen reader support
- Test with keyboard-only navigation
