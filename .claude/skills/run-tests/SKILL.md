---
name: run-tests
description: Run this project's LWC Jest tests and optionally Apex tests in the connected org. Use when the user wants to verify their changes or when finishing an implementation task.
---

Run the project test suite.

## LWC Jest (always available, no org required)

All LWC tests:

```
npm run test:unit
```

A single component's tests:

```
npm run test:unit -- --testPathPattern=patriotSolutionsHome
```

A single test by name:

```
npm run test:unit -- -t 'should render dashboard stats'
```

## Apex (requires a connected org)

```
sf apex test run --result-format human --code-coverage --wait 10
```

## Reporting

After running, summarize:

- Pass / fail counts
- Coverage if available
- Specific failure messages and the file:line they came from

If tests fail, propose a concrete fix based on the error — do not silently rerun. If the failure looks like a flake or env issue, say so explicitly.
