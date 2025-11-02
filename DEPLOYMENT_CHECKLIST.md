# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Audit Complete

### System Status
- ✅ Database schema migrated (Learning OS)
- ✅ Environment variables configured
- ✅ API routes implemented and tested
- ✅ AI service with production settings
- ✅ Learning Brain intelligence system
- ✅ Security headers configured
- ✅ Health check endpoint added

## 📋 Deployment Steps

### 1. Environment Variables (CRITICAL)

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

**⚠️ IMPORTANT:** 
- Use your REAL keys from `.env.local`
- Mark `SUPABASE_SERVICE_ROLE_KEY` as **Production only** (not Preview)
- All `NEXT_PUBLIC_*` variables are safe for browser

### 2. Database Setup

✅ Already done! Schema applied via `migration-to-learning-os.sql`

Verify in Supabase:
- [ ] Tables exist: `users`, `skills`, `sessions`, `question_attempts`, `notes`
- [ ] RLS policies enabled
- [ ] Views created: `student_dashboard`, `skills_for_review`

### 3. Deploy to Vercel

#### Option A: GitHub (Recommended)
```bash
# 1. Push to GitHub
git add .
git commit -m "Production ready - Learning OS complete"
git push origin main

# 2. Connect in Vercel
- Go to vercel.com/new
- Import your GitHub repo
- Add environment variables
- Deploy
```

#### Option B: Vercel CLI
```bash
# 1. Install CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### 4. Post-Deployment Verification

#### Test Health Endpoint
```bash
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "api": "ok",
    "database": "ok",
    "ai": "ok"
  }
}
```

#### Test Mission Flow
```bash
# 1. Get next mission
curl https://your-app.vercel.app/api/mission/next?userId=test-user

# 2. Grade an attempt
curl -X POST https://your-app.vercel.app/api/mission/grade \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "...",
    "userId": "test-user",
    "questionText": "What is 2+2?",
    "studentAnswer": "4",
    "timeToAnswerSeconds": 10
  }'

# 3. Get dashboard
curl https://your-app.vercel.app/api/dashboard?userId=test-user
```

#### Test Brain Analysis
```bash
curl -X POST https://your-app.vercel.app/api/brain/analyze \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'
```

### 5. Monitor Logs

In Vercel Dashboard → Deployments → [Your Deployment] → Logs

Watch for:
- ✅ Successful API calls
- ✅ Database connections
- ✅ OpenAI API calls
- ❌ Any errors or warnings

## 🔒 Security Checklist

- [x] Environment variables not committed to git
- [x] Service role key marked as Production only
- [x] Security headers configured (X-Frame-Options, etc.)
- [x] Rate limiting implemented in AI service
- [x] Input validation in all API routes
- [x] RLS policies enabled in Supabase
- [x] CORS configured (Next.js default)

## 📊 Performance Optimization

- [x] API caching configured (60s with stale-while-revalidate)
- [x] Response streaming for AI chat
- [x] Database query optimization (indexes)
- [x] AI response caching (5 min TTL)
- [x] Function memory: 1024MB
- [x] Function timeout: 30s

## 🐛 Common Issues & Fixes

### Issue: "Database not available"
**Fix:** Verify Supabase environment variables are set correctly
```bash
vercel env ls
```

### Issue: "OpenAI API key not found"
**Fix:** Ensure `OPENAI_API_KEY` is set in Vercel (not just local)

### Issue: "Build fails"
**Fix:** Check TypeScript errors
```bash
npm run typecheck
```

### Issue: "Function timeout"
**Fix:** Increase timeout in `vercel.json` (max 60s on Pro plan)

### Issue: "Rate limit exceeded"
**Fix:** AI service has built-in rate limiting (20 req/min per user)

## 📈 Monitoring Setup

### Vercel Analytics (Built-in)
- Automatic performance monitoring
- Web Vitals tracking
- Error tracking

### Recommended: Add Sentry
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Health Check Monitoring
Set up uptime monitoring (e.g., UptimeRobot) for:
```
https://your-app.vercel.app/api/health
```

## 🎯 Success Criteria

### Deployment Successful When:
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Can create a user via `/api/user`
- [ ] Can get next mission via `/api/mission/next`
- [ ] Can grade attempts via `/api/mission/grade`
- [ ] Dashboard loads with data
- [ ] Brain analysis works
- [ ] No errors in Vercel logs
- [ ] Page load time < 3s
- [ ] API response time < 2s

## 🚨 Rollback Plan

If deployment fails:

```bash
# 1. Revert to previous deployment in Vercel Dashboard
# 2. Or redeploy previous commit
vercel --prod --force

# 3. Check logs for errors
vercel logs
```

## 📝 Post-Launch Tasks

### Week 1
- [ ] Monitor error rates (target: <1%)
- [ ] Check API response times
- [ ] Verify database performance
- [ ] Test with 10 real users
- [ ] Collect initial feedback

### Week 2
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Add more monitoring
- [ ] Plan UI improvements

### Month 1
- [ ] Review costs (OpenAI + Supabase)
- [ ] Optimize token usage
- [ ] Scale if needed
- [ ] User testimonials

## 💰 Cost Estimation

### Current Setup (100 users/month)
- **Vercel Hobby**: $0 (free tier)
- **Supabase Free**: $0 (up to 500MB)
- **OpenAI**: ~$50-100/month
  - ~10 questions/session
  - ~5 sessions/user/month
  - ~$0.01-0.02 per question

### Scaling (1000 users/month)
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **OpenAI**: ~$500-1000/month

## 🎓 Production Best Practices

### DO:
- ✅ Monitor error rates daily
- ✅ Set up alerts for downtime
- ✅ Keep dependencies updated
- ✅ Backup database regularly (Supabase auto-backups)
- ✅ Test in staging before production

### DON'T:
- ❌ Commit API keys to git
- ❌ Deploy without testing
- ❌ Ignore error logs
- ❌ Skip database migrations
- ❌ Hardcode configuration

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **OpenAI Support**: https://help.openai.com

## ✅ Final Pre-Flight Check

Run this before deploying:

```bash
# 1. Build locally
npm run build

# 2. Check for errors
npm run typecheck

# 3. Test health endpoint locally
npm run dev
# Visit http://localhost:3000/api/health

# 4. Verify environment variables
cat .env.local

# 5. Commit everything
git status
git add .
git commit -m "Ready for production"

# 6. Deploy!
vercel --prod
```

## 🎉 You're Ready!

Everything is configured for production deployment. The system is:
- ✅ Secure
- ✅ Optimized
- ✅ Monitored
- ✅ Scalable

**Deploy with confidence!** 🚀

---

**Last Updated:** October 2025  
**Status:** Production Ready ✅  
**Next:** Deploy → Test → Monitor → Scale
