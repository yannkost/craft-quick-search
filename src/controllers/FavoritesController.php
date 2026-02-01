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
 * Favorites Controller
 *
 * Handles favorite entries requests
 *
 * @since 1.1.0
 */
class FavoritesController extends Controller
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
     * Get user's favorites list
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
            $settings = Plugin::getInstance()->getSettings();
            $maxFavorites = $settings->maxFavorites ?? 10;

            $favorites = Plugin::getInstance()->favorites->getFavorites($currentUser->id, $maxFavorites);

            return $this->asJson([
                'success' => true,
                'favorites' => $favorites,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching favorites', $e, [
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching favorites.'),
            ]);
        }
    }

    /**
     * Add an entry to favorites
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionAdd(): Response
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

        // Validate entry exists for this site and user has permission
        $entry = Entry::find()->id($entryId)->siteId($siteId)->status(null)->one();
        if (!$entry) {
            throw new BadRequestHttpException('Entry not found.');
        }

        if (!$entry->section) {
            throw new BadRequestHttpException('Entry section not found.');
        }

        if (!$currentUser->admin && !$currentUser->can("viewEntries:{$entry->section->uid}")) {
            throw new ForbiddenHttpException('You do not have permission to access this entry.');
        }

        try {
            $result = Plugin::getInstance()->favorites->addFavorite($entryId, $siteId, $currentUser->id);

            if (!$result) {
                return $this->asJson([
                    'success' => false,
                    'error' => Craft::t('quick-search', 'Maximum favorites reached'),
                    'isFavorite' => Plugin::getInstance()->favorites->isFavorite($entryId, $siteId, $currentUser->id),
                ]);
            }

            return $this->asJson([
                'success' => true,
                'isFavorite' => true,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error adding favorite', $e, [
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while adding favorite.'),
            ]);
        }
    }

    /**
     * Remove an entry from favorites
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionRemove(): Response
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

        try {
            Plugin::getInstance()->favorites->removeFavorite($entryId, $siteId, $currentUser->id);

            return $this->asJson([
                'success' => true,
                'isFavorite' => false,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error removing favorite', $e, [
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while removing favorite.'),
            ]);
        }
    }

    /**
     * Reorder favorites
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
        $entryIds = $request->getBodyParam('entryIds');

        if (!$currentUser) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'User not found.'),
            ]);
        }

        if (!is_array($entryIds)) {
            throw new BadRequestHttpException('Entry IDs array is required.');
        }

        // Convert to integers
        $entryIds = array_map('intval', $entryIds);

        try {
            $result = Plugin::getInstance()->favorites->reorderFavorites($currentUser->id, $entryIds);

            return $this->asJson([
                'success' => $result,
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error reordering favorites', $e, [
                'userId' => $currentUser->id,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while reordering favorites.'),
            ]);
        }
    }
}
