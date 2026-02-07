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

                    // Check if a tab was clicked - close and refresh outline
                    const tab = e.target.closest('#content-container .tab, #content-container [data-id]');
                    if (tab && this.popup && this.popup.classList.contains('active')) {
                        // Small delay to let the tab switch complete
                        setTimeout(() => {
                            this.refreshOutline();
                        }, 100);
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

            // Listen for Craft's tab change events via MutationObserver
            this.observeTabChanges();
        }

        observeTabChanges() {
            const contentContainer = document.querySelector('#content-container');
            if (!contentContainer) return;

            const observer = new MutationObserver((mutations) => {
                // Check if any mutation affects tab visibility
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'class' || mutation.attributeName === 'hidden')) {
                        // A tab might have changed visibility
                        if (this.popup && this.popup.classList.contains('active')) {
                            this.refreshOutline();
                        }
                        break;
                    }
                }
            });

            observer.observe(contentContainer, {
                attributes: true,
                subtree: true,
                attributeFilter: ['class', 'hidden']
            });
        }

        refreshOutline() {
            if (this.popup && this.popup.classList.contains('active')) {
                const hierarchy = this.scanBlocksHierarchy();
                this.renderOutline(hierarchy);
            }
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

        getActiveTabContainer() {
            // Find the active tab pane in Craft CMS entry editor
            // Craft uses .flex-fields for the main content area
            const activeTab = document.querySelector('#content-container .tab.sel, #content-container [data-id].sel');
            if (activeTab) {
                const tabId = activeTab.dataset.id || activeTab.getAttribute('href')?.replace('#', '');
                if (tabId) {
                    const tabPane = document.getElementById(tabId);
                    if (tabPane) {
                        return tabPane;
                    }
                }
            }

            // Fallback: look for visible tab content
            const visiblePane = document.querySelector('#content-container > .flex-fields:not(.hidden), #content-container > div:not(.hidden) > .flex-fields');
            if (visiblePane) {
                return visiblePane;
            }

            // Final fallback: use the main content container
            return document.querySelector('#content-container') || document.body;
        }

        scanBlocksHierarchy() {
            const container = this.getActiveTabContainer();
            const outlineItems = [];
            
            // First, scan top-level fields (not inside matrix blocks)
            const topLevelFields = this.scanTopLevelFields(container);
            outlineItems.push(...topLevelFields);
            
            // Then scan matrix blocks with their hierarchy
            const matrixBlocks = this.scanMatrixBlocks(container);
            outlineItems.push(...matrixBlocks);
            
            // Assign indices to top-level items
            outlineItems.forEach((item, index) => {
                item.index = index + 1;
            });
            
            return outlineItems;
        }

        scanTopLevelFields(container) {
            const fields = [];
            const seenFields = new Set();
            
            // Find field containers that are direct children (not inside matrix blocks)
            // Craft uses .field class for field wrappers with data-attribute for the field handle
            const fieldContainers = container.querySelectorAll('.field[data-attribute]');
            
            fieldContainers.forEach(fieldEl => {
                try {
                    // Skip if this field is inside a matrix block
                    if (fieldEl.closest('.matrixblock')) {
                        return;
                    }
                    
                    // Skip matrix/nested entry fields themselves (we handle their blocks separately)
                    // But DO include entry relation fields (.elementselect)
                    const isMatrixField = fieldEl.querySelector('.matrix-field, .nested-element-cards');
                    if (isMatrixField) {
                        return;
                    }
                    
                    // Avoid duplicates
                    const fieldAttr = fieldEl.dataset.attribute;
                    if (seenFields.has(fieldAttr)) {
                        return;
                    }
                    seenFields.add(fieldAttr);
                    
                    const fieldData = this.extractFieldData(fieldEl);
                    if (fieldData) {
                        fields.push(fieldData);
                    }
                } catch (e) {
                    console.error('Quick Search: Error extracting field data', e);
                }
            });
            
            return fields;
        }

        scanMatrixBlocks(container) {
            const allBlocks = container.querySelectorAll('.matrixblock[data-type-name]');
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
            
            return topLevelBlocks;
        }

        extractFieldData(fieldEl) {
            // Get field label from legend or label element
            const labelEl = fieldEl.querySelector(':scope > .heading legend, :scope > .heading label, .heading label');
            const label = labelEl ? labelEl.textContent.trim() : null;
            
            if (!label) {
                return null;
            }
            
            // Get field type from data-type attribute first (most reliable)
            let fieldType = 'field';
            const dataType = fieldEl.dataset.type || '';
            
            if (dataType.includes('Entries') || dataType.includes('Categories') || dataType.includes('Assets') || dataType.includes('Users')) {
                fieldType = 'entries';
            } else if (dataType.includes('CKEditor') || dataType.includes('Redactor')) {
                fieldType = 'richtext';
            } else if (dataType.includes('PlainText')) {
                fieldType = 'text';
            } else if (dataType.includes('Number')) {
                fieldType = 'number';
            } else if (dataType.includes('Date')) {
                fieldType = 'date';
            } else if (dataType.includes('Lightswitch')) {
                fieldType = 'lightswitch';
            } else if (dataType.includes('Dropdown') || dataType.includes('RadioButtons') || dataType.includes('Checkboxes')) {
                fieldType = 'dropdown';
            } else if (dataType.includes('Color')) {
                fieldType = 'color';
            } else if (dataType.includes('Email')) {
                fieldType = 'email';
            } else if (dataType.includes('Url')) {
                fieldType = 'url';
            } else if (dataType.includes('Table')) {
                fieldType = 'table';
            } else {
                // Fallback: detect from DOM elements
                const fieldInput = fieldEl.querySelector('.input');
                if (fieldInput) {
                    if (fieldInput.querySelector('.elementselect, .elements')) {
                        fieldType = 'entries';
                    } else if (fieldInput.querySelector('textarea, .ck-editor, .redactor-box')) {
                        fieldType = 'richtext';
                    } else if (fieldInput.querySelector('input[type="text"], input[type="url"]')) {
                        fieldType = 'text';
                    } else if (fieldInput.querySelector('input[type="number"]')) {
                        fieldType = 'number';
                    } else if (fieldInput.querySelector('.datewrapper')) {
                        fieldType = 'date';
                    } else if (fieldInput.querySelector('.lightswitch')) {
                        fieldType = 'lightswitch';
                    } else if (fieldInput.querySelector('select')) {
                        fieldType = 'dropdown';
                    }
                }
            }
            
            // Get icon based on field type
            const iconHtml = this.getFieldTypeIcon(fieldType);
            
            return {
                element: fieldEl,
                typeName: label,
                fieldType: fieldType,
                iconHtml: iconHtml,
                iconColorClass: 'field-icon',
                isField: true,
                children: []
            };
        }

        getFieldTypeIcon(fieldType) {
            const icons = {
                richtext: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>',
                text: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
                number: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>',
                date: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
                lightswitch: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>',
                dropdown: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>',
                entries: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>',
                color: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>',
                email: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
                url: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>',
                table: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>',
                field: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>'
            };
            return icons[fieldType] || icons.field;
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
