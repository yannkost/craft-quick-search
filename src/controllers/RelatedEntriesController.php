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
 * Related Entries Controller
 *
 * Handles requests for related entries
 *
 * @since 1.0.0
 */
class RelatedEntriesController extends Controller
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
     * Get related entries for a specific entry
     *
     * @return Response
     * @throws BadRequestHttpException
     */
    public function actionIndex(): Response
    {
        $this->requireAcceptsJson();

        $request = Craft::$app->getRequest();
        $entryId = (int)$request->getRequiredParam('entryId');

        if ($entryId <= 0) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'Invalid entry ID.'),
            ]);
        }

        try {
            $relatedEntries = Plugin::getInstance()->relatedEntries->getRelatedEntries($entryId);

            return $this->asJson([
                'success' => true,
                'outgoing' => $relatedEntries['outgoing'],
                'incoming' => $relatedEntries['incoming'],
            ]);
        } catch (\Throwable $e) {
            Logger::exception('Error fetching related entries', $e, [
                'entryId' => $entryId,
            ]);

            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-search', 'An error occurred while fetching related entries.'),
            ]);
        }
    }
}
