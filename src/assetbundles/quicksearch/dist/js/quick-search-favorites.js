/**
 * Quick Search - Favorites Module
 * Handles favorites functionality
 */

window.QuickSearchFavorites = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    /**
     * Toggle favorites popup
     * @param {object} instance - QuickSearch instance
     */
    async function toggleFavorites(instance) {
        if (instance.currentPopupView === 'favorites') {
            instance.hideHistory();
        } else {
            await showFavoritesOnly(instance);
        }
    }

    /**
     * Show favorites popup
     * @param {object} instance - QuickSearch instance
     */
    async function showFavoritesOnly(instance) {
        instance.hideResults();
        instance.hideSectionDropdown();
        instance.hideBackPopup();
        instance.clearHistoryButtonHighlights();

        instance.showHistoryLoading();

        try {
            const response = await utils.fetchWithTimeout(Craft.getActionUrl('quick-search/favorites/list'), {
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
                instance.currentFavorites = data.favorites || [];
                renderFavoritesOnly(instance, instance.currentFavorites);
                if (instance.historyPopup) {
                    instance.historyPopup.classList.add('active');
                    instance.currentPopupView = 'favorites';
                }
                if (instance.favoritesBtn) {
                    instance.favoritesBtn.classList.add('active');
                }
            } else {
                console.error('Quick Search: Error loading favorites', data.error);
                instance.showHistoryError(instance.t.favoritesError || 'Error loading favorites');
            }
        } catch (error) {
            console.error('Quick Search: Error loading favorites', error);
            instance.showHistoryError(instance.t.favoritesError || 'Error loading favorites');
        }
    }

    /**
     * Render favorites popup content
     * @param {object} instance - QuickSearch instance
     * @param {Array} favorites - Favorites list
     */
    function renderFavoritesOnly(instance, favorites) {
        if (!instance.historyPopup) return;

        instance.historyPopup.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'quick-search-history-header';

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'quick-search-history-title-wrapper';

        const titleText = document.createElement('h3');
        titleText.className = 'quick-search-history-title-text';
        titleText.textContent = instance.t.favorites || 'Favorites';

        titleWrapper.appendChild(titleText);
        header.appendChild(titleWrapper);
        instance.historyPopup.appendChild(header);

        const contentContainer = document.createElement('div');
        contentContainer.className = 'quick-search-history-content';

        const currentEntryInfo = getCurrentEntryInfo(instance);
        const isCurrentFavorite = currentEntryInfo && favorites?.some(
            f => f.id === currentEntryInfo.id && f.siteId === currentEntryInfo.siteId
        );

        const filteredFavorites = currentEntryInfo
            ? (favorites || []).filter(f => !(f.id === currentEntryInfo.id && f.siteId === currentEntryInfo.siteId))
            : (favorites || []);

        instance.currentHistoryItems = currentEntryInfo ? [currentEntryInfo, ...filteredFavorites] : filteredFavorites;
        instance.historySelectedIndex = -1;

        const list = document.createElement('ul');
        list.className = 'quick-search-history-list';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', instance.t.favorites || 'Favorites');

        if (currentEntryInfo) {
            try {
                const currentItem = createCurrentEntryItem(instance, currentEntryInfo, isCurrentFavorite);
                if (currentItem) {
                    list.appendChild(currentItem);
                }
            } catch (e) {
                console.error('Quick Search: Error rendering current entry item', e);
            }
        }

        if (filteredFavorites.length > 0) {
            filteredFavorites.forEach((entry, index) => {
                try {
                    const itemIndex = currentEntryInfo ? index + 1 : index;
                    const item = window.QuickSearchHistory.createHistoryItem(instance, entry, itemIndex, true);
                    if (item) {
                        list.appendChild(item);
                    }
                } catch (e) {
                    console.error('Quick Search: Error rendering favorite item', e);
                }
            });
        }

        if (list.children.length === 0) {
            const noFavorites = document.createElement('div');
            noFavorites.className = 'quick-search-no-history';
            noFavorites.textContent = instance.t.noFavorites || 'No favorites yet';
            contentContainer.appendChild(noFavorites);
        } else {
            contentContainer.appendChild(list);
        }

        instance.historyPopup.appendChild(contentContainer);
    }

    /**
     * Get current entry info from page
     * @param {object} instance - QuickSearch instance
     * @returns {object|null}
     */
    function getCurrentEntryInfo(instance) {
        try {
            const entryId = utils.getCurrentEntryId();
            if (!entryId) return null;

            const titleInput = document.getElementById('title');
            const title = titleInput?.value || document.querySelector('#header h1')?.textContent?.trim() || 'Untitled';

            const sectionMatch = window.location.pathname.match(/\/entries\/([^/]+)\//);
            const sectionHandle = sectionMatch ? sectionMatch[1] : null;

            const breadcrumb = document.querySelector('#crumbs a[href*="/entries/"]');
            const sectionName = breadcrumb?.textContent?.trim() || sectionHandle || 'Unknown Section';

            const siteHandle = utils.getCurrentSiteHandle();
            const currentSiteId = instance.currentSiteId;

            return {
                id: entryId,
                title: title,
                url: window.location.href,
                section: {
                    handle: sectionHandle,
                    name: sectionName
                },
                site: siteHandle ? {
                    handle: siteHandle,
                    name: siteHandle
                } : null,
                siteId: currentSiteId,
                status: 'live'
            };
        } catch (e) {
            console.error('Quick Search: Error getting current entry info', e);
            return null;
        }
    }

    /**
     * Create current entry item element
     * @param {object} instance - QuickSearch instance
     * @param {object} entry - Entry data
     * @param {boolean} isFavorite - Whether entry is a favorite
     * @returns {HTMLElement|null}
     */
    function createCurrentEntryItem(instance, entry, isFavorite) {
        if (!entry) return null;

        const item = document.createElement('li');
        item.className = 'quick-search-history-item quick-search-current-entry';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.id = 'quick-search-current-entry-item';
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

        const currentLabel = document.createElement('span');
        currentLabel.className = 'quick-search-current-label';
        currentLabel.textContent = instance.t.currentPage || 'Current page';
        meta.appendChild(currentLabel);

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

        item.appendChild(content);
        item.appendChild(starBtn);

        return item;
    }

    /**
     * Toggle favorite status
     * @param {object} instance - QuickSearch instance
     * @param {number} entryId - Entry ID
     * @param {number} siteId - Site ID
     * @param {HTMLElement} buttonEl - Button element
     */
    async function toggleFavorite(instance, entryId, siteId, buttonEl) {
        const isCurrentlyFavorite = buttonEl.classList.contains('active');
        const action = isCurrentlyFavorite ? 'remove' : 'add';
        const listItem = buttonEl.closest('.quick-search-history-item, .quick-search-result-item');

        const effectiveSiteId = siteId || instance.currentSiteId;

        const isInFavoritesView = instance.historyPopup?.classList.contains('active') &&
            instance.historyPopup.querySelector('.quick-search-history-title-text')?.textContent === (instance.t.favorites || 'Favorites');

        try {
            const actionUrl = Craft.getActionUrl(`quick-search/favorites/${action}`);
            const response = await utils.fetchWithTimeout(actionUrl, {
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
                if (data.isFavorite) {
                    buttonEl.classList.add('active');
                    buttonEl.title = instance.t.removeFromFavorites || 'Remove from favorites';
                    buttonEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                } else {
                    buttonEl.classList.remove('active');
                    buttonEl.title = instance.t.addToFavorites || 'Add to favorites';
                    buttonEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>';
                }

                if (!data.isFavorite && listItem && isInFavoritesView) {
                    instance.currentFavorites = instance.currentFavorites.filter(f => f.id !== entryId);
                    listItem.classList.add('removing');

                    setTimeout(() => {
                        listItem.remove();
                        if (instance.currentFavorites.length === 0) {
                            renderFavoritesOnly(instance, []);
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

    return {
        toggleFavorites,
        showFavoritesOnly,
        renderFavoritesOnly,
        getCurrentEntryInfo,
        createCurrentEntryItem,
        toggleFavorite
    };
})();
