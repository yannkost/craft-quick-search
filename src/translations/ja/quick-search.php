<?php

return [
    // Settings page - Display Settings
    'Display Settings' => '表示設定',
    'Compact Mode' => 'コンパクトモード',
    'Use a more compact display for search results and history lists.' => '検索結果と履歴リストをよりコンパクトに表示します。',
    'Show Section Filter' => 'セクションフィルターを表示',
    'Show the section filter dropdown in the search UI.' => '検索UIにセクションフィルターのドロップダウンを表示します。',
    'Show Related Entries' => '関連エントリーを表示',
    'Display related entries in search results.' => '検索結果に関連エントリーを表示します。',

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
];
