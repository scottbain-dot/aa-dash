# Status — aa-dash

- Last worked: 2026-09-18 — Add STATUS.md and post-commit hook that keeps 'Last worked' current
- Next step: Admin overhaul PR 1 done (server-side auth, Grit tab removed, Stamps default). Next: gate getAllStudents once clash/strength-portal stop using it; Classroom B content; Workout Mode for Classroom C
- Blocked on: nothing

## Hook

`hooks/post-commit` rewrites the "Last worked" line above on every commit. Install it in a fresh clone with:

```
cp hooks/post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit
```
