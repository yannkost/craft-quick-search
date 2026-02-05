/**
 * Quick Search - Core Class
 * Main QuickSearch class that coordinates all modules
 */

window.QuickSearchCore = (function() {
    'use strict';

    const UI = window.QuickSearchUI;
    const Filters = window.QuickSearchFilters;
    const Search = window.QuickSearchSearch;
    const History = window.QuickSearchHistory;
    const Favorites = window.QuickSearchFavorites;
    const utils = window.QuickSearchUtils;

    class QuickSearch {
        constructor() {
            this.container = null;
            this.input = null;
            this.sectionFilter = null;
            this.siteFilter = null;
            this.sectionFilterBtn = null;
            this.sectionFilterDropdown = null;
            this.siteFilterBtn = null;
            this.siteFilterDropdown = null;
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
            this.selectedSections = [];
            this.lastVisitedEntry = null;
            this.historyInitialLimit = 10;
            this.historyFullLimit = 50;
            this.historyExpanded = false;
            this.historySelectedIndex = -1;
            this.currentHistoryItems = [];
            this.currentFavorites = [];
            this.currentPopupView = null;
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
            this.selectedSiteId = null;
            this.searchAbortController = null;
            this.fetchTimeout = 10000;
        }

        init() {
            try {
                if (!UI.createUI(this, this.settings, this.t)) {
                    return;
                }
                UI.bindEvents(this);
                Filters.loadSections(this);
                if (this.isMultiSite) {
                    Filters.loadSites(this);
                }
                History.loadLastVisited(this);
            } catch (error) {
                console.error('Quick Search: Error during initialization', error);
            }
        }

        // Delegate to Search module
        handleSearchInput() {
            Search.handleSearchInput(this);
        }

        search(query) {
            return Search.search(this, query);
        }

        handleKeyNavigation(e) {
            Search.handleKeyNavigation(this, e);
        }

        navigateToEntry(entry) {
            Search.navigateToEntry(entry);
        }

        // Delegate to Filters module
        toggleSectionDropdown() {
            Filters.toggleSectionDropdown(this);
        }

        hideSectionDropdown() {
            Filters.hideSectionDropdown(this);
        }

        toggleSiteDropdown() {
            Filters.toggleSiteDropdown(this);
        }

        hideSiteDropdown() {
            Filters.hideSiteDropdown(this);
        }

        shouldShowSiteBadges() {
            return Filters.shouldShowSiteBadges(this);
        }

        // Delegate to History module
        toggleHistory() {
            return History.toggleHistory(this);
        }

        showHistory(query, showAll) {
            return History.showHistory(this, query, showAll);
        }

        handleHistoryKeyNavigation(e) {
            History.handleHistoryKeyNavigation(this, e);
        }

        toggleBackPopup() {
            History.toggleBackPopup(this);
        }

        showBackPopup() {
            History.showBackPopup(this);
        }

        hideBackPopup() {
            History.hideBackPopup(this);
        }

        // Delegate to Favorites module
        toggleFavorites() {
            return Favorites.toggleFavorites(this);
        }

        toggleFavorite(entryId, siteId, buttonEl) {
            return Favorites.toggleFavorite(this, entryId, siteId, buttonEl);
        }

        getCurrentEntryInfo() {
            return Favorites.getCurrentEntryInfo(this);
        }

        // Delegate to UI module
        showResults() {
            UI.showResults(this);
        }

        hideResults() {
            UI.hideResults(this);
        }

        hideHistory() {
            UI.hideHistory(this);
        }

        clearHistoryButtonHighlights() {
            UI.clearHistoryButtonHighlights(this);
        }

        showLoading() {
            UI.showLoading(this);
        }

        showError(message) {
            UI.showError(this, message);
        }

        showHistoryLoading() {
            UI.showHistoryLoading(this);
        }

        showHistoryError(message) {
            UI.showHistoryError(this, message);
        }

        // Utility methods
        getCurrentEntryId() {
            return utils.getCurrentEntryId();
        }

        getCurrentSiteHandle() {
            return utils.getCurrentSiteHandle();
        }
    }

    return QuickSearch;
})();
