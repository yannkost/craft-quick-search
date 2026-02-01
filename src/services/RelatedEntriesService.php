<?php

declare(strict_types=1);

namespace craftcms\quicksearch\services;

use Craft;
use craft\base\Component;
use craft\elements\Entry;
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

        // Get incoming relations (entries that link to this entry)
        // This includes nested entries (e.g., in Matrix blocks), so we need to resolve them to their top-level parents
        $incomingEntries = Entry::find()
            ->relatedTo(['targetElement' => $entry])
            ->siteId($activeSiteId)
            ->status(null)
            ->all();

        // Resolve nested entries to their top-level parent entries
        $resolvedIncoming = $this->resolveToTopLevelEntries($incomingEntries);

        return [
            'outgoing' => $this->formatEntries($outgoingEntries, $currentUser),
            'incoming' => $this->formatEntries($resolvedIncoming, $currentUser),
        ];
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
