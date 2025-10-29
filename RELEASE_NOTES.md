Release: Chat v2

Summary
- Quick Actions bar above input (Start Mission, Play Game, Review Mistakes, View Progress)
- Slash commands: /mission, /game [topic], /progress, /quiz [topic], /goal <text>, /confused <text>
- Inline mini‑quiz in chat with feedback and persistence
- Message persistence via Supabase (user/assistant)
- Typing indicator and XP celebration messages in chat
- Missions/progress enhancements (daily/weekly sync, achievements, streak calendar)
- API hardening for chat (rate limit + prompt clamp)

Verification
- Header displays a small yellow version tag, default `v2` (configurable via `NEXT_PUBLIC_APP_VERSION`).
- Visit /chat and confirm Quick Actions and slash commands work; /quiz injects a mini‑quiz.

Deployment Notes
- Set environment variables on Vercel: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and optionally NEXT_PUBLIC_APP_VERSION.
- Clear cache on redeploy for a clean rollout.
