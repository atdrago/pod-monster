# Contributing

Pod Monster is a project primarily maintained by @atdrago and is currently transitioning to open source. Since it's still early, you may encounter a few rough edges when attempting to contribute. This document's purpose is to try to make the process as clear and easy as possible.

### [Code of Conduct](https://github.com/atdrago/pod-monster/blob/main/CODE_OF_CONDUCT.md)

Pod Monster has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct, and we expect project participants to adhere to it. Please read [the full text](https://github.com/atdrago/pod-monster/blob/main/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### Open Development

All work on Pod Monster happens directly on [GitHub](https://github.com/atdrago/pod-monster). The main contributor to the project is @atdrago. All other contributors are expected to fork the repository, create a branch, and send pull requests to the `main` branch which will go through a pull request review process by the primary maintainers.

### Semantic Versioning

Pod Monster is currently in its alpha phase. All commits to the `main` branch go directly to production and are available to end users immediately. The project's version is never incremented during this process.

Once Pod Monster leaves its alpha phase, the version will be incremented based on the rules in the [Semantic Versioning](https://semver.org/) specification.

### Conventional Commits

All commits that land on the `main` branch and PR titles are expected to follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This project uses 4 primary commit types:

- docs - A change to documentation
- chore - A change that is not user-facing
- feat - A change that is user-facing
- fix - A change that fixes something

It is generally fine to leave out commit scope, but if specified it should be as short as possible and probably falls into one of the following:

- deps - Dependency updates
- deps-dev - Development dependency updates
- ci - Anything involving CI, including changes in any GitHub workflows
- player - Changes to the media player
- search - Changes to the main page
- feed - Changes to the feed page
- episode - Changes to the episode page
- about - Changes to the about page
- settings - Changes to the settings page
- artwork - Changes to how artwork is handled

Some examples of conventional commits:

```
feat(search): Add subscribe button to search results
fix(player): Ensure video element changes when src changes
chore(deps): Bump react-query from 3.34.2 to 3.34.4
```

### Branch Organization

Submit all changes directly to the [`main`](https://github.com/atdrago/pod.monster/tree/main) branch. We don't use separate branches for development or for upcoming releases. Code that lands in `main` goes directly to production, and as such may take a long time to get merged.

### Bugs

#### Where to Find Known Issues

We are using [GitHub Issues](https://github.com/atdrago/pod.monster/issues) for our public bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.

#### Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case.

#### Security Bugs

For any security issues, please email the main project maintainer directly at atdrago@gmail.com with the subject line "Pod Monster Security".

### Proposing a Change

If you intend to change the user interface, or make any non-trivial changes to the implementation, we recommend [filing an issue](https://github.com/atdrago/pod.monster/issues/new). This lets us reach an agreement on your proposal before you put significant effort into it.

If you're only fixing a bug, it's fine to submit a pull request right away but we still recommend to file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

### Your First Pull Request

Working on your first Pull Request? You can learn how from this free video series:

**[How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)**

If you decide to fix an issue, please be sure to check the comment thread in case somebody is already working on a fix. If nobody is working on it at the moment, please leave a comment stating that you intend to work on it so other people don't accidentally duplicate your effort.

If somebody claims an issue but doesn't follow up for more than two weeks, it's fine to take it over but you should still leave a comment.

### Sending a Pull Request

The core team is monitoring for pull requests. We will review your pull request and either merge it, request changes to it, or close it with an explanation.

**Before submitting a pull request,** please make sure the following is done:

1. Fork [the repository](https://github.com/atdrago/pod.monster) and create your branch from `main`.
2. Make sure you are running Node v16+
3. Run `npm install` in the repository root.
4. ~~If you've fixed a bug or added code that should be tested, add tests!~~ _Not required until other tests are added._
5. Make sure the linter passes (`npm run lint`)
6. Make sure the build passes (`npm run build`)
7. Make sure the code is formatted [prettier](https://github.com/prettier/prettier) (`npm run format`)

### Style Guide

We use an automatic code formatter called [Prettier](https://prettier.io/).
If you don't have an extension taking care of this for you, you make need to run `npm run format` after making any changes to the code.

Then, our linter will catch most issues that may exist in your code.
You can check the status of your code styling by simply running `npm run lint`.

### License

By contributing to React, you agree that your contributions will be licensed under its MIT license.

## Attribution

This guide to contributing is adapted heavily from the React's [How to Contribute](https://reactjs.org/docs/how-to-contribute.html) guide.
