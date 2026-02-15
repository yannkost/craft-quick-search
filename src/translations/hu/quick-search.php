<?php

return [
    // Settings page - Display Settings
    'Display Settings' => 'Megjelenítési beállítások',
    'Compact Mode' => 'Kompakt mód',
    'Use a more compact display for search results and history lists.' => 'Kompaktabb megjelenítés használata a keresési eredményekhez és előzménylistákhoz.',
    'Show Section Filter' => 'Szekció szűrő megjelenítése',
    'Show the section filter dropdown in the search UI.' => 'A szekció szűrő legördülő menü megjelenítése a keresési felületen.',
    'Show Entry Outline' => 'Bejegyzés vázlat megjelenítése',
    'Display the entry outline button on entry pages.' => 'A bejegyzés vázlat gomb megjelenítése a bejegyzés oldalakon.',
    'Show Related Entries' => 'Kapcsolódó bejegyzések megjelenítése',
    'Display related entries button on entry pages.' => 'Kapcsolódó bejegyzések megjelenítése a keresési eredményekben.',

    // Settings page - Search Settings
    'Search Settings' => 'Keresési beállítások',
    'Enabled Search Types' => 'Engedélyezett keresési típusok',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => 'Válassza ki, mely további tartalomtípusok jelenjenek meg fülekként a keresési panelen. A bejegyzések keresése mindig engedélyezett.',
    'Enabled Sections' => 'Engedélyezett szekciók',
    'Select which sections should be searchable. Leave empty to enable all sections.' => 'Válassza ki, mely szekciók legyenek kereshetők. Hagyja üresen az összes szekció engedélyezéséhez.',
    'Minimum Search Length' => 'Minimális keresési hossz',
    'Minimum number of characters required before search is triggered.' => 'A keresés indításához szükséges minimális karakterszám.',
    'Debounce Delay' => 'Debounce késleltetés',
    'Delay in milliseconds before search is triggered after typing stops.' => 'Késleltetés ezredmásodpercben a keresés indítása előtt a gépelés befejezése után.',

    // Settings page - History Settings
    'History Settings' => 'Előzmények beállításai',
    'History Limit' => 'Előzmények korlátja',
    'Maximum number of entry visits to keep per user.' => 'A felhasználónként megőrzendő bejegyzéslátogatások maximális száma.',

    // Error messages
    'An error occurred while searching.' => 'Hiba történt a keresés során.',
    'An error occurred while fetching sections.' => 'Hiba történt a szekciók lekérésekor.',
    'An error occurred while fetching history.' => 'Hiba történt az előzmények lekérésekor.',
    'An error occurred while recording the visit.' => 'Hiba történt a látogatás rögzítésekor.',
    'User not found.' => 'Felhasználó nem található.',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'Bejegyzések keresése...',
    'All Sections' => 'Összes szekció',
    'Recent Entries' => 'Legutóbbi bejegyzések',
    'Filter history...' => 'Előzmények szűrése...',
    'No entries found' => 'Nem található bejegyzés',
    'No recent entries' => 'Nincsenek legutóbbi bejegyzések',
    'Searching...' => 'Keresés...',
    'Show more...' => 'Több megjelenítése...',
    'Go to last visited entry' => 'Ugrás az utoljára meglátogatott bejegyzéshez',
    'View recent entries' => 'Legutóbbi bejegyzések megtekintése',
    'Open in new tab' => 'Megnyitás új lapon',
    '{count} Sections' => '{count} Szekció',
    '1 Section' => '1 Szekció',

    // Related Entries
    'Related Entries' => 'Kapcsolódó bejegyzések',
    'Links to' => 'Hivatkozik',
    'Linked from' => 'Hivatkozva innen',
    'No related entries found' => 'Nem található kapcsolódó bejegyzés',
    'An error occurred while fetching related entries.' => 'Hiba történt a kapcsolódó bejegyzések lekérésekor.',
    'Invalid entry ID.' => 'Érvénytelen bejegyzés azonosító.',

    // Entry Outline
    'Entry Outline' => 'Bejegyzés szerkezete',
    'No blocks found' => 'Nem található blokk',

    // Clear History
    'Clear history' => 'Előzmények törlése',
    'Clear all history?' => 'Törli az összes előzményt?',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'Ez eltávolítja az összes legutóbbi bejegyzéslátogatást. Ez a művelet nem vonható vissza.',
    'An error occurred while clearing history.' => 'Hiba történt az előzmények törlésekor.',

    // Favorites
    'Favorites' => 'Kedvencek',
    'Favorites Limit' => 'Kedvencek korlátja',
    'Maximum number of favorites per user.' => 'A felhasználónkénti kedvencek maximális száma.',
    'Add to favorites' => 'Hozzáadás a kedvencekhez',
    'Remove from favorites' => 'Eltávolítás a kedvencekből',
    'No favorites yet' => 'Még nincsenek kedvencek',
    'Maximum favorites reached' => 'Elérte a kedvencek maximális számát',
    'An error occurred while adding favorite.' => 'Hiba történt a kedvenc hozzáadásakor.',
    'An error occurred while removing favorite.' => 'Hiba történt a kedvenc eltávolításakor.',
    'An error occurred while fetching favorites.' => 'Hiba történt a kedvencek lekérésekor.',

    // Status tooltips
    'Status: Live' => 'Állapot: Közzétéve',
    'Status: Draft' => 'Állapot: Piszkozat',
    'Status: Pending' => 'Állapot: Függőben',
    'Status: Disabled' => 'Állapot: Letiltva',
    'Status: Expired' => 'Állapot: Lejárt',

    // Section Filter Mode
    'Section Filter Mode' => 'Szekció szűrő mód',
    'Include selected sections' => 'Kijelölt szekciók bevonása',
    'Exclude selected sections' => 'Kijelölt szekciók kizárása',
    'Choose how to filter sections for search.' => 'Válassza ki, hogyan szűrje a szekciókat a kereséshez.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => 'Válassza ki, mely szekciókat zárja ki a keresésből. Hagyja üresen az összes szekcióban való kereséshez.',
    'Select which sections to include in search. Leave empty to search all sections.' => 'Válassza ki, mely szekciókat vonja be a keresésbe. Hagyja üresen az összes szekcióban való kereséshez.',
    'Sections to Include' => 'Bevonandó szekciók',
    'Sections to Exclude' => 'Kizárandó szekciók',

    // Multi-site support
    'Current Site' => 'Jelenlegi oldal',
    'All Sites' => 'Összes oldal',
    'An error occurred while fetching sites.' => 'Hiba történt az oldalak lekérésekor.',

    // Current page (favorites dropdown)
    'Current page' => 'Jelenlegi oldal',

    // Quick Access overlay
    'Quick Access' => 'Gyors hozzáférés',
    'Search Results' => 'Keresési eredmények',
    'Filter...' => 'Szűrés...',
    'Enter ↵' => 'Enter ↵',
    'Close' => 'Bezárás',
    'Close drawer' => 'Panel bezárása',
    'Drag to reorder' => 'Húzza az átrendezéshez',
    'Error loading history' => 'Hiba az előzmények betöltésekor',
    'Error loading favorites' => 'Hiba a kedvencek betöltésekor',
    'Search failed' => 'A keresés sikertelen',
    'No settings found' => 'Nem található beállítás',
    'History' => 'Előzmények',

    // Edit drawer
    'Edit Entry' => 'Bejegyzés szerkesztése',
    'Title' => 'Cím',
    'Slug' => 'Slug',
    'Status' => 'Állapot',
    'Live' => 'Élő',
    'Disabled' => 'Letiltva',
    'Draft' => 'Vázlat',
    'Post Date' => 'Közzététel dátuma',
    'Expiry Date' => 'Lejárati dátum',
    'Save' => 'Mentés',

    // Admin type labels
    'Section' => 'Szekció',
    'Field' => 'Mező',
    'Entry Type' => 'Bejegyzés típus',
    'Category Group' => 'Kategóriacsoport',
    'Volume' => 'Kötet',
    'Global Set' => 'Globális készlet',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'Bejegyzések',
    'Categories' => 'Kategóriák',
    'Assets' => 'Fájlok',
    'Users' => 'Felhasználók',
    'Globals' => 'Globálisok',
    'Admin' => 'Admin',

    // Search placeholders per type
    'Search categories...' => 'Kategóriák keresése...',
    'Search assets...' => 'Fájlok keresése...',
    'Search users...' => 'Felhasználók keresése...',
    'Search globals...' => 'Globálisok keresése...',
    'Search settings...' => 'Beállítások keresése...',

    // Empty states per type
    'No categories found' => 'Nem található kategória',
    'No assets found' => 'Nem található fájl',
    'No users found' => 'Nem található felhasználó',
    'No global sets found' => 'Nem található globális készlet',
    'No admin results found' => 'Nem található beállítás',

    // Type prefix help
    'Type prefix hint' => 'Tipp: Használja az „entries:", „categories:", „users:" stb. előtagokat a keresési típus váltásához',

    'Clear Search on Tab Switch' => 'Keresés törlése fülváltáskor',
    'Clear the search input and results when switching between search type tabs.' => 'A keresőmező és az eredmények törlése a keresési típus fülek közötti váltáskor.',
    'Clear search' => 'Keresés törlése',

    // Saved Searches
    'Show Saved Searches' => 'Mentett keresések megjelenítése',
    'Show the saved searches section in the Quick Access Overlay.' => 'A mentett keresések szekció megjelenítése a gyorselérési panelen.',
    'Saved Searches' => 'Mentett keresések',
    'Save Search' => 'Keresés mentése',
    'Name this search...' => 'Keresés elnevezése...',
    'Run' => 'Futtatás',
    'Delete saved search' => 'Mentett keresés törlése',
    'Delete this saved search?' => 'Törli ezt a mentett keresést?',
    'No saved searches yet' => 'Még nincsenek mentett keresések',
    'Maximum saved searches reached' => 'Elérte a mentett keresések maximumát',
    'Saved Searches Limit' => 'Mentett keresések korlátja',
    'Maximum number of saved searches per user.' => 'Felhasználónkénti mentett keresések maximális száma.',
    'An error occurred while saving search.' => 'Hiba történt a keresés mentése közben.',
    'An error occurred while fetching saved searches.' => 'Hiba történt a mentett keresések betöltése közben.',
    'An error occurred while deleting saved search.' => 'Hiba történt a mentett keresés törlése közben.',
    'An error occurred while reordering saved searches.' => 'Hiba történt a mentett keresések átrendezése közben.',

    // Favorites shortcuts
    'Navigating to {title}...' => 'Navigálás ide: {title}...',

    // Copy actions
    'Copy options' => 'Másolási lehetőségek',
    'Copy URL' => 'URL másolása',
    'Copy Title' => 'Cím másolása',
    'Copy ID' => 'ID másolása',
    'Copied!' => 'Másolva!',
];
