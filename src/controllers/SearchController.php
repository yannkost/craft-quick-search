<?php

declare(strict_types=1);

namespace craftcms\quicksearch\controllers;

use Craft;
use craft\web\Controller;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\Plugin;
use yii\web\BadRequestHttpException;
use yii\web\Response;

/**
 * Search Controller
 *
 * Handles entry, category, asset, user, and global search requests
 *
 * @since 1.0.0
 */
class SearchController extends Controller
{
    /**
     * @inheritdoc
     */
    public function beforeAction($action): bool
    {
        // Require CP login
        $this->requireCpRequest();
        $this->requireLogin();

        return parent::beforeAction($action);
    }

    /**
     * Search by type (entries, categories, assets, users, globals)
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionIndex(): Response
    {
        $this->requireAcceptsJson();

        $request = Craft::$app->getRequest();
        $query = $request->getParam('query', '');
        $type = $request->getParam('type');
        $sections = $request->getParam('sections');
        $siteId = $request->getParam('siteId');

        // Validate type - only allow known types, default to entries
        $allowedTypes = ['entries', 'categories', 'assets', 'users', 'globals', 'admin'];
        if (!in_array($type, $allowedTypes, true)) {
            $type = 'entries';
        }

        // Get settings
        $settings = Plugin::getInstance()->getSettings();

        // Validate and clamp limit to reasonable bounds (1-100), using settings default
        $rawLimit = $request->getParam('limit');
        $limit = min(100, max(1, (int)($rawLimit ?? $settings->searchLimit)));

        // Truncate query length to prevent abuse
        if (strlen($query) > 255) {
            $query = substr($query, 0, 255);
        }

        // Validate query
        if (strlen($query) < $settings->minSearchLength) {
            return $this->asJson([
                'success' => true,
                'results' => [],
            ]);
        }

        // Parse section handles (comma-separated string or array) - only for entries
        if ($type === 'entries') {
            if ($sections !== null && $sections !== '') {
                if (is_string($sections)) {
                    $sections = array_filter(array_map('trim', explode(',', $sections)));
                } elseif (is_array($sections)) {
                    $sections = array_filter(array_map('trim', $sections));
                } else {
                    $sections = null;
                }
            } else {
                $sections = null;
            }
        } else {
            $sections = null;
        }

        // Parse siteId: null = current site, '*' = all sites, int = specific site
        $parsedSiteId = null;
        if ($siteId !== null && $siteId !== '') {
            if ($siteId === '*') {
                $parsedSiteId = '*';
            } elseif (is_numeric($siteId)) {
                $parsedSiteId = (int)$siteId;
            }
        }

        try {
            $results = Plugin::getInstance()->search->search($query, $type, $limit, $parsedSiteId, $sections);

            return $this->asJson([
                'success' => true,
                'results' => $results,
                'type' => $type,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error searching', $e, [
                'query' => $query,
                'type' => $type,
                'sections' => $sections,
                'siteId' => $siteId,
                'limit' => $limit,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while searching.'),
            ]);
        }
    }

    /**
     * Get available sections
     *
     * @return Response
     */
    public function actionSections(): Response
    {
        $this->requireAcceptsJson();

        try {
            $sections = Plugin::getInstance()->search->getSections();

            return $this->asJson([
                'success' => true,
                'sections' => $sections,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching sections', $e);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching sections.'),
            ]);
        }
    }

    /**
     * Get available sites for multi-site dropdown
     *
     * @return Response
     */
    public function actionSites(): Response
    {
        $this->requireAcceptsJson();

        try {
            $sites = Plugin::getInstance()->search->getSites();
            $isMultiSite = Craft::$app->getIsMultiSite();

            return $this->asJson([
                'success' => true,
                'sites' => $sites,
                'isMultiSite' => $isMultiSite,
                'currentSiteId' => Craft::$app->getSites()->getCurrentSite()->id,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching sites', $e);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching sites.'),
            ]);
        }
    }

    /**
     * Get search types available to current user
     *
     * @return Response
     */
    public function actionTypes(): Response
    {
        $this->requireAcceptsJson();

        try {
            $currentUser = Craft::$app->getUser()->getIdentity();
            $types = [];

            // Entries - always available
            $types[] = [
                'id' => 'entries',
                'label' => Craft::t('quick-search', 'Entries'),
                'icon' => 'document',
            ];

            // Categories - if user has any category permissions
            if ($currentUser->admin || $this->userHasCategoryPermission($currentUser)) {
                $types[] = [
                    'id' => 'categories',
                    'label' => Craft::t('quick-search', 'Categories'),
                    'icon' => 'tag',
                ];
            }

            // Assets - if user has any asset permissions
            if ($currentUser->admin || $this->userHasAssetPermission($currentUser)) {
                $types[] = [
                    'id' => 'assets',
                    'label' => Craft::t('quick-search', 'Assets'),
                    'icon' => 'photo',
                ];
            }

            // Users - if user can view other users
            if ($currentUser->admin || $currentUser->can('viewUsers')) {
                $types[] = [
                    'id' => 'users',
                    'label' => Craft::t('quick-search', 'Users'),
                    'icon' => 'user',
                ];
            }

            // Globals - if user can edit any global sets
            if ($currentUser->admin || $this->userHasGlobalPermission($currentUser)) {
                $types[] = [
                    'id' => 'globals',
                    'label' => Craft::t('quick-search', 'Globals'),
                    'icon' => 'world',
                ];
            }

            // Admin tab - only for admins
            if ($currentUser->admin) {
                $types[] = [
                    'id' => 'admin',
                    'label' => Craft::t('quick-search', 'Admin'),
                    'icon' => 'settings',
                ];
            }

            return $this->asJson([
                'success' => true,
                'types' => $types,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching search types', $e);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching search types.'),
            ]);
        }
    }

    /**
     * Check if user has any category permissions
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
     * Check if user has any global set permissions
     */
    private function userHasGlobalPermission(\craft\elements\User $user): bool
    {
        $globalSets = Craft::$app->getGlobals()->getAllSets();

        foreach ($globalSets as $globalSet) {
            if ($user->can("editGlobalSet:{$globalSet->uid}")) {
                return true;
            }
        }

        return false;
    }
}
