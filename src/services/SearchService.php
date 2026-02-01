<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\elements\Entry;
use craft\models\Section;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\Plugin;
use yii\base\InvalidConfigException;

/**
 * Search Service
 *
 * Handles entry search functionality
 *
 * @since 1.0.0
 */
class SearchService extends Component
{
    /**
     * Search entries by title
     *
     * @param string $query Search query
     * @param array|null $sections Optional array of section handles to filter by
     * @param int $limit Maximum number of results to return
     * @param int|string|null $siteId Site ID filter: null = current site, '*' = all sites, int = specific site
     * @return array Array of entry data with id, title, url, section, site, and status
     * @throws InvalidConfigException
     */
    public function searchEntries(string $query, ?array $sections = null, int $limit = 20, int|string|null $siteId = null): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        // Apply enabledSections filter from settings (settings store handles)
        // If enabledSections is set, only search in those sections
        $settings = Plugin::getInstance()->getSettings();

        if ($settings->enabledSections !== null && !empty($settings->enabledSections)) {
            if ($sections !== null) {
                // Intersect with user-specified section handles
                $sections = array_intersect($sections, $settings->enabledSections);
            } else {
                $sections = $settings->enabledSections;
            }
        }

        // Use search index for case-insensitive matching with relevance scoring
        $entryQuery = Entry::find()
            ->search("title:*{$query}*")
            ->orderBy('score')
            ->status(null)
            ->section($sections !== null && !empty($sections) ? $sections : '*')
            ->limit($limit);

        // Apply site filter
        if ($siteId === null) {
            // Default: current site only
            $entryQuery->siteId(Craft::$app->getSites()->getCurrentSite()->id);
        } elseif ($siteId === '*') {
            // All sites - return entry for each site it exists on
            $entryQuery->siteId('*');
        } else {
            // Specific site
            $entryQuery->siteId($siteId);
        }

        // Only show entries the user can view
        $entries = $entryQuery->all();
        $results = [];

        foreach ($entries as $entry) {
            // Skip entries with missing sections (orphaned entries) - should not happen with sectionId filter
            if (!$entry->section) {
                continue;
            }

            // Admins can view all entries; others need at least view permission
            if (!$currentUser->admin && !$currentUser->can("viewEntries:{$entry->section->uid}")) {
                continue;
            }

            // Get site info
            $site = $entry->getSite();

            $results[] = [
                'id' => $entry->id,
                'title' => $entry->title,
                'url' => $entry->getCpEditUrl(),
                'section' => [
                    'id' => $entry->section->id,
                    'name' => $entry->section->name,
                    'handle' => $entry->section->handle,
                ],
                'site' => $site ? [
                    'id' => $site->id,
                    'name' => $site->name,
                    'handle' => $site->handle,
                ] : null,
                'siteId' => $entry->siteId,
                'status' => $entry->status,
                'dateUpdated' => $entry->dateUpdated?->format('Y-m-d H:i:s'),
            ];
        }

        return $results;
    }

    /**
     * Get all sections the current user can edit
     *
     * @return array Array of section data with id, name, and handle
     */
    public function getSections(): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        // In Craft 5, use getEditableSections() for non-admins, getAllSections() for admins
        if ($currentUser->admin) {
            $allSections = Craft::$app->getEntries()->getAllSections();
        } else {
            $allSections = Craft::$app->getEntries()->getEditableSections();
        }

        $sections = [];

        foreach ($allSections as $section) {
            $sections[] = [
                'id' => $section->id,
                'name' => $section->name,
                'handle' => $section->handle,
            ];
        }

        // Sort by name
        usort($sections, fn($a, $b) => strcasecmp($a['name'], $b['name']));

        return $sections;
    }

    /**
     * Get all sites the current user can access
     *
     * @return array Array of site data with id, name, handle, and whether it's the current site
     */
    public function getSites(): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        $currentSiteId = Craft::$app->getSites()->getCurrentSite()->id;

        // Get all editable sites for the user
        if ($currentUser->admin) {
            $allSites = Craft::$app->getSites()->getAllSites();
        } else {
            $allSites = Craft::$app->getSites()->getEditableSites();
        }

        $sites = [];

        foreach ($allSites as $site) {
            $sites[] = [
                'id' => $site->id,
                'name' => $site->name,
                'handle' => $site->handle,
                'language' => $site->language,
                'isCurrent' => $site->id === $currentSiteId,
            ];
        }

        // Sort by name, but keep current site first
        usort($sites, function ($a, $b) {
            if ($a['isCurrent']) return -1;
            if ($b['isCurrent']) return 1;
            return strcasecmp($a['name'], $b['name']);
        });

        return $sites;
    }
}
