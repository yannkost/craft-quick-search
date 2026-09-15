import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const assets = new URL('../src/assetbundles/quicksearch/dist/js/', import.meta.url);

for (const [filename, className, method] of [
    ['related-entries-sidebar.js', 'RelatedEntriesSidebar', 'fetchAndRender'],
    ['related-entries-overlay.js', 'RelatedEntriesOverlay', 'showRelatedEntries'],
]) {
    for (const currentSiteId of [2, undefined]) {
        for (const actionUrl of ['/actions/quick-search/related-entries/index', '/index.php?p=actions/quick-search/related-entries/index']) {
            test(`${className}: site ${currentSiteId ?? 'omitted'}, ${actionUrl}`, async () => {
                let request;
                const context = vm.createContext({
                    URLSearchParams,
                    console,
                    Craft: { getActionUrl: () => actionUrl },
                    window: {
                        QuickSearchSettings: { currentSiteId },
                        QuickSearchUtils: {
                            async fetchWithTimeout(url, options, timeout) {
                                request = { url, options, timeout };
                                return { ok: true, json: async () => ({ success: true, outgoing: [], incoming: [] }) };
                            },
                        },
                    },
                });
                vm.runInContext(readFileSync(new URL(filename, assets), 'utf8'), context);
                const instance = new context.window[className]();
                instance.entryId = 692867;
                instance.show = () => {};
                instance.showLoading = () => {};
                instance.showError = instance.renderError = (message) => assert.fail(message);
                await instance[method](692867);

                const url = new URL(request.url, 'https://craft.test');
                assert.equal(url.searchParams.get('entryId'), '692867');
                assert.equal(url.searchParams.get('siteId'), currentSiteId ? '2' : null);
                assert.equal(url.searchParams.get('p'), actionUrl.includes('?') ? 'actions/quick-search/related-entries/index' : null);
                assert.equal(request.options.headers.Accept, 'application/json');
                assert.equal(request.timeout, 60000);
            });
        }
    }
}
