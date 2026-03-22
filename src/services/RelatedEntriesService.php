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

        // Merge and deduplicate incoming entries
        $allIncoming = $this->mergeEntries($incomingEntries, $contentLinkedIncoming);

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
                
                // Find CKEditor hash references (most important!)
                if (preg_match_all($hashRefPattern, $fieldValue, $matches)) {
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
                
                // Find Craft reference tags (curly brace format)
                if (preg_match_all($refTagPattern, $fieldValue, $matches)) {
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
                
                // Find entry IDs in URLs
                if (preg_match_all($entryIdPattern, $fieldValue, $matches)) {
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
                
                // Find data-entry-id attributes
                if (preg_match_all($dataEntryIdPattern, $fieldValue, $matches)) {
                    foreach ($matches[1] as $id) {
                        $foundEntryIds[(int)$id] = true;
                    }
                }
            }
        }

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

        foreach ($this->searchRawContentForEntry($entry) as $entryId) {
            $foundEntryIds[$entryId] = true;
        }

        unset($foundEntryIds[$entry->id]);

        if (empty($foundEntryIds)) {
            return [];
        }

        return Entry::find()
            ->id(array_keys($foundEntryIds))
            ->status(null)
            ->all();
    }

    /**
     * Search raw database content for all patterns that reference the given entry.
     * Covers CKEditor/Redactor reference tags, data attributes, and manually typed URLs.
     * Searches elements_sites.content directly, which includes nested/Matrix entries.
     *
     * @param Entry $entry
     * @return array Entry IDs that link to this entry
     */
    private function searchRawContentForEntry(Entry $entry): array
    {
        $foundEntryIds = [];

        $rawPatterns = [
            // CKEditor hash format: #entry:708@1:url or #entry:708:url
            '#entry:' . $entry->id . '@',
            '#entry:' . $entry->id . ':',
            // Craft reference tags: {entry:708:url}, {entry:708@1:url}, {entry:708}
            '{entry:' . $entry->id . ':',
            '{entry:' . $entry->id . '@',
            '{entry:' . $entry->id . '}',
            // Data attributes
            'data-entry-id="' . $entry->id . '"',
            'data-link-entry-id="' . $entry->id . '"',
            'entry-id="' . $entry->id . '"',
        ];

        // Manually typed/pasted frontend URL (not stored as a reference tag)
        $frontendUrl = $entry->getUrl();
        if ($frontendUrl) {
            $rawPatterns[] = $frontendUrl;
        }

        // CP URL path (e.g. /entries/news/123)
        if ($entry->section) {
            $rawPatterns[] = '/entries/' . $entry->section->handle . '/' . $entry->id;
        }

        try {
            // Single OR query instead of N sequential LIKE scans
            $orConditions = ['or'];
            foreach ($rawPatterns as $pattern) {
                $orConditions[] = ['like', 'es.content', $pattern, false];
            }

            $results = (new Query())
                ->select(['es.elementId', 'e.canonicalId'])
                ->from(['es' => '{{%elements_sites}}'])
                ->innerJoin(['e' => '{{%elements}}'], '[[es.elementId]] = [[e.id]]')
                ->where($orConditions)
                ->andWhere(['e.type' => 'craft\\elements\\Entry'])
                ->all();

            foreach ($results as $row) {
                $elementId = (int)($row['canonicalId'] ?? $row['elementId']);
                if ($elementId !== $entry->id) {
                    $foundEntryIds[$elementId] = true;
                }
            }
        } catch (\Throwable $e) {
            // Silently fail - raw content search is best-effort
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
                    'title' => $entry->title ?: $entry->section->name,
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
                continue;
            }
        }

        return $results;
    }
}
