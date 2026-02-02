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
        $db = Craft::$app->getDb();
        $schema = $db->getSchema();

        // Get primary site ID for default values
        $primarySiteId = Craft::$app->getSites()->getPrimarySite()->id;

        // Check if siteId column already exists in entry_visits table
        $entryVisitsColumns = $schema->getTableSchema('{{%quicksearch_entry_visits}}')->columnNames;
        if (!in_array('siteId', $entryVisitsColumns)) {
            // Add siteId column to entry_visits table
            $this->addColumn(
                '{{%quicksearch_entry_visits}}',
                'siteId',
                $this->integer()->notNull()->defaultValue($primarySiteId)->after('entryId')
            );

            // Update existing records to use primary site
            $this->update('{{%quicksearch_entry_visits}}', ['siteId' => $primarySiteId]);

            // Remove default value now that existing records are updated
            $this->alterColumn(
                '{{%quicksearch_entry_visits}}',
                'siteId',
                $this->integer()->notNull()
            );
        }

        // Check if siteId column already exists in favorites table
        $favoritesColumns = $schema->getTableSchema('{{%quicksearch_favorites}}')->columnNames;
        if (!in_array('siteId', $favoritesColumns)) {
            // Add siteId column to favorites table
            $this->addColumn(
                '{{%quicksearch_favorites}}',
                'siteId',
                $this->integer()->notNull()->defaultValue($primarySiteId)->after('entryId')
            );

            // Update existing records to use primary site
            $this->update('{{%quicksearch_favorites}}', ['siteId' => $primarySiteId]);

            // Remove default value now that existing records are updated
            $this->alterColumn(
                '{{%quicksearch_favorites}}',
                'siteId',
                $this->integer()->notNull()
            );
        }

        // Drop old unique indexes (userId + entryId) if they exist
        try {
            $this->dropIndex('quicksearch_entry_visits_user_entry_unique', '{{%quicksearch_entry_visits}}');
        } catch (\Throwable $e) {
            // Index may not exist
        }
        try {
            $this->dropIndex('quicksearch_favorites_user_entry_unique', '{{%quicksearch_favorites}}');
        } catch (\Throwable $e) {
            // Index may not exist
        }

        // Create new unique indexes including siteId (userId + entryId + siteId) if they don't exist
        try {
            $this->createIndex(
                'quicksearch_entry_visits_user_entry_site_unique',
                '{{%quicksearch_entry_visits}}',
                ['userId', 'entryId', 'siteId'],
                true
            );
        } catch (\Throwable $e) {
            // Index may already exist
        }

        try {
            $this->createIndex(
                'quicksearch_favorites_user_entry_site_unique',
                '{{%quicksearch_favorites}}',
                ['userId', 'entryId', 'siteId'],
                true
            );
        } catch (\Throwable $e) {
            // Index may already exist
        }

        // Add foreign key constraints for siteId if they don't exist
        try {
            $this->addForeignKey(
                'quicksearch_entry_visits_siteId_fk',
                '{{%quicksearch_entry_visits}}',
                'siteId',
                '{{%sites}}',
                'id',
                'CASCADE',
                'CASCADE'
            );
        } catch (\Throwable $e) {
            // FK may already exist
        }

        try {
            $this->addForeignKey(
                'quicksearch_favorites_siteId_fk',
                '{{%quicksearch_favorites}}',
                'siteId',
                '{{%sites}}',
                'id',
                'CASCADE',
                'CASCADE'
            );
        } catch (\Throwable $e) {
            // FK may already exist
        }

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
