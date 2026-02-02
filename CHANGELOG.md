# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.3.0]: https://github.com/yannkost/craft-quick-search/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/yannkost/craft-quick-search/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yannkost/craft-quick-search/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yannkost/craft-quick-search/releases/tag/v1.0.0
