# Workflow 03-A Learnings
1. Always confirm business logic with the prompt (i.e. single-lesson vs package purchases). It turned out we didn't need to touch the DB.
2. Read-only Supabase calls can be wrapped nicely in Express endpoints for UI safety.
3. Keep frontend logic generic and resilient to offline/mock modes.
