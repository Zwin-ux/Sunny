# Navigation Audit & Fix Plan

## Current Navigation Map

### 1. Landing Page (`/`)

**When NOT logged in:**
- "Get Started" button → `/login` ✅ CORRECT
- "Try Demo" button → `/demo` ✅ CORRECT

**When logged in:**
- Shows 3 quick action cards:
  - "Start Learning" → `/chat` ⚠️ ISSUE: Should go to dashboard first
  - "View Dashboard" → `/dashboard` ✅ CORRECT
  - "Continue Mission" → `/chat` ⚠️ ISSUE: Should go to missions
- "Let's Go!" button → `/chat` ⚠️ ISSUE: Should go to dashboard

**PROBLEMS IDENTIFIED:**
1. Logged-in users see `/chat` links but chat might not be the best entry point
2. "Continue Mission" should go to `/missions` not `/chat`
3. Main CTA should go to `/dashboard` not `/chat`

---

### 2. Dashboard Page (`/dashboard`)

**Navigation:**
- "Try Demo" button (header) → `/demo` ✅ CORRECT
- Quick Actions:
  - "Start Chat" → `/chat` ✅ CORRECT
  - "Missions" → `/missions` ⚠️ NEEDS CREATION
  - "Progress" → `/progress` ⚠️ NEEDS CREATION
  - "Demo" → `/demo` ✅ CORRECT
- "Start Mission" button → `/missions` ⚠️ NEEDS CREATION

**PROBLEMS IDENTIFIED:**
1. `/missions` page doesn't exist yet
2. `/progress` page doesn't exist yet
3. Dashboard is linking to non-existent pages

---

### 3. Demo Flow (`/demo`)

**Flow:**
- Welcome → Quick Check → Mission → Results → Waitlist
- Results "Join Waitlist" → Calls `onContinue()` → Goes to waitlist step ✅ CORRECT
- Waitlist "Back to Home" → Should go to `/` ✅ NEEDS CHECK

---

### 4. Login Page (`/login`)

**Navigation:**
- After login → `/` ✅ CORRECT
- "Demo Mode" → `/` ✅ CORRECT
- "Sign up" link → `/signup` ✅ CORRECT

---

### 5. Signup Page (`/signup`)

**Navigation:**
- After signup → `/onboarding` ✅ CORRECT
- "Log in" link → `/login` ✅ CORRECT

---

### 6. Onboarding Page (`/onboarding`)

**Navigation:**
- After completion → `/` ✅ CORRECT

---

## Recommended Navigation Flow

### For New Users (Not Logged In):
```
Landing (/) 
  ├─ "Try Demo" → /demo (showcase experience)
  └─ "Get Started" → /login → /signup → /onboarding → / (back to landing, now logged in)
```

### For Logged-In Users:
```
Landing (/)
  └─ "Go to Dashboard" → /dashboard
      ├─ "Start Chat" → /chat
      ├─ "Missions" → /missions (needs creation)
      ├─ "Progress" → /progress (needs creation)
      └─ "Demo" → /demo
```

### Demo Flow (Anyone):
```
/demo
  ├─ Welcome
  ├─ Quick Check (3 questions)
  ├─ Mission (7 questions)
  ├─ Results (with Learning OS showcase)
  └─ Waitlist → Back to /
```

---

## Issues to Fix

### HIGH PRIORITY:

1. **Landing Page - Logged In State**
   - Change "Start Learning" card from `/chat` to `/dashboard`
   - Change "Continue Mission" card from `/chat` to `/dashboard` (then user can choose)
   - Change main CTA "Let's Go!" from `/chat` to `/dashboard`

2. **Create Placeholder Pages**
   - Create `/missions` page (placeholder for now)
   - Create `/progress` page (placeholder for now)

3. **Demo Waitlist**
   - Verify "Back to Home" button goes to `/`

### MEDIUM PRIORITY:

4. **Consistent Navigation**
   - Add header navigation to all pages
   - Add "Back to Dashboard" links where appropriate

5. **Chat Page**
   - Should have "Back to Dashboard" link
   - Currently might be orphaned

---

## Logical User Journeys

### Journey 1: New User Trying Demo
```
1. Land on / (not logged in)
2. Click "Try Demo"
3. Go through demo flow
4. Join waitlist
5. Return to / 
6. Click "Get Started"
7. Login/Signup
8. Complete onboarding
9. Return to / (now logged in)
10. See dashboard option
11. Go to /dashboard
```

### Journey 2: Returning User
```
1. Land on / (logged in)
2. See quick actions
3. Click "View Dashboard"
4. Go to /dashboard
5. Choose activity (Chat, Missions, Progress, Demo)
```

### Journey 3: Direct to Demo
```
1. Visit /demo directly
2. Complete demo
3. Join waitlist
4. Redirected to /
5. Can signup or continue browsing
```

---

## Files to Modify

1. `src/app/page.tsx` - Fix logged-in navigation
2. `src/app/demo/page.tsx` - Verify waitlist redirect
3. `src/components/demo/DemoWaitlistCTA.tsx` - Add back button
4. Create `src/app/missions/page.tsx` - Placeholder
5. Create `src/app/progress/page.tsx` - Placeholder

---

## Success Criteria

✅ All buttons lead to existing pages
✅ Logged-in users see dashboard-first navigation
✅ Demo flow has clear exit path
✅ No dead-end pages
✅ Consistent "back" navigation
✅ Clear hierarchy: Landing → Dashboard → Features
