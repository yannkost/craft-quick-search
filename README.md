# Quick Search for Craft CMS

Fast entry search and navigation for the Craft CMS control panel.

## Features

- Quick search entries by title from the CP header
- Section and site filtering (multi-site support)
- Recent entries history with tracking
- Favorites system
- Entry outline navigation
- Related entries view
- Compact mode option
- 20 language translations

## Requirements

- Craft CMS 5.0 or later
- PHP 8.2 or later

## Installation

Install via Composer:

```bash
composer require yannkost/craft-quick-search
```

Then install the plugin in the Craft Control Panel under Settings → Plugins.

## Configuration

Visit Settings → Quick Search to configure:

- **Compact Mode**: Use a more compact display for lists
- **Show Section Filter**: Toggle the section filter dropdown
- **Show Related Entries**: Display related entries button on entry pages
- **Searchable Sections**: Limit which sections are searchable
- **Search Results Limit**: Maximum number of search results
- **Minimum Search Length**: Characters required before search triggers
- **Debounce Delay**: Delay before search triggers after typing
- **History Limit**: Maximum history entries per user
- **Favorites Limit**: Maximum favorites per user

## Usage

- Click the search input in the header to start searching
- Click the back arrow to return to the last visited entry
- Click the clock icon to view recent entries
- Click the star icon to view/manage favorites
- Use the section dropdown to filter by section
- Use the site dropdown to filter by site (multi-site only)

## Keyboard Shortcuts

- `Arrow Up/Down` - Navigate results
- `Enter` - Open selected entry
- `Cmd/Ctrl + Enter` - Open in new tab
- `Escape` - Close dropdowns

## License

This plugin is licensed under the [Craft License](LICENSE.md).
