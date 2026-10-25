# Concepts

Shared domain vocabulary for this project: entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Sharing

### Share link

A `pod.monster` URL for a show or an episode. Its path is the path of the same page in the Pod Monster app, so the app and the site open one link at the same place.

An episode share link can carry a start time. The path encodes the feed URL, so a share link of a Private feed carries the member token of that feed. Because of this, the site keeps the feed part of the path out of its own logs, error reports, and analytics. An older site link that names a show by its Podcast Index id redirects permanently to the share link form.

### Private feed

A podcast feed whose URL carries a member token or credentials, so that anyone who has the URL can listen.

The site and the app use one rule to decide that a feed URL is private. The rule reads only the URL, so it can miss a private feed, and every share link page gets the telemetry protection whether the rule fires or not. For a feed that the rule marks private, the site sends the URL to no third-party podcast index, reads the feed directly, and asks search engines not to index the page.

## Browser storage

### Saved episode data

The play position of each episode and the state of the player, which the site keeps in the browser of each visitor, with no account.

The data stays in that one browser. Its schema has one version number. A deploy that raises the number upgrades the data of each visitor at the next open, and the change is one-way: a build with a lower number cannot open the data again. That build then shows no saved position and saves none, until a deploy at the same or a higher number. Thus a fix after such a deploy rolls forward, never back. When an open tab of an older build does not let go of the data, the upgrade waits, and the site asks the visitor to close that tab.

## Server fetches

### Feed guard

The server check that every fetch of a URL from a feed or from a visitor goes through, so that a visitor cannot make the server reach a loopback or private address.

The guard allows only `http` and `https` URLs with no credentials. It blocks a loopback name by the name itself, and blocks a host when any address of that host is private or reserved. It checks each redirect the same way, connects only to the addresses that it checked, and limits the size and the time of each read. A DNS failure that can be temporary counts as a timeout, not as a block.
