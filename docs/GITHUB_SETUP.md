# GitHub setup checklist

The repository must be created as **private** with the name `india-observed`.

## Branches

- `main`: reviewed, stable work only
- `develop`: integration branch
- `agent/*`: bounded coding-agent changes

## Main branch protection

Configure a ruleset requiring:

- pull request before merge
- at least one approval when a second reviewer is available
- conversation resolution
- required `validate` CI check
- no force pushes
- no branch deletion
- administrators included where practical
- squash or linear-history merges

## Security settings

- enable Dependabot alerts
- enable dependency graph
- enable secret scanning and push protection when available
- do not grant write access to automation that does not need it

These settings require GitHub account permissions and cannot be represented solely by committed files.
