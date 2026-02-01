# Quick Search for Craft CMS

Fast entry search and navigation for the Craft CMS control panel.

## Features

- Quick search entries by title from the CP header
- Section and site filtering
- Recent entries history
- Favorites system
- Entry outline navigation
- Related entries view
- Multi-site support
- Compact mode option

## Requirements

- Craft CMS 5.0 or later
- PHP 8.2 or later

## Installation

1. Install via Composer:
   ```bash
   composer require craftcms/quick-search
   ```

2. Install the plugin in the Craft Control Panel under Settings → Plugins

## Configuration

Visit Settings → Quick Search to configure:

- **Compact Mode**: Use a more compact display for lists
- **Show Section Filter**: Toggle the section filter dropdown
- **Show Related Entries**: Display related entries button on entry pages
- **Searchable Sections**: Limit which sections are searchable
- **History Limit**: Maximum history entries per user
- **Favorites Limit**: Maximum favorites per user

## Usage

- Use `Cmd/Ctrl + K` to focus the search input
- Click the back arrow to return to the last visited entry
- Click the clock icon to view recent entries
- Click the star icon to view/manage favorites
- Use the section dropdown to filter by section
- Use the site dropdown to filter by site (multi-site only)

## License

MIT
