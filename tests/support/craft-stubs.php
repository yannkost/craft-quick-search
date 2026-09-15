<?php

declare(strict_types=1);

// Test doubles for the Craft query/application boundary. No Craft installation or database is loaded.
namespace tests\support {
    class Fixtures
    {
        public static array $elements = [];
        public static array $relations = [];
        public static array $contentMatches = [];
        public static array $queries = [];
        public static array $errors = [];
        public static int $maxDepth = 3;
        public static ?object $user;
        public static array $params = [];

        public static function add(string $type, int $id, int $siteId = 2, ?object $owner = null, ?string $section = null): object
        {
            $element = new $type();
            $element->id = $id;
            $element->siteId = $siteId;
            $element->owner = $owner;
            if ($element instanceof \craft\elements\Entry) {
                $element->section = $section ? (object)[
                    'id' => 1, 'uid' => $section, 'name' => $section, 'handle' => $section,
                ] : null;
            }
            self::$elements[] = $element;
            return $element;
        }
    }

    class ElementQuery
    {
        private array $criteria = [];

        public function __construct(private string $type) {}

        public function id($value): self { $this->criteria['id'] = (array)$value; return $this; }
        public function ownerId($value): self { $this->criteria['ownerId'] = (array)$value; return $this; }
        public function siteId($value): self { $this->criteria['siteId'] = $value; return $this; }
        public function status($value): self { return $this; }
        public function relatedTo($value): self { $this->criteria['relatedTo'] = $value; return $this; }
        public function one(): ?object { return $this->all()[0] ?? null; }

        public function all(): array
        {
            Fixtures::$queries[] = [$this->type, $this->criteria];
            // CP default is the primary site; omitted site filters must not silently pass these tests.
            $siteId = $this->criteria['siteId'] ?? 1;
            return array_values(array_filter(Fixtures::$elements, function($element) use ($siteId) {
                if (get_class($element) !== $this->type || $element->siteId !== $siteId) {
                    return false;
                }
                if (isset($this->criteria['id']) && !in_array($element->id, $this->criteria['id'], true)) {
                    return false;
                }
                if (isset($this->criteria['ownerId']) && !in_array($element->owner?->id, $this->criteria['ownerId'], true)) {
                    return false;
                }
                if (!isset($this->criteria['relatedTo'])) {
                    return true;
                }
                $relation = $this->criteria['relatedTo'];
                $sourceIds = isset($relation['sourceElement'])
                    ? array_map(fn($source) => $source->id, $relation['sourceElement']) : [];
                foreach (Fixtures::$relations as [$sourceId, $targetId, $sourceSiteId]) {
                    if ($sourceSiteId !== null && $sourceSiteId !== $siteId) {
                        continue;
                    }
                    if ($sourceIds && in_array($sourceId, $sourceIds, true) && $targetId === $element->id) {
                        return true;
                    }
                    if (isset($relation['targetElement']) && $relation['targetElement']->id === $targetId && $sourceId === $element->id) {
                        return true;
                    }
                }
                return false;
            }));
        }
    }

    class Element implements \craft\base\NestedElementInterface
    {
        public int $id;
        public int $siteId;
        public ?object $owner = null;
        public array $content = [];
        public string $title = 'Fixture';
        public string $status = 'live';

        public static function find(): ElementQuery { return new ElementQuery(static::class); }
        public function getOwner(): ?object { return $this->owner; }
        public function getFieldValue(string $handle): mixed { return $this->content[$handle] ?? null; }
        public function getUrl(): ?string { return null; }
        public function getCpEditUrl(): string { return '/admin/entries/' . $this->id . '?site=' . $this->siteId; }
        public function getSite(): object { return (object)['id' => $this->siteId, 'name' => 'Site', 'handle' => 'site' . $this->siteId]; }
        public function __get(string $name): never { throw new \LogicException('Invalid element property: ' . $name); }
    }

    class App
    {
        public function getUser(): object { return new class {
            public function getIdentity(): ?object { return Fixtures::$user; }
        }; }
        public function getSites(): object { return new class {
            public function getCurrentSite(): object { return (object)['id' => 1]; }
        }; }
        public function getFields(): object { return new class {
            public function getAllFields(): array { return [new \craft\fields\PlainText()]; }
        }; }
        public function getRequest(): object { return new class {
            public function getRequiredParam(string $name): mixed { return Fixtures::$params[$name]; }
            public function getParam(string $name): mixed { return Fixtures::$params[$name] ?? null; }
        }; }
    }
}

namespace craft\base {
    class Component {}
    interface NestedElementInterface { public function getOwner(): ?object; }
}

namespace craft\elements {
    class Entry extends \tests\support\Element { public ?object $section = null; }
}

namespace craft\fields {
    class PlainText { public string $handle = 'body'; }
}

namespace craft\db {
    class Query
    {
        private array $filters = [];
        public function select($value): self { return $this; }
        public function from($value): self { return $this; }
        public function innerJoin($table, $on): self { return $this; }
        public function where($value): self { return $this; }
        public function andWhere($value): self { $this->filters += $value; return $this; }
        public function all(): array
        {
            // Rows already matched by the database content search; only site/type filtering is modeled.
            return array_values(array_filter(\tests\support\Fixtures::$contentMatches, function($row) {
                return (!isset($this->filters['es.siteId']) || $row['siteId'] === $this->filters['es.siteId'])
                    && (!isset($this->filters['e.type']) || in_array($row['type'], (array)$this->filters['e.type'], true));
            }));
        }
    }
}

namespace craftcms\quicksearch {
    class Plugin
    {
        public static object $instance;
        public static function getInstance(): object { return self::$instance; }
    }
}

namespace craftcms\quicksearch\helpers {
    class Logger
    {
        public static function exception($message, $exception, $context = []): void
        {
            \tests\support\Fixtures::$errors[] = $message . ': ' . $exception->getMessage();
        }
    }
}

namespace craft\web {
    class Controller
    {
        public function requireAcceptsJson(): void {}
        public function asJson(array $data): \yii\web\Response { return new \yii\web\Response($data); }
    }
}

namespace yii\web {
    class Response { public function __construct(public array $data) {} }
}

namespace {
    class Craft
    {
        public static object $app;
        public static function t(string $category, string $message): string { return $message; }
    }
}
