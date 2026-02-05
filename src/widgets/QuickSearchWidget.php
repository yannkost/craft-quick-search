<?php

declare(strict_types=1);

namespace craftcms\quicksearch\widgets;

use Craft;
use craft\base\Widget;
use craftcms\quicksearch\Plugin;

/**
 * Quick Search Widget
 *
 * Dashboard widget showing recent history and favorites
 *
 * @since 1.6.0
 */
class QuickSearchWidget extends Widget
{
    /**
     * @var int Number of history items to show
     */
    public int $historyLimit = 10;

    /**
     * @var int Number of favorites to show
     */
    public int $favoritesLimit = 10;

    /**
     * @var string Which sections to show: 'both', 'history', 'favorites', 'search'
     */
    public string $showSections = 'both';

    /**
     * @var bool Whether to show the search input
     */
    public bool $showSearch = false;

    /**
     * @inheritdoc
     */
    public static function displayName(): string
    {
        return Craft::t('quick-search', 'Quick Search');
    }

    /**
     * @inheritdoc
     */
    public static function icon(): ?string
    {
        return Craft::getAlias('@craftcms/quicksearch/icon.svg');
    }

    /**
     * @inheritdoc
     */
    public function getTitle(): ?string
    {
        return Craft::t('quick-search', 'Quick Search');
    }

    /**
     * @inheritdoc
     */
    public function getSubtitle(): ?string
    {
        return Craft::t('quick-search', 'Recent history and favorites');
    }

    /**
     * @inheritdoc
     */
    public static function isSelectable(): bool
    {
        return true;
    }

    /**
     * @inheritdoc
     */
    public function getSettingsHtml(): ?string
    {
        return Craft::$app->getView()->renderTemplate(
            'quick-search/widgets/quick-search-settings',
            [
                'widget' => $this,
            ]
        );
    }

    /**
     * @inheritdoc
     */
    public function getBodyHtml(): ?string
    {
        $plugin = Plugin::getInstance();
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser || !$plugin) {
            return null;
        }

        $history = [];
        $favorites = [];

        // Get history
        if ($this->showSections === 'both' || $this->showSections === 'history') {
            try {
                $history = $plugin->history->getHistory($currentUser->id, $this->historyLimit);
            } catch (\Throwable $e) {
                Craft::error('Quick Search Widget: Error loading history - ' . $e->getMessage(), __METHOD__);
            }
        }

        // Get favorites
        if ($this->showSections === 'both' || $this->showSections === 'favorites') {
            try {
                $favorites = $plugin->favorites->getFavorites($currentUser->id, $this->favoritesLimit);
            } catch (\Throwable $e) {
                Craft::error('Quick Search Widget: Error loading favorites - ' . $e->getMessage(), __METHOD__);
            }
        }

        // Get settings for Quick Access shortcut display
        $settings = $plugin->getSettings();
        $shortcut = $settings->quickAccessShortcut ?? 'ctrl+g';
        $quickAccessEnabled = $settings->quickAccessEnabled ?? true;

        return Craft::$app->getView()->renderTemplate(
            'quick-search/widgets/quick-search',
            [
                'widget' => $this,
                'history' => $history,
                'favorites' => $favorites,
                'showSections' => $this->showSections,
                'showSearch' => $this->showSearch,
                'historyLimit' => $this->historyLimit,
                'favoritesLimit' => $this->favoritesLimit,
                'shortcut' => $shortcut,
                'quickAccessEnabled' => $quickAccessEnabled,
            ]
        );
    }

    /**
     * @inheritdoc
     */
    protected function defineRules(): array
    {
        $rules = parent::defineRules();

        $rules[] = [['historyLimit', 'favoritesLimit'], 'integer', 'min' => 5, 'max' => 20];
        $rules[] = ['showSections', 'in', 'range' => ['both', 'history', 'favorites', 'search']];
        $rules[] = ['showSearch', 'boolean'];

        return $rules;
    }
}
