<?php

return [
    // Settings page - Display Settings
    'Display Settings' => 'Настройки на дисплея',
    'Compact Mode' => 'Компактен режим',
    'Use a more compact display for search results and history lists.' => 'Използвайте по-компактен дисплей за резултати от търсене и списъци с история.',
    'Show Section Filter' => 'Покажи филтър за секции',
    'Show the section filter dropdown in the search UI.' => 'Покажи падащото меню за филтър на секции в интерфейса за търсене.',
    'Show Entry Outline' => 'Показване на структурата на записа',
    'Display the entry outline button on entry pages.' => 'Показване на бутона за структура на записа в страниците на записите.',
    'Show Related Entries' => 'Покажи свързани записи',
    'Display related entries button on entry pages.' => 'Показване на свързани записи в резултатите от търсенето.',

    // Settings page - Search Settings
    'Search Settings' => 'Настройки за търсене',
    'Enabled Search Types' => 'Активирани типове търсене',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => 'Изберете кои допълнителни типове съдържание да се показват като раздели в панела за търсене. Търсенето на записи е винаги активно.',
    'Enabled Sections' => 'Активирани секции',
    'Select which sections should be searchable. Leave empty to enable all sections.' => 'Изберете кои секции да бъдат търсими. Оставете празно, за да активирате всички секции.',
    'Minimum Search Length' => 'Минимална дължина на търсене',
    'Minimum number of characters required before search is triggered.' => 'Минимален брой символи, необходими преди стартиране на търсенето.',
    'Debounce Delay' => 'Забавяне на debounce',
    'Delay in milliseconds before search is triggered after typing stops.' => 'Забавяне в милисекунди преди стартиране на търсенето след спиране на писането.',

    // Settings page - History Settings
    'History Settings' => 'Настройки на историята',
    'History Limit' => 'Лимит на историята',
    'Maximum number of entry visits to keep per user.' => 'Максимален брой посещения на записи, които да се запазят за потребител.',

    // Error messages
    'An error occurred while searching.' => 'Възникна грешка при търсенето.',
    'An error occurred while fetching sections.' => 'Възникна грешка при извличане на секциите.',
    'An error occurred while fetching history.' => 'Възникна грешка при извличане на историята.',
    'An error occurred while recording the visit.' => 'Възникна грешка при записване на посещението.',
    'User not found.' => 'Потребителят не е намерен.',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'Търсене на записи...',
    'All Sections' => 'Всички секции',
    'Recent Entries' => 'Скорошни записи',
    'Filter history...' => 'Филтриране на история...',
    'No entries found' => 'Не са намерени записи',
    'No recent entries' => 'Няма скорошни записи',
    'Searching...' => 'Търсене...',
    'Show more...' => 'Покажи повече...',
    'Go to last visited entry' => 'Към последния посетен запис',
    'View recent entries' => 'Преглед на скорошни записи',
    'Open in new tab' => 'Отвори в нов раздел',
    '{count} Sections' => '{count} Секции',
    '1 Section' => '1 Секция',

    // Related Entries
    'Related Entries' => 'Свързани записи',
    'Links to' => 'Свързва към',
    'Linked from' => 'Свързано от',
    'No related entries found' => 'Не са намерени свързани записи',
    'An error occurred while fetching related entries.' => 'Възникна грешка при извличане на свързани записи.',
    'Invalid entry ID.' => 'Невалиден ID на запис.',

    // Entry Outline
    'Entry Outline' => 'Структура на записа',
    'No blocks found' => 'Не са намерени блокове',

    // Clear History
    'Clear history' => 'Изчисти историята',
    'Clear all history?' => 'Изчисти цялата история?',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'Това ще премахне всички ваши скорошни посещения на записи. Това действие не може да бъде отменено.',
    'An error occurred while clearing history.' => 'Възникна грешка при изчистване на историята.',

    // Favorites
    'Favorites' => 'Любими',
    'Favorites Limit' => 'Лимит на любими',
    'Maximum number of favorites per user.' => 'Максимален брой любими на потребител.',
    'Add to favorites' => 'Добави в любими',
    'Remove from favorites' => 'Премахни от любими',
    'No favorites yet' => 'Все още няма любими',
    'Maximum favorites reached' => 'Достигнат максимален брой любими',
    'An error occurred while adding favorite.' => 'Възникна грешка при добавяне в любими.',
    'An error occurred while removing favorite.' => 'Възникна грешка при премахване от любими.',
    'An error occurred while fetching favorites.' => 'Възникна грешка при извличане на любими.',

    // Status tooltips
    'Status: Live' => 'Статус: Публикувано',
    'Status: Draft' => 'Статус: Чернова',
    'Status: Pending' => 'Статус: Изчакващо',
    'Status: Disabled' => 'Статус: Деактивирано',
    'Status: Expired' => 'Статус: Изтекло',

    // Section Filter Mode
    'Section Filter Mode' => 'Режим на филтър за секции',
    'Include selected sections' => 'Включи избраните секции',
    'Exclude selected sections' => 'Изключи избраните секции',
    'Choose how to filter sections for search.' => 'Изберете как да филтрирате секциите за търсене.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => 'Изберете кои секции да изключите от търсенето. Оставете празно за търсене във всички секции.',
    'Select which sections to include in search. Leave empty to search all sections.' => 'Изберете кои секции да включите в търсенето. Оставете празно за търсене във всички секции.',
    'Sections to Include' => 'Секции за включване',
    'Sections to Exclude' => 'Секции за изключване',

    // Multi-site support
    'Current Site' => 'Текущ сайт',
    'All Sites' => 'Всички сайтове',
    'An error occurred while fetching sites.' => 'Възникна грешка при зареждане на сайтовете.',

    // Current page (favorites dropdown)
    'Current page' => 'Текуща страница',

    // Quick Access overlay
    'Quick Access' => 'Бърз достъп',
    'Search Results' => 'Резултати от търсенето',
    'Filter...' => 'Филтриране...',
    'Enter ↵' => 'Enter ↵',
    'Close' => 'Затвори',
    'Close drawer' => 'Затвори панела',
    'Drag to reorder' => 'Плъзнете за пренареждане',
    'Error loading history' => 'Грешка при зареждане на историята',
    'Error loading favorites' => 'Грешка при зареждане на любимите',
    'Search failed' => 'Търсенето е неуспешно',
    'No settings found' => 'Няма намерени настройки',
    'History' => 'История',

    // Edit drawer
    'Edit Entry' => 'Редактиране на запис',
    'Title' => 'Заглавие',
    'Slug' => 'Slug',
    'Status' => 'Състояние',
    'Live' => 'Публикуван',
    'Disabled' => 'Деактивиран',
    'Draft' => 'Чернова',
    'Post Date' => 'Дата на публикуване',
    'Expiry Date' => 'Дата на изтичане',
    'Save' => 'Запази',

    // Admin type labels
    'Section' => 'Раздел',
    'Field' => 'Поле',
    'Entry Type' => 'Тип запис',
    'Category Group' => 'Група категории',
    'Volume' => 'Том',
    'Global Set' => 'Глобален набор',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'Записи',
    'Categories' => 'Категории',
    'Assets' => 'Файлове',
    'Users' => 'Потребители',
    'Globals' => 'Глобални',
    'Admin' => 'Админ',

    // Search placeholders per type
    'Search categories...' => 'Търсене на категории...',
    'Search assets...' => 'Търсене на файлове...',
    'Search users...' => 'Търсене на потребители...',
    'Search globals...' => 'Търсене на глобални...',
    'Search settings...' => 'Търсене на настройки...',

    // Empty states per type
    'No categories found' => 'Няма намерени категории',
    'No assets found' => 'Няма намерени файлове',
    'No users found' => 'Няма намерени потребители',
    'No global sets found' => 'Няма намерени глобални набори',
    'No admin results found' => 'Няма намерени настройки',

    // Type prefix help
    'Type prefix hint' => 'Съвет: Използвайте „entries:", „categories:", „users:" и др. за превключване на типа търсене',

    'Clear Search on Tab Switch' => 'Изчистване на търсенето при смяна на раздел',
    'Clear the search input and results when switching between search type tabs.' => 'Изчистване на полето за търсене и резултатите при превключване между разделите за типове търсене.',
    'Clear search' => 'Изчистване на търсенето',

    // Saved Searches
    'Show Saved Searches' => 'Показване на запазените търсения',
    'Show the saved searches section in the Quick Access Overlay.' => 'Показване на секцията за запазени търсения в панела за бърз достъп.',
    'Saved Searches' => 'Запазени търсения',
    'Save Search' => 'Запази търсенето',
    'Name this search...' => 'Именувайте това търсене...',
    'Run' => 'Изпълни',
    'Delete saved search' => 'Изтрий запазеното търсене',
    'Delete this saved search?' => 'Изтриване на това запазено търсене?',
    'No saved searches yet' => 'Все още няма запазени търсения',
    'Maximum saved searches reached' => 'Достигнат е максималният брой запазени търсения',
    'Saved Searches Limit' => 'Лимит на запазени търсения',
    'Maximum number of saved searches per user.' => 'Максимален брой запазени търсения на потребител.',
    'An error occurred while saving search.' => 'Възникна грешка при запазване на търсенето.',
    'An error occurred while fetching saved searches.' => 'Възникна грешка при зареждане на запазените търсения.',
    'An error occurred while deleting saved search.' => 'Възникна грешка при изтриване на запазеното търсене.',
    'An error occurred while reordering saved searches.' => 'Възникна грешка при пренареждане на запазените търсения.',

    // Favorites shortcuts
    'Navigating to {title}...' => 'Навигиране към {title}...',

    // Copy actions
    'Copy options' => 'Опции за копиране',
    'Copy URL' => 'Копирай URL',
    'Copy Title' => 'Копирай заглавие',
    'Copy ID' => 'Копирай ID',
    'Copied!' => 'Копирано!',
];
