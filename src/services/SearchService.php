<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\elements\Category;
use craft\elements\Entry;
use craft\elements\User;
use craft\models\Section;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\Plugin;
use yii\base\InvalidConfigException;

/**
 * Search Service
 *
 * Handles search functionality for entries, categories, assets, users, and globals
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
            ->where(['like', 'LOWER([[title]])', mb_strtolower($query)])
            ->orderBy('title')
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
                'type' => 'entry',
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
     * Search categories by title
     *
     * @param string $query Search query
     * @param int $limit Maximum number of results to return
     * @param int|string|null $siteId Site ID filter: null = current site, '*' = all sites, int = specific site
     * @return array Array of category data with id, title, url, group, and site info
     */
    public function searchCategories(string $query, int $limit = 20, int|string|null $siteId = null): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        // Check if user can view any categories
        if (!$currentUser->admin && !$this->userHasCategoryPermission($currentUser)) {
            return [];
        }

        $categoryQuery = Category::find()
            ->where(['like', 'LOWER([[title]])', mb_strtolower($query)])
            ->orderBy('title')
            ->limit($limit);

        // Apply site filter
        if ($siteId === null) {
            $categoryQuery->siteId(Craft::$app->getSites()->getCurrentSite()->id);
        } elseif ($siteId === '*') {
            $categoryQuery->siteId('*');
        } else {
            $categoryQuery->siteId($siteId);
        }

        $categories = $categoryQuery->all();
        $results = [];

        foreach ($categories as $category) {
            // Check permission for this category's group
            if (!$currentUser->admin && !$currentUser->can("viewCategories:{$category->group->uid}")) {
                continue;
            }

            $site = $category->getSite();

            $results[] = [
                'type' => 'category',
                'id' => $category->id,
                'title' => $category->title,
                'url' => $category->getCpEditUrl(),
                'group' => [
                    'id' => $category->group->id,
                    'name' => $category->group->name,
                    'handle' => $category->group->handle,
                ],
                'site' => $site ? [
                    'id' => $site->id,
                    'name' => $site->name,
                    'handle' => $site->handle,
                ] : null,
                'siteId' => $category->siteId,
            ];
        }

        return $results;
    }

    /**
     * Search assets by title
     *
     * @param string $query Search query
     * @param int $limit Maximum number of results to return
     * @param int|string|null $siteId Site ID filter: null = current site, '*' = all sites, int = specific site
     * @return array Array of asset data with id, title, url, volume, and thumbnail info
     */
    public function searchAssets(string $query, int $limit = 20, int|string|null $siteId = null): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        // Check if user can view any assets
        if (!$currentUser->admin && !$this->userHasAssetPermission($currentUser)) {
            return [];
        }

        $assetQuery = \craft\elements\Asset::find()
            ->where(['like', 'LOWER([[title]])', mb_strtolower($query)])
            ->orderBy('title')
            ->limit($limit);

        // Apply site filter
        if ($siteId === null) {
            $assetQuery->siteId(Craft::$app->getSites()->getCurrentSite()->id);
        } elseif ($siteId === '*') {
            $assetQuery->siteId('*');
        } else {
            $assetQuery->siteId($siteId);
        }

        $assets = $assetQuery->all();
        $results = [];

        foreach ($assets as $asset) {
            // Check permission for this asset's volume
            if (!$currentUser->admin && !$currentUser->can("viewAssets:{$asset->volume->uid}")) {
                continue;
            }

            $site = $asset->getSite();

            // Get thumbnail URL if image
            $thumbUrl = null;
            if ($asset->getIsImage()) {
                try {
                    $thumbUrl = $asset->getThumbUrl(50, 50);
                } catch (\Throwable $e) {
                    // Ignore thumbnail errors
                }
            }

            $results[] = [
                'type' => 'asset',
                'id' => $asset->id,
                'title' => $asset->title,
                'url' => $asset->getCpEditUrl(),
                'volume' => [
                    'id' => $asset->volume->id,
                    'name' => $asset->volume->name,
                    'handle' => $asset->volume->handle,
                ],
                'site' => $site ? [
                    'id' => $site->id,
                    'name' => $site->name,
                    'handle' => $site->handle,
                ] : null,
                'siteId' => $asset->siteId,
                'filename' => $asset->filename,
                'kind' => $asset->kind,
                'thumbUrl' => $thumbUrl,
            ];
        }

        return $results;
    }

    /**
     * Search users by name, email, or username
     *
     * @param string $query Search query
     * @param int $limit Maximum number of results to return
     * @return array Array of user data with id, name, email, photo, and url
     */
    public function searchUsers(string $query, int $limit = 20): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        // Check if current user can view other users
        if (!$currentUser->admin && !$currentUser->can('viewUsers')) {
            return [];
        }

        $userQuery = User::find()
            ->where(['or',
                ['like', 'LOWER([[username]])', mb_strtolower($query)],
                ['like', 'LOWER([[firstName]])', mb_strtolower($query)],
                ['like', 'LOWER([[lastName]])', mb_strtolower($query)],
                ['like', 'LOWER([[email]])', mb_strtolower($query)],
            ])
            ->orderBy('lastName, firstName, username')
            ->limit($limit);

        $users = $userQuery->all();
        $results = [];

        foreach ($users as $user) {
            // Get full name
            $fullName = trim($user->firstName . ' ' . $user->lastName);
            if (empty($fullName)) {
                $fullName = $user->username;
            }

            // Get photo URL
            $photoUrl = null;
            if ($user->photoId) {
                try {
                    $photoUrl = $user->getPhotoUrl();
                } catch (\Throwable $e) {
                    // Ignore photo errors
                }
            }

            // Determine user status/status badge
            $status = 'active';
            if ($user->suspended) {
                $status = 'suspended';
            } elseif (!$user->active) {
                $status = 'inactive';
            }

            // Get CP edit URL for users
            $cpEditUrl = null;
            try {
                $cpEditUrl = $user->getCpEditUrl();
            } catch (\Throwable $e) {
                // Fallback
                $cpEditUrl = "users/{$user->id}";
            }

            $results[] = [
                'type' => 'user',
                'id' => $user->id,
                'title' => $fullName,
                'username' => $user->username,
                'email' => $user->email,
                'url' => $cpEditUrl,
                'photoUrl' => $photoUrl,
                'status' => $status,
            ];
        }

        return $results;
    }

    /**
     * Search global sets by name
     *
     * @param string $query Search query
     * @param int $limit Maximum number of results to return
     * @return array Array of global set data with id, name, and url
     */
    public function searchGlobals(string $query, int $limit = 20): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return [];
        }

        $globalSets = Craft::$app->getGlobals()->getAllSets();
        $results = [];

        foreach ($globalSets as $globalSet) {
            // Check permission for this global set
            if (!$currentUser->admin && !$currentUser->can("editGlobalSet:{$globalSet->uid}")) {
                continue;
            }

            // Filter by query
            if (!empty($query)) {
                $nameLower = mb_strtolower($globalSet->name);
                $queryLower = mb_strtolower($query);
                if (strpos($nameLower, $queryLower) === false) {
                    continue;
                }
            }

            $results[] = [
                'type' => 'global',
                'id' => $globalSet->id,
                'title' => $globalSet->name,
                'handle' => $globalSet->handle,
                'url' => "globals/{$globalSet->handle}",
            ];

            if (count($results) >= $limit) {
                break;
            }
        }

        return $results;
    }

    /**
     * Universal search across all element types
     *
     * @param string $query Search query
     * @param string $type Element type: 'entries'|'categories'|'assets'|'users'|'globals'|'admin'
     * @param int $limit Results per type
     * @param int|string|null $siteId Site ID filter
     * @return array Search results grouped by type
     */
    public function search(string $query, string $type = 'entries', int $limit = 20, int|string|null $siteId = null, ?array $sections = null): array
    {
        return match ($type) {
            'categories' => $this->searchCategories($query, $limit, $siteId),
            'assets' => $this->searchAssets($query, $limit, $siteId),
            'users' => $this->searchUsers($query, $limit),
            'globals' => $this->searchGlobals($query, $limit),
            'admin' => $this->searchAdmin($query, $limit),
            default => $this->searchEntries($query, $sections, $limit, $siteId),
        };
    }

    /**
     * Search admin elements (sections, entry types, fields, category groups, volumes, plugins, settings)
     *
     * @param string $query Search query
     * @param int $limit Maximum number of results per category
     * @return array Array of admin results grouped by type
     */
    public function searchAdmin(string $query, int $limit = 10): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser || !$currentUser->admin) {
            return [];
        }

        $results = [];

        // Search sections
        $sections = Craft::$app->getEntries()->getAllSections();
        foreach ($sections as $section) {
            if (stripos($section->name, $query) !== false || stripos($section->handle, $query) !== false) {
                $results[] = [
                    'type' => 'section',
                    'id' => $section->id,
                    'title' => $section->name,
                    'subtitle' => $section->handle,
                    'url' => "settings/sections/{$section->id}",
                ];
                if (count($results) >= $limit) {
                    break;
                }
            }
        }

        // Search entry types
        if (count($results) < $limit) {
            foreach ($sections as $section) {
                if (count($results) >= $limit) {
                    break;
                }
                foreach ($section->getEntryTypes() as $entryType) {
                    if (count($results) >= $limit) {
                        break 2;
                    }
                    if (stripos($entryType->name, $query) !== false) {
                        $results[] = [
                            'type' => 'entrytype',
                            'id' => $entryType->id,
                            'title' => $entryType->name,
                            'subtitle' => $section->name,
                            'url' => "settings/entry-types/{$entryType->id}",
                        ];
                    }
                }
            }
        }

        // Search fields
        if (count($results) < $limit) {
            $fields = Craft::$app->getFields()->getAllFields();
            foreach ($fields as $field) {
                if (count($results) >= $limit) {
                    break;
                }
                if (stripos($field->name, $query) !== false || stripos($field->handle, $query) !== false) {
                    $results[] = [
                        'type' => 'field',
                        'id' => $field->id,
                        'title' => $field->name,
                        'subtitle' => $field->handle,
                        'url' => "settings/fields/edit/{$field->id}",
                    ];
                }
            }
        }

        // Search category groups
        if (count($results) < $limit) {
            $categoryGroups = Craft::$app->getCategories()->getAllGroups();
            foreach ($categoryGroups as $group) {
                if (count($results) >= $limit) {
                    break;
                }
                if (stripos($group->name, $query) !== false || stripos($group->handle, $query) !== false) {
                    $results[] = [
                        'type' => 'categorygroup',
                        'id' => $group->id,
                        'title' => $group->name,
                        'subtitle' => $group->handle,
                        'url' => "settings/categories/{$group->id}",
                    ];
                }
            }
        }

        // Search asset volumes
        if (count($results) < $limit) {
            $volumes = Craft::$app->getVolumes()->getAllVolumes();
            foreach ($volumes as $volume) {
                if (count($results) >= $limit) {
                    break;
                }
                if (stripos($volume->name, $query) !== false || stripos($volume->handle, $query) !== false) {
                    $results[] = [
                        'type' => 'volume',
                        'id' => $volume->id,
                        'title' => $volume->name,
                        'subtitle' => $volume->handle,
                        'url' => "settings/assets/volumes/{$volume->id}",
                    ];
                }
            }
        }

        // Search global sets
        if (count($results) < $limit) {
            $globalSets = Craft::$app->getGlobals()->getAllSets();
            foreach ($globalSets as $globalSet) {
                if (count($results) >= $limit) {
                    break;
                }
                if (stripos($globalSet->name, $query) !== false || stripos($globalSet->handle, $query) !== false) {
                    $results[] = [
                        'type' => 'globalset',
                        'id' => $globalSet->id,
                        'title' => $globalSet->name,
                        'subtitle' => $globalSet->handle,
                        'url' => "settings/global-sets/{$globalSet->id}",
                    ];
                }
            }
        }

        // Search plugins
        if (count($results) < $limit) {
            $plugins = Craft::$app->getPlugins()->getAllPlugins();
            foreach ($plugins as $plugin) {
                if (count($results) >= $limit) {
                    break;
                }
                try {
                    $name = $plugin->getName();
                } catch (\Throwable $e) {
                    // Skip plugins without getName method
                    continue;
                }
                if (stripos($name, $query) !== false) {
                    $results[] = [
                        'type' => 'plugin',
                        'id' => $plugin->getId(),
                        'title' => $name,
                        'subtitle' => $plugin->getVersion(),
                        'url' => "settings/plugins/{$plugin->getId()}",
                    ];
                }
            }
        }

        return $results;
    }

    /**
     * Check if user has any category permissions
     *
     * @param \craft\elements\User $user
     * @return bool
     */
    private function userHasCategoryPermission(\craft\elements\User $user): bool
    {
        $categoriesService = Craft::$app->getCategories();
        $groups = $categoriesService->getAllGroups();

        foreach ($groups as $group) {
            if ($user->can("viewCategories:{$group->uid}")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has any asset permissions
     *
     * @param \craft\elements\User $user
     * @return bool
     */
    private function userHasAssetPermission(\craft\elements\User $user): bool
    {
        $volumes = Craft::$app->getVolumes()->getAllVolumes();

        foreach ($volumes as $volume) {
            if ($user->can("viewAssets:{$volume->uid}")) {
                return true;
            }
        }

        return false;
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
