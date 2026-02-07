<?php

declare(strict_types=1);

namespace craftcms\quicksearch\models;

use craft\base\Model;

/**
 * Quick Search settings model
 *
 * @since 1.0.0
 */
class Settings extends Model
{
    /**
     * @var int Maximum number of history entries to keep per user
     */
    public int $historyLimit = 50;

    /**
     * @var bool Whether to show the section filter dropdown
     */
    public bool $showSectionFilter = true;

    /**
     * @var array|null Array of section handles to include or exclude based on sectionFilterMode
     */
    public ?array $enabledSections = null;

    /**
     * @var string Section filter mode: 'include' or 'exclude'
     */
    public string $sectionFilterMode = 'include';

    /**
     * @var int Maximum number of search results to return
     */
    public int $searchLimit = 20;

    /**
     * @var int Minimum number of characters required before search is triggered
     */
    public int $minSearchLength = 2;

    /**
     * @var int Debounce delay in milliseconds for search input
     */
    public int $debounceDelay = 300;

    /**
     * @var bool Whether to use compact mode for entry lists
     */
    public bool $compactMode = false;

    /**
     * @var bool Whether to show related entries
     */
    public bool $showRelatedEntries = true;

    /**
     * @var int Maximum number of favorites per user
     */
    public int $maxFavorites = 25;

    /**
     * @var bool Whether to enable the Quick Access Overlay
     */
    public bool $quickAccessEnabled = true;

    /**
     * @var string Keyboard shortcut for Quick Access Overlay (e.g., 'ctrl+g', 'meta+g')
     */
    public string $quickAccessShortcut = 'ctrl+g';

    /**
     * @var string Default panel to focus when opening Quick Access ('history' or 'favorites')
     */
    public string $quickAccessDefaultPanel = 'history';

    /**
     * @var bool Whether to show the entry search in Quick Access Overlay
     */
    public bool $quickAccessShowSearch = true;

    /**
     * @inheritdoc
     */
    public function defineRules(): array
    {
        return [
            [['historyLimit', 'minSearchLength', 'debounceDelay', 'searchLimit'], 'required'],
            [['historyLimit', 'minSearchLength', 'debounceDelay', 'searchLimit'], 'integer', 'min' => 1],
            ['historyLimit', 'integer', 'max' => 200],
            ['searchLimit', 'integer', 'max' => 100],
            ['minSearchLength', 'integer', 'max' => 10],
            ['debounceDelay', 'integer', 'max' => 2000],
            ['showSectionFilter', 'boolean'],
            ['compactMode', 'boolean'],
            ['showRelatedEntries', 'boolean'],
            ['enabledSections', 'each', 'rule' => ['string']],
            ['sectionFilterMode', 'in', 'range' => ['include', 'exclude']],
            ['maxFavorites', 'integer', 'min' => 1, 'max' => 50],
            ['quickAccessEnabled', 'boolean'],
            ['quickAccessShortcut', 'string'],
            ['quickAccessShortcut', 'match', 'pattern' => '/^(ctrl|meta|alt|shift)(\+(ctrl|meta|alt|shift))*\+[a-z0-9]$/i', 'message' => 'Invalid shortcut format. Use format like "ctrl+g" or "meta+shift+k".'],
            ['quickAccessDefaultPanel', 'in', 'range' => ['history', 'favorites']],
            ['quickAccessShowSearch', 'boolean'],
        ];
    }
}
