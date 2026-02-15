<?php

return [
    // Settings page - Display Settings
    'Display Settings' => 'Anzeigeeinstellungen',
    'Compact Mode' => 'Kompaktmodus',
    'Use a more compact display for search results and history lists.' => 'Kompaktere Darstellung für Suchergebnisse und Verlaufslisten verwenden.',
    'Show Section Filter' => 'Bereichsfilter anzeigen',
    'Show the section filter dropdown in the search UI.' => 'Bereichsfilter-Dropdown in der Suchoberfläche anzeigen.',
    'Show Entry Outline' => 'Eintragsübersicht anzeigen',
    'Display the entry outline button on entry pages.' => 'Schaltfläche für die Eintragsübersicht auf Eintragsseiten anzeigen.',
    'Show Related Entries' => 'Verwandte Einträge anzeigen',
    'Display related entries button on entry pages.' => 'Schaltfläche für verwandte Einträge auf Eintragsseiten anzeigen.',

    // Settings page - Search Settings
    'Search Settings' => 'Sucheinstellungen',
    'Enabled Search Types' => 'Aktivierte Suchtypen',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => 'Wählen Sie aus, welche zusätzlichen Inhaltstypen als Tabs im Such-Overlay angezeigt werden sollen. Die Eintragssuche ist immer aktiviert.',
    'Enabled Sections' => 'Aktivierte Bereiche',
    'Select which sections should be searchable. Leave empty to enable all sections.' => 'Wählen Sie aus, welche Bereiche durchsuchbar sein sollen. Leer lassen, um alle Bereiche zu aktivieren.',
    'Minimum Search Length' => 'Minimale Suchlänge',
    'Minimum number of characters required before search is triggered.' => 'Mindestanzahl an Zeichen, bevor die Suche ausgelöst wird.',
    'Debounce Delay' => 'Verzögerung',
    'Delay in milliseconds before search is triggered after typing stops.' => 'Verzögerung in Millisekunden, bevor die Suche nach dem Tippen ausgelöst wird.',

    // Settings page - History Settings
    'History Settings' => 'Verlaufseinstellungen',
    'History Limit' => 'Verlaufslimit',
    'Maximum number of entry visits to keep per user.' => 'Maximale Anzahl der Eintragsbesuche pro Benutzer.',

    // Error messages
    'An error occurred while searching.' => 'Bei der Suche ist ein Fehler aufgetreten.',
    'An error occurred while fetching sections.' => 'Beim Abrufen der Bereiche ist ein Fehler aufgetreten.',
    'An error occurred while fetching history.' => 'Beim Abrufen des Verlaufs ist ein Fehler aufgetreten.',
    'An error occurred while recording the visit.' => 'Beim Aufzeichnen des Besuchs ist ein Fehler aufgetreten.',
    'User not found.' => 'Benutzer nicht gefunden.',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'Einträge suchen...',
    'All Sections' => 'Alle Bereiche',
    'Recent Entries' => 'Letzte Einträge',
    'Filter history...' => 'Verlauf filtern...',
    'No entries found' => 'Keine Einträge gefunden',
    'No recent entries' => 'Keine letzten Einträge',
    'Searching...' => 'Suche...',
    'Show more...' => 'Mehr anzeigen...',
    'Go to last visited entry' => 'Zum letzten besuchten Eintrag',
    'View recent entries' => 'Letzte Einträge anzeigen',
    'Open in new tab' => 'In neuem Tab öffnen',
    '{count} Sections' => '{count} Bereiche',
    '1 Section' => '1 Bereich',

    // Related Entries
    'Related Entries' => 'Verwandte Einträge',
    'Links to' => 'Verweist auf',
    'Linked from' => 'Verwiesen von',
    'No related entries found' => 'Keine verwandten Einträge gefunden',
    'An error occurred while fetching related entries.' => 'Beim Abrufen der verwandten Einträge ist ein Fehler aufgetreten.',
    'Invalid entry ID.' => 'Ungültige Eintrags-ID.',

    // Entry Outline
    'Entry Outline' => 'Eintragsübersicht',
    'No blocks found' => 'Keine Blöcke gefunden',

    // Clear History
    'Clear history' => 'Verlauf löschen',
    'Clear all history?' => 'Gesamten Verlauf löschen?',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'Dies entfernt alle Ihre letzten Eintragsbesuche. Diese Aktion kann nicht rückgängig gemacht werden.',
    'An error occurred while clearing history.' => 'Beim Löschen des Verlaufs ist ein Fehler aufgetreten.',

    // Favorites
    'Favorites' => 'Favoriten',
    'Favorites Limit' => 'Favoritenlimit',
    'Maximum number of favorites per user.' => 'Maximale Anzahl der Favoriten pro Benutzer.',
    'Add to favorites' => 'Zu Favoriten hinzufügen',
    'Remove from favorites' => 'Aus Favoriten entfernen',
    'No favorites yet' => 'Noch keine Favoriten',
    'Maximum favorites reached' => 'Maximale Favoriten erreicht',
    'An error occurred while adding favorite.' => 'Beim Hinzufügen des Favoriten ist ein Fehler aufgetreten.',
    'An error occurred while removing favorite.' => 'Beim Entfernen des Favoriten ist ein Fehler aufgetreten.',
    'An error occurred while fetching favorites.' => 'Beim Abrufen der Favoriten ist ein Fehler aufgetreten.',

    // Status tooltips
    'Status: Live' => 'Status: Veröffentlicht',
    'Status: Draft' => 'Status: Entwurf',
    'Status: Pending' => 'Status: Ausstehend',
    'Status: Disabled' => 'Status: Deaktiviert',
    'Status: Expired' => 'Status: Abgelaufen',

    // Section Filter Mode
    'Section Filter Mode' => 'Bereichsfiltermodus',
    'Include selected sections' => 'Ausgewählte Bereiche einschließen',
    'Exclude selected sections' => 'Ausgewählte Bereiche ausschließen',
    'Choose how to filter sections for search.' => 'Wählen Sie, wie Bereiche für die Suche gefiltert werden sollen.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => 'Wählen Sie, welche Bereiche von der Suche ausgeschlossen werden sollen. Leer lassen, um alle Bereiche zu durchsuchen.',
    'Select which sections to include in search. Leave empty to search all sections.' => 'Wählen Sie, welche Bereiche in die Suche eingeschlossen werden sollen. Leer lassen, um alle Bereiche zu durchsuchen.',
    'Sections to Include' => 'Einzuschließende Bereiche',
    'Sections to Exclude' => 'Auszuschließende Bereiche',

    // Multi-site support
    'Current Site' => 'Aktuelle Website',
    'All Sites' => 'Alle Websites',
    'An error occurred while fetching sites.' => 'Beim Abrufen der Websites ist ein Fehler aufgetreten.',

    // Current page (favorites dropdown)
    'Current page' => 'Aktuelle Seite',

    // Quick Access overlay
    'Quick Access' => 'Schnellzugriff',
    'Search Results' => 'Suchergebnisse',
    'Filter...' => 'Filtern...',
    'Enter ↵' => 'Eingabe ↵',
    'Close' => 'Schließen',
    'Close drawer' => 'Seitenleiste schließen',
    'Drag to reorder' => 'Ziehen zum Sortieren',
    'Error loading history' => 'Fehler beim Laden des Verlaufs',
    'Error loading favorites' => 'Fehler beim Laden der Favoriten',
    'Search failed' => 'Suche fehlgeschlagen',
    'No settings found' => 'Keine Einstellungen gefunden',
    'History' => 'Verlauf',

    // Edit drawer
    'Edit Entry' => 'Eintrag bearbeiten',
    'Title' => 'Titel',
    'Slug' => 'Slug',
    'Status' => 'Status',
    'Live' => 'Live',
    'Disabled' => 'Deaktiviert',
    'Draft' => 'Entwurf',
    'Post Date' => 'Veröffentlichungsdatum',
    'Expiry Date' => 'Ablaufdatum',
    'Save' => 'Speichern',

    // Admin type labels
    'Section' => 'Bereich',
    'Field' => 'Feld',
    'Entry Type' => 'Eintragstyp',
    'Category Group' => 'Kategoriegruppe',
    'Volume' => 'Volume',
    'Global Set' => 'Globales Set',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'Einträge',
    'Categories' => 'Kategorien',
    'Assets' => 'Dateien',
    'Users' => 'Benutzer',
    'Globals' => 'Globale',
    'Admin' => 'Admin',

    // Search placeholders per type
    'Search categories...' => 'Kategorien suchen...',
    'Search assets...' => 'Dateien suchen...',
    'Search users...' => 'Benutzer suchen...',
    'Search globals...' => 'Globale suchen...',
    'Search settings...' => 'Einstellungen suchen...',

    // Empty states per type
    'No categories found' => 'Keine Kategorien gefunden',
    'No assets found' => 'Keine Dateien gefunden',
    'No users found' => 'Keine Benutzer gefunden',
    'No global sets found' => 'Keine globalen Sets gefunden',
    'No admin results found' => 'Keine Einstellungen gefunden',

    // Type prefix help
    'Type prefix hint' => 'Tipp: Verwenden Sie „entries:", „categories:", „users:" usw., um den Suchtyp zu wechseln',

    'Clear Search on Tab Switch' => 'Suche beim Tab-Wechsel leeren',
    'Clear the search input and results when switching between search type tabs.' => 'Suchfeld und Ergebnisse beim Wechsel zwischen den Suchtyp-Tabs leeren.',
    'Clear search' => 'Suche leeren',

    // Saved Searches
    'Show Saved Searches' => 'Gespeicherte Suchen anzeigen',
    'Show the saved searches section in the Quick Access Overlay.' => 'Den Bereich für gespeicherte Suchen im Schnellzugriff-Overlay anzeigen.',
    'Saved Searches' => 'Gespeicherte Suchen',
    'Save Search' => 'Suche speichern',
    'Name this search...' => 'Diese Suche benennen...',
    'Run' => 'Ausführen',
    'Delete saved search' => 'Gespeicherte Suche löschen',
    'Delete this saved search?' => 'Diese gespeicherte Suche löschen?',
    'No saved searches yet' => 'Noch keine gespeicherten Suchen',
    'Maximum saved searches reached' => 'Maximale Anzahl gespeicherter Suchen erreicht',
    'Saved Searches Limit' => 'Limit für gespeicherte Suchen',
    'Maximum number of saved searches per user.' => 'Maximale Anzahl gespeicherter Suchen pro Benutzer.',
    'An error occurred while saving search.' => 'Beim Speichern der Suche ist ein Fehler aufgetreten.',
    'An error occurred while fetching saved searches.' => 'Beim Abrufen der gespeicherten Suchen ist ein Fehler aufgetreten.',
    'An error occurred while deleting saved search.' => 'Beim Löschen der gespeicherten Suche ist ein Fehler aufgetreten.',
    'An error occurred while reordering saved searches.' => 'Beim Neuordnen der gespeicherten Suchen ist ein Fehler aufgetreten.',

    // Favorites shortcuts
    'Navigating to {title}...' => 'Navigation zu {title}...',

    // Copy actions
    'Copy options' => 'Kopieroptionen',
    'Copy URL' => 'URL kopieren',
    'Copy Title' => 'Titel kopieren',
    'Copy ID' => 'ID kopieren',
    'Copied!' => 'Kopiert!',
];
