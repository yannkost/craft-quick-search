/**
 * Quick Search - Related Entries Overlay
 * Handles the related entries modal functionality
 */

window.RelatedEntriesOverlay = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    class RelatedEntriesOverlay {
        constructor() {
            this.overlay = null;
            this.modal = null;
            this.settings = window.QuickSearchSettings || {
                compactMode: false,
                translations: {}
            };
            this.t = this.settings.translations || {};
            this.fetchTimeout = 10000;
        }

        init() {
            try {
                this.createOverlay();
                this.bindEvents();
            } catch (error) {
                console.error('Quick Search: Error initializing related entries overlay', error);
            }
        }

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.className = 'quick-search-related-overlay';

            this.modal = document.createElement('div');
            this.modal.className = 'quick-search-related-modal';
            if (this.settings.compactMode) {
                this.modal.classList.add('compact');
            }

            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);
        }

        bindEvents() {
            document.addEventListener('click', (e) => {
                try {
                    const btn = e.target.closest('.quick-search-related-btn');
                    if (btn) {
                        e.preventDefault();
                        const entryId = btn.dataset.entryId;
                        if (entryId) {
                            this.showRelatedEntries(parseInt(entryId));
                        }
                    }
                } catch (error) {
                    console.error('Quick Search: Error handling related entries button click', error);
                }
            });

            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) {
                        this.hide();
                    }
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('active')) {
                    this.hide();
                }
            });
        }

        async showRelatedEntries(entryId) {
            this.showLoading();
            this.show();

            try {
                const params = new URLSearchParams({ entryId: entryId.toString() });
                const actionUrl = Craft.getActionUrl('quick-search/related-entries/index');
                const separator = actionUrl.includes('?') ? '&' : '?';

                const response = await utils.fetchWithTimeout(actionUrl + separator + params, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }, this.fetchTimeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.renderRelatedEntries(data.outgoing || [], data.incoming || []);
                } else {
                    this.showError(data.error || this.t.relatedEntriesError || 'An error occurred while fetching related entries.');
                }
            } catch (error) {
                console.error('Quick Search: Error fetching related entries', error);
                this.showError(this.t.relatedEntriesError || 'An error occurred while fetching related entries.');
            }
        }

        renderRelatedEntries(outgoing, incoming) {
            if (!this.modal) return;

            this.modal.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'quick-search-related-header';

            const title = document.createElement('h2');
            title.className = 'quick-search-related-title';
            title.textContent = this.t.relatedEntries || 'Related Entries';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'quick-search-related-close';
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            closeBtn.addEventListener('click', () => this.hide());

            header.appendChild(title);
            header.appendChild(closeBtn);
            this.modal.appendChild(header);

            const content = document.createElement('div');
            content.className = 'quick-search-related-content';

            if ((!outgoing || outgoing.length === 0) && (!incoming || incoming.length === 0)) {
                const noResults = document.createElement('div');
                noResults.className = 'quick-search-related-empty';
                noResults.textContent = this.t.noRelatedEntries || 'No related entries found';
                content.appendChild(noResults);
            } else {
                if (outgoing && outgoing.length > 0) {
                    const outgoingSection = this.createSection(
                        this.t.linksTo || 'Links to',
                        outgoing
                    );
                    content.appendChild(outgoingSection);
                }

                if (incoming && incoming.length > 0) {
                    const incomingSection = this.createSection(
                        this.t.linkedFrom || 'Linked from',
                        incoming
                    );
                    content.appendChild(incomingSection);
                }
            }

            this.modal.appendChild(content);
        }

        createSection(title, entries) {
            const section = document.createElement('div');
            section.className = 'quick-search-related-section';

            const sectionHeader = document.createElement('h3');
            sectionHeader.className = 'quick-search-related-section-title';
            sectionHeader.textContent = `${title} (${entries.length})`;
            section.appendChild(sectionHeader);

            const list = document.createElement('ul');
            list.className = 'quick-search-related-list';

            entries.forEach(entry => {
                try {
                    const item = this.createEntryItem(entry);
                    if (item) {
                        list.appendChild(item);
                    }
                } catch (e) {
                    console.error('Quick Search: Error rendering related entry item', e);
                }
            });

            section.appendChild(list);
            return section;
        }

        createEntryItem(entry) {
            if (!entry) return null;

            const item = document.createElement('li');
            item.className = 'quick-search-related-item';

            const content = document.createElement('a');
            content.href = entry.url || '#';
            content.className = 'quick-search-related-item-content';

            const titleEl = document.createElement('div');
            titleEl.className = 'quick-search-related-item-title';
            titleEl.textContent = entry.title || '';

            const meta = document.createElement('div');
            meta.className = 'quick-search-related-item-meta';

            const sectionEl = document.createElement('span');
            sectionEl.className = 'quick-search-related-item-section';
            sectionEl.textContent = entry.section?.name || '';

            const statusEl = document.createElement('span');
            statusEl.className = `quick-search-related-item-status ${entry.status || ''}`;
            statusEl.textContent = entry.status || '';
            if (entry.status) {
                statusEl.title = utils.getStatusTooltip(entry.status, this.t);
            }

            meta.appendChild(sectionEl);
            meta.appendChild(statusEl);

            content.appendChild(titleEl);
            content.appendChild(meta);

            const newTabBtn = document.createElement('button');
            newTabBtn.type = 'button';
            newTabBtn.className = 'quick-search-newtab-btn';
            newTabBtn.title = this.t.openInNewTab || 'Open in new tab';
            newTabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';
            newTabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (entry.url) {
                    window.open(entry.url, '_blank');
                }
            });

            item.appendChild(content);
            item.appendChild(newTabBtn);

            return item;
        }

        showLoading() {
            if (this.modal) {
                this.modal.innerHTML = `<div class="quick-search-related-loading">${this.t.searching || 'Searching...'}</div>`;
            }
        }

        showError(message) {
            if (!this.modal) return;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'quick-search-related-error';
            errorDiv.textContent = message;
            this.modal.innerHTML = '';
            this.modal.appendChild(errorDiv);
        }

        show() {
            if (this.overlay) {
                this.overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        hide() {
            if (this.overlay) {
                this.overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    return RelatedEntriesOverlay;
})();
