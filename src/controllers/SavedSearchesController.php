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
 * Saved Searches Controller
 *
 * Handles saved search CRUD requests
 *
 * @since 1.3.0
 */
class SavedSearchesController extends Controller
{
    /**
     * @inheritdoc
     */
    public function beforeAction($action): bool
    {
        $this->requireCpRequest();
        $this->requireLogin();

        return parent::beforeAction($action);
    }

    /**
     * List user's saved searches
     *
     * @return Response
     */
    public function actionList(): Response
    {
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        try {
            $savedSearches = Plugin::getInstance()->savedSearches->getSavedSearches($currentUser->id);

            return $this->asJson([
                'success' => true,
                'savedSearches' => $savedSearches,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching saved searches', $e, [
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching saved searches.'),
            ]);
        }
    }

    /**
     * Save a search
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionSave(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();
        $request = Craft::$app->getRequest();

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        $name = trim((string)$request->getBodyParam('name'));
        $query = trim((string)$request->getBodyParam('query'));
        $type = trim((string)$request->getBodyParam('type', 'entries'));
        $siteId = $request->getBodyParam('siteId');

        if (!$name) {
            throw new BadRequestHttpException('Name is required.');
        }

        if (!$query) {
            throw new BadRequestHttpException('Query is required.');
        }

        // Validate type
        $validTypes = ['entries', 'categories', 'assets', 'users', 'globals', 'admin'];
        if (!in_array($type, $validTypes, true)) {
            $type = 'entries';
        }

        // Parse siteId
        if ($siteId !== null && is_numeric($siteId)) {
            $siteId = (int)$siteId;
        } else {
            $siteId = null;
        }

        try {
            $result = Plugin::getInstance()->savedSearches->saveSearch(
                $currentUser->id,
                $name,
                $query,
                $type,
                $siteId
            );

            if (empty($result)) {
                return $this->asJson([
                    'success' => false,
                    'error' => Craft::t('quick-search', 'Maximum saved searches reached'),
                ]);
            }

            return $this->asJson([
                'success' => true,
                'savedSearch' => $result,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error saving search', $e, [
                'userId' => $currentUser->id,
                'name' => $name,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while saving search.'),
            ]);
        }
    }

    /**
     * Delete a saved search
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionDelete(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();
        $request = Craft::$app->getRequest();
        $id = (int)$request->getBodyParam('id');

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        if (!$id) {
            throw new BadRequestHttpException('Saved search ID is required.');
        }

        try {
            $result = Plugin::getInstance()->savedSearches->deleteSearch($id, $currentUser->id);

            return $this->asJson([
                'success' => $result,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error deleting saved search', $e, [
                'id' => $id,
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while deleting saved search.'),
            ]);
        }
    }

    /**
     * Reorder saved searches
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionReorder(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $currentUser = Craft::$app->getUser()->getIdentity();
        $request = Craft::$app->getRequest();
        $ids = $request->getBodyParam('ids');

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        if (!is_array($ids)) {
            throw new BadRequestHttpException('IDs array is required.');
        }

        $ids = array_map('intval', $ids);

        try {
            $result = Plugin::getInstance()->savedSearches->reorderSearches($currentUser->id, $ids);

            return $this->asJson([
                'success' => $result,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error reordering saved searches', $e, [
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while reordering saved searches.'),
            ]);
        }
    }
}
