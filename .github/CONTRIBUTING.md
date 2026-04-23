# Contributing to WakeLock

Thank you for your interest in contributing! Please read these guidelines carefully before opening issues or pull requests.

---

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Guide](#commit-message-guide)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Workflow](#development-workflow)

---

## Code of Conduct

Be respectful, constructive, and inclusive. We have zero tolerance for harassment of any kind.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/alarm.git
   cd alarm
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create a branch** following our naming conventions (see below)
5. **Make your changes** and add tests where applicable
6. **Run tests** to verify nothing is broken:
   ```bash
   npm test
   ```
7. **Push** your branch and open a pull request

---

## Branch Naming Conventions

Use the following prefixes when creating branches:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/snooze-alarm` |
| `fix/` | Bug fix | `fix/notification-not-firing` |
| `chore/` | Maintenance, deps, config | `chore/update-expo-sdk` |
| `docs/` | Documentation only | `docs/add-screenshots` |
| `refactor/` | Code restructure (no behavior change) | `refactor/extract-alarm-utils` |
| `test/` | Adding or fixing tests | `test/storage-service-unit` |
| `style/` | Formatting, styling | `style/alarm-card-redesign` |

**Rules:**
- Use lowercase and hyphens, no spaces or underscores
- Keep names short and descriptive (max 5 words)
- Always branch from `main`

---

## Commit Message Guide

We follow the **Conventional Commits** specification: https://www.conventionalcommits.org/

### Format
```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types
| Type | When to use |
|------|------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, missing semicolons (no logic change) |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, CI config |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |

### Examples
```bash
feat(alarms): add repeat day selection for alarms
fix(background): alarm not firing when app is killed on Android
docs(readme): add screenshots section and local dev guide
chore(deps): update expo-notifications to v0.33
refactor(storage): extract sleep calculation to alarmUtils
test(storage): add unit tests for getAlarms and toggleAlarm
```

### Rules
- Use **imperative mood** in the description ("add feature" not "added feature")
- Keep the subject line under **72 characters**
- Reference issues with `Closes #123` or `Fixes #456` in the footer
- Use the body to explain **why**, not what

---

## Pull Request Guidelines

1. **Link to an issue** — every PR should reference an open issue (`Fixes #123`)
2. **One concern per PR** — don't mix features and fixes in the same PR
3. **Write tests** — new features and bug fixes must include tests
4. **Update docs** — if your change affects usage, update the README
5. **Fill in the PR template** — don't leave sections blank
6. **Keep it small** — PRs under 400 lines of diff are much easier to review
7. **Squash before merging** — keep commit history clean

---

## Development Workflow

### Running the app
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
```

### Running tests
```bash
npm test           # Run all tests once
npm run test:watch # Run tests in watch mode
```

### Code style
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays
- `const` over `let`, never `var`

---

## Questions?

Open a [GitHub Discussion](https://github.com/krishnakudale1005-hash/alarm/discussions) or file an issue.
