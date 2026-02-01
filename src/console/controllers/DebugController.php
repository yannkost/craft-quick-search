<?php

declare(strict_types=1);

namespace craftcms\quicksearch\console\controllers;

use Craft;
use craft\console\Controller;
use craft\elements\Entry;
use yii\console\ExitCode;

/**
 * Debug controller for testing search queries
 */
class DebugController extends Controller
{
    /**
     * @var string The search query
     */
    public string $query = '';

    /**
     * @inheritdoc
     */
    public function options($actionID): array
    {
        $options = parent::options($actionID);
        $options[] = 'query';
        return $options;
    }

    /**
     * Test search query and show results
     *
     * @param string $searchQuery The search term
     * @return int
     */
    public function actionSearch(string $searchQuery = '20'): int
    {
        $this->stdout("Testing search for: '$searchQuery'\n\n");

        // Test 1: Using ->title() method (LIKE query)
        $this->stdout("=== Method 1: ->title('*{$searchQuery}*') ===\n");
        $entries1 = Entry::find()
            ->title('*' . $searchQuery . '*')
            ->status(null)
            ->all();
        $this->stdout("Results: " . count($entries1) . "\n");
        foreach (array_slice($entries1, 0, 10) as $entry) {
            $this->stdout("  - [{$entry->id}] {$entry->title}\n");
        }
        if (count($entries1) > 10) {
            $this->stdout("  ... and " . (count($entries1) - 10) . " more\n");
        }

        $this->stdout("\n");

        // Test 2: Using ->search() method (search index)
        $this->stdout("=== Method 2: ->search('title:*{$searchQuery}*') ===\n");
        $entries2 = Entry::find()
            ->search("title:*{$searchQuery}*")
            ->status(null)
            ->all();
        $this->stdout("Results: " . count($entries2) . "\n");
        foreach (array_slice($entries2, 0, 10) as $entry) {
            $this->stdout("  - [{$entry->id}] {$entry->title}\n");
        }
        if (count($entries2) > 10) {
            $this->stdout("  ... and " . (count($entries2) - 10) . " more\n");
        }

        $this->stdout("\n");

        // Test 3: Using ->search() without wildcards
        $this->stdout("=== Method 3: ->search('title:{$searchQuery}') ===\n");
        $entries3 = Entry::find()
            ->search("title:{$searchQuery}")
            ->status(null)
            ->all();
        $this->stdout("Results: " . count($entries3) . "\n");
        foreach (array_slice($entries3, 0, 10) as $entry) {
            $this->stdout("  - [{$entry->id}] {$entry->title}\n");
        }
        if (count($entries3) > 10) {
            $this->stdout("  ... and " . (count($entries3) - 10) . " more\n");
        }

        $this->stdout("\n");

        // Test 4: Raw SQL to verify data exists
        $this->stdout("=== Method 4: Raw count of entries with '$searchQuery' in title ===\n");
        $count = Entry::find()
            ->status(null)
            ->count();
        $this->stdout("Total entries in system: $count\n");

        // Test 5: Check if section() filter excludes orphaned entries
        $this->stdout("\n=== Method 5: Test section() filter ===\n");
        
        // Get all valid section handles
        $allSections = Craft::$app->getEntries()->getAllSections();
        $sectionHandles = array_map(fn($s) => $s->handle, $allSections);
        $this->stdout("Valid section handles: " . implode(', ', $sectionHandles) . "\n");
        
        // Test with section('*') or section('not null') - does it exclude orphans?
        $entryQuery = Entry::find()
            ->title('*' . $searchQuery . '*')
            ->status(null)
            ->section('*')  // Should match any valid section
            ->orderBy('title')
            ->limit(20);
        
        $entries = $entryQuery->all();
        $this->stdout("Entries with section('*') (limit 20): " . count($entries) . "\n");
        
        foreach ($entries as $entry) {
            $sectionName = $entry->section ? $entry->section->handle : 'NO SECTION';
            $this->stdout("  - [{$entry->id}] {$entry->title} (section: $sectionName)\n");
        }
        
        // Test 6: Check ->search() with score (orderBy('score') to get scores)
        $this->stdout("\n=== Method 6: Test search() with orderBy('score') ===\n");
        $entryQuery2 = Entry::find()
            ->search("title:*{$searchQuery}*")
            ->status(null)
            ->section('*')
            ->orderBy('score')  // Order by search score
            ->limit(20);
        
        $entries2 = $entryQuery2->all();
        $this->stdout("Entries with search() + orderBy('score') (limit 20): " . count($entries2) . "\n");
        
        foreach ($entries2 as $entry) {
            $sectionName = $entry->section ? $entry->section->handle : 'NO SECTION';
            $score = $entry->searchScore ?? 'N/A';
            $this->stdout("  - [{$entry->id}] score=$score {$entry->title} (section: $sectionName)\n");
        }
        
        // Test 7: Test with section handle filter (like the real API)
        $this->stdout("\n=== Method 7: Test with section handle 'blocsPage' ===\n");
        $entryQuery3 = Entry::find()
            ->search("title:*{$searchQuery}*")
            ->status(null)
            ->section(['blocsPage'])
            ->orderBy('score')
            ->limit(20);
        
        $entries3 = $entryQuery3->all();
        $this->stdout("Entries with section(['blocsPage']) (limit 20): " . count($entries3) . "\n");
        
        foreach ($entries3 as $entry) {
            $sectionName = $entry->section ? $entry->section->handle : 'NO SECTION';
            $score = $entry->searchScore ?? 'N/A';
            $this->stdout("  - [{$entry->id}] score=$score {$entry->title} (section: $sectionName)\n");
        }

        return ExitCode::OK;
    }
}
