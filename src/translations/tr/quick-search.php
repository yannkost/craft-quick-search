<?php

return [
    // Settings page - Display Settings
    'Display Settings' => 'Görüntü Ayarları',
    'Compact Mode' => 'Kompakt Mod',
    'Use a more compact display for search results and history lists.' => 'Arama sonuçları ve geçmiş listeleri için daha kompakt bir görünüm kullanın.',
    'Show Section Filter' => 'Bölüm Filtresini Göster',
    'Show the section filter dropdown in the search UI.' => 'Arama arayüzünde bölüm filtresi açılır menüsünü gösterin.',
    'Show Entry Outline' => 'Giriş taslağını göster',
    'Display the entry outline button on entry pages.' => 'Giriş sayfalarında giriş taslağı düğmesini göster.',
    'Show Related Entries' => 'İlgili Girişleri Göster',
    'Display related entries button on entry pages.' => 'Arama sonuçlarında ilgili girişleri gösterin.',

    // Settings page - Search Settings
    'Search Settings' => 'Arama Ayarları',
    'Enabled Sections' => 'Etkin Bölümler',
    'Select which sections should be searchable. Leave empty to enable all sections.' => 'Hangi bölümlerin aranabilir olması gerektiğini seçin. Tüm bölümleri etkinleştirmek için boş bırakın.',
    'Minimum Search Length' => 'Minimum Arama Uzunluğu',
    'Minimum number of characters required before search is triggered.' => 'Arama tetiklenmeden önce gereken minimum karakter sayısı.',
    'Debounce Delay' => 'Debounce Gecikmesi',
    'Delay in milliseconds before search is triggered after typing stops.' => 'Yazmayı durdurduktan sonra arama tetiklenmeden önceki milisaniye cinsinden gecikme.',

    // Settings page - History Settings
    'History Settings' => 'Geçmiş Ayarları',
    'History Limit' => 'Geçmiş Sınırı',
    'Maximum number of entry visits to keep per user.' => 'Kullanıcı başına tutulacak maksimum giriş ziyareti sayısı.',

    // Error messages
    'An error occurred while searching.' => 'Arama sırasında bir hata oluştu.',
    'An error occurred while fetching sections.' => 'Bölümler alınırken bir hata oluştu.',
    'An error occurred while fetching history.' => 'Geçmiş alınırken bir hata oluştu.',
    'An error occurred while recording the visit.' => 'Ziyaret kaydedilirken bir hata oluştu.',
    'User not found.' => 'Kullanıcı bulunamadı.',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'Girişleri ara...',
    'All Sections' => 'Tüm Bölümler',
    'Recent Entries' => 'Son Girişler',
    'Filter history...' => 'Geçmişi filtrele...',
    'No entries found' => 'Giriş bulunamadı',
    'No recent entries' => 'Son giriş yok',
    'Searching...' => 'Aranıyor...',
    'Show more...' => 'Daha fazla göster...',
    'Go to last visited entry' => 'Son ziyaret edilen girişe git',
    'View recent entries' => 'Son girişleri görüntüle',
    'Open in new tab' => 'Yeni sekmede aç',
    '{count} Sections' => '{count} Bölüm',
    '1 Section' => '1 Bölüm',

    // Related Entries
    'Related Entries' => 'İlgili Girişler',
    'Links to' => 'Bağlantı hedefi',
    'Linked from' => 'Bağlantı kaynağı',
    'No related entries found' => 'İlgili giriş bulunamadı',
    'An error occurred while fetching related entries.' => 'İlgili girişler alınırken bir hata oluştu.',
    'Invalid entry ID.' => 'Geçersiz giriş kimliği.',

    // Entry Outline
    'Entry Outline' => 'Giriş Yapısı',
    'No blocks found' => 'Blok bulunamadı',

    // Clear History
    'Clear history' => 'Geçmişi temizle',
    'Clear all history?' => 'Tüm geçmiş temizlensin mi?',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'Bu, tüm son giriş ziyaretlerinizi kaldıracaktır. Bu işlem geri alınamaz.',
    'An error occurred while clearing history.' => 'Geçmiş temizlenirken bir hata oluştu.',

    // Favorites
    'Favorites' => 'Favoriler',
    'Favorites Limit' => 'Favori Sınırı',
    'Maximum number of favorites per user.' => 'Kullanıcı başına maksimum favori sayısı.',
    'Add to favorites' => 'Favorilere ekle',
    'Remove from favorites' => 'Favorilerden kaldır',
    'No favorites yet' => 'Henüz favori yok',
    'Maximum favorites reached' => 'Maksimum favori sayısına ulaşıldı',
    'An error occurred while adding favorite.' => 'Favori eklenirken bir hata oluştu.',
    'An error occurred while removing favorite.' => 'Favori kaldırılırken bir hata oluştu.',
    'An error occurred while fetching favorites.' => 'Favoriler alınırken bir hata oluştu.',

    // Status tooltips
    'Status: Live' => 'Durum: Yayında',
    'Status: Draft' => 'Durum: Taslak',
    'Status: Pending' => 'Durum: Beklemede',
    'Status: Disabled' => 'Durum: Devre Dışı',
    'Status: Expired' => 'Durum: Süresi Dolmuş',

    // Section Filter Mode
    'Section Filter Mode' => 'Bölüm Filtre Modu',
    'Include selected sections' => 'Seçili bölümleri dahil et',
    'Exclude selected sections' => 'Seçili bölümleri hariç tut',
    'Choose how to filter sections for search.' => 'Arama için bölümlerin nasıl filtreleneceğini seçin.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => 'Aramadan hariç tutulacak bölümleri seçin. Tüm bölümlerde aramak için boş bırakın.',
    'Select which sections to include in search. Leave empty to search all sections.' => 'Aramaya dahil edilecek bölümleri seçin. Tüm bölümlerde aramak için boş bırakın.',
    'Sections to Include' => 'Dahil Edilecek Bölümler',
    'Sections to Exclude' => 'Hariç Tutulacak Bölümler',

    // Multi-site support
    'Current Site' => 'Mevcut Site',
    'All Sites' => 'Tüm Siteler',
    'An error occurred while fetching sites.' => 'Siteler alınırken bir hata oluştu.',

    // Current page (favorites dropdown)
    'Current page' => 'Mevcut sayfa',

    // Quick Access overlay
    'Quick Access' => 'Hızlı Erişim',
    'Search Results' => 'Arama Sonuçları',
    'Filter...' => 'Filtrele...',
    'Enter ↵' => 'Enter ↵',
    'Close' => 'Kapat',
    'Close drawer' => 'Paneli kapat',
    'Drag to reorder' => 'Sıralamak için sürükleyin',
    'Error loading history' => 'Geçmiş yüklenirken hata oluştu',
    'Error loading favorites' => 'Favoriler yüklenirken hata oluştu',
    'Search failed' => 'Arama başarısız',
    'No settings found' => 'Ayar bulunamadı',
    'History' => 'Geçmiş',

    // Edit drawer
    'Edit Entry' => 'Girişi düzenle',
    'Title' => 'Başlık',
    'Slug' => 'Slug',
    'Status' => 'Durum',
    'Live' => 'Yayında',
    'Disabled' => 'Devre dışı',
    'Draft' => 'Taslak',
    'Post Date' => 'Yayın tarihi',
    'Expiry Date' => 'Bitiş tarihi',
    'Save' => 'Kaydet',

    // Admin type labels
    'Section' => 'Bölüm',
    'Field' => 'Alan',
    'Entry Type' => 'Giriş türü',
    'Category Group' => 'Kategori grubu',
    'Volume' => 'Birim',
    'Global Set' => 'Global küme',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'Girdiler',
    'Categories' => 'Kategoriler',
    'Assets' => 'Dosyalar',
    'Users' => 'Kullanıcılar',
    'Globals' => 'Globaller',
    'Admin' => 'Yönetim',

    // Search placeholders per type
    'Search categories...' => 'Kategorileri ara...',
    'Search assets...' => 'Dosyaları ara...',
    'Search users...' => 'Kullanıcıları ara...',
    'Search globals...' => 'Globalleri ara...',
    'Search settings...' => 'Ayarları ara...',

    // Empty states per type
    'No categories found' => 'Kategori bulunamadı',
    'No assets found' => 'Dosya bulunamadı',
    'No users found' => 'Kullanıcı bulunamadı',
    'No global sets found' => 'Global set bulunamadı',
    'No admin results found' => 'Ayar bulunamadı',

    // Type prefix help
    'Type prefix hint' => 'İpucu: Arama türünü değiştirmek için "entries:", "categories:", "users:" vb. kullanın',

    // Saved Searches
    'Saved Searches' => 'Kayıtlı aramalar',
    'Save Search' => 'Aramayı kaydet',
    'Name this search...' => 'Bu aramayı adlandırın...',
    'Run' => 'Çalıştır',
    'Delete saved search' => 'Kayıtlı aramayı sil',
    'Delete this saved search?' => 'Bu kayıtlı aramayı silmek istiyor musunuz?',
    'No saved searches yet' => 'Henüz kayıtlı arama yok',
    'Maximum saved searches reached' => 'Maksimum kayıtlı arama sayısına ulaşıldı',
    'Saved Searches Limit' => 'Kayıtlı arama limiti',
    'Maximum number of saved searches per user.' => 'Kullanıcı başına maksimum kayıtlı arama sayısı.',
    'An error occurred while saving search.' => 'Arama kaydedilirken bir hata oluştu.',
    'An error occurred while fetching saved searches.' => 'Kayıtlı aramalar yüklenirken bir hata oluştu.',
    'An error occurred while deleting saved search.' => 'Kayıtlı arama silinirken bir hata oluştu.',
    'An error occurred while reordering saved searches.' => 'Kayıtlı aramalar yeniden sıralanırken bir hata oluştu.',

    // Favorites shortcuts
    'Navigating to {title}...' => '{title} sayfasına gidiliyor...',

    // Copy actions
    'Copy options' => 'Kopyalama seçenekleri',
    'Copy URL' => 'URL kopyala',
    'Copy Title' => 'Başlığı kopyala',
    'Copy ID' => 'ID kopyala',
    'Copied!' => 'Kopyalandı!',
];
