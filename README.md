# Quick Search for Craft CMS

Fast entry search and navigation for the Craft CMS control panel.

## Features

### Search & Navigation
- **Instant Search** - Find entries by title directly from the CP header with real-time results
- **Smart Filtering** - Filter by section and site (full multi-site support)
- **Quick Access Overlay** - Press `Ctrl/Cmd+G` to instantly access search, history, and favorites from anywhere
- **Dashboard Widget** - Search, history, and favorites right on your dashboard

### Productivity Tools
- **Recent History** - Automatic tracking of visited entries with one-click access
- **Favorites System** - Star important entries and reorder them via drag & drop
- **Entry Outline** - Navigate complex entries with a hierarchical view of all fields and Matrix blocks
- **Related Entries** - Discover connections between entries, including links in content fields

### Customization
- **Compact Mode** - Streamlined interface for power users
- **Configurable Limits** - Control search results, history size, and favorites count
- **20+ Languages** - Fully translated interface for international teams

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
