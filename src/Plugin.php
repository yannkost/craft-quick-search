<?php

declare(strict_types=1);

namespace craftcms\quicksearch;

use Craft;
use craft\base\Model;
use craft\base\Plugin as BasePlugin;
use craft\elements\Entry;
use craft\events\DefineHtmlEvent;
use craft\events\TemplateEvent;
use craft\web\View;
use craft\console\Application as ConsoleApplication;
use craftcms\quicksearch\assetbundles\quicksearch\QuickSearchAsset;
use craftcms\quicksearch\console\controllers\DebugController;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\models\Settings;
use craftcms\quicksearch\services\FavoritesService;
use craftcms\quicksearch\services\HistoryService;
use craftcms\quicksearch\services\RelatedEntriesService;
use craftcms\quicksearch\services\SavedSearchesService;
use craftcms\quicksearch\services\SearchService;
use craftcms\quicksearch\widgets\QuickSearchWidget;
use craft\events\RegisterComponentTypesEvent;
use craft\services\Dashboard;
use yii\base\Event;

/**
 * Quick Search Plugin
 *
 * Fast entry search and navigation for the Craft CMS control panel
 *
 * @property-read SearchService $search
 * @property-read HistoryService $history
 * @property-read RelatedEntriesService $relatedEntries
 * @property-read FavoritesService $favorites
 * @property-read SavedSearchesService $savedSearches
 * @property-read Settings $settings
 *
 * @method Settings getSettings()
 *
 * @since 1.0.0
 */
class Plugin extends BasePlugin
{
    /**
     * @var string
     */
    public string $schemaVersion = '1.3.0';

    /**
     * @var bool
     */
    public bool $hasCpSettings = true;

    /**
     * @var bool
     */
    public bool $hasCpSection = false;

    /**
     * @inheritdoc
     */
    public static function config(): array
    {
        return [
            'components' => [
                'search' => SearchService::class,
                'history' => HistoryService::class,
                'relatedEntries' => RelatedEntriesService::class,
                'favorites' => FavoritesService::class,
                'savedSearches' => SavedSearchesService::class,
            ],
        ];
    }

    /**
     * @inheritdoc
     */
    public function init(): void
    {
        parent::init();

        // Register console commands
        if (Craft::$app instanceof ConsoleApplication) {
            Craft::$app->controllerMap['quick-search-debug'] = DebugController::class;
        }

        // Register widget
        $this->registerWidget();

        // Only register for CP requests
        $request = Craft::$app->getRequest();
        if ($request->getIsCpRequest() && !$request->getIsConsoleRequest()) {
            $this->registerCpUrlRules();
            $this->registerAssetBundle();
            $this->registerEntryVisitTracking();
            $this->registerEntryOutlineButton();
            $this->registerRelatedEntriesButton();
        }
    }

    /**
     * Register the Quick Search dashboard widget
     */
    private function registerWidget(): void
    {
        Event::on(
            Dashboard::class,
            Dashboard::EVENT_REGISTER_WIDGET_TYPES,
            function(RegisterComponentTypesEvent $event) {
                $event->types[] = QuickSearchWidget::class;
            }
        );
    }

    /**
     * Register CP URL rules for AJAX endpoints
     */
    private function registerCpUrlRules(): void
    {
        Craft::$app->getUrlManager()->addRules([
            'quick-search/search' => 'quick-search/search/index',
            'quick-search/search/sections' => 'quick-search/search/sections',
            'quick-search/search/sites' => 'quick-search/search/sites',
            'quick-search/search/types' => 'quick-search/search/types',
            'quick-search/history' => 'quick-search/history/index',
            'quick-search/history/record' => 'quick-search/history/record',
            'quick-search/history/clear' => 'quick-search/history/clear',
            'quick-search/favorites' => 'quick-search/favorites/list',
            'quick-search/favorites/add' => 'quick-search/favorites/add',
            'quick-search/favorites/remove' => 'quick-search/favorites/remove',
            'quick-search/favorites/reorder' => 'quick-search/favorites/reorder',
            'quick-search/related-entries' => 'quick-search/related-entries/index',
            'quick-search/saved-searches' => 'quick-search/saved-searches/list',
            'quick-search/saved-searches/save' => 'quick-search/saved-searches/save',
            'quick-search/saved-searches/delete' => 'quick-search/saved-searches/delete',
            'quick-search/saved-searches/reorder' => 'quick-search/saved-searches/reorder',
        ]);
    }

    /**
     * Register asset bundle for CP pages
     */
    private function registerAssetBundle(): void
    {
        // Register on BEFORE_RENDER_PAGE_TEMPLATE - fires once per page load
        Event::on(
            View::class,
            View::EVENT_BEFORE_RENDER_PAGE_TEMPLATE,
            function(TemplateEvent $event) {
                try {
                    $currentUser = Craft::$app->getUser()->getIdentity();
                    if (!$currentUser) {
                        return;
                    }

                    $view = Craft::$app->getView();
                    $view->registerAssetBundle(QuickSearchAsset::class);

                    // Pass settings and translations to JavaScript
                    $settings = $this->getSettings();

                    // Get actual current site from URL query parameter (Craft CP uses ?site=handle)
                    $request = Craft::$app->getRequest();
                    $siteHandle = $request->getQueryParam('site');
                    if ($siteHandle) {
                        $currentSite = Craft::$app->getSites()->getSiteByHandle($siteHandle);
                        if (!$currentSite) {
                            $currentSite = Craft::$app->getSites()->getCurrentSite();
                        }
                    } else {
                        $currentSite = Craft::$app->getSites()->getCurrentSite();
                    }

                    $view->registerJs(
                        'window.QuickSearchSettings = ' . json_encode([
                            'minSearchLength' => $settings->minSearchLength ?? 2,
                            'debounceDelay' => $settings->debounceDelay ?? 300,
                            'showSectionFilter' => $settings->showSectionFilter ?? true,
                            'compactMode' => $settings->compactMode ?? false,
                            'showRelatedEntries' => $settings->showRelatedEntries ?? false,
                            'quickAccessEnabled' => $settings->quickAccessEnabled ?? true,
                            'quickAccessShortcut' => $settings->quickAccessShortcut ?? 'ctrl+g',
                            'quickAccessDefaultPanel' => $settings->quickAccessDefaultPanel ?? 'history',
                            'quickAccessShowSearch' => $settings->quickAccessShowSearch ?? true,
                            'currentSiteId' => $currentSite->id,
                            'currentSiteName' => $currentSite->name,
                            'isMultiSite' => Craft::$app->getIsMultiSite(),
                            'translations' => [
                                'searchPlaceholder' => Craft::t('quick-search', 'Search entries...'),
                                'allSections' => Craft::t('quick-search', 'All Sections'),
                                'recentEntries' => Craft::t('quick-search', 'Recent Entries'),
                                'filterHistory' => Craft::t('quick-search', 'Filter history...'),
                                'noEntriesFound' => Craft::t('quick-search', 'No entries found'),
                                'noRecentEntries' => Craft::t('quick-search', 'No recent entries'),
                                'searching' => Craft::t('quick-search', 'Searching...'),
                                'showMore' => Craft::t('quick-search', 'Show more...'),
                                'goToLastVisited' => Craft::t('quick-search', 'Go to last visited entry'),
                                'viewRecentEntries' => Craft::t('quick-search', 'View recent entries'),
                                'openInNewTab' => Craft::t('quick-search', 'Open in new tab'),
                                'sectionsCount' => Craft::t('quick-search', '{count} Sections'),
                                'oneSection' => Craft::t('quick-search', '1 Section'),
                                'relatedEntries' => Craft::t('quick-search', 'Related Entries'),
                                'linksTo' => Craft::t('quick-search', 'Links to'),
                                'linkedFrom' => Craft::t('quick-search', 'Linked from'),
                                'noRelatedEntries' => Craft::t('quick-search', 'No related entries found'),
                                'relatedEntriesError' => Craft::t('quick-search', 'An error occurred while fetching related entries.'),
                                'entryOutline' => Craft::t('quick-search', 'Entry Outline'),
                                'noBlocksFound' => Craft::t('quick-search', 'No blocks found'),
                                'clearHistory' => Craft::t('quick-search', 'Clear history'),
                                'clearHistoryConfirm' => Craft::t('quick-search', 'Clear all history?') . "\n\n" . Craft::t('quick-search', 'This will remove all your recent entry visits. This action cannot be undone.'),
                                'favorites' => Craft::t('quick-search', 'Favorites'),
                                'addToFavorites' => Craft::t('quick-search', 'Add to favorites'),
                                'removeFromFavorites' => Craft::t('quick-search', 'Remove from favorites'),
                                'noFavorites' => Craft::t('quick-search', 'No favorites yet'),
                                'maxFavoritesReached' => Craft::t('quick-search', 'Maximum favorites reached'),
                                'statusLive' => Craft::t('quick-search', 'Status: Live'),
                                'statusDraft' => Craft::t('quick-search', 'Status: Draft'),
                                'statusPending' => Craft::t('quick-search', 'Status: Pending'),
                                'statusDisabled' => Craft::t('quick-search', 'Status: Disabled'),
                                'statusExpired' => Craft::t('quick-search', 'Status: Expired'),
                                'currentSite' => Craft::t('quick-search', 'Current Site'),
                                'allSites' => Craft::t('quick-search', 'All Sites'),
                                'currentPage' => Craft::t('quick-search', 'Current page'),
                                'quickAccess' => Craft::t('quick-search', 'Quick Access'),
                                'searchAllEntries' => Craft::t('quick-search', 'Search all entries...'),
                                'filterHistoryFavorites' => Craft::t('quick-search', 'Filter...'),
                                'pressEscToClose' => Craft::t('quick-search', 'Press Esc to close'),
                                'history' => Craft::t('quick-search', 'History'),
                                // Tab labels
                                'tabEntries' => Craft::t('quick-search', 'Entries'),
                                'tabCategories' => Craft::t('quick-search', 'Categories'),
                                'tabAssets' => Craft::t('quick-search', 'Assets'),
                                'tabUsers' => Craft::t('quick-search', 'Users'),
                                'tabGlobals' => Craft::t('quick-search', 'Globals'),
                                'tabAdmin' => Craft::t('quick-search', 'Admin'),
                                // Search placeholders per type
                                'searchEntriesPlaceholder' => Craft::t('quick-search', 'Search entries...'),
                                'searchCategoriesPlaceholder' => Craft::t('quick-search', 'Search categories...'),
                                'searchAssetsPlaceholder' => Craft::t('quick-search', 'Search assets...'),
                                'searchUsersPlaceholder' => Craft::t('quick-search', 'Search users...'),
                                'searchGlobalsPlaceholder' => Craft::t('quick-search', 'Search globals...'),
                                'searchAdminPlaceholder' => Craft::t('quick-search', 'Search settings...'),
                                // Empty states per type
                                'noCategoriesFound' => Craft::t('quick-search', 'No categories found'),
                                'noAssetsFound' => Craft::t('quick-search', 'No assets found'),
                                'noUsersFound' => Craft::t('quick-search', 'No users found'),
                                'noGlobalsFound' => Craft::t('quick-search', 'No global sets found'),
                                // Favorites shortcuts
                                'navigatingTo' => Craft::t('quick-search', 'Navigating to {title}...'),
                                // Copy actions
                                'copyActions' => Craft::t('quick-search', 'Copy options'),
                                'copyUrl' => Craft::t('quick-search', 'Copy URL'),
                                'copyTitle' => Craft::t('quick-search', 'Copy Title'),
                                'copyId' => Craft::t('quick-search', 'Copy ID'),
                                'copied' => Craft::t('quick-search', 'Copied!'),
                                // Site dropdown
                                'allSitesLabel' => Craft::t('quick-search', 'All Sites'),
                                // Saved searches
                                'savedSearches' => Craft::t('quick-search', 'Saved Searches'),
                                'saveSearch' => Craft::t('quick-search', 'Save Search'),
                                'savedSearchName' => Craft::t('quick-search', 'Name this search...'),
                                'runSearch' => Craft::t('quick-search', 'Run'),
                                'deleteSavedSearch' => Craft::t('quick-search', 'Delete saved search'),
                                'deleteSavedSearchConfirm' => Craft::t('quick-search', 'Delete this saved search?'),
                                'noSavedSearches' => Craft::t('quick-search', 'No saved searches yet'),
                                'maxSavedSearchesReached' => Craft::t('quick-search', 'Maximum saved searches reached'),
                                'savedSearchError' => Craft::t('quick-search', 'An error occurred while saving search.'),
                            ],
                        ]) . ';',
                        View::POS_HEAD
                    );
                } catch (\Throwable $e) {
                    Logger::exception('Error registering Quick Search asset bundle', $e);
                    // Don't rethrow - allow page to render without Quick Search
                }
            }
        );
    }

    /**
     * Register entry visit tracking for entry edit pages
     */
    private function registerEntryVisitTracking(): void
    {
        // Track visits after the page template is rendered
        Event::on(
            View::class,
            View::EVENT_AFTER_RENDER_PAGE_TEMPLATE,
            function(TemplateEvent $event) {
                try {
                    $currentUser = Craft::$app->getUser()->getIdentity();
                    $request = Craft::$app->getRequest();

                    if (!$currentUser || !$request) {
                        return;
                    }

                    // URL patterns:
                    // /content/entries/{section}/{entryId}-{slug}?site={siteHandle}
                    // /content/entries/{section}?source=...  (listing page, no entry)
                    // Check if 'content' and 'entries' appear anywhere in segments (in that order)
                    $segments = $request->getSegments();

                    $contentIndex = array_search('content', $segments);
                    $entriesIndex = array_search('entries', $segments);

                    if ($contentIndex === false || $entriesIndex === false || $entriesIndex <= $contentIndex) {
                        return;
                    }

                    // Get the last segment and check if it starts with a number (entry ID)
                    $lastSegment = end($segments);

                    if ($lastSegment && is_string($lastSegment) && preg_match('/^(\d+)/', $lastSegment, $matches)) {
                        $entryId = (int)$matches[1];

                        if ($entryId > 0 && $this->history) {
                            // Get site ID from URL query parameter (Craft CP uses ?site=handle)
                            $siteHandle = $request->getQueryParam('site');
                            if ($siteHandle) {
                                $site = Craft::$app->getSites()->getSiteByHandle($siteHandle);
                                $siteId = $site ? $site->id : Craft::$app->getSites()->getCurrentSite()->id;
                            } else {
                                $siteId = Craft::$app->getSites()->getCurrentSite()->id;
                            }
                            $this->history->recordVisit($entryId, $siteId, $currentUser->id);
                        }
                    }
                } catch (\Throwable $e) {
                    Logger::exception('Error recording entry visit', $e);
                    // Don't rethrow - allow page to render normally
                }
            }
        );
    }

    /**
     * @inheritdoc
     */
    protected function createSettingsModel(): ?Model
    {
        return new Settings();
    }

    /**
     * @inheritdoc
     */
    protected function settingsHtml(): ?string
    {
        return Craft::$app->getView()->renderTemplate(
            'quick-search/settings',
            [
                'settings' => $this->getSettings(),
                'sections' => Craft::$app->getEntries()->getAllSections(),
            ]
        );
    }

    /**
     * Register the entry outline button on entry edit pages
     */
    private function registerEntryOutlineButton(): void
    {
        $settings = $this->getSettings();

        if (!$settings || !$settings->showEntryOutline) {
            return;
        }

        Event::on(
            Entry::class,
            Entry::EVENT_DEFINE_ADDITIONAL_BUTTONS,
            function(DefineHtmlEvent $event) {
                try {
                    /** @var Entry $entry */
                    $entry = $event->sender;

                    // Only show for saved entries
                    if (!$entry || !$entry->id) {
                        return;
                    }

                    $buttonLabel = Craft::t('quick-search', 'Entry Outline');
                    $event->html = '<button type="button" class="quick-search-outline-btn btn" title="' . htmlspecialchars($buttonLabel, ENT_QUOTES, 'UTF-8') . '">' .
                        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' .
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />' .
                        '</svg>' .
                        '</button>' . $event->html;
                } catch (\Throwable $e) {
                    Logger::exception('Error registering entry outline button', $e);
                    // Don't rethrow - allow page to render without the button
                }
            }
        );
    }

    /**
     * Register the related entries button on entry edit pages
     */
    private function registerRelatedEntriesButton(): void
    {
        $settings = $this->getSettings();

        // Only register if showRelatedEntries is enabled
        if (!$settings || !$settings->showRelatedEntries) {
            return;
        }

        Event::on(
            Entry::class,
            Entry::EVENT_DEFINE_ADDITIONAL_BUTTONS,
            function(DefineHtmlEvent $event) {
                try {
                    /** @var Entry $entry */
                    $entry = $event->sender;

                    // Only show for saved entries
                    if (!$entry || !$entry->id) {
                        return;
                    }

                    $buttonLabel = Craft::t('quick-search', 'Related Entries');
                    $event->html = '<button type="button" class="quick-search-related-btn btn" data-entry-id="' . (int)$entry->id . '" title="' . htmlspecialchars($buttonLabel, ENT_QUOTES, 'UTF-8') . '">' .
                        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' .
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />' .
                        '</svg>' .
                        '</button>' . $event->html;
                } catch (\Throwable $e) {
                    Logger::exception('Error registering related entries button', $e);
                    // Don't rethrow - allow page to render without the button
                }
            }
        );
    }
}
