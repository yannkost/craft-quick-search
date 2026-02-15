<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\db\Query;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\Plugin;
use craftcms\quicksearch\records\SavedSearchRecord;
use yii\db\Exception as DbException;

/**
 * Saved Searches Service
 *
 * Handles user saved searches functionality
 *
 * @since 1.3.0
 */
class SavedSearchesService extends Component
{
    /**
     * Get all saved searches for a user, ordered by sortOrder
     *
     * @param int $userId
     * @return array
     */
    public function getSavedSearches(int $userId): array
    {
        return (new Query())
            ->select(['id', 'name', 'query', 'type', 'siteId', 'sortOrder'])
            ->from(['{{%quicksearch_saved_searches}}'])
            ->where(['userId' => $userId])
            ->orderBy(['sortOrder' => SORT_ASC])
            ->all();
    }

    /**
     * Save a search (create or update by name)
     *
     * @param int $userId
     * @param string $name
     * @param string $query
     * @param string $type
     * @param int|null $siteId
     * @return array The saved record data
     * @throws DbException
     */
    public function saveSearch(int $userId, string $name, string $query, string $type, ?int $siteId): array
    {
        // Check max limit
        $settings = Plugin::getInstance()->getSettings();
        $maxSavedSearches = $settings->maxSavedSearches ?? 20;

        // Check if updating existing
        $existing = SavedSearchRecord::findOne([
            'userId' => $userId,
            'name' => $name,
        ]);

        if ($existing) {
            // Update existing
            $existing->query = $query;
            $existing->type = $type;
            $existing->siteId = $siteId;

            if (!$existing->save()) {
                Logger::error('Failed to update saved search', [
                    'userId' => $userId,
                    'name' => $name,
                    'errors' => $existing->getErrors(),
                ]);
                throw new DbException('Could not update saved search');
            }

            return [
                'id' => $existing->id,
                'name' => $existing->name,
                'query' => $existing->query,
                'type' => $existing->type,
                'siteId' => $existing->siteId,
                'sortOrder' => $existing->sortOrder,
            ];
        }

        // Check count limit for new entries
        $currentCount = (int)SavedSearchRecord::find()
            ->where(['userId' => $userId])
            ->count();

        if ($currentCount >= $maxSavedSearches) {
            return [];
        }

        // Get next sort order
        $maxSortOrder = (new Query())
            ->select(['MAX(sortOrder)'])
            ->from(['{{%quicksearch_saved_searches}}'])
            ->where(['userId' => $userId])
            ->scalar();

        $sortOrder = $maxSortOrder !== null ? (int)$maxSortOrder + 1 : 0;

        // Create new
        $record = new SavedSearchRecord();
        $record->userId = $userId;
        $record->name = $name;
        $record->query = $query;
        $record->type = $type;
        $record->siteId = $siteId;
        $record->sortOrder = $sortOrder;

        if (!$record->save()) {
            Logger::error('Failed to save search record', [
                'userId' => $userId,
                'name' => $name,
                'errors' => $record->getErrors(),
            ]);
            throw new DbException('Could not save search record');
        }

        return [
            'id' => $record->id,
            'name' => $record->name,
            'query' => $record->query,
            'type' => $record->type,
            'siteId' => $record->siteId,
            'sortOrder' => $record->sortOrder,
        ];
    }

    /**
     * Delete a saved search
     *
     * @param int $id
     * @param int $userId
     * @return bool
     */
    public function deleteSearch(int $id, int $userId): bool
    {
        $record = SavedSearchRecord::findOne([
            'id' => $id,
            'userId' => $userId,
        ]);

        if (!$record) {
            return true; // Not found, nothing to delete
        }

        try {
            $record->delete();
            return true;
        } catch (\Throwable $e) {
            Logger::exception('Error deleting saved search', $e, [
                'id' => $id,
                'userId' => $userId,
            ]);
            return false;
        }
    }

    /**
     * Reorder saved searches
     *
     * @param int $userId
     * @param array $ids Array of saved search IDs in the new order
     * @return bool
     */
    public function reorderSearches(int $userId, array $ids): bool
    {
        $db = Craft::$app->getDb();
        $transaction = $db->beginTransaction();

        try {
            foreach ($ids as $sortOrder => $id) {
                $db->createCommand()
                    ->update(
                        '{{%quicksearch_saved_searches}}',
                        ['sortOrder' => $sortOrder],
                        ['id' => (int)$id, 'userId' => $userId]
                    )
                    ->execute();
            }

            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            Logger::exception('Error reordering saved searches', $e, [
                'userId' => $userId,
            ]);
            return false;
        }
    }
}
