<?php

declare(strict_types=1);

namespace craftcms\quicksearch\controllers;

use Craft;
use craft\web\Controller;
use yii\web\Response;

/**
 * User Preferences Controller
 *
 * Handles saving Quick Search per-user preferences.
 *
 * @since 1.9.0
 */
class UserPrefsController extends Controller
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
     * Save the user's Quick Search theme preference.
     */
    public function actionSaveTheme(): Response
    {
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $themeMode = $this->request->getBodyParam('themeMode', '');

        if (!in_array($themeMode, ['', 'auto', 'light', 'dark'], true)) {
            return $this->asFailure(Craft::t('quick-search', 'Invalid theme.'));
        }

        $user = Craft::$app->getUser()->getIdentity();
        Craft::$app->getUsers()->saveUserPreferences($user, [
            'quickSearch_themeMode' => $themeMode,
        ]);

        return $this->asSuccess();
    }
}
