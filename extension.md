# Craft Quick Search - Extension Plan

## Overview
Extend Craft Quick Search from an entry-focused search plugin into a universal search solution (similar to Rocket Launcher) while maintaining its unique strengths.

## New Features

### 1. Tabbed Quick Access Panel

Replace the single search input with a tabbed interface under a "Quick Access" header:

```
┌─────────────────────────────────────────┐
│  Quick Access                           │
│  ┌────────┬────────┬────────┬────────┐ │
│  │ Entries│Cats    │Assets  │Users   │ │
│  └────────┴────────┴────────┴────────┘ │
│  [Search input...]                      │
│  [Results...]                          │
└─────────────────────────────────────────┘
```

**Tabs:**
- **Entries** - Current behavior (sections, sites)
- **Categories** - Search by category group
- **Assets** - Search by volume
- **Users** - Search user profiles
- **Globals** - Search global sets

**Admin Search Tab (optional):**
- **Admin** - Search sections, entry types, fields, category groups, asset volumes, users, plugins, settings

### 2. Universal Element Search

#### Categories
- Fetch categories with permission checks
- Display: title, group, parent (if nested)
- Click navigates to category editor

#### Assets
- Fetch assets by volume with permission checks
- Display: thumbnail, title, volume
- Click opens asset editor or preview

#### Users
- Fetch users with permission checks
- Display: name, email, photo
- Click opens user settings

#### Globals
- Fetch global sets
- Display: name, icon
- Click opens global set editor

### 3. Permission Handling

All element searches must respect Craft's permissions:
- `viewEntries` - Entry access per section
- `viewCategories` - Category group access
- `viewAssets` - Volume access
- `viewUsers` - User group access
- `editUsers` - User edit permissions
- `editGlobals` - Global set edit

### 4. Frontend Launcher (Deferred)

**Status**: Needs further design discussion

**Initial Ideas:**
- Overlay that can be triggered on front-end sites
- Allow quick navigation to admin while viewing live site
- Preview page content without leaving context
- May require separate frontend plugin or embeddable component

**Open Questions:**
- How to inject launcher into existing sites?
- Security implications of front-end access
- Performance impact on live sites

## Technical Implementation

### Backend Changes

#### New/Modified Services
```
src/services/
├── SearchService.php     # Extended to handle all element types
├── CategorySearch.php    # New - category search logic
├── AssetSearch.php       # New - asset search logic
├── UserSearch.php        # New - user search logic
├── GlobalSearch.php      # New - global set search logic
└── AdminSearch.php       # New - admin elements search (deferred)
```

#### Controller Changes
- Extend `SearchController` to handle element type parameter
- Add permission checks per element type
- Return structured results with type metadata

#### SearchService Updates
```php
// Proposed interface
public function search(array $options): array
{
    // Options:
    // - query: search term
    // - type: 'entries'|'categories'|'assets'|'users'|'globals'
    // - siteId: optional site filter
    // - limit: result limit
}
```

### Frontend Changes

#### Tabbed Interface
- Add tab navigation above search input
- Default tab: "Entries" (preserves current behavior)
- Store last active tab in localStorage

#### Result Rendering
- Unified result card component with type-specific icons
- Type indicators: entry, category, asset, user, global
- Keyboard navigation across tabs

#### Keyboard Shortcuts
- Current: `Ctrl/Cmd+G` - Open launcher
- New: `Alt+1` through `Alt+5` - Quick switch tabs
- `Ctrl/Cmd+K` - Reserved for potential future conflict avoidance

### Database Changes

No new tables required. Extend existing records if needed for tab preferences.

## Phased Rollout

### Phase 1: Tabbed Interface & Categories
- [ ] UI refactor: Add tab component
- [ ] Category search service
- [ ] Permission integration
- [ ] Category results in dropdown

### Phase 2: Assets, Users, Globals
- [ ] Asset search with thumbnails
- [ ] User search with avatars
- [ ] Global set search
- [ ] Permission checks for all

### Phase 3: Admin Search (Deferred)
- [ ] Section/entry type search
- [ ] Field search
- [ ] Settings search
- [ ] Plugin search

### Phase 4: Frontend Launcher (TBD)
- [ ] Design document
- [ ] Prototype
- [ ] Security review
- [ ] Implementation

## UI/UX Considerations

### Result Prioritization
- Search within current site first
- Recent items across all sites
- Favorites always visible
- Match quality scoring

### Empty States
- No results found for type
- Permission denied indicator
- "No access" for restricted elements

### Loading States
- Debounced search (300ms)
- Skeleton loaders
- Cancel previous requests

## Settings

Add new plugin settings:
- [ ] Enable/disable specific search types
- [ ] Result limits per type
- [ ] Default tab selection
- [ ] Show/hide admin search

## Compatibility

- Craft CMS 5.x only
- PHP 8.2+
- Maintain backward compatibility with existing searches
- Translation updates for new labels

## Open Questions

### Admin Search
**Decision:** Admin search will be a separate tab, only visible/accessible to users with admin permissions.

Tabs:
- **Admin** - Search sections, entry types, fields, category groups, asset volumes, users, plugins, settings
- Only visible when user has `admin` permission

### Multisite Handling
**Decision:** Add site dropdown in the Quick Access header.

```
┌─────────────────────────────────────────┐
│  Quick Access                  [All ▼]  │
│  ┌────────┬────────┬────────┬────────┐ │
│  │ Entries│Cats    │Assets  │Users   │ │
│  └────────┴────────┴────────┴────────┘ │
│  [Search input...]                      │
└─────────────────────────────────────────┘
```

**Dropdown Options:**
- **All** - Search across all sites (default)
- **Site 1**, **Site 2**, etc. - Limit to specific site

**Behavior per type:**
- Entries: Site filter applied
- Categories: Filtered by site context
- Assets: Filtered by site (if volume is site-specific)
- Users: Not site-specific (global)
- Globals: Not site-specific (global)

### Favorites Scope
**Decision:** Favorites feature remains entry-only.

- Only entries can be favorited
- Category/Asset/User/Global searches do not support favorites
- Favorites panel in dashboard widget still entry-focused
- No cross-type favorites

### Frontend Launcher
**Status:** Deferred - Not in scope for this update.

May be revisited in a future iteration.
