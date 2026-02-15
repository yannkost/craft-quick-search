/**
 * Quick Search - Filters Module
 * Handles section, site filter functionality, and search type tabs
 */

window.QuickSearchFilters = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    /**
     * Load sections from server
     * @param {object} instance - QuickSearch instance
     */
    async function loadSections(instance) {
        try {
            const response = await utils.fetchWithTimeout(Craft.getActionUrl('quick-search/search/sections'), {
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
                instance.sections = data.sections;
                populateSectionFilter(instance);
            }
        } catch (error) {
            console.error('Quick Search: Error loading sections', error);
        }
    }

    /**
     * Populate section filter dropdown
     * @param {object} instance - QuickSearch instance
     */
    function populateSectionFilter(instance) {
        if (!instance.sectionFilterDropdown) return;

        instance.sectionFilterDropdown.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'quick-search-section-header';
        const allItem = createSectionCheckbox(instance, null, instance.t.allSections || 'All Sections', true);
        header.appendChild(allItem);
        instance.sectionFilterDropdown.appendChild(header);

        const list = document.createElement('div');
        list.className = 'quick-search-section-list';

        if (Array.isArray(instance.sections)) {
            instance.sections.forEach(section => {
                if (section && section.handle && section.name) {
                    const item = createSectionCheckbox(instance, section.handle, section.name, false);
                    list.appendChild(item);
                }
            });
        }

        instance.sectionFilterDropdown.appendChild(list);
    }

    /**
     * Create a section checkbox element
     * @param {object} instance - QuickSearch instance
     * @param {string|null} sectionHandle - Section handle or null for "All"
     * @param {string} name - Display name
     * @param {boolean} isAll - Whether this is the "All Sections" option
     * @returns {HTMLElement}
     */
    function createSectionCheckbox(instance, sectionHandle, name, isAll) {
        const label = document.createElement('label');
        label.className = 'quick-search-section-item';
        if (isAll) label.classList.add('quick-search-section-item-all');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'quick-search-section-checkbox';
        checkbox.value = sectionHandle || '';
        checkbox.checked = isAll;
        checkbox.dataset.isAll = isAll ? 'true' : 'false';

        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            handleSectionCheckboxChange(instance, checkbox, isAll);
        });

        const text = document.createElement('span');
        text.className = 'quick-search-section-name';
        text.textContent = name;

        label.appendChild(checkbox);
        label.appendChild(text);

        return label;
    }

    /**
     * Handle section checkbox change
     * @param {object} instance - QuickSearch instance
     * @param {HTMLInputElement} checkbox - The changed checkbox
     * @param {boolean} isAll - Whether this is the "All Sections" option
     */
    function handleSectionCheckboxChange(instance, checkbox, isAll) {
        if (!instance.sectionFilterDropdown) return;

        const allCheckbox = instance.sectionFilterDropdown.querySelector('.quick-search-section-checkbox[data-is-all="true"]');
        const sectionCheckboxes = instance.sectionFilterDropdown.querySelectorAll('.quick-search-section-checkbox[data-is-all="false"]');

        if (isAll) {
            if (checkbox.checked) {
                sectionCheckboxes.forEach(cb => cb.checked = false);
                instance.selectedSections = [];
            }
        } else {
            if (checkbox.checked) {
                if (allCheckbox) allCheckbox.checked = false;
                instance.selectedSections.push(checkbox.value);
            } else {
                instance.selectedSections = instance.selectedSections.filter(handle => handle !== checkbox.value);

                if (instance.selectedSections.length === 0 && allCheckbox) {
                    allCheckbox.checked = true;
                }
            }
        }

        updateSectionFilterText(instance);

        if (instance.input && instance.input.value.length >= instance.settings.minSearchLength) {
            instance.search(instance.input.value);
        }
    }

    /**
     * Update section filter button text
     * @param {object} instance - QuickSearch instance
     */
    function updateSectionFilterText(instance) {
        if (!instance.sectionFilterBtn) return;

        const textSpan = instance.sectionFilterBtn.querySelector('.quick-search-section-filter-text');
        if (!textSpan) return;

        if (instance.selectedSections.length === 0) {
            textSpan.textContent = instance.t.allSections || 'All Sections';
        } else if (instance.selectedSections.length === 1) {
            const section = instance.sections.find(s => s && s.handle === instance.selectedSections[0]);
            textSpan.textContent = section ? section.name : (instance.t.oneSection || '1 Section');
        } else {
            const countText = instance.t.sectionsCount || '{count} Sections';
            textSpan.textContent = countText.replace('{count}', instance.selectedSections.length);
        }
    }

    /**
     * Toggle section dropdown visibility
     * @param {object} instance - QuickSearch instance
     */
    function toggleSectionDropdown(instance) {
        if (instance.sectionFilterDropdown) {
            const isActive = instance.sectionFilterDropdown.classList.toggle('active');
            if (instance.sectionFilterBtn) {
                instance.sectionFilterBtn.classList.toggle('active', isActive);
            }
        }
        instance.hideResults();
        instance.hideHistory();
        instance.hideBackPopup();
        hideSiteDropdown(instance);
    }

    /**
     * Hide section dropdown
     * @param {object} instance - QuickSearch instance
     */
    function hideSectionDropdown(instance) {
        if (instance.sectionFilterDropdown) {
            instance.sectionFilterDropdown.classList.remove('active');
        }
        if (instance.sectionFilterBtn) {
            instance.sectionFilterBtn.classList.remove('active');
        }
    }

    /**
     * Load sites from server
     * @param {object} instance - QuickSearch instance
     */
    async function loadSites(instance) {
        if (!instance.isMultiSite) return;

        try {
            const response = await utils.fetchWithTimeout(Craft.getActionUrl('quick-search/search/sites'), {
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
                instance.sites = data.sites;
                populateSiteFilter(instance);
            }
        } catch (error) {
            console.error('Quick Search: Error loading sites', error);
        }
    }

    /**
     * Populate site filter dropdown
     * @param {object} instance - QuickSearch instance
     */
    function populateSiteFilter(instance) {
        if (!instance.siteFilterDropdown) return;

        instance.siteFilterDropdown.innerHTML = '';

        const currentSiteOption = createSiteOption(instance, null, instance.t.currentSite || 'Current Site', true);
        instance.siteFilterDropdown.appendChild(currentSiteOption);

        if (Array.isArray(instance.sites)) {
            instance.sites.forEach(site => {
                if (site && site.id && site.name) {
                    const option = createSiteOption(instance, site.id, site.name, false);
                    instance.siteFilterDropdown.appendChild(option);
                }
            });
        }

        const allSitesOption = createSiteOption(instance, '*', instance.t.allSites || 'All Sites', false);
        instance.siteFilterDropdown.appendChild(allSitesOption);
    }

    /**
     * Create a site option element
     * @param {object} instance - QuickSearch instance
     * @param {number|string|null} siteId - Site ID, '*' for all, or null for current
     * @param {string} name - Display name
     * @param {boolean} isDefault - Whether this is the default option
     * @returns {HTMLElement}
     */
    function createSiteOption(instance, siteId, name, isDefault) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'quick-search-site-option';
        if (isDefault) option.classList.add('selected');
        option.dataset.siteId = siteId === null ? '' : siteId;
        option.textContent = name;

        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectSite(instance, siteId, name);
        });

        return option;
    }

    /**
     * Select a site
     * @param {object} instance - QuickSearch instance
     * @param {number|string|null} siteId - Site ID
     * @param {string} name - Site name
     */
    function selectSite(instance, siteId, name) {
        instance.selectedSiteId = siteId;

        if (instance.siteFilterBtn) {
            const textSpan = instance.siteFilterBtn.querySelector('.quick-search-site-filter-text');
            if (textSpan) {
                textSpan.textContent = name;
            }
        }

        if (instance.siteFilterDropdown) {
            const options = instance.siteFilterDropdown.querySelectorAll('.quick-search-site-option');
            options.forEach(opt => {
                const optSiteId = opt.dataset.siteId === '' ? null : (opt.dataset.siteId === '*' ? '*' : parseInt(opt.dataset.siteId));
                opt.classList.toggle('selected', optSiteId === siteId);
            });
        }

        hideSiteDropdown(instance);

        if (instance.input && instance.input.value.length >= instance.settings.minSearchLength) {
            instance.search(instance.input.value);
        }
    }

    /**
     * Toggle site dropdown visibility
     * @param {object} instance - QuickSearch instance
     */
    function toggleSiteDropdown(instance) {
        if (instance.siteFilterDropdown) {
            const isActive = instance.siteFilterDropdown.classList.toggle('active');
            if (instance.siteFilterBtn) {
                instance.siteFilterBtn.classList.toggle('active', isActive);
            }
        }
        instance.hideResults();
        instance.hideHistory();
        instance.hideBackPopup();
        hideSectionDropdown(instance);
    }

    /**
     * Hide site dropdown
     * @param {object} instance - QuickSearch instance
     */
    function hideSiteDropdown(instance) {
        if (instance.siteFilterDropdown) {
            instance.siteFilterDropdown.classList.remove('active');
        }
        if (instance.siteFilterBtn) {
            instance.siteFilterBtn.classList.remove('active');
        }
    }

    /**
     * Check if site badges should be shown
     * @param {object} instance - QuickSearch instance
     * @returns {boolean}
     */
    function shouldShowSiteBadges(instance) {
        return instance.isMultiSite && instance.selectedSiteId === '*';
    }

    /**
     * Load available search types from server
     * @param {object} instance - QuickSearch instance
     */
    async function loadSearchTypes(instance) {
        try {
            const response = await utils.fetchWithTimeout(Craft.getActionUrl('quick-search/search/types'), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.types) {
                instance.searchTypes = data.types;
                populateTabs(instance);
            }
        } catch (error) {
            console.error('Quick Search: Error loading search types', error);
            // Fallback to default types
            instance.searchTypes = [
                { id: 'entries', label: instance.t.tabEntries || 'Entries', icon: 'document' }
            ];
            populateTabs(instance);
        }
    }

    /**
     * Populate tabs in the UI
     * @param {object} instance - QuickSearch instance
     */
    function populateTabs(instance) {
        if (!instance.tabsContainer) return;

        instance.tabsContainer.innerHTML = '';
        instance.tabs = [];

        instance.searchTypes.forEach((type, index) => {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'quick-search-tab';
            tab.dataset.type = type.id;
            if (index === 0) {
                tab.classList.add('active');
                instance.currentSearchType = type.id;
            }

            // Create icon
            const iconSvg = getIconSvg(type.icon);
            tab.innerHTML = `<span class="quick-search-tab-icon">${iconSvg}</span><span class="quick-search-tab-label">${type.label}</span>`;

            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                switchTab(instance, type.id);
            });

            instance.tabsContainer.appendChild(tab);
            instance.tabs.push(tab);
        });

        // Hide tabs bar if only 1 tab
        instance.tabsContainer.style.display = instance.searchTypes.length <= 1 ? 'none' : '';

        updatePlaceholder(instance);
    }

    /**
     * Get SVG icon for type
     * @param {string} icon - Icon name
     * @returns {string} SVG markup
     */
    function getIconSvg(icon) {
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

    /**
     * Switch to a different search type tab
     * @param {object} instance - QuickSearch instance
     * @param {string} type - Search type ID
     */
    function switchTab(instance, type, skipSearch = false) {
        if (instance.currentSearchType === type) return;

        instance.currentSearchType = type;

        // Update tab visual state
        if (instance.tabsContainer) {
            instance.tabsContainer.querySelectorAll('.quick-search-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.type === type);
            });
        }

        // Update placeholder text
        updatePlaceholder(instance);

        // Hide section filter for non-entry types
        if (instance.sectionFilter) {
            instance.sectionFilter.style.display = type === 'entries' ? '' : 'none';
        }

        // Re-search if there's a query (unless skipSearch is true)
        if (!skipSearch && instance.input && instance.input.value.length >= instance.settings.minSearchLength) {
            instance.search(instance.input.value);
        }
    }

    /**
     * Update input placeholder based on current search type
     * @param {object} instance - QuickSearch instance
     */
    function updatePlaceholder(instance) {
        if (!instance.input) return;

        const placeholders = {
            'entries': instance.t.searchEntriesPlaceholder || instance.t.searchPlaceholder || 'Search entries...',
            'categories': instance.t.searchCategoriesPlaceholder || 'Search categories...',
            'assets': instance.t.searchAssetsPlaceholder || 'Search assets...',
            'users': instance.t.searchUsersPlaceholder || 'Search users...',
            'globals': instance.t.searchGlobalsPlaceholder || 'Search globals...',
            'admin': instance.t.searchAdminPlaceholder || 'Search settings...'
        };

        instance.input.placeholder = placeholders[instance.currentSearchType] || placeholders.entries;
    }

    return {
        loadSections,
        populateSectionFilter,
        toggleSectionDropdown,
        hideSectionDropdown,
        loadSites,
        populateSiteFilter,
        toggleSiteDropdown,
        hideSiteDropdown,
        shouldShowSiteBadges,
        loadSearchTypes,
        populateTabs,
        switchTab
    };
})();
