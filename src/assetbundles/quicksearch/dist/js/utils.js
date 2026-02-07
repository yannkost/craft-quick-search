/**
 * Quick Search - Shared Utilities
 */

window.QuickSearchUtils = (function() {
    'use strict';

    const DEFAULT_TIMEOUT = 10000;

    /**
     * Fetch with timeout - prevents UI from appearing frozen if server hangs
     * @param {string} url - The URL to fetch
     * @param {object} options - Fetch options
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<Response>}
     */
    async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    /**
     * Get status tooltip text
     * @param {string} status - Entry status
     * @param {object} translations - Translation strings
     * @returns {string}
     */
    function getStatusTooltip(status, translations = {}) {
        const statusMap = {
            'live': translations.statusLive || 'Status: Live',
            'draft': translations.statusDraft || 'Status: Draft',
            'pending': translations.statusPending || 'Status: Pending',
            'disabled': translations.statusDisabled || 'Status: Disabled',
            'expired': translations.statusExpired || 'Status: Expired'
        };
        return statusMap[status] || `Status: ${status}`;
    }

    /**
     * Get current entry ID from URL
     * @returns {number|null}
     */
    function getCurrentEntryId() {
        try {
            const match = window.location.pathname.match(/\/entries\/[^/]+\/(\d+)/);
            return match ? parseInt(match[1]) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get current site handle from URL query params
     * @returns {string|null}
     */
    function getCurrentSiteHandle() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('site') || null;
        } catch (e) {
            return null;
        }
    }

    return {
        fetchWithTimeout,
        getStatusTooltip,
        getCurrentEntryId,
        getCurrentSiteHandle,
        DEFAULT_TIMEOUT
    };
})();
