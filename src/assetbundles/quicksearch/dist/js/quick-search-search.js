/**
 * Quick Search - Search Module
 * Handles search functionality and result rendering
 */

window.QuickSearchSearch = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    /**
     * Handle search input with debouncing
     * @param {object} instance - QuickSearch instance
     */
    function handleSearchInput(instance) {
        clearTimeout(instance.debounceTimer);

        if (!instance.input) return;
        const query = instance.input.value.trim();

        if (query.length < instance.settings.minSearchLength) {
            instance.hideResults();
            return;
        }

        instance.debounceTimer = setTimeout(() => {
            search(instance, query);
        }, instance.settings.debounceDelay);
    }

    /**
     * Perform search
     * @param {object} instance - QuickSearch instance
     * @param {string} query - Search query
     */
    async function search(instance, query) {
        const params = new URLSearchParams({
            query: query
        });

        if (instance.selectedSections.length > 0) {
            params.append('sections', instance.selectedSections.join(','));
        }

        if (instance.selectedSiteId === null) {
            params.append('siteId', instance.currentSiteId);
        } else {
            params.append('siteId', instance.selectedSiteId);
        }

        instance.showLoading();

        if (instance.searchAbortController) {
            instance.searchAbortController.abort();
        }
        instance.searchAbortController = new AbortController();

        try {
            const actionUrl = Craft.getActionUrl('quick-search/search/index');
            const separator = actionUrl.includes('?') ? '&' : '?';

            const timeoutId = setTimeout(() => instance.searchAbortController.abort(), instance.fetchTimeout);

            const response = await fetch(actionUrl + separator + params, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                signal: instance.searchAbortController.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                instance.currentResults = data.results || [];
                renderResults(instance, instance.currentResults);
                instance.selectedIndex = -1;
            } else {
                instance.showError(data.error || instance.t.searchError || 'Search failed');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }
            console.error('Quick Search: Search error', error);
            instance.showError(instance.t.searchError || 'An error occurred while searching');
        }
    }

    /**
     * Render search results
     * @param {object} instance - QuickSearch instance
     * @param {Array} results - Search results
     */
    function renderResults(instance, results) {
        if (!instance.resultsContainer) return;

        instance.resultsContainer.innerHTML = '';

        if (!results || results.length === 0) {
            instance.resultsContainer.innerHTML = `<div class="quick-search-no-results">${instance.t.noEntriesFound || 'No entries found'}</div>`;
            instance.showResults();
            return;
        }

        const list = document.createElement('ul');
        list.className = 'quick-search-results-list';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', instance.t.searchResults || 'Search Results');

        results.forEach((entry, index) => {
            try {
                const item = createResultItem(instance, entry, index);
                if (item) {
                    list.appendChild(item);
                }
            } catch (e) {
                console.error('Quick Search: Error rendering result item', e);
            }
        });

        instance.resultsContainer.appendChild(list);
        instance.showResults();
    }

    /**
     * Create a result item element
     * @param {object} instance - QuickSearch instance
     * @param {object} entry - Entry data
     * @param {number} index - Item index
     * @returns {HTMLElement|null}
     */
    function createResultItem(instance, entry, index) {
        if (!entry) return null;

        const isFavorite = instance.currentFavorites.some(f => f.id === entry.id && f.siteId === entry.siteId);

        const item = document.createElement('li');
        item.className = 'quick-search-result-item';
        item.dataset.index = index;
        item.dataset.entryId = entry.id;
        item.dataset.siteId = entry.siteId || instance.currentSiteId;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.id = `quick-search-result-item-${index}`;

        const content = document.createElement('div');
        content.className = 'quick-search-result-content';

        const title = document.createElement('div');
        title.className = 'quick-search-result-title';
        title.textContent = entry.title || '';
        title.title = entry.title || '';

        const meta = document.createElement('div');
        meta.className = 'quick-search-result-meta';

        const section = document.createElement('span');
        section.className = 'quick-search-result-section';
        section.textContent = entry.section?.name || '';

        if (instance.shouldShowSiteBadges() && entry.site) {
            const siteBadge = document.createElement('span');
            siteBadge.className = 'quick-search-site-badge';
            siteBadge.textContent = entry.site.name || '';
            meta.appendChild(siteBadge);
        }

        const status = document.createElement('span');
        status.className = `quick-search-result-status ${entry.status || ''}`;
        status.textContent = entry.status || '';
        if (entry.status) {
            status.title = utils.getStatusTooltip(entry.status, instance.t);
        }

        meta.appendChild(section);
        meta.appendChild(status);

        content.appendChild(title);
        content.appendChild(meta);

        const starBtn = document.createElement('button');
        starBtn.type = 'button';
        starBtn.className = 'quick-search-star-btn' + (isFavorite ? ' active' : '');
        starBtn.title = isFavorite
            ? (instance.t.removeFromFavorites || 'Remove from favorites')
            : (instance.t.addToFavorites || 'Add to favorites');
        starBtn.innerHTML = isFavorite
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
        starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            instance.toggleFavorite(entry.id, entry.siteId, starBtn);
        });

        const newTabBtn = document.createElement('button');
        newTabBtn.type = 'button';
        newTabBtn.className = 'quick-search-newtab-btn';
        newTabBtn.title = instance.t.openInNewTab || 'Open in new tab';
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
            instance.navigateToEntry(entry);
        });

        return item;
    }

    /**
     * Handle keyboard navigation in results
     * @param {object} instance - QuickSearch instance
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyNavigation(instance, e) {
        if (!instance.resultsContainer || !instance.resultsContainer.classList.contains('active')) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectNext(instance);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectPrevious(instance);
                break;
            case 'Enter':
                e.preventDefault();
                navigateToSelected(instance);
                break;
        }
    }

    /**
     * Select next result
     * @param {object} instance - QuickSearch instance
     */
    function selectNext(instance) {
        if (instance.currentResults.length === 0) return;

        instance.selectedIndex = (instance.selectedIndex + 1) % instance.currentResults.length;
        updateSelectedItem(instance);
    }

    /**
     * Select previous result
     * @param {object} instance - QuickSearch instance
     */
    function selectPrevious(instance) {
        if (instance.currentResults.length === 0) return;

        instance.selectedIndex = instance.selectedIndex <= 0
            ? instance.currentResults.length - 1
            : instance.selectedIndex - 1;
        updateSelectedItem(instance);
    }

    /**
     * Update selected item visual state
     * @param {object} instance - QuickSearch instance
     */
    function updateSelectedItem(instance) {
        if (!instance.resultsContainer) return;

        const items = instance.resultsContainer.querySelectorAll('.quick-search-result-item');
        items.forEach((item, index) => {
            if (index === instance.selectedIndex) {
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

    /**
     * Navigate to selected result
     * @param {object} instance - QuickSearch instance
     */
    function navigateToSelected(instance) {
        if (instance.selectedIndex >= 0 && instance.selectedIndex < instance.currentResults.length) {
            const entry = instance.currentResults[instance.selectedIndex];
            instance.navigateToEntry(entry);
        }
    }

    /**
     * Navigate to an entry
     * @param {object} entry - Entry data
     */
    function navigateToEntry(entry) {
        if (entry && entry.url) {
            window.location.href = entry.url;
        }
    }

    return {
        handleSearchInput,
        search,
        renderResults,
        createResultItem,
        handleKeyNavigation,
        selectNext,
        selectPrevious,
        updateSelectedItem,
        navigateToSelected,
        navigateToEntry
    };
})();
