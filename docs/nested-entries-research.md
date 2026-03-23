# Research: Nested Entries Depth in "Links To" Relations

**Date:** 2026-03-23
**Branch:** `fix/related-entries-nested-depth`
**Problem:** Entries referenced via Entries fields inside nested components (Matrix blocks, 3+ levels deep) do not appear in the "Links to" section of Related Entries.

---

## Root Causes

### 1. `relatedTo(['sourceElement' => $entry])` does NOT traverse nested entries

**Source:** `vendor/craftcms/cms/src/elements/db/ElementRelationParamParser.php` (lines 257–504)

`relatedTo` with `sourceElement` converts the element to its canonical ID and queries the `relations` table for direct relations only. It does **not** automatically follow nested entries.

The only way to include relations held by nested entries is to explicitly provide the Matrix field handle via dot-notation:

```php
Entry::find()->relatedTo([
    'sourceElement' => $entry,
    'field' => 'myMatrixHandle.nestedFieldHandle',
])
```

**Critical limitation (confirmed by docs):** The `field` parameter supports only **one level of dot-notation**. Relations inside a Matrix-within-a-Matrix (depth ≥ 2) cannot be reached this way.

---

### 2. `findEntriesLinkedInContent()` only fetches one level of nested entries

Current code in `RelatedEntriesService.php`:

```php
$nestedEntries = Entry::find()
    ->ownerId($entry->id)
    ->status(null)
    ->all();
$entriesToSearch = array_merge($entriesToSearch, $nestedEntries);
```

`ownerId($entry->id)` fetches only **direct** children (level 1). Grandchildren (level 2+) are never searched.

---

### 3. `ownerId` vs `primaryOwnerId`

**Source:** `vendor/craftcms/cms/src/base/NestedElementTrait.php` (lines 64–71, 167–246)
**Database:** `entries.primaryOwnerId` column + `elements_owners` junction table (added in migration `m230617_070415_entrify_matrix_blocks.php`)

| Property | Description | Draft behaviour |
|---|---|---|
| `ownerId` | Immediate parent in `elements_owners`. When an entry is duplicated into a draft, the draft becomes the owner. | Changes per-draft |
| `primaryOwnerId` | Root canonical owner stored in `entries.primaryOwnerId`. Always points to the original published entry, stable across drafts and revisions. | Stable |

**For finding all nested entries under an entry across drafts:** use `primaryOwnerId`.
**For finding entries owned by the current element in context (including a draft):** use `ownerId`.

Neither property supports recursive traversal — both are single-level lookups.

---

### 4. No built-in recursive traversal

There is no single Craft query parameter that fetches nested entries at all depths in one call. The documented approach requires iteration:

```php
// Level 1
$level1 = Entry::find()->ownerId($entry->id)->all();
// Level 2
$level2 = Entry::find()->ownerId(array_column($level1, 'id'))->all();
// Level N
$levelN = Entry::find()->ownerId(array_column($levelN_1, 'id'))->all();
```

---

## Current Flow (Broken for Deep Nesting)

```
getRelatedEntries($entryId)
  └─ Entry::find()->relatedTo(['sourceElement' => $entry])
       ↳ Only direct relations on $entry — nested entries EXCLUDED
  └─ findEntriesLinkedInContent($entry)
       └─ Entry::find()->ownerId($entry->id)   ← depth 1 only
            ↳ foreach $htmlFields → getFieldValue()  ← searches text/HTML fields
```

Entries fields (not CKEditor content but the Craft relations system) stored in nested Matrix entries at depth 2+ are entirely missed by both paths.

---

## Proposed Fix Strategy

### A. For the `relatedTo` path (Craft relations system)

Instead of querying only `['sourceElement' => $entry]`, collect all nested entry IDs at all depths (up to a configurable max), then query:

```php
$allNestedIds = $this->collectAllNestedEntryIds($entry->id, $maxDepth);

$outgoingEntries = Entry::find()
    ->relatedTo(['sourceElement' => array_merge([$entry], $allNestedIds)])
    ->siteId($activeSiteId)
    ->status(null)
    ->all();
```

### B. For the `findEntriesLinkedInContent` path (HTML/CKEditor text)

Replace the single `ownerId($entry->id)` call with a recursive collector:

```php
$entriesToSearch = [$entry];
$entriesToSearch = array_merge(
    $entriesToSearch,
    $this->collectAllNestedEntries($entry->id, $maxDepth)
);
```

### C. New `collectAllNestedEntryIds()` helper

```php
private function collectAllNestedEntries(int $ownerId, int $maxDepth, int $depth = 0): array
{
    if ($depth >= $maxDepth) {
        return [];
    }
    $children = Entry::find()->ownerId($ownerId)->status(null)->all();
    $all = $children;
    foreach ($children as $child) {
        $grandchildren = $this->collectAllNestedEntries($child->id, $maxDepth, $depth + 1);
        $all = array_merge($all, $grandchildren);
    }
    return $all;
}
```

**Note:** Use `ownerId` (not `primaryOwnerId`) here because we are iterating layer by layer, and each layer's direct children are owned by the layer above.

### D. Configurable max depth

Add a setting `relatedEntriesMaxDepth` (default: `3`) to `Settings.php` to avoid runaway recursion on deeply nested content.

---

## Alternative: `primaryOwnerId` shortcut

For the common case (depth 1–2), `primaryOwnerId` fetches all entries directly under a canonical entry regardless of draft state — but it does NOT give grandchildren of nested entries:

```php
Entry::find()->primaryOwnerId($entry->id)->status(null)->all();
```

This could replace `ownerId` for level 1, but it still won't reach depth 2+ because it only expresses the relation between an entry and its root owner, not intermediate nesting.

---

## Key Source Files

| File | Lines | Topic |
|---|---|---|
| `vendor/craftcms/cms/src/elements/db/ElementRelationParamParser.php` | 257–504 | `relatedTo` / `sourceElement` implementation |
| `vendor/craftcms/cms/src/elements/db/ElementRelationParamParser.php` | 366–448 | Matrix field relation subquery (one level only) |
| `vendor/craftcms/cms/src/base/NestedElementTrait.php` | 64–246 | `ownerId` / `primaryOwnerId` getters |
| `vendor/craftcms/cms/src/elements/db/NestedElementQueryTrait.php` | 200–253 | `applyNestedElementParams()` — single-level filter |
| `vendor/craftcms/cms/src/migrations/m230617_070415_entrify_matrix_blocks.php` | 39–57 | DB schema: `entries.primaryOwnerId`, `elements_owners` |

---

## Craft Docs References

- [Nested entries querying](https://craftcms.com/docs/5.x/reference/element-types/entries.html) — `owner()`, `ownerId()`, `primaryOwner()`, `primaryOwnerId()`
- [Relations — `relatedTo`](https://craftcms.com/docs/5.x/system/relations.html) — `sourceElement` scope, `field` dot-notation (one level max)
