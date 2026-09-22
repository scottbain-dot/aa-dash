# Status — aa-dash

- Last worked: 2026-09-22 — Identity from the verified Google token on every student call; getAllStudents gated
- Next step: Redeploy the Apps Script together with merging the token PR (old pages get authRequired until reloaded). Then: Classroom B content; Workout Mode for Classroom C
- Blocked on: nothing

## Hook

`hooks/post-commit` rewrites the "Last worked" line above on every commit. Install it in a fresh clone with:

```
cp hooks/post-commit .git/hooks/post-commit && chmod +x .git/hooks/post-commit
```
