/**
 * Quick Search - Search Module
 * Handles search functionality and result rendering
 */

window.QuickSearchSearch = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    // Valid search types
    const VALID_TYPES = ['entries', 'categories', 'assets', 'users', 'globals', 'admin'];

    // Type prefixes for quick switching
    const TYPE_PREFIXES = {
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
    };

    /**
     * Get a valid search type, defaulting to 'entries'
     * @param {string|null} type - The type to validate
     * @returns {string} - A valid search type
     */
    function getValidType(type) {
        if (type && VALID_TYPES.includes(type)) {
            return type;
        }
        return 'entries';
    }

    /**
     * Parse query string for type prefix (e.g., "entries:foo" -> type="entries", query="foo")
     * @param {string} input - Raw input string
     * @returns {object} - { type: string, query: string }
     */
    function parseQueryWithType(input) {
        const trimmed = input.trim();
        const lowerInput = trimmed.toLowerCase();

        // Check for type prefixes
        for (const [prefix, type] of Object.entries(TYPE_PREFIXES)) {
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

    /**
     * Handle search input with debouncing
     * @param {object} instance - QuickSearch instance
     */
    function handleSearchInput(instance) {
        clearTimeout(instance.debounceTimer);

        if (!instance.input) return;
        const rawInput = instance.input.value;

        // Check for type prefix in input
        const { type: parsedType, query } = parseQueryWithType(rawInput);

        // If type prefix found, switch tab (but don't trigger search from tab switch)
        if (parsedType && instance.switchTab) {
            instance.switchTab(parsedType, true); // true = skip re-search
            // Don't modify the input value - keep user input as-is
        }

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
        // Ensure type is valid before sending
        const validType = getValidType(instance.currentSearchType);

        const params = new URLSearchParams({
            query: query,
            type: validType
        });

        // Only include sections filter for entries
        if (validType === 'entries' && instance.selectedSections.length > 0) {
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
                renderResults(instance, instance.currentResults, instance.currentSearchType);
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
     * @param {string} type - Search type
     */
    function renderResults(instance, results, type = 'entries') {
        if (!instance.resultsContainer) return;

        instance.resultsContainer.innerHTML = '';

        if (!results || results.length === 0) {
            instance.resultsContainer.innerHTML = `<div class="quick-search-no-results">${getNoResultsMessage(instance, type)}</div>`;
            instance.showResults();
            return;
        }

        const list = document.createElement('ul');
        list.className = 'quick-search-results-list';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', instance.t.searchResults || 'Search Results');

        results.forEach((item, index) => {
            try {
                const listItem = createResultItem(instance, item, index, type);
                if (listItem) {
                    list.appendChild(listItem);
                }
            } catch (e) {
                console.error('Quick Search: Error rendering result item', e);
            }
        });

        instance.resultsContainer.appendChild(list);
        instance.showResults();
    }

    /**
     * Get no results message based on type
     * @param {object} instance - QuickSearch instance
     * @param {string} type - Search type
     * @returns {string}
     */
    function getNoResultsMessage(instance, type) {
        const messages = {
            'entries': instance.t.noEntriesFound || 'No entries found',
            'categories': instance.t.noCategoriesFound || 'No categories found',
            'assets': instance.t.noAssetsFound || 'No assets found',
            'users': instance.t.noUsersFound || 'No users found',
            'globals': instance.t.noGlobalsFound || 'No global sets found',
            'admin': instance.t.noAdminFound || 'No results found'
        };
        return messages[type] || instance.t.noEntriesFound || 'No results found';
    }

    /**
     * Create a result item element
     * @param {object} instance - QuickSearch instance
     * @param {object} item - Result item data
     * @param {number} index - Item index
     * @param {string} type - Search type
     * @returns {HTMLElement|null}
     */
    function createResultItem(instance, item, index, type = 'entries') {
        if (!item) return null;

        const isFavorite = type === 'entries' && instance.currentFavorites.some(f => f.id === item.id && f.siteId === item.siteId);

        const itemEl = document.createElement('li');
        itemEl.className = `quick-search-result-item quick-search-result-item-${type}`;
        itemEl.dataset.index = index;
        itemEl.dataset.id = item.id;
        itemEl.dataset.siteId = item.siteId || instance.currentSiteId;
        itemEl.dataset.type = type;
        itemEl.setAttribute('role', 'option');
        itemEl.setAttribute('aria-selected', 'false');
        itemEl.id = `quick-search-result-item-${index}`;

        const content = document.createElement('div');
        content.className = 'quick-search-result-content';

        // Type-specific content
        const typeInfo = getTypeContent(instance, item, type);
        content.appendChild(typeInfo.icon);
        content.appendChild(typeInfo.meta);

        itemEl.appendChild(content);

        // Only add star button for entries
        if (type === 'entries') {
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
                instance.toggleFavorite(item.id, item.siteId, starBtn);
            });
            itemEl.appendChild(starBtn);
        }

        // Copy dropdown button
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'quick-search-copy-btn';
        copyBtn.title = instance.t.copyActions || 'Copy options';
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>';

        // Create copy dropdown menu
        const copyMenu = document.createElement('div');
        copyMenu.className = 'quick-search-copy-menu';
        copyMenu.style.display = 'none';

        const copiedMsg = instance.t.copied || 'Copied!';

        // Copy URL
        const copyUrlItem = document.createElement('button');
        copyUrlItem.type = 'button';
        copyUrlItem.className = 'quick-search-copy-menu-item';
        copyUrlItem.textContent = instance.t.copyUrl || 'Copy URL';
        copyUrlItem.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(item.url, copiedMsg);
            copyMenu.style.display = 'none';
        });

        // Copy Title
        const copyTitleItem = document.createElement('button');
        copyTitleItem.type = 'button';
        copyTitleItem.className = 'quick-search-copy-menu-item';
        copyTitleItem.textContent = instance.t.copyTitle || 'Copy Title';
        copyTitleItem.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(item.title, copiedMsg);
            copyMenu.style.display = 'none';
        });

        // Copy ID
        const copyIdItem = document.createElement('button');
        copyIdItem.type = 'button';
        copyIdItem.className = 'quick-search-copy-menu-item';
        copyIdItem.textContent = instance.t.copyId || 'Copy ID';
        copyIdItem.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(item.id ? String(item.id) : '', copiedMsg);
            copyMenu.style.display = 'none';
        });

        copyMenu.appendChild(copyUrlItem);
        copyMenu.appendChild(copyTitleItem);
        copyMenu.appendChild(copyIdItem);

        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close any other open menus first
            closeAllCopyMenus();
            const isHidden = copyMenu.style.display === 'none';
            if (isHidden) {
                // Position menu relative to button, attached to body
                const rect = copyBtn.getBoundingClientRect();
                copyMenu.style.position = 'fixed';
                copyMenu.style.right = (window.innerWidth - rect.right) + 'px';
                // Show above if near bottom of viewport
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

        itemEl.appendChild(copyBtn);
        document.body.appendChild(copyMenu);

        // New tab button
        const newTabBtn = document.createElement('button');
        newTabBtn.type = 'button';
        newTabBtn.className = 'quick-search-newtab-btn';
        newTabBtn.title = instance.t.openInNewTab || 'Open in new tab';
        newTabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';
        newTabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.url) {
                window.open(item.url, '_blank');
            }
        });
        itemEl.appendChild(newTabBtn);

        itemEl.addEventListener('click', () => {
            navigateToItem(item, type);
        });

        return itemEl;
    }

    /**
     * Copy text to clipboard with error handling and toast feedback
     * @param {string} text - Text to copy
     * @param {string} message - Success message
     */
    function copyToClipboard(text, message) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast(message);
        }).catch(() => {
            // Fallback for insecure contexts
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast(message);
            } catch (e) {
                console.error('Quick Search: Copy failed', e);
            }
        });
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     */
    function showToast(message) {
        // Remove existing toast if any
        const existing = document.querySelector('.quick-search-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'quick-search-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 200);
        }, 1500);
    }

    /**
     * Close any open copy menu
     */
    function closeAllCopyMenus() {
        document.querySelectorAll('.quick-search-copy-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }

    /**
     * Get type-specific content for result item
     * @param {object} instance - QuickSearch instance
     * @param {object} item - Result item data
     * @param {string} type - Search type
     * @returns {object} - Icon and meta elements
     */
    function getTypeContent(instance, item, type) {
        const icon = document.createElement('div');
        icon.className = 'quick-search-result-icon';

        const meta = document.createElement('div');
        meta.className = 'quick-search-result-meta';

        const title = document.createElement('div');
        title.className = 'quick-search-result-title';
        title.textContent = item.title || '';
        title.title = item.title || '';

        const subtitle = document.createElement('div');
        subtitle.className = 'quick-search-result-subtitle';

        switch (type) {
            case 'entries':
                // Thumbnail/icon
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';

                // Section name
                const section = document.createElement('span');
                section.className = 'quick-search-result-section';
                section.textContent = item.section?.name || '';
                subtitle.appendChild(section);

                // Site badge
                if (instance.shouldShowSiteBadges() && item.site) {
                    const siteBadge = document.createElement('span');
                    siteBadge.className = 'quick-search-site-badge';
                    siteBadge.textContent = item.site.name || '';
                    subtitle.appendChild(siteBadge);
                }

                // Status
                const status = document.createElement('span');
                status.className = `quick-search-result-status ${item.status || ''}`;
                status.textContent = item.status || '';
                if (item.status) {
                    status.title = utils.getStatusTooltip(item.status, instance.t);
                }
                subtitle.appendChild(status);
                break;

            case 'categories':
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>';

                const group = document.createElement('span');
                group.className = 'quick-search-result-group';
                group.textContent = item.group?.name || '';
                subtitle.appendChild(group);

                if (instance.shouldShowSiteBadges() && item.site) {
                    const siteBadge = document.createElement('span');
                    siteBadge.className = 'quick-search-site-badge';
                    siteBadge.textContent = item.site.name || '';
                    subtitle.appendChild(siteBadge);
                }
                break;

            case 'assets':
                // Thumbnail
                if (item.thumbUrl) {
                    const img = document.createElement('img');
                    img.className = 'quick-search-result-thumb';
                    img.src = item.thumbUrl;
                    img.alt = item.title || '';
                    icon.innerHTML = '';
                    icon.appendChild(img);
                } else {
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                }

                const volume = document.createElement('span');
                volume.className = 'quick-search-result-volume';
                volume.textContent = item.volume?.name || '';
                subtitle.appendChild(volume);

                const filename = document.createElement('span');
                filename.className = 'quick-search-result-filename';
                filename.textContent = item.filename || '';
                subtitle.appendChild(filename);
                break;

            case 'users':
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';

                const email = document.createElement('span');
                email.className = 'quick-search-result-email';
                email.textContent = item.email || '';
                subtitle.appendChild(email);

                const userStatus = document.createElement('span');
                userStatus.className = `quick-search-result-status ${item.status || ''}`;
                userStatus.textContent = item.status || '';
                subtitle.appendChild(userStatus);
                break;

            case 'globals':
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>';

                const handle = document.createElement('span');
                handle.className = 'quick-search-result-handle';
                handle.textContent = item.handle || '';
                subtitle.appendChild(handle);
                break;

            case 'admin':
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';

                const adminType = document.createElement('span');
                adminType.className = 'quick-search-result-admin-type';
                adminType.textContent = item.type || '';
                subtitle.appendChild(adminType);
                break;

            default:
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
        }

        meta.appendChild(title);
        meta.appendChild(subtitle);

        return { icon, meta };
    }

    /**
     * Navigate to a result item
     * @param {object} item - Result item data
     * @param {string} type - Search type
     */
    function navigateToItem(item, type) {
        if (item && item.url) {
            window.location.href = item.url;
        }
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

    // Single global listener to close copy menus on outside click
    // When a menu is open, the first outside click only closes it
    document.addEventListener('click', (e) => {
        const openMenu = document.querySelector('.quick-search-copy-menu[style*="display: block"]');
        if (openMenu && !openMenu.contains(e.target) && !e.target.closest('.quick-search-copy-btn')) {
            e.preventDefault();
            e.stopPropagation();
            closeAllCopyMenus();
        }
    }, true);

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
        navigateToEntry,
        copyToClipboard,
        showToast,
        closeAllCopyMenus
    };
})();
