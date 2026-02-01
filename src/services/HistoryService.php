<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\db\Query;
use craft\elements\Entry;
use craftcms\quicksearch\helpers\Logger;
use craftcms\quicksearch\records\EntryVisitRecord;
use yii\base\InvalidConfigException;
use yii\db\Exception as DbException;

/**
 * History Service
 *
 * Handles entry visit history tracking
 *
 * @since 1.0.0
 */
class HistoryService extends Component
{
    /**
     * Record an entry visit for a user
     *
     * Uses upsert pattern to update existing visit or create new one
     *
     * @param int $entryId
     * @param int $siteId
     * @param int $userId
     * @return void
     * @throws DbException
     */
    public function recordVisit(int $entryId, int $siteId, int $userId): void
    {
        // Check if record exists for this specific entry + site + user combination
        $record = EntryVisitRecord::findOne([
            'entryId' => $entryId,
            'siteId' => $siteId,
            'userId' => $userId,
        ]);

        if ($record) {
            // Update existing record - Craft handles dateUpdated automatically
            $record->dateVisited = new \DateTime();
        } else {
            // Create new record
            $record = new EntryVisitRecord();
            $record->entryId = $entryId;
            $record->siteId = $siteId;
            $record->userId = $userId;
            $record->dateVisited = new \DateTime();
        }

        // Check save result and throw on failure
        if (!$record->save()) {
            Logger::error('Failed to save entry visit record', [
                'entryId' => $entryId,
                'siteId' => $siteId,
                'userId' => $userId,
                'errors' => $record->getErrors(),
            ]);
            throw new DbException('Could not save entry visit record');
        }

        // Prune old history entries
        $this->pruneHistory($userId);
    }

    /**
     * Get visit history for a user
     *
     * @param int $userId
     * @param int $limit Maximum number of history entries to return
     * @return array Array of entry data with id, title, url, section, site, and dateVisited
     * @throws InvalidConfigException
     */
    public function getHistory(int $userId, int $limit = 50): array
    {
        $visits = (new Query())
            ->select(['entryId', 'siteId', 'dateVisited'])
            ->from(['{{%quicksearch_entry_visits}}'])
            ->where(['userId' => $userId])
            ->orderBy(['dateVisited' => SORT_DESC])
            ->limit($limit)
            ->all();

        if (empty($visits)) {
            return [];
        }

        // Group visits by entryId and siteId for proper lookup
        $visitLookup = [];
        foreach ($visits as $visit) {
            $key = $visit['entryId'] . '-' . $visit['siteId'];
            $visitLookup[$key] = $visit;
        }

        // Fetch entries for each site-specific visit
        $entryMap = [];
        foreach ($visits as $visit) {
            $entry = Entry::find()
                ->id($visit['entryId'])
                ->siteId($visit['siteId'])
                ->status(null)
                ->one();

            if ($entry) {
                $key = $visit['entryId'] . '-' . $visit['siteId'];
                $entryMap[$key] = $entry;
            }
        }

        // Build result array maintaining visit order
        $results = [];
        $currentUser = Craft::$app->getUser()->getIdentity();

        foreach ($visits as $visit) {
            $key = $visit['entryId'] . '-' . $visit['siteId'];

            if (!isset($entryMap[$key])) {
                continue; // Entry deleted or not found for this site
            }

            $entry = $entryMap[$key];

            // Skip entries with missing sections (orphaned entries)
            if (!$entry->section) {
                continue;
            }

            // Admins can edit all entries; others need explicit permission
            if ($currentUser && !$currentUser->admin && !$currentUser->can("saveEntries:{$entry->section->uid}")) {
                continue;
            }

            // Get site info
            $site = Craft::$app->getSites()->getSiteById((int)$visit['siteId']);

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
                'siteId' => (int)$visit['siteId'],
                'status' => $entry->status,
                'dateVisited' => $visit['dateVisited'],
            ];
        }

        return $results;
    }

    /**
     * Search within a user's visit history
     *
     * @param int $userId
     * @param string $query Search query
     * @return array Array of matching entry data
     * @throws InvalidConfigException
     */
    public function searchHistory(int $userId, string $query): array
    {
        $visits = (new Query())
            ->select(['entryId', 'siteId', 'dateVisited'])
            ->from(['{{%quicksearch_entry_visits}}'])
            ->where(['userId' => $userId])
            ->orderBy(['dateVisited' => SORT_DESC])
            ->all();

        if (empty($visits)) {
            return [];
        }

        // Index visits by entry ID + site ID
        $visitMap = [];
        foreach ($visits as $visit) {
            $key = $visit['entryId'] . '-' . $visit['siteId'];
            $visitMap[$key] = $visit;
        }

        // Search entries by title within the user's history for each site-specific visit
        $results = [];
        $currentUser = Craft::$app->getUser()->getIdentity();
        $seenKeys = [];

        foreach ($visits as $visit) {
            $key = $visit['entryId'] . '-' . $visit['siteId'];
            if (isset($seenKeys[$key])) {
                continue;
            }
            $seenKeys[$key] = true;

            $entry = Entry::find()
                ->id($visit['entryId'])
                ->siteId($visit['siteId'])
                ->title('*' . $query . '*')
                ->status(null)
                ->one();

            if (!$entry) {
                continue;
            }

            // Skip entries with missing sections (orphaned entries)
            if (!$entry->section) {
                continue;
            }

            // Admins can edit all entries; others need explicit permission
            if ($currentUser && !$currentUser->admin && !$currentUser->can("saveEntries:{$entry->section->uid}")) {
                continue;
            }

            // Get site info
            $site = Craft::$app->getSites()->getSiteById((int)$visit['siteId']);

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
                'siteId' => (int)$visit['siteId'],
                'status' => $entry->status,
                'dateVisited' => $visit['dateVisited'],
            ];
        }

        // Sort by date visited
        usort($results, function ($a, $b) {
            return strcmp($b['dateVisited'] ?? '', $a['dateVisited'] ?? '');
        });

        return $results;
    }

    /**
     * Clear all history entries for a user
     *
     * @param int $userId
     * @return int Number of entries deleted
     * @throws DbException
     */
    public function clearHistory(int $userId): int
    {
        $db = Craft::$app->getDb();

        try {
            $result = $db->createCommand()
                ->delete('{{%quicksearch_entry_visits}}', ['userId' => $userId])
                ->execute();

            return $result;
        } catch (\Exception $e) {
            Logger::exception('Error clearing history', $e, [
                'userId' => $userId,
            ]);
            throw new DbException('Could not clear history: ' . $e->getMessage());
        }
    }

    /**
     * Remove oldest history entries beyond the limit
     *
     * @param int $userId
     * @param int $limit Maximum number of history entries to keep
     * @return void
     * @throws DbException
     */
    public function pruneHistory(int $userId, int $limit = 50): void
    {
        $db = Craft::$app->getDb();
        $transaction = $db->beginTransaction();

        try {
            // Get IDs of entries to keep
            $idsToKeep = (new Query())
                ->select(['id'])
                ->from(['{{%quicksearch_entry_visits}}'])
                ->where(['userId' => $userId])
                ->orderBy(['dateVisited' => SORT_DESC])
                ->limit($limit)
                ->column();

            if (empty($idsToKeep)) {
                $transaction->commit();
                return;
            }

            // Delete entries not in the keep list
            $db->createCommand()
                ->delete(
                    '{{%quicksearch_entry_visits}}',
                    [
                        'and',
                        ['userId' => $userId],
                        ['not in', 'id', $idsToKeep],
                    ]
                )
                ->execute();

            $transaction->commit();
        } catch (\Exception $e) {
            $transaction->rollBack();
            Logger::exception('Error pruning history', $e, [
                'userId' => $userId,
                'limit' => $limit,
            ]);
            throw $e;
        }
    }
}
