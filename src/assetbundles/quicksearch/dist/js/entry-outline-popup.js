/**
 * Quick Search - Entry Outline Popup
 * Handles the entry outline/block navigation popup
 */

window.EntryOutlinePopup = (function() {
    'use strict';

    class EntryOutlinePopup {
        constructor() {
            this.popup = null;
            this.button = null;
            this.settings = window.QuickSearchSettings || {
                compactMode: false,
                translations: {}
            };
            this.t = this.settings.translations || {};
        }

        init() {
            try {
                this.createPopup();
                this.bindEvents();
            } catch (error) {
                console.error('Quick Search: Error initializing entry outline popup', error);
            }
        }

        createPopup() {
            this.popup = document.createElement('div');
            this.popup.className = 'quick-search-outline-popup';
            if (this.settings.compactMode) {
                this.popup.classList.add('compact');
            }
            document.body.appendChild(this.popup);
        }

        bindEvents() {
            document.addEventListener('click', (e) => {
                try {
                    const btn = e.target.closest('.quick-search-outline-btn');
                    if (btn) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.button = btn;
                        this.togglePopup();
                        return;
                    }

                    if (this.popup && this.popup.classList.contains('active') && !this.popup.contains(e.target)) {
                        this.hide();
                    }
                } catch (error) {
                    console.error('Quick Search: Error handling outline button click', error);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.popup && this.popup.classList.contains('active')) {
                    this.hide();
                }
            });
        }

        togglePopup() {
            if (this.popup && this.popup.classList.contains('active')) {
                this.hide();
            } else {
                this.show();
            }
        }

        show() {
            if (!this.popup) return;

            try {
                const hierarchy = this.scanBlocksHierarchy();
                this.renderOutline(hierarchy);

                if (this.button) {
                    const rect = this.button.getBoundingClientRect();
                    this.popup.style.top = (rect.bottom + 8) + 'px';
                    this.popup.style.left = rect.left + 'px';
                }

                this.popup.classList.add('active');
            } catch (error) {
                console.error('Quick Search: Error showing outline popup', error);
            }
        }

        hide() {
            if (this.popup) {
                this.popup.classList.remove('active');
            }
        }

        scanBlocksHierarchy() {
            const allBlocks = document.querySelectorAll('.matrixblock[data-type-name]');
            const topLevelBlocks = [];
            const blockMap = new Map();

            allBlocks.forEach(block => {
                try {
                    const blockData = this.extractBlockData(block);
                    blockMap.set(block, blockData);
                } catch (e) {
                    console.error('Quick Search: Error extracting block data', e);
                }
            });

            allBlocks.forEach(block => {
                try {
                    const blockData = blockMap.get(block);
                    if (!blockData) return;

                    const parentBlock = block.parentElement ? block.parentElement.closest('.matrixblock[data-type-name]') : null;

                    if (parentBlock && blockMap.has(parentBlock)) {
                        const parentData = blockMap.get(parentBlock);
                        if (!parentData.children) {
                            parentData.children = [];
                        }
                        parentData.children.push(blockData);
                    } else {
                        topLevelBlocks.push(blockData);
                    }
                } catch (e) {
                    console.error('Quick Search: Error building block hierarchy', e);
                }
            });

            topLevelBlocks.forEach((block, index) => {
                block.index = index + 1;
            });

            return topLevelBlocks;
        }

        extractBlockData(block) {
            const typeName = block.dataset.typeName || 'Block';
            const blockId = block.dataset.id;

            const titlebar = block.querySelector(':scope > .titlebar');
            let iconHtml = '';
            let iconColorClass = '';

            if (titlebar) {
                const iconEl = titlebar.querySelector('.cp-icon svg');
                if (iconEl) {
                    iconHtml = iconEl.outerHTML;
                }

                const iconContainer = titlebar.querySelector('.cp-icon');
                if (iconContainer && iconContainer.className) {
                    const classes = iconContainer.className.split(' ');
                    for (const cls of classes) {
                        if (cls !== 'cp-icon' && cls !== 'small') {
                            iconColorClass = cls;
                            break;
                        }
                    }
                }
            }

            return {
                element: block,
                typeName: typeName,
                blockId: blockId,
                iconHtml: iconHtml,
                iconColorClass: iconColorClass,
                children: []
            };
        }

        renderOutline(blocks) {
            if (!this.popup) return;

            this.popup.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'quick-search-outline-header';

            const title = document.createElement('span');
            title.className = 'quick-search-outline-title';
            title.textContent = this.t.entryOutline || 'Entry Outline';

            const headerBtns = document.createElement('div');
            headerBtns.className = 'quick-search-outline-header-btns';

            const expandAllBtn = document.createElement('button');
            expandAllBtn.type = 'button';
            expandAllBtn.className = 'quick-search-outline-expand-btn';
            expandAllBtn.title = 'Expand all blocks';
            expandAllBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9l7-7 7 7" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7 7 7-7" /></svg>';
            expandAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.expandAll();
            });

            const collapseAllBtn = document.createElement('button');
            collapseAllBtn.type = 'button';
            collapseAllBtn.className = 'quick-search-outline-collapse-btn';
            collapseAllBtn.title = 'Collapse all blocks';
            collapseAllBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l7 4 7-4" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 12h12" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 21l7-4 7 4" /></svg>';
            collapseAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.collapseAll();
            });

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'quick-search-outline-close';
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });

            headerBtns.appendChild(expandAllBtn);
            headerBtns.appendChild(collapseAllBtn);
            headerBtns.appendChild(closeBtn);

            header.appendChild(title);
            header.appendChild(headerBtns);
            this.popup.appendChild(header);

            const content = document.createElement('div');
            content.className = 'quick-search-outline-content';

            if (!blocks || blocks.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'quick-search-outline-empty';
                empty.textContent = this.t.noBlocksFound || 'No blocks found';
                content.appendChild(empty);
            } else {
                const list = document.createElement('ul');
                list.className = 'quick-search-outline-list';

                blocks.forEach(block => {
                    try {
                        const item = this.createOutlineItem(block, 0);
                        if (item) {
                            list.appendChild(item);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error creating outline item', e);
                    }
                });

                content.appendChild(list);
            }

            this.popup.appendChild(content);
        }

        createOutlineItem(block, depth) {
            if (!block) return null;

            const item = document.createElement('li');
            item.className = 'quick-search-outline-item';
            if (depth > 0) {
                item.classList.add('quick-search-outline-item-nested');
                item.style.setProperty('--depth', depth);
            }

            const hasChildren = block.children && block.children.length > 0;

            const row = document.createElement('div');
            row.className = 'quick-search-outline-item-row';

            if (hasChildren) {
                const chevron = document.createElement('button');
                chevron.type = 'button';
                chevron.className = 'quick-search-outline-chevron';
                chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>';
                chevron.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleChildren(item);
                });
                row.appendChild(chevron);
            } else {
                const spacer = document.createElement('span');
                spacer.className = 'quick-search-outline-chevron-spacer';
                row.appendChild(spacer);
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-search-outline-item-btn';

            if (depth === 0 && block.index) {
                const indexEl = document.createElement('span');
                indexEl.className = 'quick-search-outline-item-index';
                indexEl.textContent = block.index;
                button.appendChild(indexEl);
            }

            const iconWrapper = document.createElement('span');
            iconWrapper.className = 'quick-search-outline-item-icon';
            if (block.iconColorClass) {
                iconWrapper.classList.add(block.iconColorClass);
            }
            if (block.iconHtml) {
                iconWrapper.innerHTML = block.iconHtml;
            }

            const nameEl = document.createElement('span');
            nameEl.className = 'quick-search-outline-item-name';
            nameEl.textContent = block.typeName || '';

            button.appendChild(iconWrapper);
            button.appendChild(nameEl);

            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToBlock(block.element);
                this.hide();
            });

            row.appendChild(button);
            item.appendChild(row);

            if (hasChildren) {
                const childList = document.createElement('ul');
                childList.className = 'quick-search-outline-children';

                block.children.forEach(child => {
                    try {
                        const childItem = this.createOutlineItem(child, depth + 1);
                        if (childItem) {
                            childList.appendChild(childItem);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error creating child outline item', e);
                    }
                });

                item.appendChild(childList);
            }

            return item;
        }

        toggleChildren(item) {
            if (item) {
                item.classList.toggle('expanded');
            }
        }

        expandAll() {
            if (typeof jQuery === 'undefined') {
                console.error('Quick Search: jQuery not available for expand/collapse');
                return;
            }

            try {
                const blocks = document.querySelectorAll('.matrixblock.collapsed');
                blocks.forEach((block) => {
                    try {
                        const entry = jQuery(block).data('entry');
                        if (entry && typeof entry.expand === 'function') {
                            entry.expand();
                        }
                    } catch (e) {
                        console.error('Quick Search: Error expanding block', e);
                    }
                });
            } catch (error) {
                console.error('Quick Search: Error in expandAll', error);
            }
        }

        collapseAll() {
            if (typeof jQuery === 'undefined') {
                console.error('Quick Search: jQuery not available for expand/collapse');
                return;
            }

            try {
                const blocks = document.querySelectorAll('.matrixblock:not(.collapsed)');
                blocks.forEach((block) => {
                    try {
                        const entry = jQuery(block).data('entry');
                        if (entry && typeof entry.collapse === 'function') {
                            entry.collapse(true);
                        }
                    } catch (e) {
                        console.error('Quick Search: Error collapsing block', e);
                    }
                });
            } catch (error) {
                console.error('Quick Search: Error in collapseAll', error);
            }
        }

        scrollToBlock(element) {
            if (!element) return;

            try {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('quick-search-outline-highlight');

                setTimeout(() => {
                    if (element) {
                        element.classList.remove('quick-search-outline-highlight');
                    }
                }, 1500);
            } catch (error) {
                console.error('Quick Search: Error scrolling to block', error);
            }
        }
    }

    return EntryOutlinePopup;
})();
