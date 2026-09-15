<?php

declare(strict_types=1);

require __DIR__ . '/support/craft-stubs.php';

use craft\elements\Entry;
use craftcms\quicksearch\controllers\RelatedEntriesController;
use craftcms\quicksearch\Plugin;
use craftcms\quicksearch\services\RelatedEntriesService;
use tests\support\Fixtures;

// Separate processes exercise both presence and absence of the optional Neo class.
$withNeo = in_array('--with-neo', $argv, true);
if ($withNeo) {
    require __DIR__ . '/support/neo-stub.php';
}

require __DIR__ . '/../src/services/RelatedEntriesService.php';
require __DIR__ . '/../src/controllers/RelatedEntriesController.php';

Craft::$app = new tests\support\App();
Fixtures::$user = (object)['admin' => true];
$service = new RelatedEntriesService();
Plugin::$instance = new class($service) {
    public function __construct(public RelatedEntriesService $relatedEntries) {}
    public function getSettings(): object { return (object)['relatedEntriesMaxDepth' => Fixtures::$maxDepth]; }
};

function check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function ids(array $entries): array
{
    $ids = array_column($entries, 'id');
    sort($ids);
    return $ids;
}

$nestedType = $withNeo ? benf\neo\elements\Block::class : Entry::class;
$root = Fixtures::add(Entry::class, 692867, section: 'articles');
$outer = Fixtures::add($nestedType, 694767, owner: $root);
$container = Fixtures::add(Entry::class, 694768, owner: $outer);
foreach ([694769 => 542477, 694770 => 543221, 694771 => 541777] as $sourceId => $targetId) {
    Fixtures::add(Entry::class, $sourceId, owner: $container);
    Fixtures::add(Entry::class, $targetId, section: 'pages');
    Fixtures::$relations[] = [$sourceId, $targetId, 2];
}
Fixtures::add(Entry::class, 540129, section: 'pages');
Fixtures::$relations[] = [$root->id, 540129, 2];
Fixtures::$relations[] = [694769, 540129, 2]; // Deduplicate a direct and nested relation.
Fixtures::$relations[] = [694769, $root->id, 2]; // Exclude outgoing self-links.

Fixtures::$maxDepth = 10;
$result = $service->getRelatedEntries($root->id, 2);
check(ids($result['outgoing']) === [540129, 541777, 542477, 543221], 'Reported three-level subtree must include all four targets.');
check(array_unique(array_column($result['outgoing'], 'siteId')) === [2], 'Results must use the selected site.');
check(str_ends_with($result['outgoing'][0]['url'], '?site=2'), 'Edit links must retain the selected site.');
check(ids($service->getRelatedEntries(542477, 2)['incoming']) === [$root->id], 'Matrix backlink must resolve through its intermediate owner to the page.');

Fixtures::$maxDepth = 2;
check(ids($service->getRelatedEntries($root->id, 2)['outgoing']) === [540129], 'Depth two must exclude third-level relations.');
Fixtures::$maxDepth = 3;
check(count($service->getRelatedEntries($root->id, 2)['outgoing']) === 4, 'Default depth three must include the reported chain.');
Fixtures::$maxDepth = 1;
Fixtures::$relations[] = [$outer->id, 542477, 2];
check(ids($service->getRelatedEntries($root->id, 2)['outgoing']) === [540129, 542477], 'Relations stored directly on a first-level block must be included.');
check(ids($service->getRelatedEntries(542477, 2)['incoming']) === [$root->id], 'Direct block and Matrix backlinks must deduplicate to one page.');

// Exercise the reverse mix as well: page -> Matrix -> Neo -> Matrix.
$other = Fixtures::add(Entry::class, 800000, section: 'articles');
$matrix = Fixtures::add(Entry::class, 800001, owner: $other);
$block = Fixtures::add($nestedType, 800002, owner: $matrix);
$leaf = Fixtures::add(Entry::class, 800003, owner: $block);
Fixtures::$relations[] = [$leaf->id, 541777, null]; // Non-translatable relations still count.
Fixtures::$maxDepth = 3;
check(ids($service->getRelatedEntries($other->id, 2)['outgoing']) === [541777], 'Matrix -> Neo -> Matrix traversal must work.');
check(ids($service->getRelatedEntries(541777, 2)['incoming']) === [692867, 800000], 'Backlinks must resolve both mixed ownership orders.');

// Same IDs, different site-specific children, relations, and rich-text content.
$primaryRoot = Fixtures::add(Entry::class, $root->id, 1, section: 'articles');
$primaryBlock = Fixtures::add($nestedType, 900001, 1, $primaryRoot);
Fixtures::add(Entry::class, 900002, 1, section: 'pages');
Fixtures::add(Entry::class, 900002, 2, section: 'pages');
Fixtures::$relations[] = [$primaryBlock->id, 900002, 1];
$primaryBlock->content['body'] = '{entry:900002:url}';
$outer->content['body'] = '{entry:543221:url}';
check(!in_array(900002, ids($service->getRelatedEntries($root->id, 2)['outgoing']), true), 'Primary-site relations and content must not leak into the selected site.');
check(ids($service->getRelatedEntries($root->id)['outgoing']) === [900002], 'Omitted site must retain the current-site fallback.');

Fixtures::add(Entry::class, 900003, section: 'pages');
$block->content['body'] = '{entry:900003:url}';
check(ids($service->getRelatedEntries($other->id, 2)['outgoing']) === [541777, 900003], 'Content links on nested blocks must load targets in the selected site.');

Fixtures::$contentMatches = [
    ['elementId' => $block->id, 'canonicalId' => null, 'siteId' => 2, 'type' => $nestedType],
    ['elementId' => $outer->id, 'canonicalId' => null, 'siteId' => 1, 'type' => $nestedType],
];
check(ids($service->getRelatedEntries(900003, 2)['incoming']) === [$other->id], 'Content matches must filter by site and resolve nested block owners.');
Fixtures::$contentMatches = [];

// Owner chains can be malformed; neither a cycle nor an orphan should produce a block as a result.
$orphan = Fixtures::add($nestedType, 910001);
$cycleA = Fixtures::add($nestedType, 910002);
$cycleB = Fixtures::add(Entry::class, 910003, owner: $cycleA);
$cycleA->owner = $cycleB;
Fixtures::$relations[] = [$orphan->id, 900003, 2];
Fixtures::$relations[] = [$cycleA->id, 900003, 2];
check($service->getRelatedEntries(900003, 2)['incoming'] === [], 'Orphans and cycles must terminate without returning nested elements.');

$controller = new RelatedEntriesController();
Fixtures::$params = ['entryId' => (string)$root->id, 'siteId' => '2'];
check(count($controller->actionIndex()->data['outgoing']) === 4, 'Controller must forward the selected site ID.');
Fixtures::$params = ['entryId' => (string)$root->id];
check(ids($controller->actionIndex()->data['outgoing']) === [900002], 'Controller must allow omitted site ID.');
Fixtures::$params['siteId'] = '';
check(ids($controller->actionIndex()->data['outgoing']) === [900002], 'Empty site ID must use the current site.');
Fixtures::$params['entryId'] = '0';
check($controller->actionIndex()->data['success'] === false, 'Invalid entry IDs must still be rejected.');

Fixtures::$user = new class {
    public bool $admin = false;
    public function can(string $permission): bool { return false; }
};
check($service->getRelatedEntries($root->id, 2) === ['outgoing' => [], 'incoming' => []], 'Section permissions must remain enforced.');
Fixtures::$user = null;
check($service->getRelatedEntries($root->id, 2) === ['outgoing' => [], 'incoming' => []], 'Anonymous requests must return no relations.');
check(Fixtures::$errors === [], 'No service exceptions expected: ' . implode('; ', Fixtures::$errors));

echo 'Related entries regression checks passed (' . ($withNeo ? 'with Neo' : 'without Neo') . ").\n";
