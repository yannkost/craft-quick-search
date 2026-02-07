<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\elements\Entry;
use craft\db\Query;
use craftcms\quicksearch\helpers\Logger;

/**
 * Related Entries Service
 *
 * Handles fetching related entries in both directions
 *
 * @since 1.0.0
 */
class RelatedEntriesService extends Component
{
    /**
     * Get entries related to the specified entry in both directions
     *
     * @param int $entryId The entry ID to find relations for
     * @param int|null $siteId Optional site ID context (defaults to current site)
     * @return array Array with 'outgoing' and 'incoming' relations
     */
    public function getRelatedEntries(int $entryId, ?int $siteId = null): array
    {
        $currentUser = Craft::$app->getUser()->getIdentity();

        if (!$currentUser) {
            return ['outgoing' => [], 'incoming' => []];
        }

        // Use provided siteId or fall back to current site
        $activeSiteId = $siteId ?? Craft::$app->getSites()->getCurrentSite()->id;

        // Get the current entry for the specified site
        $entry = Entry::find()->id($entryId)->siteId($activeSiteId)->status(null)->one();

        if (!$entry) {
            return ['outgoing' => [], 'incoming' => []];
        }

        // Get outgoing relations (entries this entry links to) - use same site context
        $outgoingEntries = Entry::find()
            ->relatedTo(['sourceElement' => $entry])
            ->siteId($activeSiteId)
            ->status(null)
            ->all();

        // Also find entries linked in content fields (CKEditor, Redactor, etc.)
        $contentLinkedOutgoing = $this->findEntriesLinkedInContent($entry);
        
        // Merge and deduplicate outgoing entries
        $allOutgoing = $this->mergeEntries($outgoingEntries, $contentLinkedOutgoing);

        // Get incoming relations (entries that link to this entry)
        // This includes nested entries (e.g., in Matrix blocks), so we need to resolve them to their top-level parents
        $incomingEntries = Entry::find()
            ->relatedTo(['targetElement' => $entry])
            ->siteId($activeSiteId)
            ->status(null)
            ->all();

        // Also find entries that link to this entry in their content fields
        $contentLinkedIncoming = $this->findEntriesLinkingToEntryInContent($entry);

        // Merge incoming entries
        $allIncoming = array_merge($incomingEntries, $contentLinkedIncoming);

        // Resolve nested entries to their top-level parent entries
        $resolvedIncoming = $this->resolveToTopLevelEntries($allIncoming);

        return [
            'outgoing' => $this->formatEntries($allOutgoing, $currentUser),
            'incoming' => $this->formatEntries($resolvedIncoming, $currentUser),
        ];
    }

    /**
     * Find entries that are linked within the content fields of the given entry
     * (e.g., links in CKEditor, Redactor, or PlainText fields)
     *
     * @param Entry $entry The entry to search content fields in
     * @return array Array of Entry elements
     */
    private function findEntriesLinkedInContent(Entry $entry): array
    {
        $results = [];
        
        // Get all text/HTML fields that might contain entry links
        $fields = Craft::$app->getFields()->getAllFields();
        $htmlFieldTypes = [
            'craft\\redactor\\Field',
            'craft\\ckeditor\\Field',
            'craft\\fields\\PlainText',
        ];
        
        $htmlFields = [];
        foreach ($fields as $field) {
            if (in_array(get_class($field), $htmlFieldTypes, true)) {
                $htmlFields[] = $field;
            }
        }
        
        if (empty($htmlFields)) {
            return $results;
        }

        // Get all entries from this entry's content (including nested entries in Matrix)
        $entriesToSearch = [$entry];
        
        // Also search nested entries (Matrix blocks, etc.)
        $nestedEntries = Entry::find()
            ->ownerId($entry->id)
            ->status(null)
            ->all();
        
        $entriesToSearch = array_merge($entriesToSearch, $nestedEntries);

        // Patterns to find entry links
        // CKEditor URL hash format: #entry:123@1:url (MOST IMPORTANT!)
        $hashRefPattern = '/#entry:(\d+)(?:@\d+)?:[^"\'>\s]*/';
        // CKEditor/Craft reference tags: {entry:123:url} or {entry:123@1:url}
        $refTagPattern = '/\{entry:(\d+)(?:@\d+)?(?::[^}]*)?\}/';
        // URLs like /admin/entries/section-handle/123-entry-slug
        $entryIdPattern = '/\/entries\/[^\/]+\/(\d+)(?:-[^"\'>\s]*)?/';
        // Data attributes
        $dataEntryIdPattern = '/data-(?:link-)?entry-id="(\d+)"/';

        $foundEntryIds = [];

        foreach ($entriesToSearch as $searchEntry) {
            foreach ($htmlFields as $field) {
                try {
                    $fieldValue = $searchEntry->getFieldValue($field->handle);
                } catch (\Throwable $e) {
                    continue;
                }
                
                // Handle different field value types
                if ($fieldValue instanceof \craft\redactor\FieldData) {
                    $fieldValue = $fieldValue->getRawContent();
                } elseif (is_object($fieldValue) && method_exists($fieldValue, '__toString')) {
                    $fieldValue = (string)$fieldValue;
                }
                
                if (!$fieldValue || !is_string($fieldValue)) {
                    continue;
                }
                
                Logger::info('Scanning field for outgoing links', [
                    'entryId' => $searchEntry->id,
                    'field' => $field->handle,
                    'contentLength' => strlen($fieldValue),
                    'contentPreview' => substr($fieldValue, 0, 500),
                ]);
                
                // Find CKEditor hash references (most important!)
                if (preg_match_all($hashRefPattern, $fieldValue, $matches)) {
                    Logger::info('Found hash ref matches', ['matches' => $matches[1]]);
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
                
                // Find Craft reference tags (curly brace format)
                if (preg_match_all($refTagPattern, $fieldValue, $matches)) {
                    Logger::info('Found ref tag matches', ['matches' => $matches[1]]);
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
                
                // Find entry IDs in URLs
                if (preg_match_all($entryIdPattern, $fieldValue, $matches)) {
                    Logger::info('Found URL matches', ['matches' => $matches[1]]);
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
                
                // Find data-entry-id attributes
                if (preg_match_all($dataEntryIdPattern, $fieldValue, $matches)) {
                    Logger::info('Found data attr matches', ['matches' => $matches[1]]);
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
            }
        }
        
        Logger::info('Found outgoing entry IDs in content', [
            'sourceEntryId' => $entry->id,
            'foundIds' => array_keys($foundEntryIds),
        ]);

        // Remove the current entry from results
        unset($foundEntryIds[$entry->id]);

        if (empty($foundEntryIds)) {
            return $results;
        }

        // Fetch the actual entries
        $results = Entry::find()
            ->id(array_keys($foundEntryIds))
            ->status(null)
            ->all();

        return $results;
    }

    /**
     * Find entries that link to the given entry in their content fields
     *
     * @param Entry $entry The entry to find links to
     * @return array Array of Entry elements that link to this entry
     */
    private function findEntriesLinkingToEntryInContent(Entry $entry): array
    {
        $foundEntryIds = [];
        
        // APPROACH 1: Search RAW database content for reference tags (most reliable)
        $rawPatterns = $this->searchRawContentForEntry($entry);
        foreach ($rawPatterns as $entryId) {
            $foundEntryIds[$entryId] = true;
        }
        
        // APPROACH 2: Search rendered content for URLs (fallback)
        $renderedPatterns = $this->searchRenderedContentForEntry($entry);
        foreach ($renderedPatterns as $entryId) {
            $foundEntryIds[$entryId] = true;
        }
        
        // Remove the current entry from results
        unset($foundEntryIds[$entry->id]);
        
        if (empty($foundEntryIds)) {
            return [];
        }
        
        // Fetch the actual entries
        return Entry::find()
            ->id(array_keys($foundEntryIds))
            ->status(null)
            ->all();
    }

    /**
     * Search raw database content for entry reference tags
     * This is the most reliable approach as it finds the original reference tags
     *
     * @param Entry $entry
     * @return array Entry IDs that link to this entry
     */
    private function searchRawContentForEntry(Entry $entry): array
    {
        $foundEntryIds = [];
        
        // Build patterns for raw content search
        // These are the patterns stored in the database before Craft parses them
        $rawPatterns = [
            // CKEditor hash format in href: #entry:708@1:url
            '#entry:' . $entry->id . '@',
            '#entry:' . $entry->id . ':',
            // Craft reference tags: {entry:708:url} or {entry:708@1:url}
            '{entry:' . $entry->id . ':',
            '{entry:' . $entry->id . '@',
            '{entry:' . $entry->id . '}',
        ];
        
        Logger::info('Searching RAW content for patterns', [
            'entryId' => $entry->id,
            'patterns' => $rawPatterns,
        ]);
        
        // Query the content table directly for raw content
        $db = Craft::$app->getDb();
        
        // Search in elements_sites for content stored in JSON
        // and in the content table for traditional content
        try {
            // Get all CKEditor and text field column names
            $fields = Craft::$app->getFields()->getAllFields();
            $fieldHandles = [];
            foreach ($fields as $field) {
                $fieldClass = get_class($field);
                if (in_array($fieldClass, ['craft\\ckeditor\\Field', 'craft\\redactor\\Field', 'craft\\fields\\PlainText'], true)) {
                    $fieldHandles[] = $field->handle;
                }
            }
            
            if (empty($fieldHandles)) {
                return $foundEntryIds;
            }
            
            // Search in elements_sites.content JSON column (Craft 5 stores content here)
            foreach ($rawPatterns as $pattern) {
                $escapedPattern = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $pattern) . '%';
                
                $results = (new Query())
                    ->select(['es.elementId', 'e.canonicalId'])
                    ->from(['es' => '{{%elements_sites}}'])
                    ->innerJoin(['e' => '{{%elements}}'], '[[es.elementId]] = [[e.id]]')
                    ->where(['like', 'es.content', $pattern, false])
                    ->andWhere(['e.type' => 'craft\\elements\\Entry'])
                    ->all();
                
                foreach ($results as $row) {
                    $elementId = (int)($row['canonicalId'] ?? $row['elementId']);
                    if ($elementId !== $entry->id) {
                        $foundEntryIds[$elementId] = true;
                        Logger::info('RAW content match found', [
                            'pattern' => $pattern,
                            'elementId' => $elementId,
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            Logger::warning('Error searching raw content', ['error' => $e->getMessage()]);
        }
        
        return array_keys($foundEntryIds);
    }

    /**
     * Search rendered content for entry URLs (fallback approach)
     *
     * @param Entry $entry
     * @return array Entry IDs that link to this entry
     */
    private function searchRenderedContentForEntry(Entry $entry): array
    {
        $foundEntryIds = [];
        
        // Build search patterns for rendered content
        $searchPatterns = [];
        
        // Entry's frontend URL (what CKEditor renders to)
        $frontendUrl = $entry->getUrl();
        if ($frontendUrl) {
            $searchPatterns[] = $frontendUrl;
            // Also check without protocol
            $parsedUrl = parse_url($frontendUrl);
            if (isset($parsedUrl['path'])) {
                $searchPatterns[] = $parsedUrl['path'];
            }
        }
        
        // Pattern: data-entry-id="123" or data-link-entry-id="123"
        $searchPatterns[] = 'data-entry-id="' . $entry->id . '"';
        $searchPatterns[] = 'data-link-entry-id="' . $entry->id . '"';
        $searchPatterns[] = 'entry-id="' . $entry->id . '"';
        
        // Pattern: /entries/section-handle/123 (CP URL)
        $cpEditUrl = $entry->getCpEditUrl();
        if ($cpEditUrl) {
            $searchPatterns[] = '/entries/' . ($entry->section->handle ?? '') . '/' . $entry->id;
        }
        
        Logger::info('Searching RENDERED content for patterns', [
            'entryId' => $entry->id,
            'patterns' => $searchPatterns,
        ]);

        // Get all text/HTML fields
        $fields = Craft::$app->getFields()->getAllFields();
        $htmlFieldTypes = [
            'craft\\redactor\\Field',
            'craft\\ckeditor\\Field',
            'craft\\fields\\PlainText',
        ];
        
        $htmlFields = [];
        foreach ($fields as $field) {
            if (in_array(get_class($field), $htmlFieldTypes, true)) {
                $htmlFields[] = $field;
            }
        }
        
        if (empty($htmlFields)) {
            return $foundEntryIds;
        }

        Logger::info('HTML fields found for rendered search', [
            'count' => count($htmlFields),
            'fields' => array_map(fn($f) => $f->handle, $htmlFields),
        ]);

        // Query all entries and check their content
        // Note: This could be slow for large sites - consider caching or limiting
        $entries = Entry::find()
            ->status(null)
            ->limit(500) // Safety limit
            ->all();

        Logger::info('Entries to scan', [
            'count' => count($entries),
        ]);

        $foundEntryIds = [];

        foreach ($entries as $checkEntry) {
            if ($checkEntry->id === $entry->id) {
                continue;
            }

            // Check main entry and ALL nested entries (recursively)
            $entriesToCheck = [$checkEntry];
            
            try {
                // Get ALL nested entries recursively (not just direct children)
                $nestedEntries = Entry::find()
                    ->descendantOf($checkEntry)
                    ->status(null)
                    ->all();
                
                // Also try ownerId approach for Matrix blocks
                if (empty($nestedEntries)) {
                    $nestedEntries = Entry::find()
                        ->ownerId($checkEntry->id)
                        ->status(null)
                        ->all();
                }
                
                $entriesToCheck = array_merge($entriesToCheck, $nestedEntries);
            } catch (\Throwable $e) {
                // Ignore errors getting nested entries
            }

            // Log when checking entry 696 specifically
            if ($checkEntry->id === 696) {
                Logger::info('Checking entry 696', [
                    'nestedCount' => count($entriesToCheck) - 1,
                    'nestedIds' => array_map(fn($e) => $e->id, $entriesToCheck),
                ]);
            }

            foreach ($entriesToCheck as $entryToCheck) {
                foreach ($htmlFields as $field) {
                    try {
                        $fieldValue = $entryToCheck->getFieldValue($field->handle);
                    } catch (\Throwable $e) {
                        continue;
                    }
                    
                    // Handle different field value types
                    if ($fieldValue instanceof \craft\redactor\FieldData) {
                        $fieldValue = $fieldValue->getRawContent();
                    } elseif (is_object($fieldValue) && method_exists($fieldValue, '__toString')) {
                        $fieldValue = (string)$fieldValue;
                    }
                    
                    if (!$fieldValue || !is_string($fieldValue)) {
                        continue;
                    }
                    
                    // Log content from entry 696's nested entries
                    if ($checkEntry->id === 696) {
                        Logger::info('Entry 696 field content', [
                            'nestedEntryId' => $entryToCheck->id,
                            'field' => $field->handle,
                            'contentLength' => strlen($fieldValue),
                            'contentPreview' => substr($fieldValue, 0, 300),
                        ]);
                    }
                    
                    // Check for any of the search patterns
                    foreach ($searchPatterns as $pattern) {
                        if ($pattern && str_contains($fieldValue, $pattern)) {
                            Logger::info('MATCH FOUND!', [
                                'parentEntryId' => $checkEntry->id,
                                'nestedEntryId' => $entryToCheck->id,
                                'field' => $field->handle,
                                'pattern' => $pattern,
                            ]);
                            $foundEntryIds[$checkEntry->id] = true;
                            break 3; // Found, move to next entry
                        }
                    }
                }
            }
        }

        return array_keys($foundEntryIds);
    }

    /**
     * Merge two arrays of entries, removing duplicates by ID
     *
     * @param array $entries1 First array of entries
     * @param array $entries2 Second array of entries
     * @return array Merged and deduplicated entries
     */
    private function mergeEntries(array $entries1, array $entries2): array
    {
        $merged = [];
        $seenIds = [];

        foreach ($entries1 as $entry) {
            if (!isset($seenIds[$entry->id])) {
                $merged[] = $entry;
                $seenIds[$entry->id] = true;
            }
        }

        foreach ($entries2 as $entry) {
            if (!isset($seenIds[$entry->id])) {
                $merged[] = $entry;
                $seenIds[$entry->id] = true;
            }
        }

        return $merged;
    }

    /**
     * Resolve nested entries to their top-level parent entries
     * For entries that don't belong to a section (e.g., Matrix block entries),
     * traverse up the owner chain to find the actual entry
     *
     * @param array $entries Array of Entry elements
     * @return array Array of top-level Entry elements (deduplicated)
     */
    private function resolveToTopLevelEntries(array $entries): array
    {
        $resolved = [];
        $seenIds = [];

        foreach ($entries as $entry) {
            // If entry has a section, it's already a top-level entry
            if ($entry->section) {
                if (!isset($seenIds[$entry->id])) {
                    $resolved[] = $entry;
                    $seenIds[$entry->id] = true;
                }
                continue;
            }

            // Traverse up the owner chain to find the top-level entry
            $current = $entry;
            $maxDepth = 10; // Safety limit to prevent infinite loops
            $depth = 0;
            $visitedIds = [$entry->id => true]; // Track visited IDs to prevent circular references

            while ($current && !$current->section && $depth < $maxDepth) {
                try {
                    $owner = $current->getOwner();
                    if ($owner instanceof Entry && !isset($visitedIds[$owner->id])) {
                        $visitedIds[$owner->id] = true;
                        $current = $owner;
                    } else {
                        break;
                    }
                } catch (\Throwable $e) {
                    Logger::warning('Error getting owner for entry', ['entryId' => $current->id, 'error' => $e->getMessage()]);
                    break;
                }
                $depth++;
            }

            // Add the resolved entry if it has a section and we haven't seen it
            if ($current && $current->section && !isset($seenIds[$current->id])) {
                $resolved[] = $current;
                $seenIds[$current->id] = true;
            }
        }

        return $resolved;
    }

    /**
     * Format entries for JSON response
     *
     * @param array $entries Array of Entry elements
     * @param mixed $currentUser The current user
     * @return array Formatted entry data
     */
    private function formatEntries(array $entries, $currentUser): array
    {
        $results = [];

        // Safety check for null user
        if (!$currentUser) {
            return $results;
        }

        foreach ($entries as $entry) {
            try {
                // Skip null entries or entries with missing sections
                if (!$entry || !$entry->section) {
                    continue;
                }

                // Admins can view all entries; others need at least view permission
                if (!$currentUser->admin && !$currentUser->can("viewEntries:{$entry->section->uid}")) {
                    continue;
                }

                // Get site info
                $site = $entry->getSite();

                $results[] = [
                    'id' => $entry->id,
                    'title' => $entry->title ?? '',
                    'url' => $entry->getCpEditUrl(),
                    'section' => [
                        'id' => $entry->section->id,
                        'name' => $entry->section->name ?? '',
                        'handle' => $entry->section->handle ?? '',
                    ],
                    'site' => $site ? [
                        'id' => $site->id,
                        'name' => $site->name,
                        'handle' => $site->handle,
                    ] : null,
                    'siteId' => $entry->siteId,
                    'status' => $entry->status ?? '',
                ];
            } catch (\Throwable $e) {
                Logger::warning('Error formatting related entry', [
                    'entryId' => $entry->id ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
                continue;
            }
        }

        return $results;
    }
}
