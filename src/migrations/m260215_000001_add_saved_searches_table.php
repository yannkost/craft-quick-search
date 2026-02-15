<?php

declare(strict_types=1);

namespace craftcms\quicksearch\migrations;

use craft\db\Migration;

/**
 * Add saved searches table
 *
 * @since 1.3.0
 */
class m260215_000001_add_saved_searches_table extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        $this->createTable('{{%quicksearch_saved_searches}}', [
            'id' => $this->primaryKey(),
            'userId' => $this->integer()->notNull(),
            'name' => $this->string(255)->notNull(),
            'query' => $this->string(255)->notNull(),
            'type' => $this->string(50)->notNull()->defaultValue('entries'),
            'siteId' => $this->integer()->null(),
            'sortOrder' => $this->smallInteger()->notNull()->defaultValue(0),
            'dateCreated' => $this->dateTime()->notNull(),
            'dateUpdated' => $this->dateTime()->notNull(),
            'uid' => $this->uid(),
        ]);

        // Unique index on userId + name
        $this->createIndex(
            'quicksearch_saved_searches_user_name_unique',
            '{{%quicksearch_saved_searches}}',
            ['userId', 'name'],
            true
        );

        // Index for listing by user and sort order
        $this->createIndex(
            'quicksearch_saved_searches_user_sort_idx',
            '{{%quicksearch_saved_searches}}',
            ['userId', 'sortOrder']
        );

        // Foreign keys
        $this->addForeignKey(
            'quicksearch_saved_searches_userId_fk',
            '{{%quicksearch_saved_searches}}',
            'userId',
            '{{%users}}',
            'id',
            'CASCADE'
        );

        $this->addForeignKey(
            'quicksearch_saved_searches_siteId_fk',
            '{{%quicksearch_saved_searches}}',
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
        $this->dropTableIfExists('{{%quicksearch_saved_searches}}');
        return true;
    }
}
