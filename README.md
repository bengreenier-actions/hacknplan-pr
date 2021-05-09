# hacknplan-pr

A GitHub Action to show hacknplan workitems in PR comments 🎲🃏 

See [main.yml](.github\workflows\main.yml) for an example.

```
name: HackNPlan

on:
  pull_request:
    branches: [ main ]
    types: [closed, opened, synchronize, reopened]

jobs:
  linkHAPItems:
    runs-on: ubuntu-latest
    steps:
      - name: identifyAndLink
        uses: bengreenier-actions/hacknplan-pr@v1.0.0
        with:
          ghToken: ${{ secrets.GITHUB_TOKEN }}
          apiKey: ${{ secrets.HAP_API_KEY }}
          projectId: 14921
```

## Features

- Highlights WorkItem status on PR
- Links WorkItems to PR
- Closes WorkItem's when PR merges
- Links PR in WorkItem comment when PR merges
