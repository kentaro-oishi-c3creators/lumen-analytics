#!/usr/bin/env bash
# Run in a terminal with GitHub CLI authenticated as the intended account.
set -euo pipefail
cd "$(dirname "$0")/.."
expected_actor=kentaro-oishi-c3creators
repo_name=lumen-analytics
actor=$(gh api user --jq .login)
if [[ "$actor" != "$expected_actor" ]]; then
  echo "Expected GitHub account: $expected_actor. Current: $actor." >&2
  exit 1
fi
npm ci
npm test
npm run build
if [[ ! -d .git ]]; then
  git init -b main
  git add .
  git commit -m 'Build LUMEN analytics collection and interactive SVG design story'
fi
if ! gh repo view "$expected_actor/$repo_name" --json name >/dev/null 2>&1; then
  gh repo create "$expected_actor/$repo_name" --public --description 'Five interactive analytics dashboards and an SVG design story. React, TypeScript, Recharts. Claude API ready.' --source . --remote origin
else
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/$expected_actor/$repo_name.git"
  fi
fi
remote_url=$(git remote get-url origin)
if [[ "$remote_url" != "https://github.com/$expected_actor/$repo_name.git" && "$remote_url" != "git@github.com:$expected_actor/$repo_name.git" ]]; then
  echo 'The origin remote does not match the intended new repository. Stopping.' >&2
  exit 1
fi
# Enable Pages before push so the first workflow can configure and deploy it.
if gh api "repos/$expected_actor/$repo_name/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/$expected_actor/$repo_name/pages" -f build_type=workflow >/dev/null
else
  gh api --method POST "repos/$expected_actor/$repo_name/pages" -f build_type=workflow >/dev/null
fi
git push -u origin main
printf 'Repository: https://github.com/%s/%s\n' "$expected_actor" "$repo_name"
printf 'Pages workflow: https://github.com/%s/%s/actions\n' "$expected_actor" "$repo_name"
printf 'Pages URL after a successful deployment: https://%s.github.io/%s/\n' "$expected_actor" "$repo_name"
