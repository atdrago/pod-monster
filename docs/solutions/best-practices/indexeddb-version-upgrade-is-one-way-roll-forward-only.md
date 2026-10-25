---
title: An IndexedDB version upgrade is one-way, so roll forward only and guard each upgrade step
date: 2026-10-24
category: best-practices
module: Settings database upgrade (contexts/SettingsContext/SettingsContext.tsx, contexts/SettingsContext/SettingsContext.test.tsx)
problem_type: best_practice
component: database
severity: high
applies_when:
  - 'A change raises the version of an IndexedDB database, for example `pod.monster` in `SettingsContext.tsx`'
  - 'An upgrade step deletes an object store that the typed `idb` schema (`DBSchema`) no longer names'
  - 'Someone plans a rollback or a `git revert` of a commit that raises an IndexedDB version'
  - 'An `upgrade` callback must work for a new database and for each older version'
  - A developer runs builds with different database versions on one origin, for example localhost:3000
related_components: [frontend, testing_framework]
tags:
  [
    indexeddb,
    idb,
    database-upgrade,
    schema-migration,
    version-error,
    rollback,
    roll-forward,
    object-store,
  ]
---

# An IndexedDB version upgrade is one-way, so roll forward only and guard each upgrade step

## Context

The change that removes subscriptions bumps the browser IndexedDB database `pod.monster` from version 6 to version 7 (`contexts/SettingsContext/SettingsContext.tsx:90`). The new step deletes the `feedSettings` object store. It keeps `episodeSettings` (the saved play positions) and `mediaPlayerSettings` (the player state) (`SettingsContext.tsx:50-59`, `:95-98`). The app opens the database with `openDB` from `idb` 8.0.3 (`SettingsContext.tsx:332-343`).

The upgrade code is short, but the code does not show most of its rules. The first draft of the plan for this change did not name the rollback hazard. A review of the flows found it and rated it critical (session history). This doc records those rules for the next version bump. A reference such as `7880925:contexts/SettingsContext/SettingsContext.tsx:369` points to the version 6 code on `main` before the change (`git show 7880925:contexts/SettingsContext/SettingsContext.tsx`).

## Guidance

### 1. Treat a version bump as one-way, and roll forward only

After a build at version 7 serves a visitor, the database in the browser of that visitor is at version 7. A version 6 build then fails to open it:

1. The version 6 build calls `openDB('pod.monster', 6)`. `idb` passes the version directly to `indexedDB.open` (`node_modules/idb/build/index.js:168`).
2. The browser rejects a request for a version below the stored version with `VersionError` (IndexedDB spec, "open a database connection"). No `upgradeneeded` event fires, so the `upgrade` callback does not run (`index.js:170-173`).
3. `idb` rejects its promise with `request.error` (`index.js:38-39`).
4. The version 6 code catches the error and ends hydration with empty state (`7880925:contexts/SettingsContext/SettingsContext.tsx:374-375`).

The visitor then sees no saved positions and no player state. The site saves no new position, because the database ref stays `null` and each write returns early (`7880925:contexts/SettingsContext/SettingsContext.tsx:448-452`). No record is lost. The records stay in the version 7 database, and the next deploy at version 7 or higher reads them again.

The rules:

- After the version 7 build serves traffic, do not roll back to a version 6 build.
- Ship each fix as a new deploy at version 7 or higher.
- Do not `git revert` the bump commit. The revert is itself a version 6 build.
- To bring a deleted store back, add a version 8 step that creates it. Do not lower the version.

Production deploys on Vercel, where an instant rollback to an older build is possible (`docs/plans/2026-10-24-0819-feat-remove-subscriptions-plan.md`, "Assumptions"). Thus an instant rollback on Vercel also breaks this rule. Sentry shows a rollback as `settings_db_open_failed` with `{ errorName: 'VersionError', reason: 'open_failed' }` (`SettingsContext.tsx:307-313`). The test "should end hydration with empty state when the database has a newer version" models this path in Chromium (`contexts/SettingsContext/SettingsContext.test.tsx:399-432`).

### 2. Delete a store that the schema does not name through `unwrap`, not a cast

The typed `IDBPDatabase` accepts only the store names of its schema. Its `objectStoreNames` is a `TypedDOMStringList<StoreNames<DBTypes>>`, and its `deleteObjectStore` takes a `StoreNames<DBTypes>` (`node_modules/idb/build/entry.d.ts:149`, `:161`). The `PodMonsterDb` schema no longer names `feedSettings` (`SettingsContext.tsx:50-59`). Thus `database.deleteObjectStore('feedSettings')` is a type error.

The `idb` README suggests a cast for this case, `db as unknown as IDBPDatabase<MyDBV1>` (`node_modules/idb/README.md:449-482`). This project forbids `as` in production code. Call `unwrap(database)` in its place (`SettingsContext.tsx:4`, `:221`):

- `idb` gives the `upgrade` callback `wrap(request.result)` (`index.js:172`).
- `wrap` keeps the plain object in a reverse `WeakMap`, and `unwrap` reads it back from that map (`index.js:152-158`).
- The type of `unwrap` maps an `IDBPDatabase<any>` to an `IDBDatabase` (`node_modules/idb/build/wrap-idb-value.d.ts:25`).

The plain `IDBDatabase` takes any string as a store name. Keep the old store name in a named constant, for example `LEGACY_FEED_SETTINGS_STORE_NAME` (`SettingsContext.tsx:92`).

### 3. Check that the store exists before you delete it

`deleteObjectStore` throws `NotFoundError` for a store that does not exist (IndexedDB spec, `deleteObjectStore()`). A new database starts at version 0 and has no `feedSettings` store. A throw in the `upgradeneeded` handler aborts the upgrade transaction (IndexedDB spec, "upgrade a database"). `idb` does not catch a throw from the `upgrade` callback (`index.js:171-173`).

Thus a delete with no check makes the open fail with `AbortError`. The database stays at its old version, and the same error occurs on each load. Guard each delete with `objectStoreNames.contains` (`SettingsContext.tsx:223-229`). The `< 6` step uses the same guard (`SettingsContext.tsx:206-208`).

### 4. Keep each call in the upgrade synchronous

The `upgrade` callback returns `void` in the `idb` types (`entry.d.ts:13`). `idb` calls it in the `upgradeneeded` listener and drops its return value (`index.js:171-173`). A transaction closes when it has nothing left to do after the microtasks run (`node_modules/idb/README.md:171-175`). An `await` on other work thus lets the upgrade transaction commit early, and a later call in the step then fails.

Keep every call in `upgradeDatabase` synchronous (comment at `SettingsContext.tsx:193-199`). Per the plan of this change (KTD7), the upgrade sends no telemetry, because a count of the deleted records needs an async request.

### 5. Chain the steps by the old version

`upgradeDatabase` receives `oldVersion`, and runs each `if (oldVersion < N)` step in order (`SettingsContext.tsx:200-231`). The browser has one old version, so it runs only the steps above that version:

| Old version      | `< 6` step                                                                         | `< 7` step                                | Result                                                          |
| ---------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| 0 (new database) | Creates `episodeSettings` and `mediaPlayerSettings`.                               | Finds no `feedSettings`, so does nothing. | Two empty stores (`SettingsContext.test.tsx:238`).              |
| 5                | Deletes and creates again the two kept stores. Removes the old `localStorage` key. | Deletes `feedSettings`.                   | Two empty stores (`SettingsContext.test.tsx:207`, `:249`).      |
| 6                | Does not run.                                                                      | Deletes `feedSettings`.                   | Two stores with their records (`SettingsContext.test.tsx:188`). |

The `< 6` step reads `STORE_NAMES`, and that constant now holds only the two kept stores (`SettingsContext.tsx:95-98`, `:204-211`). In the version 6 code, it also held `feedSettings` (`7880925:contexts/SettingsContext/SettingsContext.tsx:125-129`). Thus a version 5 database still has `feedSettings` after the `< 6` step, and the `< 7` step deletes it. When a change edits a constant, check each older step that reads it.

### 6. Expect an old open tab to close or to block the upgrade

A new tab that opens version 7 sends a `versionchange` event to each open connection at a lower version. `idb` calls the `blocking` callback on that event (`index.js:184-186`).

- **A tab with the version 6 code** closes its connection in `blocking: closeDatabase` (`7880925:contexts/SettingsContext/SettingsContext.tsx:369`). The upgrade in the new tab then finishes with no notice. The old tab sets its database ref to `null`, so it saves nothing more (`7880925:contexts/SettingsContext/SettingsContext.tsx:319-321`). The plan of this change accepts this result as AE3. The test at `SettingsContext.test.tsx:277-289` covers it.
- **A tab with the version 5 code** does not close its connection (comment at `SettingsContext.tsx:272-275`). The open in the new tab is then blocked. `blocked: waitForAnotherTab` logs `settings_db_open_blocked` and sets `isBlockedByAnotherTab` (`SettingsContext.tsx:318-326`, `:336`). `AnotherTabNotice` then asks the visitor to close the other tab (`components/molecules/AnotherTabNotice/AnotherTabNotice.tsx:15-31`). The wait has no time limit, and hydration ends when the old tab closes (`SettingsContext.test.tsx:293-368`).

Keep `blocking: closeDatabase` in each new version (`SettingsContext.tsx:339`). The next bump then also finishes with no notice for a version 7 tab.

### 7. Test the upgrade from a real old database

- **Split each store-name constant by its role.** `OLD_STORE_NAMES` lists the stores of an old database. `UPGRADED_STORE_NAMES` lists the stores after the upgrade (`SettingsContext.test.tsx:15-20`). One constant with both roles hides the store that the upgrade deletes.
- **Build a real database at the old version.** `createVersion6Database` opens version 6 with a plain `openDB` call. It writes one record in each of the three old stores (`SettingsContext.test.tsx:121-146`). The upgrade test thus starts from the real old shape. `VERSION_6_EPISODE_KEY` keeps the old key format fixed (`SettingsContext.test.tsx:23-24`).
- **Assert the result of the upgrade.** `readDatabase` returns the store names, the record counts, and the version (`SettingsContext.test.tsx:148-159`). The upgrade test also asserts that `captureMessage` gets no call (`SettingsContext.test.tsx:204`).
- **Move each "newer version" test up by one.** These tests now open version 8 (`SettingsContext.test.tsx:400`, `:438`). An open at the current version causes no `VersionError` and no `versionchange` event. Thus each bump must move these tests to `SETTINGS_VERSION + 1`.
- **Write the upgrade test first.** Run it on the old code, and see it fail for the expected reason: the database stays at the old version with the old stores.

### 8. Delete the local database after a run of a newer build

After a run of this branch on `http://localhost:3000`, the local database is at version 7. A later run of a build at a lower version on the same origin hydrates with empty state. An example is `main` before this change merges. That build logs `VersionError`.

CAUTION: The delete removes all saved positions and the player state of that origin in that browser.

To go back, delete the `pod.monster` database in the browser developer tools:

1. In Chrome, open the "Application" panel.
2. Expand "IndexedDB", and select `pod.monster`.
3. Click "Delete database".

You can also run `indexedDB.deleteDatabase('pod.monster')` in the console of that origin.

## Why This Matters

- A rollback after a bump hides the saved positions of each upgraded visitor. The site also saves no new position until a deploy at the new version. A `git revert` of the bump looks safe, but it causes the same result.
- A throw in the upgrade breaks the database on each load for each affected visitor. Only Sentry shows it, as `settings_db_open_failed` with `AbortError`.
- An `as` cast breaks a rule of this project. `unwrap` gives a typed plain `IDBDatabase` with no cast.
- The tests catch each of these defects. A mutation check on this change (2026-10-24, not recorded in the tree) removed the store check, and 9 tests failed, the new-database test included. A second check removed the `< 7` step, and 4 tests failed.

## When to Apply

- When a change bumps `SETTINGS_VERSION` in `contexts/SettingsContext/SettingsContext.tsx`.
- When an upgrade step must delete or rename a store that the `PodMonsterDb` schema does not name.
- Before a rollback or a `git revert` of a deploy that contains a version bump.
- When a local run of an older build hydrates with empty state after a run of a newer branch.
- When Sentry shows `settings_db_open_failed` with `VersionError`, `AbortError`, or `NotFoundError`.

## Examples

The `< 7` step deletes a store that the schema does not name, with `unwrap` and a store check (`SettingsContext.tsx:220-230`):

```ts
if (oldVersion < 7) {
  const unwrappedDatabase = unwrap(database);

  if (
    unwrappedDatabase.objectStoreNames.contains(LEGACY_FEED_SETTINGS_STORE_NAME)
  ) {
    unwrappedDatabase.deleteObjectStore(LEGACY_FEED_SETTINGS_STORE_NAME);
  }
}
```

The `idb` README shows a cast for the same job (`node_modules/idb/README.md:469`). This project does not use it:

```ts
const v1Db = db as unknown as IDBPDatabase<MyDBV1>;
```

The upgrade test starts from a real version 6 database, and asserts the stores, the counts, and the version (`SettingsContext.test.tsx:188-205`):

```ts
(await createVersion6Database()).close();

const { result } = await renderHydratedSettingsContext();

expect(result.current.getEpisodeSettingsItem(EPISODE_REFERENCE)).toEqual(
  EPISODE_SETTINGS_ITEM,
);
expect(await readDatabase()).toEqual({
  counts: [1, 1],
  storeNames: UPGRADED_STORE_NAMES,
  version: 7,
});
```

The rollback test opens a database at one version above `SETTINGS_VERSION` (`SettingsContext.test.tsx:399-432`):

```ts
const newerDatabase = await openDB(DATABASE_NAME, 8, {
  upgrade(upgradeDatabase) {
    UPGRADED_STORE_NAMES.forEach((storeName) => {
      upgradeDatabase.createObjectStore(storeName);
    });
  },
});

// ...one record in each store, then close and render the provider

expect(captureMessage).toHaveBeenCalledWith(
  'settings_db_open_failed',
  expect.objectContaining({
    extra: { errorName: 'VersionError', reason: 'open_failed' },
  }),
);
```

A checklist for the next bump, to version 8:

1. Set `SETTINGS_VERSION` to 8.
2. Add an `if (oldVersion < 8)` step after the `< 7` step.
3. Keep each call in the new step synchronous.
4. Guard each delete with `objectStoreNames.contains`.
5. Use `unwrap` for a store that the schema does not name.
6. Check each older step that reads a constant that the change edits.
7. Add a `createVersion7Database` helper and an upgrade test from version 7.
8. Move the "newer version" tests from 8 to 9.
9. Put the "roll forward only" rule in the pull request body.

## Related

- `docs/plans/2026-10-24-0819-feat-remove-subscriptions-plan.md`: KTD2, KTD7, AE3, and "Operational Notes" ("Roll forward only", "Local development") are the source of these rules.
- `docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md`: KTD13 is the origin of the open handling (synchronous upgrade calls, close on `versionchange`, `VersionError` ends hydration with empty state, a blocked open waits for the old tab). That plan describes version 6 with three stores. It is a record of that change, not the current schema.
- Issue #178, "Handle IndexedDB errors": its steps delete `pod.monster` in the developer tools while the page is open.
