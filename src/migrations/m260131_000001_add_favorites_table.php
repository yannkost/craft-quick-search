<?php

declare(strict_types=1);

namespace craftcms\quicksearch\migrations;

use Craft;
use craft\db\Migration;

/**
 * m260131_000001_add_favorites_table migration.
 *
 * @since 1.1.0
 */
class m260131_000001_add_favorites_table extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        $this->createTable('{{%quicksearch_favorites}}', [
            'id' => $this->primaryKey(),
            'entryId' => $this->integer()->notNull(),
            'userId' => $this->integer()->notNull(),
            'sortOrder' => $this->smallInteger()->notNull()->defaultValue(0),
            'dateCreated' => $this->dateTime()->notNull(),
            'dateUpdated' => $this->dateTime()->notNull(),
            'uid' => $this->uid(),
        ]);

        // Create unique index for user + entry combination
        $this->createIndex(
            'quicksearch_favorites_user_entry_unique',
            '{{%quicksearch_favorites}}',
            ['userId', 'entryId'],
            true
        );

        // Create index for listing favorites by user and sort order
        $this->createIndex(
            'quicksearch_favorites_user_sort_idx',
            '{{%quicksearch_favorites}}',
            ['userId', 'sortOrder']
        );

        // Add foreign keys
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

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        $this->dropTableIfExists('{{%quicksearch_favorites}}');
        return true;
    }
}
