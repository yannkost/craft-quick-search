<?php

return [
    // Settings page - Display Settings
    'Display Settings' => '표시 설정',
    'Compact Mode' => '컴팩트 모드',
    'Use a more compact display for search results and history lists.' => '검색 결과 및 기록 목록에 더 컴팩트한 표시를 사용합니다.',
    'Show Section Filter' => '섹션 필터 표시',
    'Show the section filter dropdown in the search UI.' => '검색 UI에서 섹션 필터 드롭다운을 표시합니다.',
    'Show Entry Outline' => '항목 개요 표시',
    'Display the entry outline button on entry pages.' => '항목 페이지에 항목 개요 버튼을 표시합니다.',
    'Show Related Entries' => '관련 항목 표시',
    'Display related entries button on entry pages.' => '검색 결과에 관련 항목을 표시합니다.',

    // Settings page - Search Settings
    'Search Settings' => '검색 설정',
    'Enabled Search Types' => '활성화된 검색 유형',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => '검색 오버레이에서 탭으로 표시할 추가 콘텐츠 유형을 선택하세요. 항목 검색은 항상 활성화되어 있습니다.',
    'Enabled Sections' => '활성화된 섹션',
    'Select which sections should be searchable. Leave empty to enable all sections.' => '검색 가능한 섹션을 선택하세요. 모든 섹션을 활성화하려면 비워 두세요.',
    'Minimum Search Length' => '최소 검색 길이',
    'Minimum number of characters required before search is triggered.' => '검색이 시작되기 전에 필요한 최소 문자 수.',
    'Debounce Delay' => '디바운스 지연',
    'Delay in milliseconds before search is triggered after typing stops.' => '입력 중지 후 검색이 시작되기까지의 밀리초 지연.',

    // Settings page - History Settings
    'History Settings' => '기록 설정',
    'History Limit' => '기록 제한',
    'Maximum number of entry visits to keep per user.' => '사용자당 유지할 항목 방문 최대 수.',

    // Error messages
    'An error occurred while searching.' => '검색 중 오류가 발생했습니다.',
    'An error occurred while fetching sections.' => '섹션을 가져오는 중 오류가 발생했습니다.',
    'An error occurred while fetching history.' => '기록을 가져오는 중 오류가 발생했습니다.',
    'An error occurred while recording the visit.' => '방문을 기록하는 중 오류가 발생했습니다.',
    'User not found.' => '사용자를 찾을 수 없습니다.',

    // UI elements (passed to JavaScript)
    'Search entries...' => '항목 검색...',
    'All Sections' => '모든 섹션',
    'Recent Entries' => '최근 항목',
    'Filter history...' => '기록 필터...',
    'No entries found' => '항목을 찾을 수 없습니다',
    'No recent entries' => '최근 항목 없음',
    'Searching...' => '검색 중...',
    'Show more...' => '더 보기...',
    'Go to last visited entry' => '마지막으로 방문한 항목으로 이동',
    'View recent entries' => '최근 항목 보기',
    'Open in new tab' => '새 탭에서 열기',
    '{count} Sections' => '{count}개 섹션',
    '1 Section' => '1개 섹션',

    // Related Entries
    'Related Entries' => '관련 항목',
    'Links to' => '링크 대상',
    'Linked from' => '링크된 곳',
    'No related entries found' => '관련 항목을 찾을 수 없습니다',
    'An error occurred while fetching related entries.' => '관련 항목을 가져오는 중 오류가 발생했습니다.',
    'Invalid entry ID.' => '잘못된 항목 ID입니다.',

    // Entry Outline
    'Entry Outline' => '항목 구조',
    'No blocks found' => '블록을 찾을 수 없습니다',

    // Clear History
    'Clear history' => '기록 지우기',
    'Clear all history?' => '모든 기록을 지우시겠습니까?',
    'This will remove all your recent entry visits. This action cannot be undone.' => '모든 최근 항목 방문 기록이 삭제됩니다. 이 작업은 취소할 수 없습니다.',
    'An error occurred while clearing history.' => '기록을 지우는 중 오류가 발생했습니다.',

    // Favorites
    'Favorites' => '즐겨찾기',
    'Favorites Limit' => '즐겨찾기 제한',
    'Maximum number of favorites per user.' => '사용자당 최대 즐겨찾기 수.',
    'Add to favorites' => '즐겨찾기에 추가',
    'Remove from favorites' => '즐겨찾기에서 제거',
    'No favorites yet' => '아직 즐겨찾기가 없습니다',
    'Maximum favorites reached' => '최대 즐겨찾기에 도달했습니다',
    'An error occurred while adding favorite.' => '즐겨찾기를 추가하는 중 오류가 발생했습니다.',
    'An error occurred while removing favorite.' => '즐겨찾기를 제거하는 중 오류가 발생했습니다.',
    'An error occurred while fetching favorites.' => '즐겨찾기를 가져오는 중 오류가 발생했습니다.',

    // Status tooltips
    'Status: Live' => '상태: 게시됨',
    'Status: Draft' => '상태: 초안',
    'Status: Pending' => '상태: 대기 중',
    'Status: Disabled' => '상태: 비활성화됨',
    'Status: Expired' => '상태: 만료됨',

    // Section Filter Mode
    'Section Filter Mode' => '섹션 필터 모드',
    'Include selected sections' => '선택한 섹션 포함',
    'Exclude selected sections' => '선택한 섹션 제외',
    'Choose how to filter sections for search.' => '검색을 위한 섹션 필터링 방법을 선택하세요.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => '검색에서 제외할 섹션을 선택하세요. 모든 섹션에서 검색하려면 비워 두세요.',
    'Select which sections to include in search. Leave empty to search all sections.' => '검색에 포함할 섹션을 선택하세요. 모든 섹션에서 검색하려면 비워 두세요.',
    'Sections to Include' => '포함할 섹션',
    'Sections to Exclude' => '제외할 섹션',

    // Multi-site support
    'Current Site' => '현재 사이트',
    'All Sites' => '모든 사이트',
    'An error occurred while fetching sites.' => '사이트를 가져오는 중 오류가 발생했습니다.',

    // Current page (favorites dropdown)
    'Current page' => '현재 페이지',

    // Quick Access overlay
    'Quick Access' => '빠른 접근',
    'Search Results' => '검색 결과',
    'Filter...' => '필터...',
    'Enter ↵' => 'Enter ↵',
    'Close' => '닫기',
    'Close drawer' => '패널 닫기',
    'Drag to reorder' => '드래그하여 순서 변경',
    'Error loading history' => '기록 로드 오류',
    'Error loading favorites' => '즐겨찾기 로드 오류',
    'Search failed' => '검색 실패',
    'No settings found' => '설정을 찾을 수 없음',
    'History' => '기록',

    // Edit drawer
    'Edit Entry' => '항목 편집',
    'Title' => '제목',
    'Slug' => 'Slug',
    'Status' => '상태',
    'Live' => '게시됨',
    'Disabled' => '비활성',
    'Draft' => '초안',
    'Post Date' => '게시일',
    'Expiry Date' => '만료일',
    'Save' => '저장',

    // Admin type labels
    'Section' => '섹션',
    'Field' => '필드',
    'Entry Type' => '항목 유형',
    'Category Group' => '카테고리 그룹',
    'Volume' => '볼륨',
    'Global Set' => '글로벌 세트',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => '항목',
    'Categories' => '카테고리',
    'Assets' => '자산',
    'Users' => '사용자',
    'Globals' => '글로벌',
    'Admin' => '관리',

    // Search placeholders per type
    'Search categories...' => '카테고리 검색...',
    'Search assets...' => '자산 검색...',
    'Search users...' => '사용자 검색...',
    'Search globals...' => '글로벌 검색...',
    'Search settings...' => '설정 검색...',

    // Empty states per type
    'No categories found' => '카테고리를 찾을 수 없습니다',
    'No assets found' => '자산을 찾을 수 없습니다',
    'No users found' => '사용자를 찾을 수 없습니다',
    'No global sets found' => '글로벌 세트를 찾을 수 없습니다',
    'No admin results found' => '설정을 찾을 수 없습니다',

    // Type prefix help
    'Type prefix hint' => '팁: "entries:", "categories:", "users:" 등을 사용하여 검색 유형을 전환하세요',

    'Clear Search on Tab Switch' => '탭 전환 시 검색 지우기',
    'Clear the search input and results when switching between search type tabs.' => '검색 유형 탭 간 전환 시 검색 입력과 결과를 지웁니다.',
    'Clear search' => '검색 지우기',

    // Saved Searches
    'Show Saved Searches' => '저장된 검색 표시',
    'Show the saved searches section in the Quick Access Overlay.' => '빠른 액세스 오버레이에 저장된 검색 섹션을 표시합니다.',
    'Saved Searches' => '저장된 검색',
    'Save Search' => '검색 저장',
    'Name this search...' => '이 검색 이름 지정...',
    'Run' => '실행',
    'Delete saved search' => '저장된 검색 삭제',
    'Delete this saved search?' => '이 저장된 검색을 삭제하시겠습니까?',
    'No saved searches yet' => '아직 저장된 검색이 없습니다',
    'Maximum saved searches reached' => '최대 저장 검색 수에 도달했습니다',
    'Saved Searches Limit' => '저장된 검색 제한',
    'Maximum number of saved searches per user.' => '사용자당 최대 저장 검색 수.',
    'An error occurred while saving search.' => '검색 저장 중 오류가 발생했습니다.',
    'An error occurred while fetching saved searches.' => '저장된 검색을 가져오는 중 오류가 발생했습니다.',
    'An error occurred while deleting saved search.' => '저장된 검색 삭제 중 오류가 발생했습니다.',
    'An error occurred while reordering saved searches.' => '저장된 검색 재정렬 중 오류가 발생했습니다.',

    // Favorites shortcuts
    'Navigating to {title}...' => '{title}(으)로 이동 중...',

    // Copy actions
    'Copy options' => '복사 옵션',
    'Copy URL' => 'URL 복사',
    'Copy Title' => '제목 복사',
    'Copy ID' => 'ID 복사',
    'Copied!' => '복사됨!',
];
