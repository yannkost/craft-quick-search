<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\db\Query;
use craft\elements\Entry;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\Plugin;
use craftcms\quicksearch\records\FavoriteRecord;
use yii\db\Exception as DbException;

/**
 * Favorites Service
 *
 * Handles user favorite entries functionality
 *
 * @since 1.1.0
 */
class FavoritesService extends Component
{
    /**
     * Add an entry to user's favorites
     *
     * @param int $entryId
     * @param int $siteId
     * @param int $userId
     * @return bool
     * @throws DbException
     */
    public function addFavorite(int $entryId, int $siteId, int $userId): bool
    {
        // Check if already a favorite for this specific entry + site combination
        $existing = FavoriteRecord::findOne([
            'entryId' => $entryId,
            'siteId' => $siteId,
            'userId' => $userId,
        ]);

        if ($existing) {
            return true; // Already a favorite
        }

        // Check max favorites limit
        $settings = Plugin::getInstance()->getSettings();
        $maxFavorites = $settings->maxFavorites ?? 10;
        $currentCount = $this->getFavoritesCount($userId);

        if ($currentCount >= $maxFavorites) {
            return false; // Limit reached
        }

        // Get next sort order
        $maxSortOrder = (new Query())
            ->select(['MAX(sortOrder)'])
            ->from(['{{%quicksearch_favorites}}'])
            ->where(['userId' => $userId])
            ->scalar();

        $sortOrder = $maxSortOrder !== null ? (int)$maxSortOrder + 1 : 0;

        // Create new record
        $record = new FavoriteRecord();
        $record->entryId = $entryId;
        $record->siteId = $siteId;
        $record->userId = $userId;
        $record->sortOrder = $sortOrder;

        if (!$record->save()) {
            Logger::error('Failed to save favorite record', [
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $userId,
                'errors' => $record->getErrors(),
            ]);
            throw new DbException('Could not save favorite record');
        }

        return true;
    }

    /**
     * Remove an entry from user's favorites
     *
     * @param int $entryId
     * @param int $siteId
     * @param int $userId
     * @return bool
     */
    public function removeFavorite(int $entryId, int $siteId, int $userId): bool
    {
        $record = FavoriteRecord::findOne([
            'entryId' => $entryId,
            'siteId' => $siteId,
            'userId' => $userId,
        ]);

        if (!$record) {
            return true; // Not a favorite, nothing to remove
        }

        try {
            $record->delete();
            return true;
        } catch (\Throwable $e) {
            Logger::exception('Error removing favorite', $e, [
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $userId,
            ]);
            return false;
        }
    }

    /**
     * Get user's favorites
     *
     * @param int $userId
     * @param int $limit
     * @return array
     */
    public function getFavorites(int $userId, int $limit = 10): array
    {
        $favorites = (new Query())
            ->select(['entryId', 'siteId', 'sortOrder'])
            ->from(['{{%quicksearch_favorites}}'])
            ->where(['userId' => $userId])
            ->orderBy(['sortOrder' => SORT_ASC])
            ->limit($limit)
            ->all();

        if (empty($favorites)) {
            return [];
        }

        // Fetch entries for each site-specific favorite
        $entryMap = [];
        foreach ($favorites as $favorite) {
            $entry = Entry::find()
                ->id($favorite['entryId'])
                ->siteId($favorite['siteId'])
                ->status(null)
                ->one();

            if ($entry) {
                $key = $favorite['entryId'] . '-' . $favorite['siteId'];
                $entryMap[$key] = $entry;
            }
        }

        // Build result array maintaining sort order
        $results = [];
        $currentUser = Craft::$app->getUser()->getIdentity();

        foreach ($favorites as $favorite) {
            $key = $favorite['entryId'] . '-' . $favorite['siteId'];

            if (!isset($entryMap[$key])) {
                continue; // Entry deleted or not found for this site
            }

            $entry = $entryMap[$key];

            // Skip entries with missing sections
            if (!$entry->section) {
                continue;
            }

            // Admins can view all entries; others need at least view permission
            if ($currentUser && !$currentUser->admin && !$currentUser->can("viewEntries:{$entry->section->uid}")) {
                continue;
            }

            // Get site info
            $site = Craft::$app->getSites()->getSiteById((int)$favorite['siteId']);

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
                'siteId' => (int)$favorite['siteId'],
                'status' => $entry->status,
                'isFavorite' => true,
            ];
        }

        return $results;
    }

    /**
     * Check if an entry is a favorite for a user
     *
     * @param int $entryId
     * @param int $siteId
     * @param int $userId
     * @return bool
     */
    public function isFavorite(int $entryId, int $siteId, int $userId): bool
    {
        return FavoriteRecord::find()
            ->where([
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $userId,
            ])
            ->exists();
    }

    /**
     * Get the count of favorites for a user
     *
     * @param int $userId
     * @return int
     */
    public function getFavoritesCount(int $userId): int
    {
        return (int)FavoriteRecord::find()
            ->where(['userId' => $userId])
            ->count();
    }

    /**
     * Reorder user's favorites
     *
     * @param int $userId
     * @param array $favoriteItems Array of objects with entryId and siteId in the new order
     * @return bool
     */
    public function reorderFavorites(int $userId, array $favoriteItems): bool
    {
        $db = Craft::$app->getDb();
        $transaction = $db->beginTransaction();

        try {
            foreach ($favoriteItems as $sortOrder => $item) {
                // Support both old format (just entryId) and new format (entryId + siteId)
                if (is_array($item) && isset($item['entryId']) && isset($item['siteId'])) {
                    $db->createCommand()
                        ->update(
                            '{{%quicksearch_favorites}}',
                            ['sortOrder' => $sortOrder],
                            ['userId' => $userId, 'entryId' => $item['entryId'], 'siteId' => $item['siteId']]
                        )
                        ->execute();
                } else {
                    // Legacy format - just entryId (will update all site versions)
                    $entryId = is_array($item) ? ($item['entryId'] ?? $item) : $item;
                    $db->createCommand()
                        ->update(
                            '{{%quicksearch_favorites}}',
                            ['sortOrder' => $sortOrder],
                            ['userId' => $userId, 'entryId' => $entryId]
                        )
                        ->execute();
                }
            }

            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            Logger::exception('Error reordering favorites', $e, [
                'userId' => $userId,
            ]);
            return false;
        }
    }
}
