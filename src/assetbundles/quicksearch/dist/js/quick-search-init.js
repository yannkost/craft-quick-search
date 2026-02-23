/**
 * Quick Search - Initialization
 * Initializes all Quick Search components when DOM is ready
 */

(function() {
    'use strict';

    function initTheme() {
        var themeMode = (window.QuickSearchSettings && window.QuickSearchSettings.themeMode) || 'auto';
        var html = document.documentElement;

        if (themeMode === 'dark') {
            html.classList.add('qs-dark');
        } else if (themeMode === 'light') {
            html.classList.remove('qs-dark');
        } else {
            // auto: follow OS preference
            var mq = window.matchMedia('(prefers-color-scheme: dark)');
            var apply = function() {
                if (mq.matches) {
                    html.classList.add('qs-dark');
                } else {
                    html.classList.remove('qs-dark');
                }
            };
            apply();
            mq.addEventListener('change', apply);
        }
    }

    function initQuickSearch() {
        initTheme();

        try {
            // Initialize main Quick Search
            if (window.QuickSearchCore) {
                const quickSearch = new window.QuickSearchCore();
                quickSearch.init();
                window.quickSearchInstance = quickSearch;
            }

            // Initialize Related Entries Overlay
            if (window.RelatedEntriesOverlay) {
                const relatedEntriesOverlay = new window.RelatedEntriesOverlay();
                relatedEntriesOverlay.init();
                window.relatedEntriesOverlayInstance = relatedEntriesOverlay;
            }

            // Initialize Entry Outline Popup
            if (window.EntryOutlinePopup) {
                const entryOutlinePopup = new window.EntryOutlinePopup();
                entryOutlinePopup.init();
                window.entryOutlinePopupInstance = entryOutlinePopup;
            }

            // Initialize Quick Access Overlay
            if (window.QuickAccessOverlay) {
                const quickAccessOverlay = new window.QuickAccessOverlay();
                quickAccessOverlay.init();
                window.quickAccessOverlayInstance = quickAccessOverlay;
            }
        } catch (error) {
            console.error('Quick Search: Error during initialization', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuickSearch);
    } else {
        initQuickSearch();
    }
})();
