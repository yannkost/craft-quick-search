<?php

declare(strict_types=1);

namespace craftcms\quicksearch\migrations;

use Craft;
use craft\db\Migration;

/**
 * m260201_000001_add_site_id_columns migration.
 *
 * Adds siteId column to entry_visits and favorites tables for multi-site support.
 *
 * @since 1.2.0
 */
class m260201_000001_add_site_id_columns extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        // Get primary site ID for default values
        $primarySiteId = Craft::$app->getSites()->getPrimarySite()->id;

        // Add siteId column to entry_visits table
        $this->addColumn(
            '{{%quicksearch_entry_visits}}',
            'siteId',
            $this->integer()->notNull()->defaultValue($primarySiteId)->after('entryId')
        );

        // Add siteId column to favorites table
        $this->addColumn(
            '{{%quicksearch_favorites}}',
            'siteId',
            $this->integer()->notNull()->defaultValue($primarySiteId)->after('entryId')
        );

        // Update existing records to use primary site (already done via default value)
        // but let's be explicit for safety
        $this->update('{{%quicksearch_entry_visits}}', ['siteId' => $primarySiteId]);
        $this->update('{{%quicksearch_favorites}}', ['siteId' => $primarySiteId]);

        // Remove default value now that existing records are updated
        $this->alterColumn(
            '{{%quicksearch_entry_visits}}',
            'siteId',
            $this->integer()->notNull()
        );
        $this->alterColumn(
            '{{%quicksearch_favorites}}',
            'siteId',
            $this->integer()->notNull()
        );

        // Drop old unique indexes (userId + entryId)
        $this->dropIndex('quicksearch_entry_visits_user_entry_unique', '{{%quicksearch_entry_visits}}');
        $this->dropIndex('quicksearch_favorites_user_entry_unique', '{{%quicksearch_favorites}}');

        // Create new unique indexes including siteId (userId + entryId + siteId)
        $this->createIndex(
            'quicksearch_entry_visits_user_entry_site_unique',
            '{{%quicksearch_entry_visits}}',
            ['userId', 'entryId', 'siteId'],
            true
        );

        $this->createIndex(
            'quicksearch_favorites_user_entry_site_unique',
            '{{%quicksearch_favorites}}',
            ['userId', 'entryId', 'siteId'],
            true
        );

        // Add foreign key constraints for siteId
        $this->addForeignKey(
            'quicksearch_entry_visits_siteId_fk',
            '{{%quicksearch_entry_visits}}',
            'siteId',
            '{{%sites}}',
            'id',
            'CASCADE',
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
        // Drop foreign keys (using parent's dropForeignKeyIfExists method)
        $this->dropForeignKeyIfExists('quicksearch_entry_visits_siteId_fk', '{{%quicksearch_entry_visits}}');
        $this->dropForeignKeyIfExists('quicksearch_favorites_siteId_fk', '{{%quicksearch_favorites}}');

        // Drop new unique indexes
        $this->dropIndex('quicksearch_entry_visits_user_entry_site_unique', '{{%quicksearch_entry_visits}}');
        $this->dropIndex('quicksearch_favorites_user_entry_site_unique', '{{%quicksearch_favorites}}');

        // Recreate old unique indexes (userId + entryId)
        // Note: This may fail if there are now duplicate userId + entryId combinations
        // due to multiple sites having the same entry favorited
        $this->createIndex(
            'quicksearch_entry_visits_user_entry_unique',
            '{{%quicksearch_entry_visits}}',
            ['userId', 'entryId'],
            true
        );

        $this->createIndex(
            'quicksearch_favorites_user_entry_unique',
            '{{%quicksearch_favorites}}',
            ['userId', 'entryId'],
            true
        );

        // Drop siteId columns
        $this->dropColumn('{{%quicksearch_entry_visits}}', 'siteId');
        $this->dropColumn('{{%quicksearch_favorites}}', 'siteId');

        return true;
    }
}
