<?php

return [
    // Settings page - Display Settings
    'Display Settings' => '显示设置',
    'Compact Mode' => '紧凑模式',
    'Use a more compact display for search results and history lists.' => '为搜索结果和历史记录列表使用更紧凑的显示。',
    'Show Section Filter' => '显示栏目筛选器',
    'Show the section filter dropdown in the search UI.' => '在搜索界面中显示栏目筛选下拉菜单。',
    'Show Entry Outline' => '显示条目大纲',
    'Display the entry outline button on entry pages.' => '在条目页面上显示条目大纲按钮。',
    'Show Related Entries' => '显示相关条目',
    'Display related entries button on entry pages.' => '在搜索结果中显示相关条目。',

    // Settings page - Search Settings
    'Search Settings' => '搜索设置',
    'Enabled Search Types' => '启用的搜索类型',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => '选择在搜索面板中作为标签页显示的额外内容类型。条目搜索始终启用。',
    'Enabled Sections' => '已启用的栏目',
    'Select which sections should be searchable. Leave empty to enable all sections.' => '选择哪些栏目应该可搜索。留空以启用所有栏目。',
    'Minimum Search Length' => '最小搜索长度',
    'Minimum number of characters required before search is triggered.' => '触发搜索前所需的最小字符数。',
    'Debounce Delay' => '防抖延迟',
    'Delay in milliseconds before search is triggered after typing stops.' => '停止输入后触发搜索前的毫秒延迟。',

    // Settings page - History Settings
    'History Settings' => '历史记录设置',
    'History Limit' => '历史记录限制',
    'Maximum number of entry visits to keep per user.' => '每个用户保留的最大条目访问数。',

    // Error messages
    'An error occurred while searching.' => '搜索时发生错误。',
    'An error occurred while fetching sections.' => '获取栏目时发生错误。',
    'An error occurred while fetching history.' => '获取历史记录时发生错误。',
    'An error occurred while recording the visit.' => '记录访问时发生错误。',
    'User not found.' => '未找到用户。',

    // UI elements (passed to JavaScript)
    'Search entries...' => '搜索条目...',
    'All Sections' => '所有栏目',
    'Recent Entries' => '最近的条目',
    'Filter history...' => '筛选历史...',
    'No entries found' => '未找到条目',
    'No recent entries' => '没有最近的条目',
    'Searching...' => '搜索中...',
    'Show more...' => '显示更多...',
    'Go to last visited entry' => '转到上次访问的条目',
    'View recent entries' => '查看最近的条目',
    'Open in new tab' => '在新标签页中打开',
    '{count} Sections' => '{count} 个栏目',
    '1 Section' => '1 个栏目',

    // Related Entries
    'Related Entries' => '相关条目',
    'Links to' => '链接到',
    'Linked from' => '被链接自',
    'No related entries found' => '未找到相关条目',
    'An error occurred while fetching related entries.' => '获取相关条目时发生错误。',
    'Invalid entry ID.' => '无效的条目ID。',

    // Entry Outline
    'Entry Outline' => '条目结构',
    'No blocks found' => '未找到区块',

    // Clear History
    'Clear history' => '清除历史记录',
    'Clear all history?' => '清除所有历史记录？',
    'This will remove all your recent entry visits. This action cannot be undone.' => '这将删除您所有最近的条目访问记录。此操作无法撤销。',
    'An error occurred while clearing history.' => '清除历史记录时发生错误。',

    // Favorites
    'Favorites' => '收藏夹',
    'Favorites Limit' => '收藏夹限制',
    'Maximum number of favorites per user.' => '每个用户的最大收藏数。',
    'Add to favorites' => '添加到收藏夹',
    'Remove from favorites' => '从收藏夹移除',
    'No favorites yet' => '还没有收藏',
    'Maximum favorites reached' => '已达到收藏上限',
    'An error occurred while adding favorite.' => '添加收藏时发生错误。',
    'An error occurred while removing favorite.' => '移除收藏时发生错误。',
    'An error occurred while fetching favorites.' => '获取收藏时发生错误。',

    // Status tooltips
    'Status: Live' => '状态：已发布',
    'Status: Draft' => '状态：草稿',
    'Status: Pending' => '状态：待审核',
    'Status: Disabled' => '状态：已禁用',
    'Status: Expired' => '状态：已过期',

    // Section Filter Mode
    'Section Filter Mode' => '栏目筛选模式',
    'Include selected sections' => '包含选定栏目',
    'Exclude selected sections' => '排除选定栏目',
    'Choose how to filter sections for search.' => '选择如何筛选搜索栏目。',
    'Select which sections to exclude from search. Leave empty to search all sections.' => '选择要从搜索中排除的栏目。留空以搜索所有栏目。',
    'Select which sections to include in search. Leave empty to search all sections.' => '选择要包含在搜索中的栏目。留空以搜索所有栏目。',
    'Sections to Include' => '要包含的栏目',
    'Sections to Exclude' => '要排除的栏目',

    // Multi-site support
    'Current Site' => '当前站点',
    'All Sites' => '所有站点',
    'An error occurred while fetching sites.' => '获取站点时发生错误。',

    // Current page (favorites dropdown)
    'Current page' => '当前页面',

    // Quick Access overlay
    'Quick Access' => '快速访问',
    'Search Results' => '搜索结果',
    'Filter...' => '筛选...',
    'Enter ↵' => '回车 ↵',
    'Close' => '关闭',
    'Close drawer' => '关闭面板',
    'Drag to reorder' => '拖动排序',
    'Error loading history' => '加载历史记录出错',
    'Error loading favorites' => '加载收藏夹出错',
    'Search failed' => '搜索失败',
    'No settings found' => '未找到设置',
    'History' => '历史记录',

    // Edit drawer
    'Edit Entry' => '编辑条目',
    'Title' => '标题',
    'Slug' => 'Slug',
    'Status' => '状态',
    'Live' => '已发布',
    'Disabled' => '已禁用',
    'Draft' => '草稿',
    'Post Date' => '发布日期',
    'Expiry Date' => '到期日期',
    'Save' => '保存',

    // Admin type labels
    'Section' => '区块',
    'Field' => '字段',
    'Entry Type' => '条目类型',
    'Category Group' => '分类组',
    'Volume' => '卷',
    'Global Set' => '全局集',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => '条目',
    'Categories' => '分类',
    'Assets' => '资源',
    'Users' => '用户',
    'Globals' => '全局',
    'Admin' => '管理',

    // Search placeholders per type
    'Search categories...' => '搜索分类...',
    'Search assets...' => '搜索资源...',
    'Search users...' => '搜索用户...',
    'Search globals...' => '搜索全局...',
    'Search settings...' => '搜索设置...',

    // Empty states per type
    'No categories found' => '未找到分类',
    'No assets found' => '未找到资源',
    'No users found' => '未找到用户',
    'No global sets found' => '未找到全局集',
    'No admin results found' => '未找到设置',

    // Type prefix help
    'Type prefix hint' => '提示：使用「entries:」「categories:」「users:」等前缀切换搜索类型',

    'Clear Search on Tab Switch' => '切换标签时清除搜索',
    'Clear the search input and results when switching between search type tabs.' => '在搜索类型标签之间切换时清除搜索输入和结果。',
    'Clear search' => '清除搜索',

    // Saved Searches
    'Show Saved Searches' => '显示保存的搜索',
    'Show the saved searches section in the Quick Access Overlay.' => '在快速访问面板中显示保存的搜索部分。',
    'Saved Searches' => '已保存的搜索',
    'Save Search' => '保存搜索',
    'Name this search...' => '为此搜索命名...',
    'Run' => '运行',
    'Delete saved search' => '删除已保存的搜索',
    'Delete this saved search?' => '删除此已保存的搜索？',
    'No saved searches yet' => '暂无已保存的搜索',
    'Maximum saved searches reached' => '已达到最大保存搜索数',
    'Saved Searches Limit' => '保存搜索上限',
    'Maximum number of saved searches per user.' => '每个用户的最大保存搜索数。',
    'An error occurred while saving search.' => '保存搜索时发生错误。',
    'An error occurred while fetching saved searches.' => '获取已保存搜索时发生错误。',
    'An error occurred while deleting saved search.' => '删除已保存搜索时发生错误。',
    'An error occurred while reordering saved searches.' => '重新排序已保存搜索时发生错误。',

    // Favorites shortcuts
    'Navigating to {title}...' => '正在导航到 {title}...',

    // Copy actions
    'Copy options' => '复制选项',
    'Copy URL' => '复制链接',
    'Copy Title' => '复制标题',
    'Copy ID' => '复制ID',
    'Copied!' => '已复制！',
];
