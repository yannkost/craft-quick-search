/**
 * Quick Search - Related Entries Sidebar Panel
 * Injects a related entries panel into the Craft entry edit sidebar,
 * positioned right after the native Craft metadata blocks.
 */

window.RelatedEntriesSidebar = (function() {
    'use strict';

    const utils = window.QuickSearchUtils;

    class RelatedEntriesSidebar {
        constructor() {
            this.panel = null;
            this.settings = window.QuickSearchSettings || {};
            this.t = this.settings.translations || {};
            this.entryId = null;
        }

        init() {
            if (!this.settings.showSidebarRelatedEntries) {
                return;
            }

            this.entryId = utils.getCurrentEntryId();
            if (!this.entryId) {
                return;
            }

            try {
                this.createPanel();
                this.injectPanel();
                this.fetchAndRender();
            } catch (error) {
                console.error('Quick Search: Error initializing related entries sidebar', error);
            }
        }

        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'quick-search-related-sidebar';
            this.panel.className = 'qs-sidebar-panel';

            const collapsed = this.getCollapsedState();

            const header = document.createElement('div');
            header.className = 'qs-sidebar-header' + (collapsed ? ' qs-sidebar-collapsed' : '');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', String(!collapsed));

            const title = document.createElement('span');
            title.className = 'qs-sidebar-title';
            title.textContent = this.t.relatedEntries || 'Related Entries';

            const chevron = document.createElement('span');
            chevron.className = 'qs-sidebar-chevron';
            chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';

            header.appendChild(title);
            header.appendChild(chevron);
            header.addEventListener('click', () => this.toggleCollapse());

            const body = document.createElement('div');
            body.className = 'qs-sidebar-body' + (collapsed ? ' qs-sidebar-body-hidden' : '');

            const loading = document.createElement('div');
            loading.className = 'qs-sidebar-loading';
            loading.textContent = this.t.searching || 'Searching...';
            body.appendChild(loading);

            this.panel.appendChild(header);
            this.panel.appendChild(body);
        }

        injectPanel() {
            const details = document.getElementById('details');
            if (!details) {
                return;
            }

            // Craft renders sidebar content inside #details > .details, not as direct children of #details
            const detailsInner = details.querySelector(':scope > .details') || details;

            const position = this.settings.sidebarRelatedEntriesPosition || 'end';
            this.panel.classList.add(`qs-sidebar-position-${position}`);

            if (position === 'end') {
                detailsInner.appendChild(this.panel);

            } else if (position === 'after_status') {
                // Status is wrapped in a <fieldset> direct child of .details
                // (structure: fieldset > legend.h6 + div.meta > lightswitch)
                const statusFieldset = detailsInner.querySelector(':scope > fieldset');
                if (statusFieldset) {
                    statusFieldset.insertAdjacentElement('afterend', this.panel);
                } else {
                    detailsInner.appendChild(this.panel);
                }

            } else {
                // 'start': insert after the metadata block.
                // Craft renders: div.meta (fields) + h2.visually-hidden "Metadata" as siblings.
                // The h2 is the most reliable anchor — it always follows the metadata .meta.
                const metaHeading = detailsInner.querySelector(':scope > h2.visually-hidden');
                if (metaHeading) {
                    metaHeading.insertAdjacentElement('afterend', this.panel);
                } else {
                    // Fallback: after the last direct .meta
                    const metas = [...detailsInner.querySelectorAll(':scope > .meta')];
                    const lastMeta = metas[metas.length - 1];
                    if (lastMeta) {
                        lastMeta.insertAdjacentElement('afterend', this.panel);
                    } else {
                        detailsInner.prepend(this.panel);
                    }
                }
            }
        }

        async fetchAndRender() {
            try {
                const params = new URLSearchParams({ entryId: this.entryId.toString() });
                const actionUrl = Craft.getActionUrl('quick-search/related-entries/index');
                const separator = actionUrl.includes('?') ? '&' : '?';

                const response = await utils.fetchWithTimeout(
                    actionUrl + separator + params,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    },
                    60000
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    this.renderResults(data.outgoing || [], data.incoming || []);
                } else {
                    this.renderError(data.error || this.t.relatedEntriesError || 'An error occurred.');
                }
            } catch (error) {
                console.error('Quick Search: Error fetching related entries for sidebar', error);
                this.renderError(this.t.relatedEntriesError || 'An error occurred.');
            }
        }

        renderResults(outgoing, incoming) {
            if (!this.panel) return;

            const body = this.panel.querySelector('.qs-sidebar-body');
            if (!body) return;

            const total = outgoing.length + incoming.length;

            const title = this.panel.querySelector('.qs-sidebar-title');
            if (title) {
                title.textContent = (this.t.relatedEntries || 'Related Entries') +
                    (total > 0 ? ` (${total})` : '');
            }

            body.innerHTML = '';

            if (total === 0) {
                const empty = document.createElement('div');
                empty.className = 'qs-sidebar-empty';
                empty.textContent = this.t.noRelatedEntries || 'No related entries found';
                body.appendChild(empty);
                return;
            }

            if (outgoing.length > 0) {
                body.appendChild(this.buildDirectionBlock(this.t.linksTo || 'Links to', outgoing));
            }

            if (incoming.length > 0) {
                body.appendChild(this.buildDirectionBlock(this.t.linkedFrom || 'Linked from', incoming));
            }
        }

        buildDirectionBlock(label, entries) {
            const block = document.createElement('div');
            block.className = 'qs-sidebar-direction';

            const heading = document.createElement('div');
            heading.className = 'qs-sidebar-direction-label';
            heading.textContent = `${label} (${entries.length})`;
            block.appendChild(heading);

            // Group by section
            const groups = {};
            entries.forEach(entry => {
                const key = entry.section?.name || 'Other';
                if (!groups[key]) groups[key] = [];
                groups[key].push(entry);
            });

            Object.entries(groups).forEach(([sectionName, groupEntries]) => {
                const group = document.createElement('div');
                group.className = 'qs-sidebar-group';

                const groupLabel = document.createElement('div');
                groupLabel.className = 'qs-sidebar-group-label';
                groupLabel.textContent = `${sectionName} (${groupEntries.length})`;
                group.appendChild(groupLabel);

                groupEntries.forEach(entry => {
                    group.appendChild(this.buildEntryItem(entry));
                });

                block.appendChild(group);
            });

            return block;
        }

        buildEntryItem(entry) {
            const item = document.createElement('a');
            item.href = entry.url || '#';
            item.className = 'qs-sidebar-item';
            item.title = entry.title || '';

            const titleEl = document.createElement('span');
            titleEl.className = 'qs-sidebar-item-title';
            titleEl.textContent = entry.title || '';

            const statusEl = document.createElement('span');
            statusEl.className = `qs-sidebar-item-status ${entry.status || ''}`;
            statusEl.title = utils.getStatusTooltip(entry.status, this.t);

            item.appendChild(titleEl);
            item.appendChild(statusEl);

            return item;
        }

        renderError(message) {
            if (!this.panel) return;
            const body = this.panel.querySelector('.qs-sidebar-body');
            if (body) {
                body.innerHTML = '';
                const error = document.createElement('div');
                error.className = 'qs-sidebar-error';
                error.textContent = message;
                body.appendChild(error);
            }
        }

        toggleCollapse() {
            const header = this.panel.querySelector('.qs-sidebar-header');
            const body = this.panel.querySelector('.qs-sidebar-body');
            if (!header || !body) return;

            const isNowCollapsed = !header.classList.contains('qs-sidebar-collapsed');
            header.classList.toggle('qs-sidebar-collapsed', isNowCollapsed);
            header.setAttribute('aria-expanded', String(!isNowCollapsed));
            body.classList.toggle('qs-sidebar-body-hidden', isNowCollapsed);
            this.saveCollapsedState(isNowCollapsed);
        }

        getCollapsedState() {
            try {
                return sessionStorage.getItem(`qs-sidebar-collapsed-${this.entryId}`) === '1';
            } catch (e) {
                return false;
            }
        }

        saveCollapsedState(collapsed) {
            try {
                if (collapsed) {
                    sessionStorage.setItem(`qs-sidebar-collapsed-${this.entryId}`, '1');
                } else {
                    sessionStorage.removeItem(`qs-sidebar-collapsed-${this.entryId}`);
                }
            } catch (e) {
                // sessionStorage unavailable — ignore
            }
        }
    }

    return RelatedEntriesSidebar;
})();
