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
 * Handles entry search requests
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
     * Search entries by query
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionIndex(): Response
    {
        $this->requireAcceptsJson();

        $request = Craft::$app->getRequest();
        $query = $request->getParam('query', '');
        $sections = $request->getParam('sections');
        $siteId = $request->getParam('siteId');

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

        // Parse section handles (comma-separated string or array)
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
            $results = Plugin::getInstance()->search->searchEntries($query, $sections, $limit, $parsedSiteId);

            return $this->asJson([
                'success' => true,
                'results' => $results,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error searching entries', $e, [
                'query' => $query,
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
}
