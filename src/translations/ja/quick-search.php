<?php

return [
    // Settings page - Display Settings
    'Display Settings' => '表示設定',
    'Compact Mode' => 'コンパクトモード',
    'Use a more compact display for search results and history lists.' => '検索結果と履歴リストをよりコンパクトに表示します。',
    'Show Section Filter' => 'セクションフィルターを表示',
    'Show the section filter dropdown in the search UI.' => '検索UIにセクションフィルターのドロップダウンを表示します。',
    'Show Entry Outline' => 'エントリーアウトライン表示',
    'Display the entry outline button on entry pages.' => 'エントリーページにアウトラインボタンを表示します。',
    'Show Related Entries' => '関連エントリーを表示',
    'Display related entries button on entry pages.' => '検索結果に関連エントリーを表示します。',

    // Settings page - Search Settings
    'Search Settings' => '検索設定',
    'Enabled Sections' => '有効なセクション',
    'Select which sections should be searchable. Leave empty to enable all sections.' => '検索可能にするセクションを選択してください。すべてのセクションを有効にするには空のままにしてください。',
    'Minimum Search Length' => '最小検索文字数',
    'Minimum number of characters required before search is triggered.' => '検索が開始される前に必要な最小文字数。',
    'Debounce Delay' => 'デバウンス遅延',
    'Delay in milliseconds before search is triggered after typing stops.' => '入力停止後、検索が開始されるまでのミリ秒単位の遅延。',

    // Settings page - History Settings
    'History Settings' => '履歴設定',
    'History Limit' => '履歴の上限',
    'Maximum number of entry visits to keep per user.' => 'ユーザーごとに保持するエントリー訪問の最大数。',

    // Error messages
    'An error occurred while searching.' => '検索中にエラーが発生しました。',
    'An error occurred while fetching sections.' => 'セクションの取得中にエラーが発生しました。',
    'An error occurred while fetching history.' => '履歴の取得中にエラーが発生しました。',
    'An error occurred while recording the visit.' => '訪問の記録中にエラーが発生しました。',
    'User not found.' => 'ユーザーが見つかりません。',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'エントリーを検索...',
    'All Sections' => 'すべてのセクション',
    'Recent Entries' => '最近のエントリー',
    'Filter history...' => '履歴をフィルター...',
    'No entries found' => 'エントリーが見つかりません',
    'No recent entries' => '最近のエントリーはありません',
    'Searching...' => '検索中...',
    'Show more...' => 'もっと見る...',
    'Go to last visited entry' => '最後に訪問したエントリーへ移動',
    'View recent entries' => '最近のエントリーを表示',
    'Open in new tab' => '新しいタブで開く',
    '{count} Sections' => '{count} セクション',
    '1 Section' => '1 セクション',

    // Related Entries
    'Related Entries' => '関連エントリー',
    'Links to' => 'リンク先',
    'Linked from' => 'リンク元',
    'No related entries found' => '関連エントリーが見つかりません',
    'An error occurred while fetching related entries.' => '関連エントリーの取得中にエラーが発生しました。',
    'Invalid entry ID.' => '無効なエントリーIDです。',

    // Entry Outline
    'Entry Outline' => 'エントリー構造',
    'No blocks found' => 'ブロックが見つかりません',

    // Clear History
    'Clear history' => '履歴をクリア',
    'Clear all history?' => 'すべての履歴をクリアしますか？',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'これにより、すべての最近のエントリー訪問が削除されます。この操作は取り消せません。',
    'An error occurred while clearing history.' => '履歴のクリア中にエラーが発生しました。',

    // Favorites
    'Favorites' => 'お気に入り',
    'Favorites Limit' => 'お気に入りの上限',
    'Maximum number of favorites per user.' => 'ユーザーごとのお気に入りの最大数。',
    'Add to favorites' => 'お気に入りに追加',
    'Remove from favorites' => 'お気に入りから削除',
    'No favorites yet' => 'まだお気に入りはありません',
    'Maximum favorites reached' => 'お気に入りの上限に達しました',
    'An error occurred while adding favorite.' => 'お気に入りの追加中にエラーが発生しました。',
    'An error occurred while removing favorite.' => 'お気に入りの削除中にエラーが発生しました。',
    'An error occurred while fetching favorites.' => 'お気に入りの取得中にエラーが発生しました。',

    // Status tooltips
    'Status: Live' => 'ステータス: 公開中',
    'Status: Draft' => 'ステータス: 下書き',
    'Status: Pending' => 'ステータス: 保留中',
    'Status: Disabled' => 'ステータス: 無効',
    'Status: Expired' => 'ステータス: 期限切れ',

    // Section Filter Mode
    'Section Filter Mode' => 'セクションフィルターモード',
    'Include selected sections' => '選択したセクションを含める',
    'Exclude selected sections' => '選択したセクションを除外',
    'Choose how to filter sections for search.' => '検索用にセクションをフィルターする方法を選択してください。',
    'Select which sections to exclude from search. Leave empty to search all sections.' => '検索から除外するセクションを選択してください。すべてのセクションで検索するには空のままにしてください。',
    'Select which sections to include in search. Leave empty to search all sections.' => '検索に含めるセクションを選択してください。すべてのセクションで検索するには空のままにしてください。',
    'Sections to Include' => '含めるセクション',
    'Sections to Exclude' => '除外するセクション',

    // Multi-site support
    'Current Site' => '現在のサイト',
    'All Sites' => 'すべてのサイト',
    'An error occurred while fetching sites.' => 'サイトの取得中にエラーが発生しました。',

    // Current page (favorites dropdown)
    'Current page' => '現在のページ',

    // Quick Access overlay
    'Quick Access' => 'クイックアクセス',
    'Search Results' => '検索結果',
    'Filter...' => 'フィルター...',
    'Enter ↵' => 'Enter ↵',
    'Close' => '閉じる',
    'Close drawer' => 'パネルを閉じる',
    'Drag to reorder' => 'ドラッグして並べ替え',
    'Error loading history' => '履歴の読み込みエラー',
    'Error loading favorites' => 'お気に入りの読み込みエラー',
    'Search failed' => '検索に失敗しました',
    'No settings found' => '設定が見つかりません',
    'History' => '履歴',

    // Edit drawer
    'Edit Entry' => 'エントリーを編集',
    'Title' => 'タイトル',
    'Slug' => 'Slug',
    'Status' => 'ステータス',
    'Live' => '公開',
    'Disabled' => '無効',
    'Draft' => '下書き',
    'Post Date' => '投稿日',
    'Expiry Date' => '有効期限',
    'Save' => '保存',

    // Admin type labels
    'Section' => 'セクション',
    'Field' => 'フィールド',
    'Entry Type' => 'エントリータイプ',
    'Category Group' => 'カテゴリーグループ',
    'Volume' => 'ボリューム',
    'Global Set' => 'グローバルセット',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'エントリー',
    'Categories' => 'カテゴリー',
    'Assets' => 'アセット',
    'Users' => 'ユーザー',
    'Globals' => 'グローバル',
    'Admin' => '管理',

    // Search placeholders per type
    'Search categories...' => 'カテゴリーを検索...',
    'Search assets...' => 'アセットを検索...',
    'Search users...' => 'ユーザーを検索...',
    'Search globals...' => 'グローバルを検索...',
    'Search settings...' => '設定を検索...',

    // Empty states per type
    'No categories found' => 'カテゴリーが見つかりません',
    'No assets found' => 'アセットが見つかりません',
    'No users found' => 'ユーザーが見つかりません',
    'No global sets found' => 'グローバルセットが見つかりません',
    'No admin results found' => '設定が見つかりません',

    // Type prefix help
    'Type prefix hint' => 'ヒント：「entries:」「categories:」「users:」等を使用して検索タイプを切り替えられます',

    // Saved Searches
    'Saved Searches' => '保存済み検索',
    'Save Search' => '検索を保存',
    'Name this search...' => 'この検索に名前を付ける...',
    'Run' => '実行',
    'Delete saved search' => '保存済み検索を削除',
    'Delete this saved search?' => 'この保存済み検索を削除しますか？',
    'No saved searches yet' => '保存済み検索はまだありません',
    'Maximum saved searches reached' => '保存済み検索の上限に達しました',
    'Saved Searches Limit' => '保存済み検索の上限',
    'Maximum number of saved searches per user.' => 'ユーザーごとの保存済み検索の最大数。',
    'An error occurred while saving search.' => '検索の保存中にエラーが発生しました。',
    'An error occurred while fetching saved searches.' => '保存済み検索の取得中にエラーが発生しました。',
    'An error occurred while deleting saved search.' => '保存済み検索の削除中にエラーが発生しました。',
    'An error occurred while reordering saved searches.' => '保存済み検索の並べ替え中にエラーが発生しました。',

    // Favorites shortcuts
    'Navigating to {title}...' => '{title}に移動中...',

    // Copy actions
    'Copy options' => 'コピーオプション',
    'Copy URL' => 'URLをコピー',
    'Copy Title' => 'タイトルをコピー',
    'Copy ID' => 'IDをコピー',
    'Copied!' => 'コピーしました！',
];
