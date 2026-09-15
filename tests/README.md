# Related Entries regression checks

Run from the repository root with PHP 8.2+ and Node.js (with `node:test` support):

```bash
composer test
```

Or run the checks directly, without Composer dependencies:

```bash
php tests/related-entries.php
php tests/related-entries.php --with-neo
node tests/related-entries-requests.test.mjs
```

The PHP checks execute the production service and controller against fixture-backed Craft query/application doubles. Separate processes cover Neo present and absent. Fixtures cover the reported subtree, both Matrix/Neo nesting orders, depth limits, direct block relations, parent deduplication, site isolation, content-link result handling, missing/cyclic owners, and section permissions.

The JavaScript checks execute both production request methods and inspect their requests, including omitted site settings and action URLs with existing query parameters.

These checks do not boot Craft or execute SQL. For a live integration check, verify the sidebar and modal on a Craft 5 installation with Neo and multiple sites: select a non-primary site, check links stored inside mixed Matrix/Neo content in both directions, and confirm that the entry edit links retain that site. Check an installation without Neo as well.
