# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.0] - 2026-03-22

### Added
- **Related Entries Sidebar Panel**: A new panel in the entry edit sidebar that automatically loads all related entries when the page opens — no button click required. Shows both outgoing links (entries this entry links to) and incoming backlinks (entries that link to this entry), grouped by section. Collapsible, with collapse state remembered per entry per session.
- **Sidebar Panel Position setting**: Choose where the panel appears in the entry sidebar — *Top* (before all metadata), *After Status*, or *Bottom* (default).
- **Section grouping in Related Entries modal**: Results in the toolbar button modal are now grouped by section, matching the sidebar panel layout.

### Changed
- **Related Entries toolbar button defaults to off**: The sidebar panel is now the primary way to view related entries, so the toolbar button (`showRelatedEntries`) is disabled by default. ⚠️ Existing installations that had this enabled will need to re-enable it under Settings → Quick Search → "Show Related Entries Button".
- **Related entries fetch timeout raised to 60 seconds**: The modal overlay now uses a 60-second timeout instead of the generic 10-second default, preventing false timeouts on large sites with complex content structures.

### Fixed
- **Related Entries modal was empty in Craft 5**: The toolbar button was passing the provisional draft's element ID instead of the canonical entry ID. Since Craft 5 always creates a provisional draft when opening an entry for editing, the modal was querying relations for the draft element (which has none) instead of the canonical entry. Now uses `getCanonicalId()`.
- **Severe performance issue in incoming relation search**: The previous implementation iterated over every entry on the site and made additional queries per entry to search its content fields — an N+1 query pattern that could issue hundreds of DB queries on larger sites. Rewritten to use a single query with OR conditions against `elements_sites.content`, the JSON blob where Craft 5 stores all field content.
- **Exceptions in raw content search are now logged** to `storage/logs/quick-search.log` instead of being silently swallowed.

### Translations
- New settings strings added to all 20 supported language files (`en` + 19 others with English placeholders, ready for localization).

## [1.9.1] - 2026-03-04

### Fixed
- "All" option in Enabled Search Types and Searchable Sections settings now correctly shows as selected on page load (fresh install and after saving)
- Saving "All" in either checkbox-select field now stores `null` instead of an empty/asterisk array, keeping the data clean and consistent
- Section filter dropdown in the header search now only shows sections that are enabled in the Searchable Sections setting

## [1.9.0] - 2026-02-23

### Added
- Theme mode setting (Auto / Light / Dark) in plugin settings — sets the color theme for all users
- Per-user theme override in My Account → Preferences — each user can override the site default for their own account, auto-saves without a page reload and applies instantly

## [1.5.0] - 2026-02-03

### Changed
- Improved entry search performance by using direct title matching instead of search index

## [1.4.0] - 2026-02-02

### Added
- Current entry shown at top of favorites dropdown with "Add to favorites" button
- Ability to favorite entries directly without visiting them first

### Changed
- Show Related Entries setting now defaults to enabled
- Favorites limit default increased to 25

## [1.3.0] - 2026-02-02

### Fixed
- Made migrations idempotent to handle both fresh installs and upgrades correctly

## [1.2.0] - 2026-02-01

### Added
- Multi-site support with site filter dropdown
- Site badges on entries when viewing all sites
- Configurable search results limit setting
- Fetch timeouts (10 seconds) to prevent UI freezes
- Loading indicators for history and favorites popups
- Search request cancellation to prevent race conditions

### Changed
- Improved error handling throughout
- Back button now considers both entry ID and site

### Fixed
- Site context now correctly tracked from URL query parameter
- History entries now properly track which site was visited

## [1.1.0] - 2026-01-31

### Added
- Favorites system with star button
- Entry outline navigation popup
- Related entries view (optional)
- Compact mode for denser display
- Clear history functionality
- 20 language translations

### Changed
- Simplified section filter settings (removed include/exclude mode)
- Default favorites limit increased to 20

## [1.0.0] - 2026-01-30

### Added
- Initial release
- Global header search integration
- Entry search by title with section filtering
- Section dropdown filter in search UI
- Visit history tracking (configurable limit per user)
- History popup with search functionality
- Keyboard navigation support (arrow keys, Enter, Escape)
- Automatic entry visit tracking on edit pages
- Permission-aware search and history
- Configurable settings:
  - History limit
  - Show/hide section filter
  - Searchable sections
  - Minimum search length
  - Debounce delay
- Database migrations with proper indexes
- AJAX API endpoints for search and history
- Responsive design matching Craft CP styles

[1.10.0]: https://github.com/yannkost/craft-quick-search/compare/v1.9.1...v1.10.0
[1.9.1]: https://github.com/yannkost/craft-quick-search/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/yannkost/craft-quick-search/compare/v1.5.0...v1.9.0
[1.5.0]: https://github.com/yannkost/craft-quick-search/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/yannkost/craft-quick-search/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/yannkost/craft-quick-search/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/yannkost/craft-quick-search/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yannkost/craft-quick-search/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yannkost/craft-quick-search/releases/tag/v1.0.0
