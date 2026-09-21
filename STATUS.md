# Status — aa-dash

- Last worked: 2026-09-18 — Add STATUS.md and post-commit hook that keeps 'Last worked' current
- Next step: Classroom A ships with g9-portal.html (passport, six patterns, program) and the admin Stamps tab. Next: Classroom B content, then Workout Mode for Classroom C
- Blocked on: nothing

## Hook

`hooks/post-commit` rewrites the "Last worked" line above on every commit. Install it in a fresh clone with:

```
cp hooks/post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit
```
