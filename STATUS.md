# Status — aa-dash

- Last worked: 2026-09-18 — Add STATUS.md and post-commit hook that keeps 'Last worked' current
- Next step: (fill in when the plan changes)
- Blocked on: nothing

## Hook

`hooks/post-commit` rewrites the "Last worked" line above on every commit. Install it in a fresh clone with:

```
cp hooks/post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit
```
