# Concepts

Shared domain vocabulary for this project: entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Sharing

### Share link

A `pod.monster` URL for a show or an episode. Its path is the path of the same page in the Pod Monster app, so the app and the site open one link at the same place.

An episode share link can carry a start time. The path encodes the feed URL, so a share link of a Private feed carries the member token of that feed. Because of this, the site keeps the feed part of the path out of its own logs, error reports, and analytics. An older site link that names a show by its Podcast Index id redirects permanently to the share link form.

### Private feed

A podcast feed whose URL carries a member token or credentials, so that anyone who has the URL can listen.

The site and the app use one rule to decide that a feed URL is private. The rule reads only the URL, so it can miss a private feed, and every share link page gets the telemetry protection whether the rule fires or not. For a feed that the rule marks private, the site sends the URL to no third-party podcast index, reads the feed directly, and asks search engines not to index the page.
