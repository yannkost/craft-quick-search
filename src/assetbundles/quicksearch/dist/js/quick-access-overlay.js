/**
 * Quick Search - Quick Access Overlay
 * Full-screen overlay for quick access to history, favorites, and search
 */

window.QuickAccessOverlay = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    class QuickAccessOverlay {
        constructor() {
            this.overlay = null;
            this.modal = null;
            this.searchInput = null;
            this.historyPanel = null;
            this.favoritesPanel = null;
            this.historyFilterInput = null;
            this.favoritesFilterInput = null;
            this.historyList = null;
            this.favoritesList = null;
            this.searchResultsSection = null;
            this.searchResultsList = null;

            this.settings = window.QuickSearchSettings || {};
            this.t = this.settings.translations || {};

            this.isOpen = false;
            this.activePanel = this.settings.quickAccessDefaultPanel || 'history';
            this.historyItems = [];
            this.favoritesItems = [];
            this.searchResults = [];

            this.historySelectedIndex = -1;
            this.favoritesSelectedIndex = -1;
            this.searchSelectedIndex = -1;

            this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            this.fetchTimeout = 10000;
        }

        init() {
            if (!this.settings.quickAccessEnabled) {
                return;
            }

            try {
                this.createOverlay();
                this.bindGlobalShortcut();
            } catch (error) {
                console.error('Quick Access Overlay: Error during initialization', error);
            }
        }

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.className = 'quick-access-overlay';
            this.overlay.setAttribute('role', 'dialog');
            this.overlay.setAttribute('aria-modal', 'true');
            this.overlay.setAttribute('aria-label', this.t.quickAccess || 'Quick Access');

            this.modal = document.createElement('div');
            this.modal.className = 'quick-access-modal';
            if (this.settings.compactMode) {
                this.modal.classList.add('compact');
            }

            // Header
            const header = document.createElement('div');
            header.className = 'quick-access-header';

            const title = document.createElement('h2');
            title.className = 'quick-access-title';
            title.textContent = this.t.quickAccess || 'Quick Access';

            const shortcutHint = document.createElement('span');
            shortcutHint.className = 'quick-access-shortcut-hint';
            shortcutHint.textContent = this.getShortcutDisplay();

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'quick-access-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            closeBtn.addEventListener('click', () => this.hide());

            header.appendChild(title);
            header.appendChild(shortcutHint);
            header.appendChild(closeBtn);

            // Entry Search Section (top, centered)
            const searchSection = document.createElement('div');
            searchSection.className = 'quick-access-search-section';
            if (!this.settings.quickAccessShowSearch) {
                searchSection.style.display = 'none';
            }

            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.className = 'quick-access-search-input';
            this.searchInput.placeholder = this.t.searchAllEntries || 'Search all entries...';
            this.searchInput.setAttribute('aria-label', this.t.searchAllEntries || 'Search all entries');

            const searchHint = document.createElement('span');
            searchHint.className = 'quick-access-search-hint';
            searchHint.textContent = 'Enter ↵';

            searchSection.appendChild(this.searchInput);
            searchSection.appendChild(searchHint);

            // Panels Container
            const panelsContainer = document.createElement('div');
            panelsContainer.className = 'quick-access-panels';

            // History Panel
            this.historyPanel = this.createPanel('history', this.t.history || 'History', this.t.filterHistoryFavorites || 'Filter...');

            // Favorites Panel
            this.favoritesPanel = this.createPanel('favorites', this.t.favorites || 'Favorites', this.t.filterHistoryFavorites || 'Filter...');

            panelsContainer.appendChild(this.historyPanel);
            panelsContainer.appendChild(this.favoritesPanel);

            // Search Results Section (appears when searching)
            this.searchResultsSection = document.createElement('div');
            this.searchResultsSection.className = 'quick-access-search-results';
            this.searchResultsSection.style.display = 'none';

            const searchResultsHeader = document.createElement('div');
            searchResultsHeader.className = 'quick-access-search-results-header';
            searchResultsHeader.innerHTML = '<span>' + (this.t.searchResults || 'Search Results') + '</span>';

            this.searchResultsList = document.createElement('ul');
            this.searchResultsList.className = 'quick-access-list';
            this.searchResultsList.setAttribute('role', 'listbox');

            this.searchResultsSection.appendChild(searchResultsHeader);
            this.searchResultsSection.appendChild(this.searchResultsList);

            // Assemble modal
            this.modal.appendChild(header);
            this.modal.appendChild(searchSection);
            this.modal.appendChild(this.searchResultsSection);
            this.modal.appendChild(panelsContainer);

            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);

            this.bindOverlayEvents();
        }

        createPanel(type, title, filterPlaceholder) {
            const panel = document.createElement('div');
            panel.className = `quick-access-panel quick-access-panel-${type}`;
            panel.dataset.panel = type;

            const panelHeader = document.createElement('div');
            panelHeader.className = 'quick-access-panel-header';

            const panelTitle = document.createElement('h3');
            panelTitle.className = 'quick-access-panel-title';
            panelTitle.innerHTML = type === 'history'
                ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
            panelTitle.innerHTML += `<span>${title}</span>`;

            const filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.className = 'quick-access-panel-filter';
            filterInput.placeholder = filterPlaceholder;
            filterInput.setAttribute('aria-label', `Filter ${title}`);

            if (type === 'history') {
                this.historyFilterInput = filterInput;
            } else {
                this.favoritesFilterInput = filterInput;
            }

            panelHeader.appendChild(panelTitle);
            panelHeader.appendChild(filterInput);

            const list = document.createElement('ul');
            list.className = 'quick-access-list';
            list.setAttribute('role', 'listbox');
            list.setAttribute('aria-label', title);

            if (type === 'history') {
                this.historyList = list;
            } else {
                this.favoritesList = list;
            }

            panel.appendChild(panelHeader);
            panel.appendChild(list);

            return panel;
        }

        bindOverlayEvents() {
            // Close on backdrop click
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });

            // Search input - Enter to search
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.searchInput.value.trim().length >= 2) {
                    e.preventDefault();
                    this.performSearch(this.searchInput.value.trim());
                }
            });

            // History filter
            this.historyFilterInput.addEventListener('input', () => {
                this.filterPanel('history', this.historyFilterInput.value);
            });

            this.historyFilterInput.addEventListener('focus', () => {
                this.setActivePanel('history');
            });

            // Favorites filter
            this.favoritesFilterInput.addEventListener('input', () => {
                this.filterPanel('favorites', this.favoritesFilterInput.value);
            });

            this.favoritesFilterInput.addEventListener('focus', () => {
                this.setActivePanel('favorites');
            });

            // Keyboard navigation within overlay
            this.overlay.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        bindGlobalShortcut() {
            document.addEventListener('keydown', (e) => {
                if (this.shouldIgnoreShortcut(e)) {
                    return;
                }

                if (this.matchesShortcut(e)) {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }

        shouldIgnoreShortcut(e) {
            const target = e.target;
            const tagName = target.tagName.toLowerCase();

            // Ignore if typing in input, textarea, or contenteditable
            if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
                return true;
            }

            // Ignore if a modal is already open (check for Craft's modal classes)
            if (document.querySelector('.modal.shade, .hud-shade')) {
                return true;
            }

            return false;
        }

        matchesShortcut(e) {
            const shortcut = this.settings.quickAccessShortcut || 'ctrl+g';
            const parts = shortcut.toLowerCase().split('+');
            const key = parts.pop();

            // Check modifiers
            const needsCtrl = parts.includes('ctrl');
            const needsMeta = parts.includes('meta');
            const needsAlt = parts.includes('alt');
            const needsShift = parts.includes('shift');

            // On Mac, treat ctrl as meta (Cmd)
            const ctrlOrMeta = this.isMac ? (needsCtrl || needsMeta) : needsCtrl;
            const hasCtrlOrMeta = this.isMac ? e.metaKey : e.ctrlKey;

            if (ctrlOrMeta && !hasCtrlOrMeta) return false;
            if (needsMeta && !this.isMac && !e.metaKey) return false;
            if (needsAlt && !e.altKey) return false;
            if (needsShift && !e.shiftKey) return false;

            // Check key
            return e.key.toLowerCase() === key;
        }

        getShortcutDisplay() {
            const shortcut = this.settings.quickAccessShortcut || 'ctrl+g';
            const parts = shortcut.split('+');

            return parts.map(part => {
                const p = part.toLowerCase();
                if (p === 'ctrl') return this.isMac ? '⌘' : 'Ctrl';
                if (p === 'meta') return this.isMac ? '⌘' : 'Win';
                if (p === 'alt') return this.isMac ? '⌥' : 'Alt';
                if (p === 'shift') return '⇧';
                return part.toUpperCase();
            }).join(this.isMac ? '' : '+');
        }

        handleKeydown(e) {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.hide();
                    break;

                case 'Tab':
                    e.preventDefault();
                    this.switchPanel();
                    break;

                case 'ArrowLeft':
                    if (document.activeElement !== this.searchInput &&
                        document.activeElement !== this.historyFilterInput &&
                        document.activeElement !== this.favoritesFilterInput) {
                        e.preventDefault();
                        this.setActivePanel('history');
                    }
                    break;

                case 'ArrowRight':
                    if (document.activeElement !== this.searchInput &&
                        document.activeElement !== this.historyFilterInput &&
                        document.activeElement !== this.favoritesFilterInput) {
                        e.preventDefault();
                        this.setActivePanel('favorites');
                    }
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;

                case 'Enter':
                    if (document.activeElement === this.searchInput) {
                        // Let the search input handler deal with it
                        return;
                    }
                    e.preventDefault();
                    this.navigateToSelected(e.ctrlKey || e.metaKey);
                    break;
            }
        }

        toggle() {
            if (this.isOpen) {
                this.hide();
            } else {
                this.show();
            }
        }

        async show() {
            if (this.isOpen) return;

            this.isOpen = true;
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Reset state
            this.searchInput.value = '';
            this.historyFilterInput.value = '';
            this.favoritesFilterInput.value = '';
            this.searchResultsSection.style.display = 'none';
            this.historySelectedIndex = -1;
            this.favoritesSelectedIndex = -1;
            this.searchSelectedIndex = -1;

            // Set active panel
            this.setActivePanel(this.settings.quickAccessDefaultPanel || 'history');

            // Focus search input if search is enabled, otherwise focus filter
            if (this.settings.quickAccessShowSearch) {
                this.searchInput.focus();
            } else if (this.activePanel === 'history') {
                this.historyFilterInput.focus();
            } else {
                this.favoritesFilterInput.focus();
            }

            // Load data
            await Promise.all([
                this.loadHistory(),
                this.loadFavorites()
            ]);
        }

        hide() {
            if (!this.isOpen) return;

            this.isOpen = false;
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        setActivePanel(panel) {
            this.activePanel = panel;

            this.historyPanel.classList.toggle('active', panel === 'history');
            this.favoritesPanel.classList.toggle('active', panel === 'favorites');
        }

        switchPanel() {
            const newPanel = this.activePanel === 'history' ? 'favorites' : 'history';
            this.setActivePanel(newPanel);

            // Focus the filter input of the new panel
            if (newPanel === 'history') {
                this.historyFilterInput.focus();
            } else {
                this.favoritesFilterInput.focus();
            }
        }

        async loadHistory() {
            try {
                this.historyList.innerHTML = '<li class="quick-access-loading">' + (this.t.searching || 'Loading...') + '</li>';

                const historyUrl = Craft.getActionUrl('quick-search/history/index');
                const separator = historyUrl.includes('?') ? '&' : '?';
                const response = await utils.fetchWithTimeout(
                    historyUrl + separator + 'limit=50',
                    {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.historyItems = data.history || [];
                    this.renderPanel('history', this.historyItems);
                } else {
                    this.historyList.innerHTML = '<li class="quick-access-error">' + (this.t.historyError || 'Error loading history') + '</li>';
                }
            } catch (error) {
                console.error('Quick Access: Error loading history', error);
                this.historyList.innerHTML = '<li class="quick-access-error">' + (this.t.historyError || 'Error loading history') + '</li>';
            }
        }

        async loadFavorites() {
            try {
                this.favoritesList.innerHTML = '<li class="quick-access-loading">' + (this.t.searching || 'Loading...') + '</li>';

                const favoritesUrl = Craft.getActionUrl('quick-search/favorites/list');
                const response = await utils.fetchWithTimeout(
                    favoritesUrl,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.favoritesItems = data.favorites || [];
                    this.renderPanel('favorites', this.favoritesItems);
                } else {
                    this.favoritesList.innerHTML = '<li class="quick-access-error">' + (this.t.favoritesError || 'Error loading favorites') + '</li>';
                }
            } catch (error) {
                console.error('Quick Access: Error loading favorites', error);
                this.favoritesList.innerHTML = '<li class="quick-access-error">' + (this.t.favoritesError || 'Error loading favorites') + '</li>';
            }
        }

        renderPanel(type, items) {
            const list = type === 'history' ? this.historyList : this.favoritesList;
            list.innerHTML = '';

            if (!items || items.length === 0) {
                const emptyMsg = type === 'history'
                    ? (this.t.noRecentEntries || 'No recent entries')
                    : (this.t.noFavorites || 'No favorites yet');
                list.innerHTML = `<li class="quick-access-empty">${emptyMsg}</li>`;
                return;
            }

            items.forEach((entry, index) => {
                const item = this.createEntryItem(entry, index, type);
                if (item) {
                    list.appendChild(item);
                }
            });
        }

        createEntryItem(entry, index, type) {
            if (!entry) return null;

            const item = document.createElement('li');
            item.className = 'quick-access-item';
            item.dataset.index = index;
            item.dataset.type = type;
            item.dataset.entryId = entry.id;
            item.dataset.url = entry.url || '';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');

            const content = document.createElement('div');
            content.className = 'quick-access-item-content';

            const title = document.createElement('div');
            title.className = 'quick-access-item-title';
            title.textContent = entry.title || '';

            const meta = document.createElement('div');
            meta.className = 'quick-access-item-meta';

            const section = document.createElement('span');
            section.className = 'quick-access-item-section';
            section.textContent = entry.section?.name || '';

            const status = document.createElement('span');
            status.className = `quick-access-item-status ${entry.status || ''}`;
            status.textContent = entry.status || '';

            meta.appendChild(section);
            if (this.settings.isMultiSite && entry.site) {
                const site = document.createElement('span');
                site.className = 'quick-access-item-site';
                site.textContent = entry.site.name || '';
                meta.appendChild(site);
            }
            meta.appendChild(status);

            content.appendChild(title);
            content.appendChild(meta);

            const newTabBtn = document.createElement('button');
            newTabBtn.type = 'button';
            newTabBtn.className = 'quick-access-newtab-btn';
            newTabBtn.title = this.t.openInNewTab || 'Open in new tab';
            newTabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';
            newTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (entry.url) {
                    window.open(entry.url, '_blank');
                }
            });

            item.appendChild(content);
            item.appendChild(newTabBtn);

            item.addEventListener('click', () => {
                if (entry.url) {
                    window.location.href = entry.url;
                }
            });

            return item;
        }

        filterPanel(type, query) {
            const items = type === 'history' ? this.historyItems : this.favoritesItems;
            const q = query.toLowerCase().trim();

            if (!q) {
                this.renderPanel(type, items);
                return;
            }

            const filtered = items.filter(entry => {
                if (!entry) return false;
                const title = (entry.title || '').toLowerCase();
                const section = (entry.section?.name || '').toLowerCase();
                return title.includes(q) || section.includes(q);
            });

            this.renderPanel(type, filtered);
        }

        async performSearch(query) {
            if (!query || query.length < 2) return;

            this.searchResultsSection.style.display = 'block';
            this.searchResultsList.innerHTML = '<li class="quick-access-loading">' + (this.t.searching || 'Searching...') + '</li>';

            try {
                const params = new URLSearchParams({ query });
                const actionUrl = Craft.getActionUrl('quick-search/search/index');
                const separator = actionUrl.includes('?') ? '&' : '?';

                const response = await utils.fetchWithTimeout(
                    actionUrl + separator + params,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.searchResults = data.results || [];
                    this.renderSearchResults(this.searchResults);
                } else {
                    this.searchResultsList.innerHTML = '<li class="quick-access-error">' + (data.error || this.t.searchError || 'Search failed') + '</li>';
                }
            } catch (error) {
                console.error('Quick Access: Search error', error);
                this.searchResultsList.innerHTML = '<li class="quick-access-error">' + (this.t.searchError || 'An error occurred') + '</li>';
            }
        }

        renderSearchResults(results) {
            this.searchResultsList.innerHTML = '';

            if (!results || results.length === 0) {
                this.searchResultsList.innerHTML = '<li class="quick-access-empty">' + (this.t.noEntriesFound || 'No entries found') + '</li>';
                return;
            }

            results.forEach((entry, index) => {
                const item = this.createEntryItem(entry, index, 'search');
                if (item) {
                    this.searchResultsList.appendChild(item);
                }
            });
        }

        selectNext() {
            const list = this.getActiveList();
            const items = list.querySelectorAll('.quick-access-item');
            if (items.length === 0) return;

            let currentIndex = this.getSelectedIndex();
            currentIndex = (currentIndex + 1) % items.length;
            this.setSelectedIndex(currentIndex);
            this.updateSelection();
        }

        selectPrevious() {
            const list = this.getActiveList();
            const items = list.querySelectorAll('.quick-access-item');
            if (items.length === 0) return;

            let currentIndex = this.getSelectedIndex();
            currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
            this.setSelectedIndex(currentIndex);
            this.updateSelection();
        }

        getActiveList() {
            if (this.searchResultsSection.style.display !== 'none' && this.searchResults.length > 0) {
                return this.searchResultsList;
            }
            return this.activePanel === 'history' ? this.historyList : this.favoritesList;
        }

        getSelectedIndex() {
            if (this.searchResultsSection.style.display !== 'none' && this.searchResults.length > 0) {
                return this.searchSelectedIndex;
            }
            return this.activePanel === 'history' ? this.historySelectedIndex : this.favoritesSelectedIndex;
        }

        setSelectedIndex(index) {
            if (this.searchResultsSection.style.display !== 'none' && this.searchResults.length > 0) {
                this.searchSelectedIndex = index;
            } else if (this.activePanel === 'history') {
                this.historySelectedIndex = index;
            } else {
                this.favoritesSelectedIndex = index;
            }
        }

        updateSelection() {
            // Clear all selections
            this.overlay.querySelectorAll('.quick-access-item').forEach(item => {
                item.classList.remove('selected');
                item.setAttribute('aria-selected', 'false');
            });

            const list = this.getActiveList();
            const index = this.getSelectedIndex();
            const items = list.querySelectorAll('.quick-access-item');

            if (index >= 0 && index < items.length) {
                items[index].classList.add('selected');
                items[index].setAttribute('aria-selected', 'true');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        }

        navigateToSelected(newTab = false) {
            const list = this.getActiveList();
            const index = this.getSelectedIndex();
            const items = list.querySelectorAll('.quick-access-item');

            if (index >= 0 && index < items.length) {
                const url = items[index].dataset.url;
                if (url) {
                    if (newTab) {
                        window.open(url, '_blank');
                    } else {
                        window.location.href = url;
                    }
                }
            }
        }
    }

    return QuickAccessOverlay;
})();
