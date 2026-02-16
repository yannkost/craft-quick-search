# Quick Search for Craft CMS

Fast, keyboard-first search and navigation for the Craft CMS control panel.

## Features

### Quick Access Overlay (`Ctrl+G`)
A full-screen overlay for instant access to everything in your CP:
- **Universal Search** — search across entries, categories, assets, users, globals, and admin settings from a single input
- **System Commands** — execute admin utilities (clear caches, rebuild indexes, flush transforms) directly from the overlay (admin-only)
- **Tabbed Results** — switch between content types with tabs or type prefixes
- **Site Selector** — search across different sites or all sites at once (multi-site)
- **History Panel** — browse recently visited entries with client-side filtering
- **Favorites Panel** — star important entries, reorder via drag-and-drop
- **Saved Searches** — save frequently used searches for one-click access, reorder via drag-and-drop
- **Copy Actions** — quickly copy an entry's URL, title, or ID from the results

### Header Bar Search
- **Instant Search** — find entries by title directly from the CP header with real-time results
- **Section Filter** — filter results by section (include or exclude mode)
- **Site Filter** — filter by site (multi-site installations)
- **Recent History** — browse and filter recent entries from the clock icon
- **Favorites** — access starred entries from the star icon
- **Back Button** — one-click return to the last visited entry

### Entry Tools
- **Entry Outline** — navigate complex entries with a hierarchical view of all fields and Matrix blocks
- **Related Entries** — discover connections between entries (links to / linked from)

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+G` (or `Cmd+G`) | Open Quick Access overlay |
| `Alt+1` through `Alt+9` | Jump directly to favorites 1–9 (works from anywhere) |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Open selected entry |
| `Ctrl/Cmd+Enter` | Open in new tab |
| `Escape` | Close overlay / dropdowns |

### Search Prefixes

Type a prefix in the Quick Access search to switch content type:

| Prefix | Type |
|---|---|
| `e:` or `entries:` | Entries |
| `c:` or `categories:` or `cats:` | Categories |
| `a:` or `assets:` | Assets |
| `u:` or `users:` | Users |
| `g:` or `globals:` | Globals |
| `@:` or `admin:` | Admin settings |
| `sections:`, `fields:`, `entrytypes:`, `volumes:`, `plugins:` | Admin (specific) |
| `cmd:` or `commands:` | System commands |

### Customization
- **Compact Mode** — streamlined interface for power users
- **Configurable Search Types** — choose which content types appear as tabs (entries is always available)
- **Configurable Limits** — control history size, favorites count, and saved searches
- **Clear on Tab Switch** — optionally clear the search input when switching between tabs
- **Default Panel** — choose whether Quick Access opens on History or Favorites
- **20 Languages** — ar, bg, cs, de, en, es, fr, hu, it, ja, ko, nl, pl, pt, ro, ru, sk, tr, uk, zh

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

| Setting | Description | Default |
|---|---|---|
| Compact Mode | Use a more compact display for lists | Off |
| Show Section Filter | Toggle the section filter dropdown | On |
| Show Entry Outline | Display entry outline button on entry pages | On |
| Show Related Entries | Display related entries button on entry pages | On |
| Section Filter Mode | Include or exclude selected sections | Include |
| Enabled Sections | Limit which sections are searchable | All |
| Enabled Search Types | Choose which content types appear as tabs | All |
| Search Results Limit | Maximum number of search results | 20 |
| Minimum Search Length | Characters required before search triggers | 2 |
| Debounce Delay | Delay (ms) before search triggers after typing | 300 |
| History Limit | Maximum history entries per user | 50 |
| Favorites Limit | Maximum favorites per user | 25 |
| Saved Searches Limit | Maximum saved searches per user | 20 |
| Quick Access Overlay | Enable/disable the overlay | On |
| Quick Access Shortcut | Keyboard shortcut for the overlay | `Ctrl+G` |
| Default Panel | Panel shown when overlay opens | History |
| Show Entry Search | Toggle the search input in the overlay | On |
| Clear Search on Tab Switch | Clear input when switching content type tabs | On |
| Show Saved Searches | Toggle the saved searches section | On |

## Dashboard Widget

A dashboard widget is included, providing search, history, and favorites directly on the Craft dashboard.

## License

This plugin is licensed under the [Craft License](LICENSE.md).
