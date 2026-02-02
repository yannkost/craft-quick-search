<?php

declare(strict_types=1);

namespace craftcms\quicksearch\migrations;

use Craft;
use craft\db\Migration;

/**
 * Installation migration
 *
 * @since 1.0.0
 */
class Install extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        // Get primary site ID for default value
        $primarySiteId = Craft::$app->getSites()->getPrimarySite()->id;

        $this->createTable('{{%quicksearch_entry_visits}}', [
            'id' => $this->primaryKey(),
            'entryId' => $this->integer()->notNull(),
            'siteId' => $this->integer()->notNull()->defaultValue($primarySiteId),
            'userId' => $this->integer()->notNull(),
            'dateVisited' => $this->dateTime()->notNull(),
            'dateCreated' => $this->dateTime()->notNull(),
            'dateUpdated' => $this->dateTime()->notNull(),
            'uid' => $this->uid(),
        ]);

        // Create unique index for upsert pattern (userId + entryId + siteId)
        $this->createIndex(
            'quicksearch_entry_visits_user_entry_site_unique',
            '{{%quicksearch_entry_visits}}',
            ['userId', 'entryId', 'siteId'],
            true
        );

        // Create index for history queries
        $this->createIndex(
            'quicksearch_entry_visits_user_date_idx',
            '{{%quicksearch_entry_visits}}',
            ['userId', 'dateVisited']
        );

        // Add foreign keys
        $this->addForeignKey(
            'quicksearch_entry_visits_entryId_fk',
            '{{%quicksearch_entry_visits}}',
            'entryId',
            '{{%entries}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'quicksearch_entry_visits_userId_fk',
            '{{%quicksearch_entry_visits}}',
            'userId',
            '{{%users}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'quicksearch_entry_visits_siteId_fk',
            '{{%quicksearch_entry_visits}}',
            'siteId',
            '{{%sites}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        // Create favorites table
        $this->createTable('{{%quicksearch_favorites}}', [
            'id' => $this->primaryKey(),
            'entryId' => $this->integer()->notNull(),
            'siteId' => $this->integer()->notNull()->defaultValue($primarySiteId),
            'userId' => $this->integer()->notNull(),
            'sortOrder' => $this->smallInteger()->notNull()->defaultValue(0),
            'dateCreated' => $this->dateTime()->notNull(),
            'dateUpdated' => $this->dateTime()->notNull(),
            'uid' => $this->uid(),
        ]);

        // Create unique index for user + entry + site combination
        $this->createIndex(
            'quicksearch_favorites_user_entry_site_unique',
            '{{%quicksearch_favorites}}',
            ['userId', 'entryId', 'siteId'],
            true
        );

        // Create index for listing favorites by user and sort order
        $this->createIndex(
            'quicksearch_favorites_user_sort_idx',
            '{{%quicksearch_favorites}}',
            ['userId', 'sortOrder']
        );

        // Add foreign keys for favorites
        $this->addForeignKey(
            'quicksearch_favorites_entryId_fk',
            '{{%quicksearch_favorites}}',
            'entryId',
            '{{%entries}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'quicksearch_favorites_userId_fk',
            '{{%quicksearch_favorites}}',
            'userId',
            '{{%users}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'quicksearch_favorites_siteId_fk',
            '{{%quicksearch_favorites}}',
            'siteId',
            '{{%sites}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        $this->dropTableIfExists('{{%quicksearch_favorites}}');
        $this->dropTableIfExists('{{%quicksearch_entry_visits}}');
        return true;
    }
}
