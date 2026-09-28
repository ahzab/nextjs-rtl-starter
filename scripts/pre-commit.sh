#!/usr/bin/env bash
# pre-commit.sh — solo-scaffold: installed by bin/product-scaffold.sh.
#
# .git/hooks/ is not version-controlled, so the check logic lives here (tracked)
# and the installed hook is a one-line delegator. Same split as the solo repo's
# bin/pre-commit.sh.
#
# Deliberately cheap. This runs on EVERY commit, and a gate slow enough to be
# annoying is a gate that teaches --no-verify. The real gate is CI
# (.github/workflows/pr-checks.yml); this only catches the two things that are
# unrecoverable once pushed.
#
# Bypass with: git commit --no-verify

set -euo pipefail

fail=0
staged() { git diff --cached --name-only --diff-filter=ACM; }

# 1. Secret leak. A committed .env is not fixable by a follow-up commit — the
#    value is in the history and has to be rotated. Everything else here is
#    recoverable; this is not.
while IFS= read -r f; do
  case "$(basename "$f")" in
    .env|.env.*)
      case "$f" in
        *.example|*.sample|*.template) ;;
        *) echo "pre-commit: refusing to commit '$f' — env files hold live secrets." >&2
           echo "  If this one is genuinely safe, name it .env.example." >&2
           fail=1 ;;
      esac ;;
  esac
done < <(staged)

# 2. Lockfile desync. package.json changed but the lockfile did not, so CI
#    installs different versions than anyone ran locally. Cheap to catch here,
#    confusing to debug from a CI log.
if staged | grep -qx 'package.json'; then
  if ! staged | grep -qxE '(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)'; then
    echo "pre-commit: package.json is staged without its lockfile." >&2
    echo "  Run your package manager's install and stage the lockfile too." >&2
    fail=1
  fi
fi

exit "$fail"
