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
            this.savedSearches = [];
            this.savedSearchesSection = null;
            this.savedSearchesList = null;

            this.historySelectedIndex = -1;
            this.favoritesSelectedIndex = -1;
            this.searchSelectedIndex = -1;

            this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            this.fetchTimeout = 10000;

            // Drag and drop state
            this.draggedItem = null;
            this.draggedIndex = null;

            // Search abort controller
            this.searchAbortController = null;

            // Edit drawer state
            this.drawerOpen = false;
            this.drawerEntry = null;
            this.editDrawer = null;
            this.searchResultsBody = null;
        }

        init() {
            if (!this.settings.quickAccessEnabled) {
                return;
            }

            try {
                this.createOverlay();
                this.bindGlobalShortcut();
                this.preloadFavorites();
                this.bindFavoritesShortcuts();
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

            // Tabs container
            this.tabsContainer = document.createElement('div');
            this.tabsContainer.className = 'quick-access-tabs';

            this.tabButtons = {};
            this.currentTab = 'entries';

            // Load search types and create tabs
            this.loadSearchTypes().then(() => {
                this.renderTabs();
            });

            searchSection.appendChild(this.tabsContainer);

            // Search input wrapper
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'quick-access-input-wrapper';

            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.className = 'quick-access-search-input';
            this.searchInput.placeholder = this.t.searchAllEntries || 'Search all entries...';
            this.searchInput.setAttribute('aria-label', this.t.searchAllEntries || 'Search all entries');

            const searchHint = document.createElement('span');
            searchHint.className = 'quick-access-search-hint';
            searchHint.textContent = 'Enter ↵';

            // Save search button
            this.saveSearchBtn = document.createElement('button');
            this.saveSearchBtn.type = 'button';
            this.saveSearchBtn.className = 'quick-access-save-search-btn';
            this.saveSearchBtn.title = this.t.saveSearch || 'Save Search';
            this.saveSearchBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>';
            this.saveSearchBtn.style.display = 'none';
            this.saveSearchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.promptSaveSearch();
            });

            inputWrapper.appendChild(this.searchInput);
            inputWrapper.appendChild(this.saveSearchBtn);
            inputWrapper.appendChild(searchHint);

            searchSection.appendChild(inputWrapper);

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

            this.searchResultsHeader = document.createElement('div');
            this.searchResultsHeader.className = 'quick-access-search-results-header';
            this.searchResultsHeader.innerHTML = '<span>' + (this.t.searchResults || 'Search Results') + '</span>';

            this.searchResultsList = document.createElement('ul');
            this.searchResultsList.className = 'quick-access-list';
            this.searchResultsList.setAttribute('role', 'listbox');

            this.searchResultsSection.appendChild(this.searchResultsHeader);

            // Search results body (list + edit drawer side by side)
            this.searchResultsBody = document.createElement('div');
            this.searchResultsBody.className = 'quick-access-search-results-body';
            this.searchResultsBody.appendChild(this.searchResultsList);

            // Edit Drawer
            this.editDrawer = this.createEditDrawer();
            this.searchResultsBody.appendChild(this.editDrawer);

            this.searchResultsSection.appendChild(this.searchResultsBody);

            // Saved Searches Section
            this.savedSearchesSection = document.createElement('div');
            this.savedSearchesSection.className = 'quick-access-saved-searches';
            this.savedSearchesSection.style.display = 'none';

            const savedSearchesHeader = document.createElement('div');
            savedSearchesHeader.className = 'quick-access-saved-searches-header';
            savedSearchesHeader.innerHTML = '<span>' + (this.t.savedSearches || 'Saved Searches') + '</span>';

            this.savedSearchesList = document.createElement('ul');
            this.savedSearchesList.className = 'quick-access-saved-searches-list';

            this.savedSearchesSection.appendChild(savedSearchesHeader);
            this.savedSearchesSection.appendChild(this.savedSearchesList);

            // Assemble modal
            this.modal.appendChild(header);
            this.modal.appendChild(searchSection);
            this.modal.appendChild(this.savedSearchesSection);
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

        createEditDrawer() {
            const drawer = document.createElement('div');
            drawer.className = 'quick-access-edit-drawer';

            // Header
            const drawerHeader = document.createElement('div');
            drawerHeader.className = 'quick-access-drawer-header';

            const drawerTitle = document.createElement('h3');
            drawerTitle.className = 'quick-access-drawer-title';
            drawerTitle.textContent = this.t.editEntry || 'Edit Entry';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'quick-access-drawer-close';
            closeBtn.setAttribute('aria-label', 'Close drawer');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            closeBtn.addEventListener('click', () => this.closeDrawer());

            drawerHeader.appendChild(drawerTitle);
            drawerHeader.appendChild(closeBtn);

            // Content
            const drawerContent = document.createElement('div');
            drawerContent.className = 'quick-access-drawer-content';

            // Title field
            this.drawerTitleField = this.createDrawerField('title', this.t.title || 'Title', 'text');
            drawerContent.appendChild(this.drawerTitleField);

            // Slug field
            this.drawerSlugField = this.createDrawerField('slug', this.t.slug || 'Slug', 'text');
            drawerContent.appendChild(this.drawerSlugField);

            // Status field (select)
            this.drawerStatusField = this.createDrawerSelectField('status', this.t.status || 'Status', [
                { value: 'live', label: this.t.statusLive || 'Live' },
                { value: 'disabled', label: this.t.statusDisabled || 'Disabled' },
                { value: 'draft', label: this.t.statusDraft || 'Draft' }
            ]);
            drawerContent.appendChild(this.drawerStatusField);

            // Post Date field
            this.drawerPostDateField = this.createDrawerField('postDate', this.t.postDate || 'Post Date', 'datetime-local');
            drawerContent.appendChild(this.drawerPostDateField);

            // Expiry Date field
            this.drawerExpiryDateField = this.createDrawerField('expiryDate', this.t.expiryDate || 'Expiry Date', 'datetime-local');
            drawerContent.appendChild(this.drawerExpiryDateField);

            // Footer
            const drawerFooter = document.createElement('div');
            drawerFooter.className = 'quick-access-drawer-footer';

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'quick-access-drawer-save';
            saveBtn.textContent = this.t.save || 'Save';
            saveBtn.addEventListener('click', () => this.saveEntry());

            drawerFooter.appendChild(saveBtn);

            drawer.appendChild(drawerHeader);
            drawer.appendChild(drawerContent);
            drawer.appendChild(drawerFooter);

            return drawer;
        }

        createDrawerField(name, label, type) {
            const field = document.createElement('div');
            field.className = 'quick-access-drawer-field';

            const lbl = document.createElement('label');
            lbl.className = 'quick-access-drawer-label';
            lbl.textContent = label;

            const input = document.createElement('input');
            input.type = type;
            input.className = 'quick-access-drawer-input';
            input.name = name;
            input.dataset.field = name;

            field.appendChild(lbl);
            field.appendChild(input);

            return field;
        }

        createDrawerSelectField(name, label, options) {
            const field = document.createElement('div');
            field.className = 'quick-access-drawer-field';

            const lbl = document.createElement('label');
            lbl.className = 'quick-access-drawer-label';
            lbl.textContent = label;

            const select = document.createElement('select');
            select.className = 'quick-access-drawer-input';
            select.name = name;
            select.dataset.field = name;

            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                select.appendChild(option);
            });

            field.appendChild(lbl);
            field.appendChild(select);

            return field;
        }

        isEditableEntry(entry, type) {
            // Show edit button on entries (not admin, globals, users, assets, categories)
            // History and favorites are always entries, search results need a type check
            if (type === 'search') {
                return entry.type === 'entry' || !entry.type;
            }
            // History and favorites items are entries
            return type === 'history' || type === 'favorites';
        }

        openDrawer(entry) {
            if (!entry) return;

            this.drawerEntry = entry;
            this.drawerOpen = true;

            // Populate fields
            const titleInput = this.editDrawer.querySelector('[data-field="title"]');
            const slugInput = this.editDrawer.querySelector('[data-field="slug"]');
            const statusSelect = this.editDrawer.querySelector('[data-field="status"]');
            const postDateInput = this.editDrawer.querySelector('[data-field="postDate"]');
            const expiryDateInput = this.editDrawer.querySelector('[data-field="expiryDate"]');

            if (titleInput) titleInput.value = entry.title || '';
            if (slugInput) slugInput.value = entry.slug || this.extractSlugFromUrl(entry.url) || '';
            if (statusSelect) statusSelect.value = entry.status || 'live';
            if (postDateInput) postDateInput.value = this.formatDateForInput(entry.postDate);
            if (expiryDateInput) expiryDateInput.value = this.formatDateForInput(entry.expiryDate);

            this.searchResultsBody.classList.add('drawer-open');

            // Focus the title input after transition
            setTimeout(() => {
                if (titleInput) titleInput.focus();
            }, 260);
        }

        closeDrawer() {
            this.drawerOpen = false;
            this.drawerEntry = null;
            this.searchResultsBody.classList.remove('drawer-open');
        }

        saveEntry() {
            // Placeholder - will be wired to backend in next iteration
            if (!this.drawerEntry) return;

            const titleInput = this.editDrawer.querySelector('[data-field="title"]');
            const slugInput = this.editDrawer.querySelector('[data-field="slug"]');
            const statusSelect = this.editDrawer.querySelector('[data-field="status"]');
            const postDateInput = this.editDrawer.querySelector('[data-field="postDate"]');
            const expiryDateInput = this.editDrawer.querySelector('[data-field="expiryDate"]');

            const data = {
                entryId: this.drawerEntry.id,
                title: titleInput ? titleInput.value : '',
                slug: slugInput ? slugInput.value : '',
                status: statusSelect ? statusSelect.value : '',
                postDate: postDateInput ? postDateInput.value : '',
                expiryDate: expiryDateInput ? expiryDateInput.value : ''
            };

            console.log('Quick Access: Save entry (not yet implemented)', data);
        }

        formatDateForInput(dateStr) {
            if (!dateStr) return '';
            try {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return '';
                // Format as YYYY-MM-DDTHH:MM for datetime-local input
                const pad = (n) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } catch {
                return '';
            }
        }

        extractSlugFromUrl(url) {
            if (!url) return '';
            try {
                const pathname = new URL(url, window.location.origin).pathname;
                // Remove trailing slash, then grab last segment
                const segments = pathname.replace(/\/+$/, '').split('/');
                return segments.pop() || '';
            } catch {
                return '';
            }
        }

        bindOverlayEvents() {
            // When a copy menu is open, first outside click only closes it
            document.addEventListener('click', (e) => {
                const openMenu = document.querySelector('.quick-access-copy-menu[style*="display: block"]');
                if (openMenu && !openMenu.contains(e.target) && !e.target.closest('.quick-access-copy-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeAllCopyMenus();
                }
            }, true);

            // Close on backdrop click (but not if user has text selected)
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    // Check if there's any text selected
                    const selection = window.getSelection();
                    const hasSelection = selection && selection.toString().length > 0;

                    if (!hasSelection) {
                        this.hide();
                    }
                }
            });

            // Show/hide save button based on input content
            this.searchInput.addEventListener('input', () => {
                const hasQuery = this.searchInput.value.trim().length >= 2;
                this.saveSearchBtn.style.display = hasQuery ? '' : 'none';
            });

            // Search input - Enter to search
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const rawValue = this.searchInput.value;
                    const { type: parsedType, query } = this.parseQueryWithType(rawValue);

                    // If type prefix found, switch tab (keep original input value)
                    if (parsedType && this.searchTypes.some(t => t.id === parsedType)) {
                        this.switchTab(parsedType);
                        // Don't modify the input value - keep user input as-is
                    }

                    if (query.length >= 2) {
                        e.preventDefault();
                        this.performSearch(query);
                    }
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
                    if (this.drawerOpen) {
                        this.closeDrawer();
                    } else {
                        this.hide();
                    }
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
                this.loadFavorites(),
                this.loadSavedSearches()
            ]);
        }

        hide() {
            if (!this.isOpen) return;

            this.isOpen = false;
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';

            // Move focus out of the overlay so global shortcuts (Alt+1-9) work
            if (this.overlay.contains(document.activeElement)) {
                document.activeElement.blur();
            }

            // Close drawer if open
            if (this.drawerOpen) {
                this.closeDrawer();
            }
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

        async preloadFavorites() {
            try {
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

                if (!response.ok) return;

                const data = await response.json();
                if (data.success) {
                    this.favoritesItems = data.favorites || [];
                }
            } catch (error) {
                // Silent fail - shortcuts just won't work until overlay is opened
            }
        }

        bindFavoritesShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

                const digit = parseInt(e.key, 10);
                if (isNaN(digit) || digit < 1 || digit > 9) return;

                // When overlay is open, allow shortcuts from our own inputs
                // When overlay is closed, ignore if focused in an external input
                if (this.isOpen) {
                    if (!this.overlay.contains(e.target)) return;
                } else {
                    if (this.shouldIgnoreShortcut(e)) return;
                }

                const index = digit - 1;
                if (!this.favoritesItems || index >= this.favoritesItems.length) return;

                e.preventDefault();
                const entry = this.favoritesItems[index];
                if (entry && entry.url) {
                    if (this.isOpen) this.hide();
                    this.showNavigationToast(entry);
                    window.location.href = entry.url;
                }
            });
        }

        showNavigationToast(entry) {
            // Remove any existing toast
            const existing = document.querySelector('.quick-access-nav-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = 'quick-access-nav-toast';
            toast.textContent = (this.t.navigatingTo || 'Navigating to {title}...').replace('{title}', entry.title || '');
            document.body.appendChild(toast);

            // Trigger reflow for animation
            toast.offsetHeight;
            toast.classList.add('visible');

            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }

        async loadFavorites() {
            // On first open, use preloaded data to avoid double-fetch
            if (!this.favoritesLoadedOnce && this.favoritesItems && this.favoritesItems.length > 0) {
                this.favoritesLoadedOnce = true;
                this.renderPanel('favorites', this.favoritesItems);
                return;
            }
            this.favoritesLoadedOnce = true;

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
                    // Add drag & drop for favorites
                    if (type === 'favorites') {
                        this.setupDragAndDrop(item, index);
                        // Add shortcut badge for first 9 favorites
                        if (index < 9) {
                            const badge = document.createElement('span');
                            badge.className = 'quick-access-shortcut-badge';
                            badge.textContent = (this.isMac ? '⌥' : 'Alt+') + (index + 1);
                            item.appendChild(badge);
                        }
                    }
                    list.appendChild(item);
                }
            });
        }

        setupDragAndDrop(item, index) {
            // Create drag handle button
            const dragHandle = document.createElement('button');
            dragHandle.type = 'button';
            dragHandle.className = 'quick-access-drag-handle';
            dragHandle.title = this.t.dragToReorder || 'Drag to reorder';
            dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>';
            dragHandle.draggable = true;

            // Insert drag handle at the beginning of the item
            item.insertBefore(dragHandle, item.firstChild);
            item.classList.add('quick-access-has-drag-handle');

            dragHandle.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                this.draggedItem = item;
                this.draggedIndex = index;
                this.dragContext = 'favorites';
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
            });

            dragHandle.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedItem = null;
                this.draggedIndex = null;
                this.dragContext = null;
                // Remove all drag-over classes
                this.favoritesList.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (this.draggedItem && this.draggedItem !== item && this.dragContext === 'favorites') {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');

                if (!this.draggedItem || this.draggedItem === item || this.dragContext !== 'favorites') return;

                const fromIndex = this.draggedIndex;
                const toIndex = parseInt(item.dataset.index, 10);

                if (fromIndex === toIndex) return;

                // Reorder the items array
                const movedItem = this.favoritesItems.splice(fromIndex, 1)[0];
                this.favoritesItems.splice(toIndex, 0, movedItem);

                // Re-render the panel
                this.renderPanel('favorites', this.favoritesItems);

                // Save the new order to the server
                this.saveFavoritesOrder();
            });
        }

        async saveFavoritesOrder() {
            try {
                const entryIds = this.favoritesItems.map(item => ({
                    entryId: item.id,
                    siteId: item.siteId || item.site?.id
                }));

                const actionUrl = Craft.getActionUrl('quick-search/favorites/reorder');

                const response = await utils.fetchWithTimeout(
                    actionUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-Token': Craft.csrfTokenValue
                        },
                        body: JSON.stringify({ entryIds })
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (!data.success) {
                    console.error('Quick Access: Failed to save favorites order');
                }
            } catch (error) {
                console.error('Quick Access: Error saving favorites order', error);
            }
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

            // Build metadata based on entry type
            if (type === 'search' && entry.type) {
                // Search results with type info
                meta.appendChild(this.createTypeSpecificMeta(entry, entry.type));
            } else if (type === 'history' || type === 'favorites') {
                // History/favorites - show section
                const section = document.createElement('span');
                section.className = 'quick-access-item-section';
                section.textContent = entry.section?.name || '';
                meta.appendChild(section);

                if (this.settings.isMultiSite && entry.site) {
                    const site = document.createElement('span');
                    site.className = 'quick-access-item-site';
                    site.textContent = entry.site.name || '';
                    meta.appendChild(site);
                }

                const status = document.createElement('span');
                status.className = `quick-access-item-status ${entry.status || ''}`;
                status.textContent = entry.status || '';
                meta.appendChild(status);
            }

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

            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'quick-access-copy-btn';
            copyBtn.title = this.t.copyActions || 'Copy options';
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';

            // Create copy dropdown menu
            const copyMenu = document.createElement('div');
            copyMenu.className = 'quick-access-copy-menu';
            copyMenu.style.display = 'none';

            const copiedMsg = this.t.copied || 'Copied!';
            const copyFn = window.QuickSearchSearch.copyToClipboard;

            // Copy URL
            const copyUrlItem = document.createElement('button');
            copyUrlItem.type = 'button';
            copyUrlItem.className = 'quick-access-copy-menu-item';
            copyUrlItem.textContent = this.t.copyUrl || 'Copy URL';
            copyUrlItem.addEventListener('click', (e) => {
                e.stopPropagation();
                copyFn(entry.url, copiedMsg);
                copyMenu.style.display = 'none';
            });

            // Copy Title
            const copyTitleItem = document.createElement('button');
            copyTitleItem.type = 'button';
            copyTitleItem.className = 'quick-access-copy-menu-item';
            copyTitleItem.textContent = this.t.copyTitle || 'Copy Title';
            copyTitleItem.addEventListener('click', (e) => {
                e.stopPropagation();
                copyFn(entry.title, copiedMsg);
                copyMenu.style.display = 'none';
            });

            // Copy ID
            const copyIdItem = document.createElement('button');
            copyIdItem.type = 'button';
            copyIdItem.className = 'quick-access-copy-menu-item';
            copyIdItem.textContent = this.t.copyId || 'Copy ID';
            copyIdItem.addEventListener('click', (e) => {
                e.stopPropagation();
                copyFn(entry.id ? String(entry.id) : '', copiedMsg);
                copyMenu.style.display = 'none';
            });

            copyMenu.appendChild(copyUrlItem);
            copyMenu.appendChild(copyTitleItem);
            copyMenu.appendChild(copyIdItem);

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close any other open menus first
                this.closeAllCopyMenus();
                const isHidden = copyMenu.style.display === 'none';
                if (isHidden) {
                    const rect = copyBtn.getBoundingClientRect();
                    copyMenu.style.position = 'fixed';
                    copyMenu.style.right = (window.innerWidth - rect.right) + 'px';
                    copyMenu.style.display = 'block';
                    const menuHeight = copyMenu.offsetHeight;
                    if (rect.bottom + menuHeight + 8 > window.innerHeight) {
                        copyMenu.style.top = (rect.top - menuHeight - 4) + 'px';
                    } else {
                        copyMenu.style.top = (rect.bottom + 4) + 'px';
                    }
                    copyMenu.style.left = '';
                } else {
                    copyMenu.style.display = 'none';
                }
            });

            // Stop propagation on menu click
            copyMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Edit button (only for editable entries)
            let editBtn = null;
            if (this.isEditableEntry(entry, type)) {
                editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'quick-access-edit-btn';
                editBtn.title = this.t.editEntry || 'Edit entry';
                editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>';
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openDrawer(entry);
                });
            }

            item.appendChild(content);
            if (editBtn) item.appendChild(editBtn);
            item.appendChild(copyBtn);
            item.appendChild(newTabBtn);
            document.body.appendChild(copyMenu);

            item.addEventListener('click', () => {
                if (entry.url) {
                    window.location.href = entry.url;
                }
            });

            return item;
        }

        /**
         * Close all open copy menus within the overlay
         */
        closeAllCopyMenus() {
            document.querySelectorAll('.quick-access-copy-menu').forEach(menu => {
                menu.style.display = 'none';
            });
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

            // Abort any in-flight search
            if (this.searchAbortController) {
                this.searchAbortController.abort();
            }
            this.searchAbortController = new AbortController();

            this.searchResultsSection.style.display = 'block';
            this.searchResultsList.innerHTML = '<li class="quick-access-loading">' + (this.t.searching || 'Searching...') + '</li>';

            try {
                // Ensure type is valid before sending
                const validTypes = ['entries', 'categories', 'assets', 'users', 'globals', 'admin'];
                const type = (this.currentTab && validTypes.includes(this.currentTab)) ? this.currentTab : 'entries';

                const params = new URLSearchParams({
                    query: query,
                    type: type
                });

                const actionUrl = Craft.getActionUrl('quick-search/search/index');
                const separator = actionUrl.includes('?') ? '&' : '?';

                const timeoutId = setTimeout(() => this.searchAbortController.abort(), this.fetchTimeout);

                const response = await fetch(
                    actionUrl + separator + params.toString(),
                    {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        signal: this.searchAbortController.signal
                    }
                );

                clearTimeout(timeoutId);

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
                if (error.name === 'AbortError') {
                    return; // Silently ignore aborted requests
                }
                console.error('Quick Access: Search error', error);
                this.searchResultsList.innerHTML = '<li class="quick-access-error">' + (this.t.searchError || 'An error occurred') + '</li>';
            }
        }

        renderSearchResults(results) {
            this.searchResultsList.innerHTML = '';

            // Update header with result count
            const count = results ? results.length : 0;
            const headerText = this.t.searchResults || 'Search Results';
            this.searchResultsHeader.innerHTML = '<span>' + headerText + ' (' + count + ')</span>';

            if (!results || results.length === 0) {
                this.searchResultsList.innerHTML = '<li class="quick-access-empty">' + (this.getNoResultsMessage()) + '</li>';
                return;
            }

            results.forEach((entry, index) => {
                const item = this.createEntryItem(entry, index, 'search');
                if (item) {
                    this.searchResultsList.appendChild(item);
                }
            });
        }

        getNoResultsMessage() {
            const messages = {
                'entries': this.t.noEntriesFound || 'No entries found',
                'categories': this.t.noCategoriesFound || 'No categories found',
                'assets': this.t.noAssetsFound || 'No assets found',
                'users': this.t.noUsersFound || 'No users found',
                'globals': this.t.noGlobalsFound || 'No global sets found',
                'admin': this.t.noAdminFound || 'No results found'
            };
            return messages[this.currentTab] || this.t.noEntriesFound || 'No results found';
        }

        parseQueryWithType(input) {
            const trimmed = input.trim();
            const lowerInput = trimmed.toLowerCase();

            // Type prefixes for quick switching (long prefixes first to avoid short prefix conflicts)
            const prefixes = {
                'entries:': 'entries',
                'categories:': 'categories',
                'cats:': 'categories',
                'assets:': 'assets',
                'users:': 'users',
                'globals:': 'globals',
                // Admin prefixes
                'admin:': 'admin',
                'sections:': 'admin',
                'fields:': 'admin',
                'entrytypes:': 'admin',
                'volumes:': 'admin',
                'plugins:': 'admin',
                // Short prefixes
                'e:': 'entries',
                'c:': 'categories',
                'a:': 'assets',
                'u:': 'users',
                'g:': 'globals',
                '@:': 'admin',
            };

            for (const [prefix, type] of Object.entries(prefixes)) {
                if (lowerInput.startsWith(prefix)) {
                    return {
                        type: type,
                        query: trimmed.substring(prefix.length).trim()
                    };
                }
            }

            return {
                type: null,
                query: trimmed
            };
        }

        createTypeSpecificMeta(entry, type) {
            const container = document.createElement('div');
            container.style.display = 'contents';

            switch (type) {
                case 'category':
                    const group = document.createElement('span');
                    group.className = 'quick-access-item-section';
                    group.textContent = entry.group?.name || '';
                    container.appendChild(group);
                    break;

                case 'asset':
                    const volume = document.createElement('span');
                    volume.className = 'quick-access-item-section';
                    volume.textContent = entry.volume?.name || '';
                    container.appendChild(volume);

                    if (entry.filename) {
                        const filename = document.createElement('span');
                        filename.className = 'quick-access-item-site';
                        filename.style.fontFamily = 'monospace';
                        filename.textContent = entry.filename || '';
                        container.appendChild(filename);
                    }
                    break;

                case 'user':
                    const email = document.createElement('span');
                    email.className = 'quick-access-item-section';
                    email.textContent = entry.email || '';
                    container.appendChild(email);

                    const userStatus = document.createElement('span');
                    userStatus.className = `quick-access-item-status ${entry.status || ''}`;
                    userStatus.textContent = entry.status || '';
                    container.appendChild(userStatus);
                    break;

                case 'global':
                    const handle = document.createElement('span');
                    handle.className = 'quick-access-item-section';
                    handle.textContent = entry.handle || '';
                    container.appendChild(handle);
                    break;

                case 'admin':
                case 'section':
                case 'field':
                case 'entrytype':
                case 'categorygroup':
                case 'volume':
                case 'globalset':
                case 'plugin':
                    const adminType = document.createElement('span');
                    adminType.className = `quick-access-item-admin-type ${entry.type || type}`;
                    adminType.textContent = this.formatAdminTypeLabel(entry.type || type);
                    container.appendChild(adminType);
                    break;

                case 'entry':
                default:
                    const section = document.createElement('span');
                    section.className = 'quick-access-item-section';
                    section.textContent = entry.section?.name || '';
                    container.appendChild(section);

                    if (this.settings.isMultiSite && entry.site) {
                        const site = document.createElement('span');
                        site.className = 'quick-access-item-site';
                        site.textContent = entry.site.name || '';
                        container.appendChild(site);
                    }

                    const status = document.createElement('span');
                    status.className = `quick-access-item-status ${entry.status || ''}`;
                    status.textContent = entry.status || '';
                    container.appendChild(status);
                    break;
            }

            return container;
        }

        formatAdminTypeLabel(type) {
            const labels = {
                'section': 'Section',
                'field': 'Field',
                'entrytype': 'Entry Type',
                'categorygroup': 'Category Group',
                'volume': 'Volume',
                'globalset': 'Global Set',
                'plugin': 'Plugin'
            };
            return labels[type] || type;
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

        // Tab methods for universal search
        async loadSearchTypes() {
            try {
                const actionUrl = Craft.getActionUrl('quick-search/search/types');
                const separator = actionUrl.includes('?') ? '&' : '?';

                const response = await utils.fetchWithTimeout(
                    actionUrl + separator + 'limit=50',
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
                    this.searchTypes = data.types || [];
                } else {
                    this.searchTypes = [];
                }
            } catch (error) {
                console.error('Quick Access: Error loading search types', error);
                // Default to entries only
                this.searchTypes = [
                    { id: 'entries', label: this.t.tabEntries || 'Entries', icon: 'document' }
                ];
            }
        }

        renderTabs() {
            if (!this.tabsContainer) return;

            this.tabsContainer.innerHTML = '';
            this.tabButtons = {};

            this.searchTypes.forEach((type, index) => {
                const tab = document.createElement('button');
                tab.type = 'button';
                tab.className = 'quick-access-tab';
                if (index === 0) {
                    tab.classList.add('active');
                    this.currentTab = type.id;
                }
                tab.dataset.type = type.id;

                // Create icon
                const iconSvg = this.getTabIcon(type.icon);
                tab.innerHTML = `<span class="quick-access-tab-icon">${iconSvg}</span><span class="quick-access-tab-label">${type.label}</span>`;

                tab.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.switchTab(type.id);
                });

                this.tabsContainer.appendChild(tab);
                this.tabButtons[type.id] = tab;
            });

            this.updateSearchPlaceholder();
        }

        getTabIcon(icon) {
            const icons = {
                'document': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
                'tag': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>',
                'photo': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
                'user': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>',
                'world': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>',
                'settings': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'
            };

            return icons[icon] || icons.document;
        }

        switchTab(type, skipSearch = false) {
            if (this.currentTab === type) return;

            this.currentTab = type;

            // Update tab visual state
            if (this.tabsContainer) {
                this.tabsContainer.querySelectorAll('.quick-access-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.type === type);
                });
            }

            // Update placeholder
            this.updateSearchPlaceholder();

            // Re-search if there's a query (unless skipSearch is true)
            if (!skipSearch && this.searchInput && this.searchInput.value.trim().length >= 2) {
                this.performSearch(this.searchInput.value.trim());
            }
        }

        // --- Saved Searches methods ---

        async loadSavedSearches() {
            try {
                const actionUrl = Craft.getActionUrl('quick-search/saved-searches/list');
                const response = await utils.fetchWithTimeout(
                    actionUrl,
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
                    this.savedSearches = data.savedSearches || [];
                    this.renderSavedSearches();
                }
            } catch (error) {
                console.error('Quick Access: Error loading saved searches', error);
            }
        }

        renderSavedSearches() {
            if (!this.savedSearchesList) return;

            this.savedSearchesList.innerHTML = '';

            if (!this.savedSearches || this.savedSearches.length === 0) {
                this.savedSearchesSection.style.display = 'none';
                return;
            }

            this.savedSearchesSection.style.display = '';

            this.savedSearches.forEach((search, index) => {
                const item = this.createSavedSearchItem(search, index);
                this.savedSearchesList.appendChild(item);
            });
        }

        createSavedSearchItem(search, index) {
            const item = document.createElement('li');
            item.className = 'quick-access-saved-search-item';
            item.dataset.index = index;
            item.dataset.id = search.id;

            // Drag handle
            const dragHandle = document.createElement('button');
            dragHandle.type = 'button';
            dragHandle.className = 'quick-access-drag-handle';
            dragHandle.title = this.t.dragToReorder || 'Drag to reorder';
            dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>';
            dragHandle.draggable = true;

            // Drag events
            dragHandle.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                this.draggedItem = item;
                this.draggedIndex = index;
                this.dragContext = 'savedSearches';
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
            });

            dragHandle.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedItem = null;
                this.draggedIndex = null;
                this.dragContext = null;
                this.savedSearchesList.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (this.draggedItem && this.draggedItem !== item && this.dragContext === 'savedSearches') {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');

                if (!this.draggedItem || this.draggedItem === item || this.dragContext !== 'savedSearches') return;

                const fromIndex = this.draggedIndex;
                const toIndex = parseInt(item.dataset.index, 10);

                if (fromIndex === toIndex) return;

                const movedItem = this.savedSearches.splice(fromIndex, 1)[0];
                this.savedSearches.splice(toIndex, 0, movedItem);

                this.renderSavedSearches();
                this.saveSavedSearchesOrder();
            });

            // Icon
            const icon = document.createElement('span');
            icon.className = 'quick-access-saved-search-icon';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>';

            // Content
            const content = document.createElement('div');
            content.className = 'quick-access-saved-search-content';

            const name = document.createElement('span');
            name.className = 'quick-access-saved-search-name';
            name.textContent = search.name;

            const typeBadge = document.createElement('span');
            typeBadge.className = 'quick-access-saved-search-type';
            typeBadge.textContent = search.type || 'entries';

            content.appendChild(name);
            content.appendChild(typeBadge);

            // Run button
            const runBtn = document.createElement('button');
            runBtn.type = 'button';
            runBtn.className = 'quick-access-saved-search-run';
            runBtn.title = this.t.runSearch || 'Run';
            runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
            runBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.runSavedSearch(search);
            });

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'quick-access-saved-search-delete';
            deleteBtn.title = this.t.deleteSavedSearch || 'Delete saved search';
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSavedSearch(search.id);
            });

            item.appendChild(dragHandle);
            item.appendChild(icon);
            item.appendChild(content);
            item.appendChild(runBtn);
            item.appendChild(deleteBtn);

            // Click entire row to run
            item.addEventListener('click', () => {
                this.runSavedSearch(search);
            });

            return item;
        }

        runSavedSearch(search) {
            // Switch tab if needed
            if (search.type && search.type !== this.currentTab) {
                this.switchTab(search.type, true); // skipSearch = true
            }

            // Fill query
            this.searchInput.value = search.query;
            this.saveSearchBtn.style.display = '';

            // Trigger search
            this.performSearch(search.query);
        }

        async promptSaveSearch() {
            const rawValue = this.searchInput.value.trim();
            if (rawValue.length < 2) return;

            // Strip type prefix so we only save the actual query
            const { query } = this.parseQueryWithType(rawValue);
            if (query.length < 2) return;

            const name = prompt(this.t.savedSearchName || 'Name this search...');
            if (!name || !name.trim()) return;

            try {
                const actionUrl = Craft.getActionUrl('quick-search/saved-searches/save');

                const response = await utils.fetchWithTimeout(
                    actionUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-Token': Craft.csrfTokenValue
                        },
                        body: JSON.stringify({
                            name: name.trim(),
                            query: query,
                            type: this.currentTab || 'entries',
                            siteId: null
                        })
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    await this.loadSavedSearches();
                } else {
                    console.error('Quick Access: Failed to save search', data.error);
                }
            } catch (error) {
                console.error('Quick Access: Error saving search', error);
            }
        }

        async deleteSavedSearch(id) {
            const confirmMsg = this.t.deleteSavedSearchConfirm || 'Delete this saved search?';
            if (!confirm(confirmMsg)) return;

            try {
                const actionUrl = Craft.getActionUrl('quick-search/saved-searches/delete');

                const response = await utils.fetchWithTimeout(
                    actionUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-Token': Craft.csrfTokenValue
                        },
                        body: JSON.stringify({ id: id })
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.savedSearches = this.savedSearches.filter(s => s.id !== id);
                    this.renderSavedSearches();
                }
            } catch (error) {
                console.error('Quick Access: Error deleting saved search', error);
            }
        }

        async saveSavedSearchesOrder() {
            try {
                const ids = this.savedSearches.map(s => s.id);
                const actionUrl = Craft.getActionUrl('quick-search/saved-searches/reorder');

                const response = await utils.fetchWithTimeout(
                    actionUrl,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-Token': Craft.csrfTokenValue
                        },
                        body: JSON.stringify({ ids: ids })
                    },
                    this.fetchTimeout
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (!data.success) {
                    console.error('Quick Access: Failed to save searches order');
                }
            } catch (error) {
                console.error('Quick Access: Error saving searches order', error);
            }
        }

        updateSearchPlaceholder() {
            if (!this.searchInput) return;

            const placeholders = {
                'entries': this.t.searchAllEntries || 'Search entries...',
                'categories': this.t.searchCategoriesPlaceholder || 'Search categories...',
                'assets': this.t.searchAssetsPlaceholder || 'Search assets...',
                'users': this.t.searchUsersPlaceholder || 'Search users...',
                'globals': this.t.searchGlobalsPlaceholder || 'Search globals...',
                'admin': this.t.searchAdminPlaceholder || 'Search settings...'
            };

            this.searchInput.placeholder = placeholders[this.currentTab] || placeholders.entries;
        }
    }

    return QuickAccessOverlay;
})();
