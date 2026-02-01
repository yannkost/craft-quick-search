<?php

declare(strict_types=1);

namespace craftcms\quicksearch\controllers;

use Craft;
use craft\elements\Entry;
use craft\web\Controller;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\Plugin;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\Response;

/**
 * History Controller
 *
 * Handles entry visit history requests
 *
 * @since 1.0.0
 */
class HistoryController extends Controller
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
     * Get user's visit history
     *
     * @return Response
     */
    public function actionIndex(): Response
    {
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();
        $request = Craft::$app->getRequest();
        $query = $request->getParam('query');
        $limit = $request->getParam('limit');

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        try {
            $settings = Plugin::getInstance()->getSettings();

            // Use request limit if provided, otherwise use settings limit
            $historyLimit = $limit !== null ? min((int)$limit, $settings->historyLimit) : $settings->historyLimit;

            // If query provided, search within history
            if ($query !== null && $query !== '') {
                $history = Plugin::getInstance()->history->searchHistory($currentUser->id, $query);
            } else {
                $history = Plugin::getInstance()->history->getHistory($currentUser->id, $historyLimit);
            }

            return $this->asJson([
                'success' => true,
                'history' => $history,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching history', $e, [
                'userId' => $currentUser->id,
                'query' => $query,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching history.'),
            ]);
        }
    }

    /**
     * Record an entry visit
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionRecord(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();
        $request = Craft::$app->getRequest();
        $entryId = (int)$request->getBodyParam('entryId');
        $siteId = $request->getBodyParam('siteId');

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        if (!$entryId) {
            throw new BadRequestHttpException('Entry ID is required.');
        }

        // Parse siteId - default to current site if not provided
        if ($siteId !== null && is_numeric($siteId)) {
            $siteId = (int)$siteId;
        } else {
            $siteId = Craft::$app->getSites()->getCurrentSite()->id;
        }

        // Validate entry exists for this site and user has permission to access it
        $entry = Entry::find()->id($entryId)->siteId($siteId)->status(null)->one();
        if (!$entry) {
            throw new BadRequestHttpException('Entry not found.');
        }

        if (!$entry->section) {
            throw new BadRequestHttpException('Entry section not found.');
        }

        if (!$currentUser->can("editEntries:{$entry->section->uid}")) {
            throw new ForbiddenHttpException('You do not have permission to access this entry.');
        }

        try {
            Plugin::getInstance()->history->recordVisit($entryId, $siteId, $currentUser->id);

            return $this->asJson([
                'success' => true,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error recording visit', $e, [
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while recording the visit.'),
            ]);
        }
    }

    /**
     * Clear all history for the current user
     *
     * @return Response
     */
    public function actionClear(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        try {
            $clearedCount = Plugin::getInstance()->history->clearHistory($currentUser->id);

            return $this->asJson([
                'success' => true,
                'cleared' => $clearedCount,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error clearing history', $e, [
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while clearing history.'),
            ]);
        }
    }
}
