/**
 * Quick Search - UI Module
 * Handles UI creation and event binding for the main search component
 */

window.QuickSearchUI = (function() {
    'use strict';

    /**
     * Create the main Quick Search UI elements
     * @param {object} instance - QuickSearch instance
     * @param {object} settings - Plugin settings
     * @param {object} t - Translations
     * @returns {boolean} - Success status
     */
    function createUI(instance, settings, t) {
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

            instance.container = document.createElement('div');
            instance.container.className = 'quick-search-container';

            // Section filter
            instance.sectionFilter = document.createElement('div');
            instance.sectionFilter.className = 'quick-search-section-filter';

            instance.sectionFilterBtn = document.createElement('button');
            instance.sectionFilterBtn.type = 'button';
            instance.sectionFilterBtn.className = 'quick-search-section-filter-btn';
            const allSectionsText = t.allSections || 'All Sections';
            instance.sectionFilterBtn.innerHTML = `<span class="quick-search-section-filter-text">${allSectionsText}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;

            instance.sectionFilterDropdown = document.createElement('div');
            instance.sectionFilterDropdown.className = 'quick-search-section-dropdown';

            instance.sectionFilter.appendChild(instance.sectionFilterBtn);
            instance.sectionFilter.appendChild(instance.sectionFilterDropdown);

            instance.selectedSections = [];

            // Site filter (for Quick Access header)
            instance.siteFilter = document.createElement('div');
            instance.siteFilter.className = 'quick-search-site-filter';

            instance.siteFilterBtn = document.createElement('button');
            instance.siteFilterBtn.type = 'button';
            instance.siteFilterBtn.className = 'quick-search-site-filter-btn';
            const currentSiteText = t.currentSite || 'Current Site';
            instance.siteFilterBtn.innerHTML = `<span class="quick-search-site-filter-text">${currentSiteText}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>`;

            instance.siteFilterDropdown = document.createElement('div');
            instance.siteFilterDropdown.className = 'quick-search-site-dropdown';

            instance.siteFilter.appendChild(instance.siteFilterBtn);
            instance.siteFilter.appendChild(instance.siteFilterDropdown);

            // Input wrapper
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'quick-search-input-wrapper';

            instance.input = document.createElement('input');
            instance.input.type = 'text';
            instance.input.className = 'quick-search-input';
            instance.input.placeholder = t.searchPlaceholder || 'Search entries...';
            instance.input.autocomplete = 'off';

            // Back button
            instance.backBtn = document.createElement('button');
            instance.backBtn.className = 'quick-search-back-btn';
            instance.backBtn.type = 'button';
            instance.backBtn.title = t.goToLastVisited || 'Go to last visited entry';
            instance.backBtn.disabled = true;
            instance.backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>';

            // History button
            instance.historyBtn = document.createElement('button');
            instance.historyBtn.className = 'quick-search-history-btn';
            instance.historyBtn.type = 'button';
            instance.historyBtn.title = t.viewRecentEntries || 'View recent entries';
            instance.historyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';

            // Favorites button
            instance.favoritesBtn = document.createElement('button');
            instance.favoritesBtn.className = 'quick-search-favorites-btn';
            instance.favoritesBtn.type = 'button';
            instance.favoritesBtn.title = t.favorites || 'Favorites';
            instance.favoritesBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';

            // Results container
            instance.resultsContainer = document.createElement('div');
            instance.resultsContainer.className = 'quick-search-results';
            if (settings.compactMode) {
                instance.resultsContainer.classList.add('compact');
            }

            // Back popup
            instance.backPopup = document.createElement('div');
            instance.backPopup.className = 'quick-search-back-popup';
            if (settings.compactMode) {
                instance.backPopup.classList.add('compact');
            }

            // History popup
            instance.historyPopup = document.createElement('div');
            instance.historyPopup.className = 'quick-search-history-popup';
            if (settings.compactMode) {
                instance.historyPopup.classList.add('compact');
            }

            // Button group
            const btnGroup = document.createElement('div');
            btnGroup.className = 'quick-search-btn-group';
            btnGroup.appendChild(instance.backBtn);
            btnGroup.appendChild(instance.historyBtn);
            btnGroup.appendChild(instance.favoritesBtn);

            // Assemble UI
            if (instance.isMultiSite) {
                inputWrapper.appendChild(instance.siteFilter);
            }
            if (settings.showSectionFilter !== false) {
                inputWrapper.appendChild(instance.sectionFilter);
            }
            inputWrapper.appendChild(instance.input);
            instance.container.appendChild(inputWrapper);
            instance.container.appendChild(btnGroup);
            instance.container.appendChild(instance.resultsContainer);
            instance.container.appendChild(instance.backPopup);
            instance.container.appendChild(instance.historyPopup);

            globalHeader.insertBefore(instance.container, accountToggle);
            return true;
        } catch (error) {
            console.error('Quick Search: Error creating UI', error);
            return false;
        }
    }

    /**
     * Bind all event listeners
     * @param {object} instance - QuickSearch instance
     */
    function bindEvents(instance) {
        if (!instance.input || !instance.container) {
            return;
        }

        instance.input.addEventListener('input', () => {
            instance.handleSearchInput();
        });

        instance.input.addEventListener('keydown', (e) => {
            instance.handleKeyNavigation(e);
        });

        instance.input.addEventListener('focus', () => {
            if (instance.input && instance.input.value.length >= instance.settings.minSearchLength) {
                instance.showResults();
            }
        });

        if (instance.sectionFilterBtn) {
            instance.sectionFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                instance.toggleSectionDropdown();
            });
        }

        if (instance.siteFilterBtn) {
            instance.siteFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                instance.toggleSiteDropdown();
            });
        }

        if (instance.backBtn) {
            instance.backBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                instance.toggleBackPopup();
            });
        }

        if (instance.historyBtn) {
            instance.historyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                instance.toggleHistory();
            });
        }

        if (instance.favoritesBtn) {
            instance.favoritesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                instance.toggleFavorites();
            });
        }

        document.addEventListener('click', (e) => {
            if (instance.container && !instance.container.contains(e.target)) {
                instance.hideResults();
                instance.hideHistory();
                instance.hideBackPopup();
                instance.hideSectionDropdown();
                instance.hideSiteDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                instance.hideResults();
                instance.hideHistory();
                instance.hideBackPopup();
                instance.hideSectionDropdown();
                instance.hideSiteDropdown();
                if (instance.input) {
                    instance.input.blur();
                }
                return;
            }

            if (instance.historyPopup && instance.historyPopup.classList.contains('active')) {
                instance.handleHistoryKeyNavigation(e);
            }
        });
    }

    /**
     * Show/hide helper methods
     */
    function showResults(instance) {
        instance.hideHistory();
        instance.hideSectionDropdown();
        instance.hideBackPopup();
        if (instance.resultsContainer) {
            instance.resultsContainer.classList.add('active');
        }
    }

    function hideResults(instance) {
        clearTimeout(instance.debounceTimer);
        if (instance.resultsContainer) {
            instance.resultsContainer.classList.remove('active');
        }
    }

    function hideHistory(instance) {
        if (instance.historyPopup) {
            instance.historyPopup.classList.remove('active');
        }
        instance.currentPopupView = null;
        instance._cachedHistory = null;
        instance._historyFilterInput = null;
        instance._historyContentContainer = null;
        clearHistoryButtonHighlights(instance);
    }

    function clearHistoryButtonHighlights(instance) {
        if (instance.historyBtn) {
            instance.historyBtn.classList.remove('active');
        }
        if (instance.favoritesBtn) {
            instance.favoritesBtn.classList.remove('active');
        }
    }

    function showLoading(instance) {
        if (instance.resultsContainer) {
            instance.resultsContainer.innerHTML = `<div class="quick-search-loading">${instance.t.searching || 'Searching...'}</div>`;
            showResults(instance);
        }
    }

    function showError(instance, message) {
        if (!instance.resultsContainer) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'quick-search-no-results';
        errorDiv.textContent = message;
        instance.resultsContainer.innerHTML = '';
        instance.resultsContainer.appendChild(errorDiv);
        showResults(instance);
    }

    function showHistoryLoading(instance) {
        if (!instance.historyPopup) return;

        instance.historyPopup.innerHTML = `<div class="quick-search-loading">${instance.t.searching || 'Loading...'}</div>`;
        instance.historyPopup.classList.add('active');
    }

    function showHistoryError(instance, message) {
        if (!instance.historyPopup) return;

        instance.historyPopup.innerHTML = `<div class="quick-search-no-results">${message}</div>`;
        instance.historyPopup.classList.add('active');
    }

    return {
        createUI,
        bindEvents,
        showResults,
        hideResults,
        hideHistory,
        clearHistoryButtonHighlights,
        showLoading,
        showError,
        showHistoryLoading,
        showHistoryError
    };
})();
