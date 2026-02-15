/**
 * Quick Search - History Module
 * Handles history and favorites functionality
 */

window.QuickSearchHistory = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    /**
     * Load last visited entry
     * @param {object} instance - QuickSearch instance
     */
    async function loadLastVisited(instance) {
        try {
            const actionUrl = Craft.getActionUrl('quick-search/history/index');
            const response = await utils.fetchWithTimeout(actionUrl, {
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
                const currentEntryId = utils.getCurrentEntryId();
                const currentSiteHandle = utils.getCurrentSiteHandle();

                const previousEntry = data.history.find(entry => {
                    if (!entry) return false;
                    if (entry.id !== currentEntryId) return true;
                    if (currentSiteHandle && entry.site?.handle !== currentSiteHandle) return true;
                    return false;
                });

                if (previousEntry && instance.backBtn) {
                    instance.lastVisitedEntry = previousEntry;
                    instance.backBtn.disabled = false;
                    instance.backBtn.title = `${instance.t.goToLastVisited || 'Go to last visited entry'}: ${instance.lastVisitedEntry.title || ''}`;
                }
            }
        } catch (error) {
            console.error('Quick Search: Error loading last visited', error);
        }
    }

    /**
     * Toggle history popup
     * @param {object} instance - QuickSearch instance
     */
    async function toggleHistory(instance) {
        if (instance.currentPopupView === 'history') {
            instance.hideHistory();
        } else {
            await showHistory(instance);
        }
    }

    /**
     * Show history popup
     * @param {object} instance - QuickSearch instance
     * @param {string} query - Filter query
     * @param {boolean} showAll - Show all history
     */
    async function showHistory(instance, query = '', showAll = false) {
        instance.hideResults();
        instance.hideSectionDropdown();
        instance.hideBackPopup();
        instance.clearHistoryButtonHighlights();

        // First open: fetch from server and build the full popup structure
        if (!instance._cachedHistory) {
            instance.showHistoryLoading();

            const limit = showAll ? instance.historyFullLimit : instance.historyInitialLimit;
            const params = new URLSearchParams();
            params.append('limit', limit.toString());

            try {
                const historyUrl = Craft.getActionUrl('quick-search/history/index');
                const response = await utils.fetchWithTimeout(historyUrl + (historyUrl.includes('?') ? '&' : '?') + params.toString(), {
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
                    const history = data.history || [];
                    instance._cachedHistory = history;
                    instance.historyExpanded = showAll;
                    renderHistory(instance, history, showAll);
                } else {
                    console.error('Quick Search: Error loading history', data.error);
                    instance.showHistoryError(instance.t.historyError || 'Error loading history');
                    return;
                }
            } catch (error) {
                console.error('Quick Search: Error loading history', error);
                instance.showHistoryError(instance.t.historyError || 'Error loading history');
                return;
            }
        }

        if (instance.historyPopup) {
            instance.historyPopup.classList.add('active');
            instance.currentPopupView = 'history';
        }
        if (instance.historyBtn) {
            instance.historyBtn.classList.add('active');
        }
    }

    /**
     * Expand history to show all items (fetches with higher limit)
     */
    async function expandHistory(instance) {
        const params = new URLSearchParams();
        params.append('limit', instance.historyFullLimit.toString());

        try {
            const historyUrl = Craft.getActionUrl('quick-search/history/index');
            const response = await utils.fetchWithTimeout(historyUrl + (historyUrl.includes('?') ? '&' : '?') + params.toString(), {
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
                instance._cachedHistory = data.history || [];
                instance.historyExpanded = true;
                // Re-render list with current filter value
                const filterValue = instance._historyFilterInput ? instance._historyFilterInput.value : '';
                renderHistoryList(instance, filterValue);
            }
        } catch (error) {
            console.error('Quick Search: Error expanding history', error);
        }
    }

    /**
     * Filter history items client-side by title or section name
     */
    function filterHistoryItems(items, query) {
        const q = query.toLowerCase().trim();
        if (!q) return items;
        return items.filter(entry => {
            if (!entry) return false;
            const title = (entry.title || '').toLowerCase();
            const section = (entry.section?.name || '').toLowerCase();
            return title.includes(q) || section.includes(q);
        });
    }

    /**
     * Build the full popup structure (header + filter + content container).
     * Called once on first open, then only the list content is updated.
     */
    function renderHistory(instance, history, isExpanded = false) {
        if (!instance.historyPopup) return;

        instance.historyPopup.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'quick-search-history-header';

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'quick-search-history-title-wrapper';

        const titleText = document.createElement('h3');
        titleText.className = 'quick-search-history-title-text';
        titleText.textContent = instance.t.recentEntries || 'Recent Entries';

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'quick-search-history-clear-btn';
        clearBtn.title = instance.t.clearHistory || 'Clear history';
        clearBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmClearHistory(instance);
        });

        titleWrapper.appendChild(titleText);
        titleWrapper.appendChild(clearBtn);

        // Filter input — persistent, never destroyed
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'quick-search-history-search';
        searchInput.placeholder = instance.t.filterHistory || 'Filter history...';
        instance._historyFilterInput = searchInput;

        searchInput.addEventListener('input', () => {
            renderHistoryList(instance, searchInput.value);
        });

        header.appendChild(titleWrapper);
        header.appendChild(searchInput);
        instance.historyPopup.appendChild(header);

        // Content container — only this part gets replaced on filter/expand
        const contentContainer = document.createElement('div');
        contentContainer.className = 'quick-search-history-content';
        instance._historyContentContainer = contentContainer;
        instance.historyPopup.appendChild(contentContainer);

        // Render the initial list
        renderHistoryList(instance, '');
    }

    /**
     * Re-render only the list content inside the existing popup structure.
     * The header and filter input are preserved.
     */
    function renderHistoryList(instance, query) {
        const container = instance._historyContentContainer;
        if (!container) return;

        container.innerHTML = '';

        const currentEntryId = utils.getCurrentEntryId();
        const currentSiteHandle = utils.getCurrentSiteHandle();

        // Filter out current entry, then apply text filter
        let items = (instance._cachedHistory || []).filter(entry => {
            if (!entry) return false;
            if (entry.id === currentEntryId) {
                if (!currentSiteHandle || entry.site?.handle === currentSiteHandle) {
                    return false;
                }
            }
            return true;
        });

        items = filterHistoryItems(items, query);

        instance.currentHistoryItems = items;
        instance.historySelectedIndex = -1;

        if (items.length === 0) {
            const noHistory = document.createElement('div');
            noHistory.className = 'quick-search-no-history';
            noHistory.textContent = instance.t.noRecentEntries || 'No recent entries';
            container.appendChild(noHistory);
        } else {
            const list = document.createElement('ul');
            list.className = 'quick-search-history-list';
            list.setAttribute('role', 'listbox');
            list.setAttribute('aria-label', instance.t.recentEntries || 'Recent Entries');

            items.forEach((entry, index) => {
                try {
                    const item = createHistoryItem(instance, entry, index, false);
                    if (item) {
                        list.appendChild(item);
                    }
                } catch (e) {
                    console.error('Quick Search: Error rendering history item', e);
                }
            });

            container.appendChild(list);
        }

        // Show "Show more" button if not expanded, not filtering, and we hit the limit
        const existingShowMore = instance.historyPopup.querySelector('.quick-search-show-more-btn');
        if (existingShowMore) existingShowMore.remove();

        if (!instance.historyExpanded && !query &&
            instance._cachedHistory && instance._cachedHistory.length >= instance.historyInitialLimit) {
            const showMoreBtn = document.createElement('button');
            showMoreBtn.type = 'button';
            showMoreBtn.className = 'quick-search-show-more-btn';
            showMoreBtn.textContent = instance.t.showMore || 'Show more...';
            showMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                expandHistory(instance);
            });
            instance.historyPopup.appendChild(showMoreBtn);
        }
    }

    /**
     * Create a history item element
     * @param {object} instance - QuickSearch instance
     * @param {object} entry - Entry data
     * @param {number} index - Item index
     * @param {boolean} isFavorite - Whether entry is a favorite
     * @returns {HTMLElement|null}
     */
    function createHistoryItem(instance, entry, index = 0, isFavorite = false) {
        if (!entry) return null;

        const item = document.createElement('li');
        item.className = 'quick-search-history-item';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.id = `quick-search-history-item-${index}`;
        item.dataset.entryId = entry.id;
        item.dataset.siteId = entry.siteId || instance.currentSiteId;

        const content = document.createElement('div');
        content.className = 'quick-search-history-item-content';

        const title = document.createElement('div');
        title.className = 'quick-search-history-title';
        title.textContent = entry.title || '';
        title.title = entry.title || '';

        const meta = document.createElement('div');
        meta.className = 'quick-search-history-meta';

        const section = document.createElement('span');
        section.className = 'quick-search-history-section';
        section.textContent = entry.section?.name || '';

        if (instance.isMultiSite && entry.site) {
            const siteBadge = document.createElement('span');
            siteBadge.className = 'quick-search-site-badge';
            siteBadge.textContent = entry.site.name || '';
            meta.appendChild(siteBadge);
        }

        const status = document.createElement('span');
        status.className = `quick-search-history-status ${entry.status || ''}`;
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
     * Confirm and clear history
     * @param {object} instance - QuickSearch instance
     */
    function confirmClearHistory(instance) {
        const confirmMsg = instance.t.clearHistoryConfirm || 'Clear all history?\n\nThis will remove all your recent entry visits. This action cannot be undone.';
        if (confirm(confirmMsg)) {
            clearHistory(instance);
        }
    }

    /**
     * Clear history
     * @param {object} instance - QuickSearch instance
     */
    async function clearHistory(instance) {
        try {
            const actionUrl = Craft.getActionUrl('quick-search/history/clear');
            const response = await utils.fetchWithTimeout(actionUrl, {
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
                instance.currentHistoryItems = [];
                instance._cachedHistory = [];
                if (instance._historyFilterInput) {
                    instance._historyFilterInput.value = '';
                }
                renderHistoryList(instance, '');
                if (instance.backBtn) {
                    instance.backBtn.disabled = true;
                    instance.backBtn.title = instance.t.goToLastVisited || 'Go to last visited entry';
                }
                instance.lastVisitedEntry = null;
            } else {
                console.error('Quick Search: Error clearing history', data.error);
            }
        } catch (error) {
            console.error('Quick Search: Error clearing history', error);
        }
    }

    /**
     * Handle keyboard navigation in history
     * @param {object} instance - QuickSearch instance
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleHistoryKeyNavigation(instance, e) {
        if (!instance.historyPopup || !instance.historyPopup.classList.contains('active')) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectHistoryNext(instance);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectHistoryPrevious(instance);
                break;
            case 'Enter':
                e.preventDefault();
                navigateToSelectedHistory(instance);
                break;
        }
    }

    function selectHistoryNext(instance) {
        if (instance.currentHistoryItems.length === 0) return;
        instance.historySelectedIndex = (instance.historySelectedIndex + 1) % instance.currentHistoryItems.length;
        updateHistorySelectedItem(instance);
    }

    function selectHistoryPrevious(instance) {
        if (instance.currentHistoryItems.length === 0) return;
        instance.historySelectedIndex = instance.historySelectedIndex <= 0
            ? instance.currentHistoryItems.length - 1
            : instance.historySelectedIndex - 1;
        updateHistorySelectedItem(instance);
    }

    function updateHistorySelectedItem(instance) {
        if (!instance.historyPopup) return;

        const items = instance.historyPopup.querySelectorAll('.quick-search-history-item');
        items.forEach((item, index) => {
            if (index === instance.historySelectedIndex) {
                item.classList.add('keyboard-focus');
                item.setAttribute('aria-selected', 'true');
                try {
                    item.scrollIntoView({ block: 'nearest' });
                } catch (e) {}
            } else {
                item.classList.remove('keyboard-focus');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }

    function navigateToSelectedHistory(instance) {
        if (instance.historySelectedIndex >= 0 && instance.historySelectedIndex < instance.currentHistoryItems.length) {
            const entry = instance.currentHistoryItems[instance.historySelectedIndex];
            instance.navigateToEntry(entry);
        }
    }

    /**
     * Toggle back popup
     * @param {object} instance - QuickSearch instance
     */
    function toggleBackPopup(instance) {
        if (instance.currentPopupView === 'back') {
            hideBackPopup(instance);
        } else {
            showBackPopup(instance);
        }
    }

    /**
     * Show back popup
     * @param {object} instance - QuickSearch instance
     */
    function showBackPopup(instance) {
        if (!instance.backPopup || !instance.lastVisitedEntry) return;

        instance.hideResults();
        instance.hideSectionDropdown();
        instance.hideHistory();

        instance.backPopup.innerHTML = '';

        const item = createHistoryItem(instance, instance.lastVisitedEntry, 0, false);
        if (item) {
            instance.backPopup.appendChild(item);
        }

        instance.backPopup.classList.add('active');
        instance.currentPopupView = 'back';

        if (instance.backBtn) {
            instance.backBtn.classList.add('active');
        }
    }

    /**
     * Hide back popup
     * @param {object} instance - QuickSearch instance
     */
    function hideBackPopup(instance) {
        if (instance.backPopup) {
            instance.backPopup.classList.remove('active');
        }
        if (instance.currentPopupView === 'back') {
            instance.currentPopupView = null;
        }

        if (instance.backBtn) {
            instance.backBtn.classList.remove('active');
        }
    }

    return {
        loadLastVisited,
        toggleHistory,
        showHistory,
        renderHistory,
        createHistoryItem,
        confirmClearHistory,
        clearHistory,
        handleHistoryKeyNavigation,
        toggleBackPopup,
        showBackPopup,
        hideBackPopup
    };
})();
