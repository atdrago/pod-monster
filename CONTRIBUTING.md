# Contributing

Pod Monster is a project primarily maintained by [@atdrago](https://github.com/atdrago) and is currently transitioning to open source. Since it's still early, you may encounter a few rough edges when attempting to contribute. This document's purpose is to try to make the process as clear and easy as possible.

### [Code of Conduct](https://github.com/atdrago/pod-monster/blob/main/CODE_OF_CONDUCT.md)

Pod Monster has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct, and we expect project participants to adhere to it. Please read [the full text](https://github.com/atdrago/pod-monster/blob/main/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### Open Development

All work on Pod Monster happens directly on [GitHub](https://github.com/atdrago/pod-monster). The main contributor to the project is [@atdrago](https://github.com/atdrago). All other contributors are expected to fork the repository, create a branch, and send pull requests to the `main` branch which will go through a pull request review process by [@atdrago](https://github.com/atdrago) and/or any other primary maintainers.

### [Semantic Versioning](https://semver.org/)

Pod Monster is currently in its alpha phase. All commits to the `main` branch go directly to production and are available to end users immediately. The project's version is never incremented during this process.

Once Pod Monster leaves its alpha phase, the version will be incremented based on the rules in the [Semantic Versioning](https://semver.org/) specification.

### [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

All commits that land on the `main` branch and PR titles are expected to follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification, and the message should be in [imperative mood](https://en.wikipedia.org/wiki/Imperative_mood). In general, you should be able to put your commit message into the blank space in the following sentence, and it should make sense: "If I merge this PR, it will **\_**." For example, if I added a "Subscribe" button to each search result item, I may be tempted to make my commit message "Added subscribe button to search result items", but completing the above sentece with this commit message will not make sense: "If I merge this PR, it will _added subscribe button to search result items_". Instead, "Added" should be changed to "Add", like so: "Add subscribe button to search result items", and now this sentence is easier to read: "If I merge this PR, it will _add subscribe button to search result items_"

Below is a template and some examples to use when writing acceptable commit messages.

Note that commits are easy to squash together and their messages easy to change, so don't worry too much about getting this correct on your first couple of PRs.

#### **Commit Message Template**

```
type(scope): Short specific message describing the change
```

#### **Commit Message Examples**

```
feat(search): Add subscribe button to search results
fix(player): Ensure video element changes when src changes
chore(deps): Bump react-query from 3.34.2 to 3.34.4
```

#### **Commit Message `type`**

This project uses 4 primary commit `type`s:

- docs - A change to documentation
- fix - A change that fixes something
- feat - A change that is user-facing
- chore - A change that is not user-facing

#### **Commit Message `scope`**

It is generally fine to leave out commit `scope`, but if specified it should be as short as possible and probably falls into one of the following:

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

### Branch Organization

Submit all changes directly to the [`main`](https://github.com/atdrago/pod.monster/tree/main) branch. We don't use separate branches for development or for upcoming releases. Code that lands in `main` goes directly to production, and as such may take a long time to get merged.

### Bugs

#### Where to Find Known Issues

We are using [GitHub Issues](https://github.com/atdrago/pod.monster/issues) for our public bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.

#### Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case.

#### Security Bugs

Please use [GitHub Issues](https://github.com/atdrago/pod.monster/issues) to report all security issues. Please **do not** add any sensitive or potentially sensitive information in a GitHub Issue. If it is absolutely necessary to include sensitive information as part of the bug report, please email the main project maintainer directly at atdrago@gmail.com with the subject line "Pod Monster Security", and reference the GitHub Issue within the body for further instructions.

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
7. Make sure the code is formatted (`npm run format`)

### Style Guide

In general, all changes related to formatting or linting should be caught by Prettier or ESLint prior to the pull request being made, however there are automatic checks that happen for every PR as well. If a human reviewer requests a stylistic (formatting or linting) change to a PR, a suitable linting or formatting rule should be agreed upon and be added to the appropriate configuration file, or otherwise should not be requested.

#### Formatting with Prettier

We use an automatic code formatter called [Prettier](https://prettier.io/) and recommend that you use [an extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) to take care of formatting code for you on save. If you don't have this setup, please run `npm run format` after making any changes to the code.

#### Linting with ESLint

Then, our linter will catch most issues that may exist in your code.
You can check the status of your code styling by simply running `npm run lint`.

### License

By contributing to React, you agree that your contributions will be licensed under its MIT license.

## Attribution

This guide to contributing is adapted heavily from React's [How to Contribute](https://reactjs.org/docs/how-to-contribute.html) guide.
