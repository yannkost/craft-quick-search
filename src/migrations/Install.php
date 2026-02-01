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
        $this->createTable('{{%quicksearch_entry_visits}}', [
            'id' => $this->primaryKey(),
            'entryId' => $this->integer()->notNull(),
            'userId' => $this->integer()->notNull(),
            'dateVisited' => $this->dateTime()->notNull(),
            'dateCreated' => $this->dateTime()->notNull(),
            'dateUpdated' => $this->dateTime()->notNull(),
            'uid' => $this->uid(),
        ]);

        // Create unique index for upsert pattern
        $this->createIndex(
            'quicksearch_entry_visits_user_entry_unique',
            '{{%quicksearch_entry_visits}}',
            ['userId', 'entryId'],
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

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        $this->dropTableIfExists('{{%quicksearch_entry_visits}}');
        return true;
    }
}
