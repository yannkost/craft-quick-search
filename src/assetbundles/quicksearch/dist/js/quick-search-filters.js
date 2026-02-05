/**
 * Quick Search - Filters Module
 * Handles section and site filter functionality
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

    return {
        loadSections,
        populateSectionFilter,
        toggleSectionDropdown,
        hideSectionDropdown,
        loadSites,
        populateSiteFilter,
        toggleSiteDropdown,
        hideSiteDropdown,
        shouldShowSiteBadges
    };
})();
