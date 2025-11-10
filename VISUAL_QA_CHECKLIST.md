# Visual QA Checklist - Sunny AI

## Pre-Demo Visual Verification

Use this checklist to verify all visual elements before demos or presentations.

---

## Landing Page (/) - Not Logged In

### Hero Section
- [ ] Sunny logo/sun image loads correctly
- [ ] "AI Teaching Companion" badge displays
- [ ] Headline text is readable and properly sized
- [ ] Gradient text effect works on "Sunny"
- [ ] Description text is clear
- [ ] "Get Started Free" button is prominent
- [ ] "Try Demo" button is visible
- [ ] Animated sun character floats smoothly
- [ ] No layout shift on load

### Business Model Section
- [ ] Section appears between hero and demo
- [ ] Three cards display side-by-side on desktop
- [ ] Cards stack on mobile
- [ ] Icons (🏠 🏫 🧪) display correctly
- [ ] Text is readable in all cards
- [ ] Border and shadow effects consistent
- [ ] Gradient backgrounds look good

### Demo Section
- [ ] "See Sunny in Action" headline clear
- [ ] 5 agent cards display correctly
- [ ] Agent icons (🧠 ✨ 🎯 💪 💬) visible
- [ ] Robot emoji (🤖) animates
- [ ] "Try Interactive Demo" button prominent
- [ ] Three feature cards at bottom display
- [ ] Grid layout works on all screen sizes

### Features Section
- [ ] "How It Works" headline clear
- [ ] Three feature cards display
- [ ] Icons render correctly
- [ ] Hover effects work smoothly
- [ ] Cards lift on hover
- [ ] Text is readable

### Final CTA Section
- [ ] Gradient background looks good
- [ ] "Try Sunny" headline clear
- [ ] "Get Started Free" button prominent
- [ ] Border and shadow effects work
- [ ] Text is centered

### Footer
- [ ] Sun emoji displays
- [ ] Text is readable
- [ ] Copyright year is current
- [ ] Background color contrasts well

---

## Landing Page (/) - Logged In (Welcome Screen)

### Header
- [ ] Sun emoji and "Sunny AI" text display
- [ ] Logout button visible and styled
- [ ] Border and background effects work

### Welcome Message
- [ ] Wave emoji (👋) displays
- [ ] User name appears correctly
- [ ] Gradient text effect on name works
- [ ] Streak badge displays if applicable
- [ ] Fire emoji (🔥) visible in streak

### Action Cards
- [ ] Four cards display in grid
- [ ] Emojis (📊 🌈 ✨ 💬) visible
- [ ] Cards lift on hover
- [ ] Shadow effects work
- [ ] Text is readable
- [ ] Cards are clickable

### Primary Button
- [ ] "Go to Dashboard" button prominent
- [ ] Gradient background works
- [ ] Arrow icon displays
- [ ] Hover effects smooth

### Learning Interests
- [ ] Section displays if user has interests
- [ ] Interest tags styled correctly
- [ ] Tags wrap properly on mobile

---

## Dashboard (/dashboard)

### Header
- [ ] Sunny logo displays
- [ ] "Sunny Learning OS" text clear
- [ ] User name displays
- [ ] Settings button styled
- [ ] Logout button styled
- [ ] Sticky header works on scroll

### Stats Cards
- [ ] Four stat cards display
- [ ] Gradient backgrounds work
- [ ] Numbers are large and readable
- [ ] Icons/images load correctly
- [ ] Borders and shadows consistent

### Learning Apps Launcher
- [ ] App cards display in grid
- [ ] Icons/images load
- [ ] Lock icons show for locked apps
- [ ] XP requirements visible
- [ ] Hover effects work
- [ ] Cards are clickable

### Quick Start Section
- [ ] Two quick start cards display
- [ ] Icons load correctly
- [ ] Hover effects work
- [ ] Links are clickable

### Recent Activity
- [ ] Activity items display
- [ ] Icons load correctly
- [ ] Gradient backgrounds work
- [ ] Motivational message shows
- [ ] Sunny image displays

---

## Chat Interface (/chat)

### Header
- [ ] XP and streak display
- [ ] Speaking toggle button works
- [ ] App version shows
- [ ] Sticky header works

### Agent Integration
- [ ] "AI Agents Active" indicator shows
- [ ] Green dot animates
- [ ] Progress visualization displays
- [ ] Metrics show correctly

### Emotion Selector
- [ ] Emotion buttons display
- [ ] Icons are visible
- [ ] Selected state shows
- [ ] Collapse/expand works

### Messages
- [ ] User messages align right
- [ ] Assistant messages align left
- [ ] Avatars/icons display
- [ ] Timestamps show
- [ ] Typing indicator animates
- [ ] Message bubbles styled correctly

### Input Area
- [ ] Text input is visible
- [ ] Send button displays
- [ ] Microphone button shows
- [ ] Placeholder text clear
- [ ] Input expands for long text

### Mobile Stats
- [ ] Stats bar shows on mobile
- [ ] XP and streak visible
- [ ] Speaking toggle works

---

## Teacher Dashboard (/teacher-dashboard)

### Header
- [ ] "Teacher Dashboard" title clear
- [ ] "AI-Powered Learning Management" subtitle
- [ ] Back button visible
- [ ] "Agents Active" indicator shows
- [ ] Green dot animates

### Student Selector
- [ ] Dropdown displays
- [ ] Student names visible
- [ ] Selection works

### Tab Navigation
- [ ] Four tabs display
- [ ] Icons show correctly
- [ ] Active tab highlighted
- [ ] Gradient background on active
- [ ] Shadow effects work

### Analytics Tab
- [ ] Header with gradient background
- [ ] Brain icon displays
- [ ] Four metric cards show
- [ ] Icons in cards visible
- [ ] Trend indicators (📈 📉 ➡️) show
- [ ] Learning objectives list displays
- [ ] Progress bars work
- [ ] Knowledge map grid displays
- [ ] Concept cards colored correctly
- [ ] Knowledge gaps section shows if applicable

### Content Review Tab
- [ ] Header displays
- [ ] Pending count badge shows
- [ ] Filter buttons work
- [ ] Content cards display
- [ ] Status badges colored correctly
- [ ] Review modal opens
- [ ] Modal content displays
- [ ] Action buttons work

### Configuration Tab
- [ ] Header with gradient
- [ ] Settings icon displays
- [ ] Config sections display
- [ ] Icons in sections visible
- [ ] Sliders work
- [ ] Toggles work
- [ ] Dropdowns work
- [ ] Save/reset buttons styled

### Students Tab
- [ ] Student list displays
- [ ] Avatar circles show
- [ ] Names visible
- [ ] "View Analytics" buttons work

---

## Coming Soon Modal

### Modal Display
- [ ] Modal centers on screen
- [ ] Backdrop blur works
- [ ] Modal has border and shadow
- [ ] Close button (X) visible

### Header
- [ ] Gradient background displays
- [ ] Rocket icon shows
- [ ] "Coming Soon!" text clear
- [ ] Subtitle visible

### Content
- [ ] Feature name displays
- [ ] Description text readable
- [ ] Expected date card shows (if provided)
- [ ] Calendar icon displays
- [ ] Notification card displays
- [ ] Bell icon shows

### Actions
- [ ] "Got it!" button styled
- [ ] "Try Demo Instead" button styled
- [ ] Buttons are clickable
- [ ] Hover effects work

---

## Responsive Design Checks

### Mobile (< 768px)
- [ ] All text is readable
- [ ] Buttons are tappable (min 44x44px)
- [ ] Cards stack vertically
- [ ] Images scale properly
- [ ] No horizontal scroll
- [ ] Modals fit screen
- [ ] Navigation works

### Tablet (768px - 1024px)
- [ ] Grid layouts adapt
- [ ] Text sizes appropriate
- [ ] Images scale well
- [ ] Touch targets adequate
- [ ] Spacing looks good

### Desktop (> 1024px)
- [ ] Max-width containers work
- [ ] Grid layouts use full width
- [ ] Hover effects work
- [ ] Cursor changes appropriately
- [ ] Spacing is generous

---

## Animation Checks

### Framer Motion Animations
- [ ] Page transitions smooth
- [ ] Card hover lifts work
- [ ] Fade-ins smooth
- [ ] Scale animations smooth
- [ ] No jank or stuttering

### CSS Animations
- [ ] Pulse animations work
- [ ] Spin animations smooth
- [ ] Gradient animations work
- [ ] Bounce animations smooth

### Loading States
- [ ] Loading spinners display
- [ ] Skeleton screens work (if applicable)
- [ ] Progress indicators animate
- [ ] Typing indicators animate

---

## Color & Contrast

### Text Readability
- [ ] All text meets WCAG AA (4.5:1)
- [ ] Headings are clearly darker
- [ ] Links are distinguishable
- [ ] Disabled text is visible but muted

### Button Contrast
- [ ] Primary buttons stand out
- [ ] Secondary buttons clear
- [ ] Disabled buttons obvious
- [ ] Hover states visible

### Background Contrast
- [ ] Content readable on all backgrounds
- [ ] Gradients don't obscure text
- [ ] Overlays provide enough contrast

---

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] Animations smooth
- [ ] Layout correct

### Firefox
- [ ] All features work
- [ ] Animations smooth
- [ ] Layout correct

### Safari
- [ ] All features work
- [ ] Animations smooth
- [ ] Layout correct
- [ ] Webkit-specific features work

### Edge
- [ ] All features work
- [ ] Animations smooth
- [ ] Layout correct

---

## Performance Checks

### Load Time
- [ ] Initial page load < 3s
- [ ] Images load progressively
- [ ] No layout shift (CLS < 0.1)
- [ ] Fonts load without FOIT

### Interaction
- [ ] Buttons respond immediately
- [ ] Animations don't block interaction
- [ ] Scrolling is smooth
- [ ] No lag on input

### Images
- [ ] All images optimized
- [ ] Proper sizes for screen
- [ ] Alt text present
- [ ] Lazy loading works

---

## Accessibility Checks

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] All interactive elements reachable
- [ ] Escape closes modals
- [ ] Enter activates buttons

### Screen Reader
- [ ] Headings structured correctly
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Form inputs have labels
- [ ] ARIA labels present where needed

### Color Blindness
- [ ] Information not conveyed by color alone
- [ ] Icons supplement color
- [ ] Patterns used in addition to color

---

## Final Checks

### Content
- [ ] No Lorem Ipsum text
- [ ] No placeholder images
- [ ] All copy proofread
- [ ] No broken links
- [ ] Copyright year current

### Branding
- [ ] Logo consistent
- [ ] Colors match brand
- [ ] Typography consistent
- [ ] Tone of voice consistent

### Polish
- [ ] No console errors
- [ ] No 404 errors
- [ ] No broken images
- [ ] All animations smooth
- [ ] Professional appearance

---

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Browser:** ___________________  
**Device:** ___________________  
**Screen Size:** ___________________  

**Issues Found:** ___________________  
**Status:** ☐ Pass ☐ Fail ☐ Pass with Notes  

**Notes:**
_________________________________
_________________________________
_________________________________

---

## Quick Reference: Common Issues

### If text is unreadable:
- Check color contrast
- Increase font size
- Add background overlay
- Change text color

### If buttons don't work:
- Check onClick handlers
- Verify routes exist
- Check for JavaScript errors
- Test in different browsers

### If layout breaks:
- Check responsive breakpoints
- Verify grid/flex properties
- Test on actual devices
- Check for overflow issues

### If animations stutter:
- Reduce animation complexity
- Use CSS transforms
- Check for layout thrashing
- Optimize images

---

*Use this checklist before every demo, presentation, or deployment*
