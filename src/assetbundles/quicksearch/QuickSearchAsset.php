<?php

declare(strict_types=1);

namespace craftcms\quicksearch\assetbundles\quicksearch;

use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

/**
 * Quick Search Asset Bundle
 *
 * @since 1.0.0
 */
class QuickSearchAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init(): void
    {
        $this->sourcePath = __DIR__ . '/dist';

        $this->depends = [
            CpAsset::class,
        ];

        $this->css = [
            'css/quick-search.css',
        ];

        $this->js = [
            'js/utils.js',
            'js/quick-search-ui.js',
            'js/quick-search-filters.js',
            'js/quick-search-search.js',
            'js/quick-search-history.js',
            'js/quick-search-favorites.js',
            'js/quick-search-core.js',
            'js/related-entries-overlay.js',
            'js/entry-outline-popup.js',
            'js/quick-access-overlay.js',
            'js/quick-search-init.js',
        ];

        parent::init();
    }
}
