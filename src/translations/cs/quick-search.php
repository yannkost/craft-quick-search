<?php

return [
    // Settings page - Display Settings
    'Display Settings' => 'Nastavení zobrazení',
    'Compact Mode' => 'Kompaktní režim',
    'Use a more compact display for search results and history lists.' => 'Použít kompaktnější zobrazení pro výsledky vyhledávání a seznamy historie.',
    'Show Section Filter' => 'Zobrazit filtr sekcí',
    'Show the section filter dropdown in the search UI.' => 'Zobrazit rozbalovací nabídku filtru sekcí v rozhraní vyhledávání.',
    'Show Entry Outline' => 'Zobrazit osnovu záznamu',
    'Display the entry outline button on entry pages.' => 'Zobrazit tlačítko osnovy záznamu na stránkách záznamů.',
    'Show Related Entries' => 'Zobrazit související položky',
    'Display related entries button on entry pages.' => 'Zobrazit související položky ve výsledcích vyhledávání.',

    // Settings page - Search Settings
    'Search Settings' => 'Nastavení vyhledávání',
    'Enabled Search Types' => 'Povolené typy vyhledávání',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => 'Vyberte, které další typy obsahu se mají zobrazovat jako záložky v panelu vyhledávání. Vyhledávání položek je vždy aktivní.',
    'Enabled Sections' => 'Povolené sekce',
    'Select which sections should be searchable. Leave empty to enable all sections.' => 'Vyberte, které sekce mají být prohledávatelné. Ponechte prázdné pro povolení všech sekcí.',
    'Minimum Search Length' => 'Minimální délka vyhledávání',
    'Minimum number of characters required before search is triggered.' => 'Minimální počet znaků potřebných před spuštěním vyhledávání.',
    'Debounce Delay' => 'Zpoždění debounce',
    'Delay in milliseconds before search is triggered after typing stops.' => 'Zpoždění v milisekundách před spuštěním vyhledávání po ukončení psaní.',

    // Settings page - History Settings
    'History Settings' => 'Nastavení historie',
    'History Limit' => 'Limit historie',
    'Maximum number of entry visits to keep per user.' => 'Maximální počet návštěv položek k uchování na uživatele.',

    // Error messages
    'An error occurred while searching.' => 'Při vyhledávání došlo k chybě.',
    'An error occurred while fetching sections.' => 'Při načítání sekcí došlo k chybě.',
    'An error occurred while fetching history.' => 'Při načítání historie došlo k chybě.',
    'An error occurred while recording the visit.' => 'Při zaznamenávání návštěvy došlo k chybě.',
    'User not found.' => 'Uživatel nenalezen.',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'Hledat položky...',
    'All Sections' => 'Všechny sekce',
    'Recent Entries' => 'Nedávné položky',
    'Filter history...' => 'Filtrovat historii...',
    'No entries found' => 'Žádné položky nenalezeny',
    'No recent entries' => 'Žádné nedávné položky',
    'Searching...' => 'Vyhledávání...',
    'Show more...' => 'Zobrazit více...',
    'Go to last visited entry' => 'Přejít na naposledy navštívenou položku',
    'View recent entries' => 'Zobrazit nedávné položky',
    'Open in new tab' => 'Otevřít v nové kartě',
    '{count} Sections' => '{count} Sekcí',
    '1 Section' => '1 Sekce',

    // Related Entries
    'Related Entries' => 'Související položky',
    'Links to' => 'Odkazuje na',
    'Linked from' => 'Odkázáno z',
    'No related entries found' => 'Nebyly nalezeny žádné související položky',
    'An error occurred while fetching related entries.' => 'Při načítání souvisejících položek došlo k chybě.',
    'Invalid entry ID.' => 'Neplatné ID položky.',

    // Entry Outline
    'Entry Outline' => 'Struktura položky',
    'No blocks found' => 'Žádné bloky nenalezeny',

    // Clear History
    'Clear history' => 'Vymazat historii',
    'Clear all history?' => 'Vymazat celou historii?',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'Toto odstraní všechny vaše nedávné návštěvy položek. Tuto akci nelze vrátit zpět.',
    'An error occurred while clearing history.' => 'Při mazání historie došlo k chybě.',

    // Favorites
    'Favorites' => 'Oblíbené',
    'Favorites Limit' => 'Limit oblíbených',
    'Maximum number of favorites per user.' => 'Maximální počet oblíbených na uživatele.',
    'Add to favorites' => 'Přidat do oblíbených',
    'Remove from favorites' => 'Odebrat z oblíbených',
    'No favorites yet' => 'Zatím žádné oblíbené',
    'Maximum favorites reached' => 'Dosažen maximální počet oblíbených',
    'An error occurred while adding favorite.' => 'Při přidávání do oblíbených došlo k chybě.',
    'An error occurred while removing favorite.' => 'Při odebírání z oblíbených došlo k chybě.',
    'An error occurred while fetching favorites.' => 'Při načítání oblíbených došlo k chybě.',

    // Status tooltips
    'Status: Live' => 'Stav: Publikováno',
    'Status: Draft' => 'Stav: Koncept',
    'Status: Pending' => 'Stav: Čeká',
    'Status: Disabled' => 'Stav: Zakázáno',
    'Status: Expired' => 'Stav: Vypršelo',

    // Section Filter Mode
    'Section Filter Mode' => 'Režim filtru sekcí',
    'Include selected sections' => 'Zahrnout vybrané sekce',
    'Exclude selected sections' => 'Vyloučit vybrané sekce',
    'Choose how to filter sections for search.' => 'Vyberte, jak filtrovat sekce pro vyhledávání.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => 'Vyberte, které sekce vyloučit z vyhledávání. Ponechte prázdné pro vyhledávání ve všech sekcích.',
    'Select which sections to include in search. Leave empty to search all sections.' => 'Vyberte, které sekce zahrnout do vyhledávání. Ponechte prázdné pro vyhledávání ve všech sekcích.',
    'Sections to Include' => 'Sekce k zahrnutí',
    'Sections to Exclude' => 'Sekce k vyloučení',

    // Multi-site support
    'Current Site' => 'Aktuální web',
    'All Sites' => 'Všechny weby',
    'An error occurred while fetching sites.' => 'Při načítání webů došlo k chybě.',

    // Current page (favorites dropdown)
    'Current page' => 'Aktuální stránka',

    // Quick Access overlay
    'Quick Access' => 'Rychlý přístup',
    'Search Results' => 'Výsledky hledání',
    'Filter...' => 'Filtrovat...',
    'Enter ↵' => 'Enter ↵',
    'Close' => 'Zavřít',
    'Close drawer' => 'Zavřít panel',
    'Drag to reorder' => 'Přetáhněte pro změnu pořadí',
    'Error loading history' => 'Chyba při načítání historie',
    'Error loading favorites' => 'Chyba při načítání oblíbených',
    'Search failed' => 'Hledání selhalo',
    'No settings found' => 'Žádná nastavení nenalezena',
    'History' => 'Historie',

    // Edit drawer
    'Edit Entry' => 'Upravit záznam',
    'Title' => 'Název',
    'Slug' => 'Slug',
    'Status' => 'Stav',
    'Live' => 'Publikováno',
    'Disabled' => 'Zakázáno',
    'Draft' => 'Koncept',
    'Post Date' => 'Datum publikace',
    'Expiry Date' => 'Datum expirace',
    'Save' => 'Uložit',

    // Admin type labels
    'Section' => 'Sekce',
    'Field' => 'Pole',
    'Entry Type' => 'Typ záznamu',
    'Category Group' => 'Skupina kategorií',
    'Volume' => 'Svazek',
    'Global Set' => 'Globální sada',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'Položky',
    'Categories' => 'Kategorie',
    'Assets' => 'Soubory',
    'Users' => 'Uživatelé',
    'Globals' => 'Globální',
    'Admin' => 'Admin',

    // Search placeholders per type
    'Search categories...' => 'Hledat kategorie...',
    'Search assets...' => 'Hledat soubory...',
    'Search users...' => 'Hledat uživatele...',
    'Search globals...' => 'Hledat globální...',
    'Search settings...' => 'Hledat nastavení...',

    // Empty states per type
    'No categories found' => 'Žádné kategorie nenalezeny',
    'No assets found' => 'Žádné soubory nenalezeny',
    'No users found' => 'Žádní uživatelé nenalezeni',
    'No global sets found' => 'Žádné globální sady nenalezeny',
    'No admin results found' => 'Žádná nastavení nenalezena',

    // Type prefix help
    'Type prefix hint' => 'Tip: Použijte „entries:", „categories:", „users:" atd. pro přepnutí typu vyhledávání',

    'Clear Search on Tab Switch' => 'Vymazat hledání při přepnutí záložky',
    'Clear the search input and results when switching between search type tabs.' => 'Vymazat vyhledávací pole a výsledky při přepínání mezi záložkami typů vyhledávání.',
    'Clear search' => 'Vymazat hledání',

    // Saved Searches
    'Show Saved Searches' => 'Zobrazit uložená vyhledávání',
    'Show the saved searches section in the Quick Access Overlay.' => 'Zobrazit sekci uložených vyhledávání v panelu rychlého přístupu.',
    'Saved Searches' => 'Uložená vyhledávání',
    'Save Search' => 'Uložit vyhledávání',
    'Name this search...' => 'Pojmenovat toto vyhledávání...',
    'Run' => 'Spustit',
    'Delete saved search' => 'Smazat uložené vyhledávání',
    'Delete this saved search?' => 'Smazat toto uložené vyhledávání?',
    'No saved searches yet' => 'Zatím žádná uložená vyhledávání',
    'Maximum saved searches reached' => 'Dosažen maximální počet uložených vyhledávání',
    'Saved Searches Limit' => 'Limit uložených vyhledávání',
    'Maximum number of saved searches per user.' => 'Maximální počet uložených vyhledávání na uživatele.',
    'An error occurred while saving search.' => 'Při ukládání vyhledávání došlo k chybě.',
    'An error occurred while fetching saved searches.' => 'Při načítání uložených vyhledávání došlo k chybě.',
    'An error occurred while deleting saved search.' => 'Při mazání uloženého vyhledávání došlo k chybě.',
    'An error occurred while reordering saved searches.' => 'Při změně pořadí uložených vyhledávání došlo k chybě.',

    // Favorites shortcuts
    'Navigating to {title}...' => 'Přechod na {title}...',

    // Copy actions
    'Copy options' => 'Možnosti kopírování',
    'Copy URL' => 'Kopírovat URL',
    'Copy Title' => 'Kopírovat název',
    'Copy ID' => 'Kopírovat ID',
    'Copied!' => 'Zkopírováno!',
];
