/**
 * Quick Search JavaScript
 * Handles search UI, AJAX requests, and entry navigation
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        try {
            // Verify Craft CP JavaScript is available
            if (typeof Craft === 'undefined' || typeof Craft.getActionUrl !== 'function') {
                console.error('Quick Search: Craft CP JavaScript not loaded');
                return;
            }

            // Only initialize if we have a global header
            const globalHeader = document.getElementById('global-header');
            if (!globalHeader) {
                return;
            }

            const quickSearch = new QuickSearch();
            quickSearch.init();

            // Initialize related entries overlay if setting is enabled
            const settings = window.QuickSearchSettings || {};
            if (settings.showRelatedEntries) {
                const relatedEntriesOverlay = new RelatedEntriesOverlay();
                relatedEntriesOverlay.init();
            }

            // Initialize entry outline popup (always on entry pages)
            const entryOutlinePopup = new EntryOutlinePopup();
            entryOutlinePopup.init();
        } catch (error) {
            console.error('Quick Search: Initialization error', error);
        }
    }

    class QuickSearch {
        constructor() {
            this.container = null;
            this.input = null;
            this.sectionFilter = null;
            this.siteFilter = null;
            this.backBtn = null;
            this.backPopup = null;
            this.historyBtn = null;
            this.favoritesBtn = null;
            this.resultsContainer = null;
            this.historyPopup = null;
            this.debounceTimer = null;
            this.selectedIndex = -1;
            this.currentResults = [];
            this.sections = [];
            this.sites = [];
            this.lastVisitedEntry = null;
            this.historyInitialLimit = 10;
            this.historyFullLimit = 50;
            this.historyExpanded = false;
            this.historySelectedIndex = -1;
            this.currentHistoryItems = [];
            this.currentFavorites = [];
            this.currentPopupView = null; // 'history', 'favorites', or null
            this.settings = window.QuickSearchSettings || {
                minSearchLength: 2,
                debounceDelay: 300,
                translations: {},
                currentSiteId: null,
                currentSiteName: '',
                isMultiSite: false
            };
            this.t = this.settings.translations || {};
            this.currentSiteId = this.settings.currentSiteId;
            this.isMultiSite = this.settings.isMultiSite;
            this.selectedSiteId = null; // null = current site, '*' = all sites, or specific id
        }

        init() {
            try {
                if (!this.createUI()) {
                    return; // UI creation failed
                }
                this.bindEvents();
                this.loadSections();
                if (this.isMultiSite) {
                    this.loadSites();
                }
                this.loadLastVisited();
            } catch (error) {
                console.error('Quick Search: Error during initialization', error);
            }
        }

        createUI() {
            try {
                const globalHeader = document.getElementById('global-header');
                if (!globalHeader) {
                    console.error('Quick Search: Could not find global header');
                    return false;
                }

                const accountToggle = globalHeader.querySelector('.account-toggle-wrapper');
                if (!accountToggle) {
                    console.error('Quick Search: Could not find account toggle wrapper');
                    return false;
                }

                // Create container
                this.container = document.createElement('div');
                this.container.className = 'quick-search-container';

                // Create section filter (custom multi-select dropdown)
                this.sectionFilter = document.createElement('div');
                this.sectionFilter.className = 'quick-search-section-filter';

                this.sectionFilterBtn = document.createElement('button');
                this.sectionFilterBtn.type = 'button';
                this.sectionFilterBtn.className = 'quick-search-section-filter-btn';
                const allSectionsText = this.t.allSections || 'All Sections';
                this.sectionFilterBtn.innerHTML = `<span class="quick-search-section-filter-text">${allSectionsText}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;

                this.sectionFilterDropdown = document.createElement('div');
                this.sectionFilterDropdown.className = 'quick-search-section-dropdown';

                this.sectionFilter.appendChild(this.sectionFilterBtn);
                this.sectionFilter.appendChild(this.sectionFilterDropdown);

                this.selectedSections = [];

                // Create site filter (only for multi-site installations)
                this.siteFilter = document.createElement('div');
                this.siteFilter.className = 'quick-search-site-filter';

                this.siteFilterBtn = document.createElement('button');
                this.siteFilterBtn.type = 'button';
                this.siteFilterBtn.className = 'quick-search-site-filter-btn';
                const currentSiteText = this.t.currentSite || 'Current Site';
                this.siteFilterBtn.innerHTML = `<span class="quick-search-site-filter-text">${currentSiteText}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;

                this.siteFilterDropdown = document.createElement('div');
                this.siteFilterDropdown.className = 'quick-search-site-dropdown';

                this.siteFilter.appendChild(this.siteFilterBtn);
                this.siteFilter.appendChild(this.siteFilterDropdown);

                // Create input wrapper
                const inputWrapper = document.createElement('div');
                inputWrapper.className = 'quick-search-input-wrapper';

                // Create search input
                this.input = document.createElement('input');
                this.input.type = 'text';
                this.input.className = 'quick-search-input';
                this.input.placeholder = this.t.searchPlaceholder || 'Search entries...';
                this.input.autocomplete = 'off';

                // Create back button (navigate to last visited entry)
                this.backBtn = document.createElement('button');
                this.backBtn.className = 'quick-search-back-btn';
                this.backBtn.type = 'button';
                this.backBtn.title = this.t.goToLastVisited || 'Go to last visited entry';
                this.backBtn.disabled = true;
                this.backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>';

                // Create history button
                this.historyBtn = document.createElement('button');
                this.historyBtn.className = 'quick-search-history-btn';
                this.historyBtn.type = 'button';
                this.historyBtn.title = this.t.viewRecentEntries || 'View recent entries';
                this.historyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';

                // Create favorites button
                this.favoritesBtn = document.createElement('button');
                this.favoritesBtn.className = 'quick-search-favorites-btn';
                this.favoritesBtn.type = 'button';
                this.favoritesBtn.title = this.t.favorites || 'Favorites';
                this.favoritesBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';

                // Create results container
                this.resultsContainer = document.createElement('div');
                this.resultsContainer.className = 'quick-search-results';
                if (this.settings.compactMode) {
                    this.resultsContainer.classList.add('compact');
                }

                // Create back button popup
                this.backPopup = document.createElement('div');
                this.backPopup.className = 'quick-search-back-popup';
                if (this.settings.compactMode) {
                    this.backPopup.classList.add('compact');
                }

                // Create history popup
                this.historyPopup = document.createElement('div');
                this.historyPopup.className = 'quick-search-history-popup';
                if (this.settings.compactMode) {
                    this.historyPopup.classList.add('compact');
                }

                // Create button group for back, history and favorites buttons
                const btnGroup = document.createElement('div');
                btnGroup.className = 'quick-search-btn-group';
                btnGroup.appendChild(this.backBtn);
                btnGroup.appendChild(this.historyBtn);
                btnGroup.appendChild(this.favoritesBtn);

                // Assemble UI - conditionally show filters based on settings
                if (this.isMultiSite) {
                    inputWrapper.appendChild(this.siteFilter);
                }
                if (this.settings.showSectionFilter !== false) {
                    inputWrapper.appendChild(this.sectionFilter);
                }
                inputWrapper.appendChild(this.input);
                this.container.appendChild(inputWrapper);
                this.container.appendChild(btnGroup);
                this.container.appendChild(this.resultsContainer);
                this.container.appendChild(this.backPopup);
                this.container.appendChild(this.historyPopup);

                // Insert before account toggle
                globalHeader.insertBefore(this.container, accountToggle);
                return true;
            } catch (error) {
                console.error('Quick Search: Error creating UI', error);
                return false;
            }
        }

        bindEvents() {
            if (!this.input || !this.container) {
                return;
            }

            // Search input events
            this.input.addEventListener('input', () => {
                this.handleSearchInput();
            });

            this.input.addEventListener('keydown', (e) => {
                this.handleKeyNavigation(e);
            });

            this.input.addEventListener('focus', () => {
                if (this.input && this.input.value.length >= this.settings.minSearchLength) {
                    this.showResults();
                }
            });

            // Section filter toggle
            if (this.sectionFilterBtn) {
                this.sectionFilterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSectionDropdown();
                });
            }

            // Site filter toggle
            if (this.siteFilterBtn) {
                this.siteFilterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSiteDropdown();
                });
            }

            // Back button (show last visited entry popup)
            if (this.backBtn) {
                this.backBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBackPopup();
                });
            }

            // History button
            if (this.historyBtn) {
                this.historyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleHistory();
                });
            }

            // Favorites button
            if (this.favoritesBtn) {
                this.favoritesBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorites();
                });
            }

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (this.container && !this.container.contains(e.target)) {
                    this.hideResults();
                    this.hideHistory();
                    this.hideBackPopup();
                    this.hideSectionDropdown();
                    this.hideSiteDropdown();
                }
            });

            // Global keyboard handling
            document.addEventListener('keydown', (e) => {
                // Escape closes all dropdowns
                if (e.key === 'Escape') {
                    this.hideResults();
                    this.hideHistory();
                    this.hideBackPopup();
                    this.hideSectionDropdown();
                    this.hideSiteDropdown();
                    if (this.input) {
                        this.input.blur();
                    }
                    return;
                }

                // Handle keyboard navigation in history popup
                if (this.historyPopup && this.historyPopup.classList.contains('active')) {
                    this.handleHistoryKeyNavigation(e);
                }
            });
        }

        handleHistoryKeyNavigation(e) {
            if (!this.historyPopup || !this.historyPopup.classList.contains('active')) {
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectHistoryNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectHistoryPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.navigateToSelectedHistory();
                    break;
            }
        }

        selectHistoryNext() {
            if (this.currentHistoryItems.length === 0) return;

            this.historySelectedIndex = (this.historySelectedIndex + 1) % this.currentHistoryItems.length;
            this.updateHistorySelectedItem();
        }

        selectHistoryPrevious() {
            if (this.currentHistoryItems.length === 0) return;

            this.historySelectedIndex = this.historySelectedIndex <= 0
                ? this.currentHistoryItems.length - 1
                : this.historySelectedIndex - 1;
            this.updateHistorySelectedItem();
        }

        updateHistorySelectedItem() {
            if (!this.historyPopup) return;

            const items = this.historyPopup.querySelectorAll('.quick-search-history-item');
            items.forEach((item, index) => {
                if (index === this.historySelectedIndex) {
                    item.classList.add('keyboard-focus');
                    item.setAttribute('aria-selected', 'true');
                    try {
                        item.scrollIntoView({ block: 'nearest' });
                    } catch (e) {
                        // Ignore scroll errors
                    }
                } else {
                    item.classList.remove('keyboard-focus');
                    item.setAttribute('aria-selected', 'false');
                }
            });
        }

        navigateToSelectedHistory() {
            if (this.historySelectedIndex >= 0 && this.historySelectedIndex < this.currentHistoryItems.length) {
                const entry = this.currentHistoryItems[this.historySelectedIndex];
                this.navigateToEntry(entry);
            }
        }

        handleSearchInput() {
            clearTimeout(this.debounceTimer);

            if (!this.input) return;
            const query = this.input.value.trim();

            if (query.length < this.settings.minSearchLength) {
                this.hideResults();
                return;
            }

            this.debounceTimer = setTimeout(() => {
                this.search(query);
            }, this.settings.debounceDelay);
        }

        handleKeyNavigation(e) {
            if (!this.resultsContainer || !this.resultsContainer.classList.contains('active')) {
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.navigateToSelected();
                    break;
            }
        }

        selectNext() {
            if (this.currentResults.length === 0) return;

            this.selectedIndex = (this.selectedIndex + 1) % this.currentResults.length;
            this.updateSelectedItem();
        }

        selectPrevious() {
            if (this.currentResults.length === 0) return;

            this.selectedIndex = this.selectedIndex <= 0
                ? this.currentResults.length - 1
                : this.selectedIndex - 1;
            this.updateSelectedItem();
        }

        updateSelectedItem() {
            if (!this.resultsContainer) return;

            const items = this.resultsContainer.querySelectorAll('.quick-search-result-item');
            items.forEach((item, index) => {
                if (index === this.selectedIndex) {
                    item.classList.add('selected', 'keyboard-focus');
                    item.setAttribute('aria-selected', 'true');
                    try {
                        item.scrollIntoView({ block: 'nearest' });
                    } catch (e) {
                        // Ignore scroll errors
                    }
                } else {
                    item.classList.remove('selected', 'keyboard-focus');
                    item.setAttribute('aria-selected', 'false');
                }
            });
        }

        navigateToSelected() {
            if (this.selectedIndex >= 0 && this.selectedIndex < this.currentResults.length) {
                const entry = this.currentResults[this.selectedIndex];
                this.navigateToEntry(entry);
            }
        }

        async loadSections() {
            try {
                const response = await fetch(Craft.getActionUrl('quick-search/search/sections'), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.sections) {
                    this.sections = data.sections;
                    this.populateSectionFilter();
                }
            } catch (error) {
                console.error('Quick Search: Error loading sections', error);
            }
        }

        populateSectionFilter() {
            if (!this.sectionFilterDropdown) return;

            // Clear existing items
            this.sectionFilterDropdown.innerHTML = '';

            // Create header with "All Sections" option
            const header = document.createElement('div');
            header.className = 'quick-search-section-header';
            const allItem = this.createSectionCheckbox(null, this.t.allSections || 'All Sections', true);
            header.appendChild(allItem);
            this.sectionFilterDropdown.appendChild(header);

            // Create scrollable list for sections
            const list = document.createElement('div');
            list.className = 'quick-search-section-list';

            // Add section checkboxes (use handle instead of id for API compatibility)
            if (Array.isArray(this.sections)) {
                this.sections.forEach(section => {
                    if (section && section.handle && section.name) {
                        const item = this.createSectionCheckbox(section.handle, section.name, false);
                        list.appendChild(item);
                    }
                });
            }

            this.sectionFilterDropdown.appendChild(list);
        }

        createSectionCheckbox(sectionHandle, name, isAll) {
            const label = document.createElement('label');
            label.className = 'quick-search-section-item';
            if (isAll) label.classList.add('quick-search-section-item-all');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'quick-search-section-checkbox';
            checkbox.value = sectionHandle || '';
            checkbox.checked = isAll; // "All" is checked by default
            checkbox.dataset.isAll = isAll ? 'true' : 'false';

            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.handleSectionCheckboxChange(checkbox, isAll);
            });

            const text = document.createElement('span');
            text.className = 'quick-search-section-name';
            text.textContent = name;

            label.appendChild(checkbox);
            label.appendChild(text);

            return label;
        }

        handleSectionCheckboxChange(checkbox, isAll) {
            if (!this.sectionFilterDropdown) return;

            const allCheckbox = this.sectionFilterDropdown.querySelector('.quick-search-section-checkbox[data-is-all="true"]');
            const sectionCheckboxes = this.sectionFilterDropdown.querySelectorAll('.quick-search-section-checkbox[data-is-all="false"]');

            if (isAll) {
                // If "All" is checked, uncheck all individual sections
                if (checkbox.checked) {
                    sectionCheckboxes.forEach(cb => cb.checked = false);
                    this.selectedSections = [];
                }
            } else {
                // If an individual section is checked/unchecked
                if (checkbox.checked) {
                    // Uncheck "All"
                    if (allCheckbox) allCheckbox.checked = false;
                    this.selectedSections.push(checkbox.value);
                } else {
                    // Remove from selected
                    this.selectedSections = this.selectedSections.filter(handle => handle !== checkbox.value);

                    // If no sections selected, check "All"
                    if (this.selectedSections.length === 0 && allCheckbox) {
                        allCheckbox.checked = true;
                    }
                }
            }

            this.updateSectionFilterText();

            // Trigger search if there's a query
            if (this.input && this.input.value.length >= this.settings.minSearchLength) {
                this.search(this.input.value);
            }
        }

        updateSectionFilterText() {
            if (!this.sectionFilterBtn) return;

            const textSpan = this.sectionFilterBtn.querySelector('.quick-search-section-filter-text');
            if (!textSpan) return;

            if (this.selectedSections.length === 0) {
                textSpan.textContent = this.t.allSections || 'All Sections';
            } else if (this.selectedSections.length === 1) {
                const section = this.sections.find(s => s && s.handle === this.selectedSections[0]);
                textSpan.textContent = section ? section.name : (this.t.oneSection || '1 Section');
            } else {
                const countText = this.t.sectionsCount || '{count} Sections';
                textSpan.textContent = countText.replace('{count}', this.selectedSections.length);
            }
        }

        toggleSectionDropdown() {
            if (this.sectionFilterDropdown) {
                const isActive = this.sectionFilterDropdown.classList.toggle('active');
                // Toggle section filter button highlight
                if (this.sectionFilterBtn) {
                    this.sectionFilterBtn.classList.toggle('active', isActive);
                }
            }
            this.hideResults();
            this.hideHistory();
            this.hideBackPopup();
            this.hideSiteDropdown();
        }

        hideSectionDropdown() {
            if (this.sectionFilterDropdown) {
                this.sectionFilterDropdown.classList.remove('active');
            }
            // Remove section filter button highlight
            if (this.sectionFilterBtn) {
                this.sectionFilterBtn.classList.remove('active');
            }
        }

        async loadSites() {
            if (!this.isMultiSite) return;

            try {
                const response = await fetch(Craft.getActionUrl('quick-search/search/sites'), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.sites) {
                    this.sites = data.sites;
                    this.populateSiteFilter();
                }
            } catch (error) {
                console.error('Quick Search: Error loading sites', error);
            }
        }

        populateSiteFilter() {
            if (!this.siteFilterDropdown) return;

            // Clear existing items
            this.siteFilterDropdown.innerHTML = '';

            // Create "Current Site" option (default)
            const currentSiteOption = this.createSiteOption(null, this.t.currentSite || 'Current Site', true);
            this.siteFilterDropdown.appendChild(currentSiteOption);

            // Create individual site options
            if (Array.isArray(this.sites)) {
                this.sites.forEach(site => {
                    if (site && site.id && site.name) {
                        const option = this.createSiteOption(site.id, site.name, false);
                        this.siteFilterDropdown.appendChild(option);
                    }
                });
            }

            // Create "All Sites" option (last)
            const allSitesOption = this.createSiteOption('*', this.t.allSites || 'All Sites', false);
            this.siteFilterDropdown.appendChild(allSitesOption);
        }

        createSiteOption(siteId, name, isDefault) {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'quick-search-site-option';
            if (isDefault) option.classList.add('selected');
            option.dataset.siteId = siteId === null ? '' : siteId;
            option.textContent = name;

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectSite(siteId, name);
            });

            return option;
        }

        selectSite(siteId, name) {
            this.selectedSiteId = siteId;

            // Update button text
            if (this.siteFilterBtn) {
                const textSpan = this.siteFilterBtn.querySelector('.quick-search-site-filter-text');
                if (textSpan) {
                    textSpan.textContent = name;
                }
            }

            // Update selected state in dropdown
            if (this.siteFilterDropdown) {
                const options = this.siteFilterDropdown.querySelectorAll('.quick-search-site-option');
                options.forEach(opt => {
                    const optSiteId = opt.dataset.siteId === '' ? null : (opt.dataset.siteId === '*' ? '*' : parseInt(opt.dataset.siteId));
                    opt.classList.toggle('selected', optSiteId === siteId);
                });
            }

            this.hideSiteDropdown();

            // Trigger search if there's a query
            if (this.input && this.input.value.length >= this.settings.minSearchLength) {
                this.search(this.input.value);
            }
        }

        toggleSiteDropdown() {
            if (this.siteFilterDropdown) {
                const isActive = this.siteFilterDropdown.classList.toggle('active');
                // Toggle site filter button highlight
                if (this.siteFilterBtn) {
                    this.siteFilterBtn.classList.toggle('active', isActive);
                }
            }
            this.hideResults();
            this.hideHistory();
            this.hideBackPopup();
            this.hideSectionDropdown();
        }

        hideSiteDropdown() {
            if (this.siteFilterDropdown) {
                this.siteFilterDropdown.classList.remove('active');
            }
            // Remove site filter button highlight
            if (this.siteFilterBtn) {
                this.siteFilterBtn.classList.remove('active');
            }
        }

        // Check if we should show site badges (only when "All Sites" is selected)
        shouldShowSiteBadges() {
            return this.isMultiSite && this.selectedSiteId === '*';
        }

        getCurrentEntryId() {
            try {
                const match = window.location.pathname.match(/\/entries\/[^/]+\/(\d+)/);
                return match ? parseInt(match[1]) : null;
            } catch (e) {
                return null;
            }
        }

        getCurrentSiteHandle() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get('site') || null;
            } catch (e) {
                return null;
            }
        }

        async loadLastVisited() {
            try {
                const actionUrl = Craft.getActionUrl('quick-search/history/index');
                const response = await fetch(actionUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.history && data.history.length > 0) {
                    const currentEntryId = this.getCurrentEntryId();
                    const currentSiteHandle = this.getCurrentSiteHandle();

                    // Find previous entry that's not the current entry+site combination
                    const previousEntry = data.history.find(entry => {
                        if (!entry) return false;
                        // Different entry ID = different entry
                        if (entry.id !== currentEntryId) return true;
                        // Same entry ID but different site = also valid (different page)
                        if (currentSiteHandle && entry.site?.handle !== currentSiteHandle) return true;
                        return false;
                    });

                    if (previousEntry && this.backBtn) {
                        this.lastVisitedEntry = previousEntry;
                        this.backBtn.disabled = false;
                        this.backBtn.title = `${this.t.goToLastVisited || 'Go to last visited entry'}: ${this.lastVisitedEntry.title || ''}`;
                    }
                }
            } catch (error) {
                console.error('Quick Search: Error loading last visited', error);
            }
        }

        async search(query) {
            const params = new URLSearchParams({
                query: query
            });

            if (this.selectedSections.length > 0) {
                params.append('sections', this.selectedSections.join(','));
            }

            // Include site filter - always send siteId
            // null = current site (use currentSiteId), '*' = all sites, number = specific site
            if (this.selectedSiteId === null) {
                params.append('siteId', this.currentSiteId);
            } else {
                params.append('siteId', this.selectedSiteId);
            }

            this.showLoading();

            try {
                const actionUrl = Craft.getActionUrl('quick-search/search/index');
                const separator = actionUrl.includes('?') ? '&' : '?';
                const response = await fetch(actionUrl + separator + params, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.currentResults = data.results || [];
                    this.renderResults(this.currentResults);
                    this.selectedIndex = -1;
                } else {
                    this.showError(data.error || this.t.searchError || 'Search failed');
                }
            } catch (error) {
                console.error('Quick Search: Search error', error);
                this.showError(this.t.searchError || 'An error occurred while searching');
            }
        }

        renderResults(results) {
            if (!this.resultsContainer) return;

            this.resultsContainer.innerHTML = '';

            if (!results || results.length === 0) {
                this.resultsContainer.innerHTML = `<div class="quick-search-no-results">${this.t.noEntriesFound || 'No entries found'}</div>`;
                this.showResults();
                return;
            }

            const list = document.createElement('ul');
            list.className = 'quick-search-results-list';
            list.setAttribute('role', 'listbox');
            list.setAttribute('aria-label', this.t.searchResults || 'Search Results');

            results.forEach((entry, index) => {
                try {
                    const item = this.createResultItem(entry, index);
                    if (item) {
                        list.appendChild(item);
                    }
                } catch (e) {
                    console.error('Quick Search: Error rendering result item', e);
                }
            });

            this.resultsContainer.appendChild(list);
            this.showResults();
        }

        createResultItem(entry, index) {
            if (!entry) return null;

            const isFavorite = this.currentFavorites.some(f => f.id === entry.id && f.siteId === entry.siteId);

            const item = document.createElement('li');
            item.className = 'quick-search-result-item';
            item.dataset.index = index;
            item.dataset.entryId = entry.id;
            item.dataset.siteId = entry.siteId || this.currentSiteId;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.id = `quick-search-result-item-${index}`;

            const content = document.createElement('div');
            content.className = 'quick-search-result-content';

            const title = document.createElement('div');
            title.className = 'quick-search-result-title';
            title.textContent = entry.title || '';
            title.title = entry.title || ''; // Show full title on hover

            const meta = document.createElement('div');
            meta.className = 'quick-search-result-meta';

            const section = document.createElement('span');
            section.className = 'quick-search-result-section';
            section.textContent = entry.section?.name || '';

            // Show site badge when "All Sites" is selected
            if (this.shouldShowSiteBadges() && entry.site) {
                const siteBadge = document.createElement('span');
                siteBadge.className = 'quick-search-site-badge';
                siteBadge.textContent = entry.site.name || '';
                meta.appendChild(siteBadge);
            }

            const status = document.createElement('span');
            status.className = `quick-search-result-status ${entry.status || ''}`;
            status.textContent = entry.status || '';
            if (entry.status) {
                status.title = this.getStatusTooltip(entry.status);
            }

            meta.appendChild(section);
            meta.appendChild(status);

            content.appendChild(title);
            content.appendChild(meta);

            // Star (favorite) button
            const starBtn = document.createElement('button');
            starBtn.type = 'button';
            starBtn.className = 'quick-search-star-btn' + (isFavorite ? ' active' : '');
            starBtn.title = isFavorite
                ? (this.t.removeFromFavorites || 'Remove from favorites')
                : (this.t.addToFavorites || 'Add to favorites');
            starBtn.innerHTML = isFavorite
                ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(entry.id, entry.siteId, starBtn);
            });

            // New tab button
            const newTabBtn = document.createElement('button');
            newTabBtn.type = 'button';
            newTabBtn.className = 'quick-search-newtab-btn';
            newTabBtn.title = this.t.openInNewTab || 'Open in new tab';
            newTabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';
            newTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (entry.url) {
                    window.open(entry.url, '_blank');
                }
            });

            item.appendChild(content);
            item.appendChild(starBtn);
            item.appendChild(newTabBtn);

            item.addEventListener('click', () => {
                this.navigateToEntry(entry);
            });

            return item;
        }

        async toggleHistory() {
            if (this.currentPopupView === 'history') {
                this.hideHistory();
            } else {
                await this.showHistory();
            }
        }

        async toggleFavorites() {
            if (this.currentPopupView === 'favorites') {
                this.hideHistory();
            } else {
                await this.showFavoritesOnly();
            }
        }

        toggleBackPopup() {
            if (this.currentPopupView === 'back') {
                this.hideBackPopup();
            } else {
                this.showBackPopup();
            }
        }

        showBackPopup() {
            if (!this.backPopup || !this.lastVisitedEntry) return;

            this.hideResults();
            this.hideSectionDropdown();
            this.hideHistory();

            this.backPopup.innerHTML = '';

            // Create the entry item
            const item = this.createHistoryItem(this.lastVisitedEntry, 0, false);
            if (item) {
                this.backPopup.appendChild(item);
            }

            this.backPopup.classList.add('active');
            this.currentPopupView = 'back';

            // Highlight back button
            if (this.backBtn) {
                this.backBtn.classList.add('active');
            }
        }

        hideBackPopup() {
            if (this.backPopup) {
                this.backPopup.classList.remove('active');
            }
            if (this.currentPopupView === 'back') {
                this.currentPopupView = null;
            }

            // Remove back button highlight
            if (this.backBtn) {
                this.backBtn.classList.remove('active');
            }
        }

        async showFavoritesOnly() {
            this.hideResults();
            this.hideSectionDropdown();
            this.hideBackPopup();
            this.clearHistoryButtonHighlights();

            try {
                const response = await fetch(Craft.getActionUrl('quick-search/favorites/list'), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.currentFavorites = data.favorites || [];
                    this.renderFavoritesOnly(this.currentFavorites);
                    if (this.historyPopup) {
                        this.historyPopup.classList.add('active');
                        this.currentPopupView = 'favorites';
                    }
                    // Highlight favorites button
                    if (this.favoritesBtn) {
                        this.favoritesBtn.classList.add('active');
                    }
                } else {
                    console.error('Quick Search: Error loading favorites', data.error);
                }
            } catch (error) {
                console.error('Quick Search: Error loading favorites', error);
            }
        }

        renderFavoritesOnly(favorites) {
            if (!this.historyPopup) return;

            this.historyPopup.innerHTML = '';

            // Create header
            const header = document.createElement('div');
            header.className = 'quick-search-history-header';

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'quick-search-history-title-wrapper';

            const titleText = document.createElement('h3');
            titleText.className = 'quick-search-history-title-text';
            titleText.textContent = this.t.favorites || 'Favorites';

            titleWrapper.appendChild(titleText);
            header.appendChild(titleWrapper);
            this.historyPopup.appendChild(header);

            // Store items for keyboard navigation
            this.currentHistoryItems = favorites || [];
            this.historySelectedIndex = -1;

            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'quick-search-history-content';

            if (!favorites || favorites.length === 0) {
                const noFavorites = document.createElement('div');
                noFavorites.className = 'quick-search-no-history';
                noFavorites.textContent = this.t.noFavorites || 'No favorites yet';
                contentContainer.appendChild(noFavorites);
            } else {
                const list = document.createElement('ul');
                list.className = 'quick-search-history-list';
                list.setAttribute('role', 'listbox');
                list.setAttribute('aria-label', this.t.favorites || 'Favorites');

                favorites.forEach((entry, index) => {
                    try {
                        const item = this.createHistoryItem(entry, index, true);
                        if (item) {
                            list.appendChild(item);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error rendering favorite item', e);
                    }
                });

                contentContainer.appendChild(list);
            }

            this.historyPopup.appendChild(contentContainer);
        }

        async showHistory(query = '', showAll = false) {
            this.hideResults();
            this.hideSectionDropdown();
            this.hideBackPopup();
            this.clearHistoryButtonHighlights();

            const limit = showAll ? this.historyFullLimit : this.historyInitialLimit;
            const params = new URLSearchParams();
            if (query) params.append('query', query);
            params.append('limit', limit.toString());

            try {
                const historyUrl = Craft.getActionUrl('quick-search/history/index');
                const response = await fetch(historyUrl + (historyUrl.includes('?') ? '&' : '?') + params.toString(), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.historyExpanded = showAll;
                    this.renderHistory(data.history || [], showAll, query);
                    if (this.historyPopup) {
                        this.historyPopup.classList.add('active');
                        this.currentPopupView = 'history';
                    }
                    // Highlight history button
                    if (this.historyBtn) {
                        this.historyBtn.classList.add('active');
                    }
                } else {
                    console.error('Quick Search: Error loading history', data.error);
                }
            } catch (error) {
                console.error('Quick Search: Error loading history', error);
            }
        }

        renderHistory(history, isExpanded = false, currentQuery = '') {
            if (!this.historyPopup) return;

            this.historyPopup.innerHTML = '';

            // Create header
            const header = document.createElement('div');
            header.className = 'quick-search-history-header';

            // Title and clear button wrapper
            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'quick-search-history-title-wrapper';

            const titleText = document.createElement('h3');
            titleText.className = 'quick-search-history-title-text';
            titleText.textContent = this.t.recentEntries || 'Recent Entries';

            // Clear history button
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'quick-search-history-clear-btn';
            clearBtn.title = this.t.clearHistory || 'Clear history';
            clearBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmClearHistory();
            });

            titleWrapper.appendChild(titleText);
            titleWrapper.appendChild(clearBtn);

            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'quick-search-history-search';
            searchInput.placeholder = this.t.filterHistory || 'Filter history...';

            let searchTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    this.showHistory(e.target.value);
                }, 300);
            });

            header.appendChild(titleWrapper);
            header.appendChild(searchInput);
            this.historyPopup.appendChild(header);

            // Store history items for keyboard navigation
            this.currentHistoryItems = history || [];
            this.historySelectedIndex = -1;

            // Create content container for history
            const contentContainer = document.createElement('div');
            contentContainer.className = 'quick-search-history-content';

            // Render history section
            if (!history || history.length === 0) {
                const noHistory = document.createElement('div');
                noHistory.className = 'quick-search-no-history';
                noHistory.textContent = this.t.noRecentEntries || 'No recent entries';
                contentContainer.appendChild(noHistory);
            } else {
                const list = document.createElement('ul');
                list.className = 'quick-search-history-list';
                list.setAttribute('role', 'listbox');
                list.setAttribute('aria-label', this.t.recentEntries || 'Recent Entries');

                history.forEach((entry, index) => {
                    try {
                        const item = this.createHistoryItem(entry, index, false);
                        if (item) {
                            list.appendChild(item);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error rendering history item', e);
                    }
                });

                contentContainer.appendChild(list);
            }

            this.historyPopup.appendChild(contentContainer);

            // Add "Show more" button if not expanded and we have the initial limit of items
            if (!isExpanded && history.length >= this.historyInitialLimit && !currentQuery) {
                const showMoreBtn = document.createElement('button');
                showMoreBtn.type = 'button';
                showMoreBtn.className = 'quick-search-show-more-btn';
                showMoreBtn.textContent = this.t.showMore || 'Show more...';
                showMoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showHistory('', true);
                });
                this.historyPopup.appendChild(showMoreBtn);
            }
        }

        createHistoryItem(entry, index = 0, isFavorite = false) {
            if (!entry) return null;

            const item = document.createElement('li');
            item.className = 'quick-search-history-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.id = `quick-search-history-item-${index}`;
            item.dataset.entryId = entry.id;
            item.dataset.siteId = entry.siteId || this.currentSiteId;

            const content = document.createElement('div');
            content.className = 'quick-search-history-item-content';

            const title = document.createElement('div');
            title.className = 'quick-search-history-title';
            title.textContent = entry.title || '';
            title.title = entry.title || ''; // Show full title on hover

            const meta = document.createElement('div');
            meta.className = 'quick-search-history-meta';

            const section = document.createElement('span');
            section.className = 'quick-search-history-section';
            section.textContent = entry.section?.name || '';

            // Show site badge for history/favorites in multi-site mode (entries can be from any site)
            if (this.isMultiSite && entry.site) {
                const siteBadge = document.createElement('span');
                siteBadge.className = 'quick-search-site-badge';
                siteBadge.textContent = entry.site.name || '';
                meta.appendChild(siteBadge);
            }

            const status = document.createElement('span');
            status.className = `quick-search-history-status ${entry.status || ''}`;
            status.textContent = entry.status || '';
            if (entry.status) {
                status.title = this.getStatusTooltip(entry.status);
            }

            meta.appendChild(section);
            meta.appendChild(status);

            content.appendChild(title);
            content.appendChild(meta);

            // Star (favorite) button
            const starBtn = document.createElement('button');
            starBtn.type = 'button';
            starBtn.className = 'quick-search-star-btn' + (isFavorite ? ' active' : '');
            starBtn.title = isFavorite
                ? (this.t.removeFromFavorites || 'Remove from favorites')
                : (this.t.addToFavorites || 'Add to favorites');
            starBtn.innerHTML = isFavorite
                ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(entry.id, entry.siteId, starBtn);
            });

            // New tab button
            const newTabBtn = document.createElement('button');
            newTabBtn.type = 'button';
            newTabBtn.className = 'quick-search-newtab-btn';
            newTabBtn.title = this.t.openInNewTab || 'Open in new tab';
            newTabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';
            newTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (entry.url) {
                    window.open(entry.url, '_blank');
                }
            });

            item.appendChild(content);
            item.appendChild(starBtn);
            item.appendChild(newTabBtn);

            item.addEventListener('click', () => {
                this.navigateToEntry(entry);
            });

            return item;
        }

        getStatusTooltip(status) {
            const statusMap = {
                'live': this.t.statusLive || 'Status: Live',
                'draft': this.t.statusDraft || 'Status: Draft',
                'pending': this.t.statusPending || 'Status: Pending',
                'disabled': this.t.statusDisabled || 'Status: Disabled',
                'expired': this.t.statusExpired || 'Status: Expired'
            };
            return statusMap[status] || `Status: ${status}`;
        }

        confirmClearHistory() {
            const confirmMsg = this.t.clearHistoryConfirm || 'Clear all history?\n\nThis will remove all your recent entry visits. This action cannot be undone.';
            if (confirm(confirmMsg)) {
                this.clearHistory();
            }
        }

        async clearHistory() {
            try {
                const actionUrl = Craft.getActionUrl('quick-search/history/clear');
                const response = await fetch(actionUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': Craft.csrfTokenValue || ''
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Update the history popup to show empty state
                    this.currentHistoryItems = [];
                    this.renderHistory([], false, '');
                    // Disable the back button as there's no history
                    if (this.backBtn) {
                        this.backBtn.disabled = true;
                        this.backBtn.title = this.t.goToLastVisited || 'Go to last visited entry';
                    }
                    this.lastVisitedEntry = null;
                } else {
                    console.error('Quick Search: Error clearing history', data.error);
                }
            } catch (error) {
                console.error('Quick Search: Error clearing history', error);
            }
        }

        async toggleFavorite(entryId, siteId, buttonEl) {
            const isCurrentlyFavorite = buttonEl.classList.contains('active');
            const action = isCurrentlyFavorite ? 'remove' : 'add';
            const listItem = buttonEl.closest('.quick-search-history-item, .quick-search-result-item');

            // Use provided siteId or fall back to current site
            const effectiveSiteId = siteId || this.currentSiteId;

            // Check if we're in the favorites-only view (opened via favorites button)
            const isInFavoritesView = this.historyPopup?.classList.contains('active') &&
                this.historyPopup.querySelector('.quick-search-history-title-text')?.textContent === (this.t.favorites || 'Favorites');

            try {
                const actionUrl = Craft.getActionUrl(`quick-search/favorites/${action}`);
                const response = await fetch(actionUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': Craft.csrfTokenValue || ''
                    },
                    body: JSON.stringify({ entryId: entryId, siteId: effectiveSiteId })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Update button state
                    if (data.isFavorite) {
                        buttonEl.classList.add('active');
                        buttonEl.title = this.t.removeFromFavorites || 'Remove from favorites';
                        buttonEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                    } else {
                        buttonEl.classList.remove('active');
                        buttonEl.title = this.t.addToFavorites || 'Add to favorites';
                        buttonEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
                    }

                    // Animate removal if unfavoriting from favorites view
                    if (!data.isFavorite && listItem && isInFavoritesView) {
                        // Update currentFavorites array
                        this.currentFavorites = this.currentFavorites.filter(f => f.id !== entryId);

                        // Add removing class to trigger animation
                        listItem.classList.add('removing');

                        // Remove element after animation completes
                        setTimeout(() => {
                            listItem.remove();

                            // If no more favorites, show empty state
                            if (this.currentFavorites.length === 0) {
                                this.renderFavoritesOnly([]);
                            }
                        }, 250);
                    }
                } else {
                    if (data.error) {
                        console.error('Quick Search: Error toggling favorite', data.error);
                    }
                }
            } catch (error) {
                console.error('Quick Search: Error toggling favorite', error);
            }
        }

        navigateToEntry(entry) {
            if (entry && entry.url) {
                window.location.href = entry.url;
            }
        }

        showResults() {
            this.hideHistory();
            this.hideSectionDropdown();
            this.hideBackPopup();
            if (this.resultsContainer) {
                this.resultsContainer.classList.add('active');
            }
        }

        hideResults() {
            clearTimeout(this.debounceTimer);
            if (this.resultsContainer) {
                this.resultsContainer.classList.remove('active');
            }
        }

        hideHistory() {
            if (this.historyPopup) {
                this.historyPopup.classList.remove('active');
            }
            this.currentPopupView = null;
            this.clearHistoryButtonHighlights();
        }

        clearHistoryButtonHighlights() {
            if (this.historyBtn) {
                this.historyBtn.classList.remove('active');
            }
            if (this.favoritesBtn) {
                this.favoritesBtn.classList.remove('active');
            }
        }

        showLoading() {
            if (this.resultsContainer) {
                this.resultsContainer.innerHTML = `<div class="quick-search-loading">${this.t.searching || 'Searching...'}</div>`;
                this.showResults();
            }
        }

        showError(message) {
            if (!this.resultsContainer) return;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'quick-search-no-results';
            errorDiv.textContent = message;
            this.resultsContainer.innerHTML = '';
            this.resultsContainer.appendChild(errorDiv);
            this.showResults();
        }
    }

    class RelatedEntriesOverlay {
        constructor() {
            this.overlay = null;
            this.modal = null;
            this.settings = window.QuickSearchSettings || {
                compactMode: false,
                translations: {}
            };
            this.t = this.settings.translations || {};
        }

        init() {
            try {
                this.createOverlay();
                this.bindEvents();
            } catch (error) {
                console.error('Quick Search: Error initializing related entries overlay', error);
            }
        }

        createOverlay() {
            // Create overlay backdrop
            this.overlay = document.createElement('div');
            this.overlay.className = 'quick-search-related-overlay';

            // Create modal container
            this.modal = document.createElement('div');
            this.modal.className = 'quick-search-related-modal';
            if (this.settings.compactMode) {
                this.modal.classList.add('compact');
            }

            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);
        }

        bindEvents() {
            // Use event delegation for the related entries button
            document.addEventListener('click', (e) => {
                try {
                    const btn = e.target.closest('.quick-search-related-btn');
                    if (btn) {
                        e.preventDefault();
                        const entryId = btn.dataset.entryId;
                        if (entryId) {
                            this.showRelatedEntries(parseInt(entryId));
                        }
                    }
                } catch (error) {
                    console.error('Quick Search: Error handling related entries button click', error);
                }
            });

            // Close on click outside modal
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) {
                        this.hide();
                    }
                });
            }

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('active')) {
                    this.hide();
                }
            });
        }

        async showRelatedEntries(entryId) {
            this.showLoading();
            this.show();

            try {
                const params = new URLSearchParams({ entryId: entryId.toString() });
                const actionUrl = Craft.getActionUrl('quick-search/related-entries/index');
                const separator = actionUrl.includes('?') ? '&' : '?';

                const response = await fetch(actionUrl + separator + params, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.renderRelatedEntries(data.outgoing || [], data.incoming || []);
                } else {
                    this.showError(data.error || this.t.relatedEntriesError || 'An error occurred while fetching related entries.');
                }
            } catch (error) {
                console.error('Quick Search: Error fetching related entries', error);
                this.showError(this.t.relatedEntriesError || 'An error occurred while fetching related entries.');
            }
        }

        renderRelatedEntries(outgoing, incoming) {
            if (!this.modal) return;

            this.modal.innerHTML = '';

            // Create header
            const header = document.createElement('div');
            header.className = 'quick-search-related-header';

            const title = document.createElement('h2');
            title.className = 'quick-search-related-title';
            title.textContent = this.t.relatedEntries || 'Related Entries';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'quick-search-related-close';
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            closeBtn.addEventListener('click', () => this.hide());

            header.appendChild(title);
            header.appendChild(closeBtn);
            this.modal.appendChild(header);

            // Create content container
            const content = document.createElement('div');
            content.className = 'quick-search-related-content';

            // Check if there are any related entries
            if ((!outgoing || outgoing.length === 0) && (!incoming || incoming.length === 0)) {
                const noResults = document.createElement('div');
                noResults.className = 'quick-search-related-empty';
                noResults.textContent = this.t.noRelatedEntries || 'No related entries found';
                content.appendChild(noResults);
            } else {
                // Outgoing section (Links to)
                if (outgoing && outgoing.length > 0) {
                    const outgoingSection = this.createSection(
                        this.t.linksTo || 'Links to',
                        outgoing
                    );
                    content.appendChild(outgoingSection);
                }

                // Incoming section (Linked from)
                if (incoming && incoming.length > 0) {
                    const incomingSection = this.createSection(
                        this.t.linkedFrom || 'Linked from',
                        incoming
                    );
                    content.appendChild(incomingSection);
                }
            }

            this.modal.appendChild(content);
        }

        createSection(title, entries) {
            const section = document.createElement('div');
            section.className = 'quick-search-related-section';

            const sectionHeader = document.createElement('h3');
            sectionHeader.className = 'quick-search-related-section-title';
            sectionHeader.textContent = `${title} (${entries.length})`;
            section.appendChild(sectionHeader);

            const list = document.createElement('ul');
            list.className = 'quick-search-related-list';

            entries.forEach(entry => {
                try {
                    const item = this.createEntryItem(entry);
                    if (item) {
                        list.appendChild(item);
                    }
                } catch (e) {
                    console.error('Quick Search: Error rendering related entry item', e);
                }
            });

            section.appendChild(list);
            return section;
        }

        createEntryItem(entry) {
            if (!entry) return null;

            const item = document.createElement('li');
            item.className = 'quick-search-related-item';

            const content = document.createElement('a');
            content.href = entry.url || '#';
            content.className = 'quick-search-related-item-content';

            const titleEl = document.createElement('div');
            titleEl.className = 'quick-search-related-item-title';
            titleEl.textContent = entry.title || '';

            const meta = document.createElement('div');
            meta.className = 'quick-search-related-item-meta';

            const sectionEl = document.createElement('span');
            sectionEl.className = 'quick-search-related-item-section';
            sectionEl.textContent = entry.section?.name || '';

            const statusEl = document.createElement('span');
            statusEl.className = `quick-search-related-item-status ${entry.status || ''}`;
            statusEl.textContent = entry.status || '';
            if (entry.status) {
                statusEl.title = this.getStatusTooltip(entry.status);
            }

            meta.appendChild(sectionEl);
            meta.appendChild(statusEl);

            content.appendChild(titleEl);
            content.appendChild(meta);

            // New tab button
            const newTabBtn = document.createElement('button');
            newTabBtn.type = 'button';
            newTabBtn.className = 'quick-search-newtab-btn';
            newTabBtn.title = this.t.openInNewTab || 'Open in new tab';
            newTabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';
            newTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (entry.url) {
                    window.open(entry.url, '_blank');
                }
            });

            item.appendChild(content);
            item.appendChild(newTabBtn);

            return item;
        }

        getStatusTooltip(status) {
            const statusMap = {
                'live': this.t.statusLive || 'Status: Live',
                'draft': this.t.statusDraft || 'Status: Draft',
                'pending': this.t.statusPending || 'Status: Pending',
                'disabled': this.t.statusDisabled || 'Status: Disabled',
                'expired': this.t.statusExpired || 'Status: Expired'
            };
            return statusMap[status] || `Status: ${status}`;
        }

        showLoading() {
            if (this.modal) {
                this.modal.innerHTML = `<div class="quick-search-related-loading">${this.t.searching || 'Searching...'}</div>`;
            }
        }

        showError(message) {
            if (!this.modal) return;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'quick-search-related-error';
            errorDiv.textContent = message;
            this.modal.innerHTML = '';
            this.modal.appendChild(errorDiv);
        }

        show() {
            if (this.overlay) {
                this.overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        hide() {
            if (this.overlay) {
                this.overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    class EntryOutlinePopup {
        constructor() {
            this.popup = null;
            this.button = null;
            this.settings = window.QuickSearchSettings || {
                compactMode: false,
                translations: {}
            };
            this.t = this.settings.translations || {};
        }

        init() {
            try {
                this.createPopup();
                this.bindEvents();
            } catch (error) {
                console.error('Quick Search: Error initializing entry outline popup', error);
            }
        }

        createPopup() {
            // Create popup container
            this.popup = document.createElement('div');
            this.popup.className = 'quick-search-outline-popup';
            if (this.settings.compactMode) {
                this.popup.classList.add('compact');
            }
            document.body.appendChild(this.popup);
        }

        bindEvents() {
            // Use event delegation for the outline button
            document.addEventListener('click', (e) => {
                try {
                    const btn = e.target.closest('.quick-search-outline-btn');
                    if (btn) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.button = btn;
                        this.togglePopup();
                        return;
                    }

                    // Close popup if clicking outside
                    if (this.popup && this.popup.classList.contains('active') && !this.popup.contains(e.target)) {
                        this.hide();
                    }
                } catch (error) {
                    console.error('Quick Search: Error handling outline button click', error);
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.popup && this.popup.classList.contains('active')) {
                    this.hide();
                }
            });
        }

        togglePopup() {
            if (this.popup && this.popup.classList.contains('active')) {
                this.hide();
            } else {
                this.show();
            }
        }

        show() {
            if (!this.popup) return;

            try {
                // Scan DOM for blocks and build hierarchy
                const hierarchy = this.scanBlocksHierarchy();

                // Render the outline
                this.renderOutline(hierarchy);

                // Position popup near the button
                if (this.button) {
                    const rect = this.button.getBoundingClientRect();
                    this.popup.style.top = (rect.bottom + 8) + 'px';
                    this.popup.style.left = rect.left + 'px';
                }

                this.popup.classList.add('active');
            } catch (error) {
                console.error('Quick Search: Error showing outline popup', error);
            }
        }

        hide() {
            if (this.popup) {
                this.popup.classList.remove('active');
            }
        }

        scanBlocksHierarchy() {
            const allBlocks = document.querySelectorAll('.matrixblock[data-type-name]');
            const topLevelBlocks = [];
            const blockMap = new Map();

            // First pass: identify all blocks and their data
            allBlocks.forEach(block => {
                try {
                    const blockData = this.extractBlockData(block);
                    blockMap.set(block, blockData);
                } catch (e) {
                    console.error('Quick Search: Error extracting block data', e);
                }
            });

            // Second pass: build hierarchy
            allBlocks.forEach(block => {
                try {
                    const blockData = blockMap.get(block);
                    if (!blockData) return;

                    // Check if this block is nested inside another matrixblock
                    const parentBlock = block.parentElement ? block.parentElement.closest('.matrixblock[data-type-name]') : null;

                    if (parentBlock && blockMap.has(parentBlock)) {
                        // This is a nested block
                        const parentData = blockMap.get(parentBlock);
                        if (!parentData.children) {
                            parentData.children = [];
                        }
                        parentData.children.push(blockData);
                    } else {
                        // This is a top-level block
                        topLevelBlocks.push(blockData);
                    }
                } catch (e) {
                    console.error('Quick Search: Error building block hierarchy', e);
                }
            });

            // Third pass: assign indices to top-level blocks only
            topLevelBlocks.forEach((block, index) => {
                block.index = index + 1;
            });

            return topLevelBlocks;
        }

        extractBlockData(block) {
            const typeName = block.dataset.typeName || 'Block';
            const blockId = block.dataset.id;

            // Try to get the icon from the titlebar (direct child only)
            const titlebar = block.querySelector(':scope > .titlebar');
            let iconHtml = '';
            let iconColorClass = '';

            if (titlebar) {
                const iconEl = titlebar.querySelector('.cp-icon svg');
                if (iconEl) {
                    iconHtml = iconEl.outerHTML;
                }

                const iconContainer = titlebar.querySelector('.cp-icon');
                if (iconContainer && iconContainer.className) {
                    const classes = iconContainer.className.split(' ');
                    for (const cls of classes) {
                        if (cls !== 'cp-icon' && cls !== 'small') {
                            iconColorClass = cls;
                            break;
                        }
                    }
                }
            }

            return {
                element: block,
                typeName: typeName,
                blockId: blockId,
                iconHtml: iconHtml,
                iconColorClass: iconColorClass,
                children: []
            };
        }

        renderOutline(blocks) {
            if (!this.popup) return;

            this.popup.innerHTML = '';

            // Create header
            const header = document.createElement('div');
            header.className = 'quick-search-outline-header';

            const title = document.createElement('span');
            title.className = 'quick-search-outline-title';
            title.textContent = this.t.entryOutline || 'Entry Outline';

            // Header buttons container
            const headerBtns = document.createElement('div');
            headerBtns.className = 'quick-search-outline-header-btns';

            // Expand all button (two chevrons pointing away from each other: ↑ ↓)
            const expandAllBtn = document.createElement('button');
            expandAllBtn.type = 'button';
            expandAllBtn.className = 'quick-search-outline-expand-btn';
            expandAllBtn.title = 'Expand all blocks';
            expandAllBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9l7-7 7 7" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7 7 7-7" /></svg>';
            expandAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.expandAll();
            });

            // Collapse all button (two chevrons pointing towards each other with line in middle: ↓ — ↑)
            const collapseAllBtn = document.createElement('button');
            collapseAllBtn.type = 'button';
            collapseAllBtn.className = 'quick-search-outline-collapse-btn';
            collapseAllBtn.title = 'Collapse all blocks';
            collapseAllBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l7 4 7-4" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 12h12" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 21l7-4 7 4" /></svg>';
            collapseAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.collapseAll();
            });

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'quick-search-outline-close';
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });

            headerBtns.appendChild(expandAllBtn);
            headerBtns.appendChild(collapseAllBtn);
            headerBtns.appendChild(closeBtn);

            header.appendChild(title);
            header.appendChild(headerBtns);
            this.popup.appendChild(header);

            // Create content
            const content = document.createElement('div');
            content.className = 'quick-search-outline-content';

            if (!blocks || blocks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'quick-search-outline-empty';
                empty.textContent = this.t.noBlocksFound || 'No blocks found';
                content.appendChild(empty);
            } else {
                const list = document.createElement('ul');
                list.className = 'quick-search-outline-list';

                blocks.forEach(block => {
                    try {
                        const item = this.createOutlineItem(block, 0);
                        if (item) {
                            list.appendChild(item);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error creating outline item', e);
                    }
                });

                content.appendChild(list);
            }

            this.popup.appendChild(content);
        }

        createOutlineItem(block, depth) {
            if (!block) return null;

            const item = document.createElement('li');
            item.className = 'quick-search-outline-item';
            if (depth > 0) {
                item.classList.add('quick-search-outline-item-nested');
                item.style.setProperty('--depth', depth);
            }

            const hasChildren = block.children && block.children.length > 0;

            const row = document.createElement('div');
            row.className = 'quick-search-outline-item-row';

            // Chevron toggle (only for items with children)
            if (hasChildren) {
                const chevron = document.createElement('button');
                chevron.type = 'button';
                chevron.className = 'quick-search-outline-chevron';
                chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>';
                chevron.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleChildren(item);
                });
                row.appendChild(chevron);
            } else {
                const spacer = document.createElement('span');
                spacer.className = 'quick-search-outline-chevron-spacer';
                row.appendChild(spacer);
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-search-outline-item-btn';

            // Index number (only for top-level)
            if (depth === 0 && block.index) {
                const indexEl = document.createElement('span');
                indexEl.className = 'quick-search-outline-item-index';
                indexEl.textContent = block.index;
                button.appendChild(indexEl);
            }

            // Icon
            const iconWrapper = document.createElement('span');
            iconWrapper.className = 'quick-search-outline-item-icon';
            if (block.iconColorClass) {
                iconWrapper.classList.add(block.iconColorClass);
            }
            if (block.iconHtml) {
                iconWrapper.innerHTML = block.iconHtml;
            }

            // Type name
            const nameEl = document.createElement('span');
            nameEl.className = 'quick-search-outline-item-name';
            nameEl.textContent = block.typeName || '';

            button.appendChild(iconWrapper);
            button.appendChild(nameEl);

            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToBlock(block.element);
                this.hide();
            });

            row.appendChild(button);
            item.appendChild(row);

            // Add children list (hidden by default)
            if (hasChildren) {
                const childList = document.createElement('ul');
                childList.className = 'quick-search-outline-children';

                block.children.forEach(child => {
                    try {
                        const childItem = this.createOutlineItem(child, depth + 1);
                        if (childItem) {
                            childList.appendChild(childItem);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error creating child outline item', e);
                    }
                });

                item.appendChild(childList);
            }

            return item;
        }

        toggleChildren(item) {
            if (item) {
                item.classList.toggle('expanded');
            }
        }

        expandAll() {
            // Check if jQuery is available
            if (typeof jQuery === 'undefined') {
                console.error('Quick Search: jQuery not available for expand/collapse');
                return;
            }

            try {
                // Expand all collapsed Matrix blocks using Craft's entry object
                const blocks = document.querySelectorAll('.matrixblock.collapsed');
                blocks.forEach((block) => {
                    try {
                        const entry = jQuery(block).data('entry');
                        if (entry && typeof entry.expand === 'function') {
                            entry.expand();
                        }
                    } catch (e) {
                        console.error('Quick Search: Error expanding block', e);
                    }
                });
            } catch (error) {
                console.error('Quick Search: Error in expandAll', error);
            }
        }

        collapseAll() {
            // Check if jQuery is available
            if (typeof jQuery === 'undefined') {
                console.error('Quick Search: jQuery not available for expand/collapse');
                return;
            }

            try {
                // Collapse all expanded Matrix blocks using Craft's entry object
                const blocks = document.querySelectorAll('.matrixblock:not(.collapsed)');
                blocks.forEach((block) => {
                    try {
                        const entry = jQuery(block).data('entry');
                        if (entry && typeof entry.collapse === 'function') {
                            entry.collapse(true);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error collapsing block', e);
                    }
                });
            } catch (error) {
                console.error('Quick Search: Error in collapseAll', error);
            }
        }

        scrollToBlock(element) {
            if (!element) return;

            try {
                // Scroll to the block
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add highlight class
                element.classList.add('quick-search-outline-highlight');

                // Remove highlight after animation
                setTimeout(() => {
                    if (element) {
                        element.classList.remove('quick-search-outline-highlight');
                    }
                }, 1500);
            } catch (error) {
                console.error('Quick Search: Error scrolling to block', error);
            }
        }
    }
})();
