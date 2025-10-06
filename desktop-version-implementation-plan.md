# Desktop Version Implementation Plan - São Miguel Bus

## Executive Summary

This document outlines a comprehensive plan to build a full-featured desktop version of the São Miguel Bus web application. The desktop version will provide ALL features currently available in the mobile version, optimized for larger screens and desktop user experience patterns.

**Current State:** Basic desktop page with limited route search functionality that redirects mobile users or shows a simplified view.

**Target State:** Full-featured, responsive desktop application with enhanced UX for desktop users including all premium features, tracking, directions, favorites, and more.

---

## ⚠️ **CRITICAL: MOBILE VERSION REMAINS UNTOUCHED** ⚠️

**This implementation plan is EXCLUSIVELY for the desktop version. The existing mobile version will remain 100% INTACT and UNCHANGED.**

### File Structure Separation

```
/SaoMiguelBus-webapp/
├── index.html                  ← MOBILE VERSION (DO NOT TOUCH)
├── js/                         ← MOBILE VERSION (DO NOT TOUCH)
│   ├── apiHandler.js
│   ├── busTrackingHandler.js
│   ├── favoriteHandler.js
│   └── ... (all other mobile JS)
├── locales/                    ← SHARED (read-only for desktop)
│   └── *.json
├── static/                     ← SHARED (read-only for desktop)
│   ├── css/
│   ├── img/
│   └── icons/
└── desktop/                    ← DESKTOP VERSION (ALL WORK HERE)
    ├── index.html              ← NEW desktop entry point
    ├── css/
    │   ├── main.css            ← NEW desktop styles
    │   └── ...
    ├── js/
    │   ├── app.js              ← NEW desktop scripts
    │   ├── apiHandler.js       ← COPY & ADAPT from mobile
    │   └── ...
    └── components/             ← NEW desktop components
```

### Development Rules

**✅ ALLOWED:**
- Create NEW files in `/desktop/` folder
- Read from `/locales/` (shared translations)
- Read from `/static/` (shared images/icons)
- Copy mobile JS files to `/desktop/js/` and adapt them
- Reference the same API endpoints

**❌ FORBIDDEN:**
- DO NOT modify `/index.html` (mobile entry point)
- DO NOT modify `/js/*` (mobile JavaScript)
- DO NOT modify mobile styles
- DO NOT modify mobile components
- DO NOT touch service-worker.js for mobile

### How They Coexist

**Option 1: Separate Paths (Recommended)**
```
saomiguelbus.com/          → Mobile version (existing)
saomiguelbus.com/desktop/  → Desktop version (new)
```

**Option 2: Smart Detection**
```
saomiguelbus.com/  → Detects screen size:
  - < 1024px: Serve mobile (existing behavior)
  - ≥ 1024px: Redirect to /desktop/
```

**Option 3: Subdomain**
```
saomiguelbus.com          → Mobile version (existing)
desktop.saomiguelbus.com  → Desktop version (new)
```

### Shared Resources

Only these resources will be **READ** by both versions:

1. **Translation Files** (`/locales/*.json`)
   - Desktop reads, never writes
   - Mobile continues using as before

2. **Static Assets** (`/static/`)
   - Images, icons, fonts
   - Both versions can use
   - No conflicts

3. **API Endpoints**
   - Same backend API
   - Both versions call the same endpoints
   - No backend changes needed

### Premium Features

Both versions will share the same premium subscription system:

- Same Stripe integration
- Same verification endpoint
- Same cookie names (`premiumEmail`, `premiumExpiresAt`)
- Premium status syncs across both versions
- User subscribes once, works everywhere

### Testing Strategy

To ensure mobile stays intact:

1. **Before starting:** Test mobile version thoroughly, document all features
2. **During development:** Regularly test mobile version hasn't changed
3. **After completion:** Full regression test of mobile version
4. **Deployment:** Mobile version deploys independently of desktop

---

---

## 1. Application Architecture Overview

### 1.1 Current Mobile Features to Implement

#### Core Features
1. **Route Search System**
   - Origin/destination autocomplete with stop suggestions
   - Date picker (calendar-based day selection)
   - Time picker for departure time
   - Real-time route results with detailed stop information
   - Route cards with expandable intermediate stops
   - Transfer counts and total travel time
   - Like/dislike voting system for routes

2. **Step-by-Step Directions**
   - Google Maps API integration for multi-modal journeys
   - Walking + Transit combined directions
   - Interactive map with Leaflet.js showing route polylines
   - Detailed step cards with bus stops and walking instructions
   - Journey-specific tracking integration

3. **Premium Features (Subscription-Based)**
   - Ad-free experience
   - Real-time bus tracking (schedule-based estimates)
   - Pin routes for daily tracking
   - Journey-specific tracking from directions
   - Smart countdown calculations
   - Active tracking dashboard
   - Subscription management (Stripe integration)
   - Weekly (€0.50), Monthly (€1.99), Yearly (€19.99) plans

4. **Favorites System**
   - Save frequently searched routes
   - Quick access to favorite routes
   - Cookie-based persistence

5. **Offline Support**
   - Service worker with caching
   - LocalStorage + Cookie fallback for API data
   - Graceful degradation when offline
   - Cached stops and routes

6. **Internationalization (i18n)**
   - 8 languages supported (PT, EN, ES, DE, FR, IT, UK, ZH)
   - Dynamic translation system
   - Language picker modal
   - Cookie-based language preference

7. **Tours Section**
   - External tours widget integration
   - Premium ad-free viewing experience

8. **Information & Alerts**
   - Service alerts from bus companies
   - Alert modal with expandable messages
   - Multi-language support for alerts

9. **Info Section**
   - About the app
   - Contact information
   - Bus company contacts
   - Developer info and support options
   - Ticket pricing information
   - Terms and privacy policy links

10. **Analytics & Ads**
    - Umami Analytics integration
    - Google Analytics
    - Ad system for non-premium users
    - Interstitial ads
    - Bottom sticky ads
    - Inline ads between results

### 1.2 Desktop-Specific Enhancements

1. **Multi-Column Layouts**
   - Sidebar navigation instead of bottom tabs
   - Split-pane views (search + results side-by-side)
   - Dashboard view for premium tracking features

2. **Enhanced Search Experience**
   - Larger, more accessible form inputs
   - Persistent search sidebar
   - Advanced filters (optional)
   - Search history panel

3. **Better Data Visualization**
   - Larger maps with more details
   - Table view option for routes
   - Comparison view for multiple routes
   - Calendar view for schedule planning

4. **Desktop-Optimized Tracking**
   - Dashboard with multiple active trackings visible
   - Pinned routes in sidebar
   - Desktop notifications support (future)

5. **Keyboard Navigation**
   - Full keyboard shortcuts support
   - Tab navigation optimized
   - Quick search with hotkeys

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Frontend:**
- HTML5
- Tailwind CSS (continue using, better for desktop responsiveness)
- Vanilla JavaScript (maintain consistency with mobile)
- Leaflet.js for maps
- Font Awesome icons

**Backend/APIs:**
- Existing API endpoints (`api.saomiguelbus.com`)
- Google Maps Directions API (for step-by-step)
- Stripe API for payments

**Storage:**
- LocalStorage for offline data
- Cookies for preferences and premium status
- Service Worker for PWA capabilities

### 2.2 File Structure

**⚠️ IMPORTANT: All development happens in `/desktop/` folder only!**

```
/desktop/                         ← ALL NEW WORK HAPPENS HERE
├── index.html                    # NEW desktop entry point
├── css/
│   ├── main.css                 # NEW desktop-specific styles
│   ├── components.css           # NEW reusable component styles
│   ├── layout.css               # NEW layout and grid systems
│   └── responsive.css           # NEW responsive breakpoints
├── js/
│   ├── app.js                   # NEW main application initialization
│   ├── router.js                # NEW client-side routing
│   ├── apiHandler.js            # ADAPTED from /js/apiHandler.js
│   ├── searchHandler.js         # NEW route search logic
│   ├── directionsHandler.js    # ADAPTED from /js/directionsApiHandler.js
│   ├── trackingHandler.js       # ADAPTED from /js/busTrackingHandler.js
│   ├── trackingUI.js            # ADAPTED from /js/busTrackingUI.js
│   ├── favoritesHandler.js      # ADAPTED from /js/favoriteHandler.js
│   ├── premiumHandler.js        # ADAPTED from /js/adRemovalHandler.js
│   ├── offlineHandler.js        # ADAPTED from /js/offlineHandler.js
│   ├── i18n.js                  # ADAPTED from /js/i18n.js
│   ├── languageModal.js         # ADAPTED from /js/languageModal.js
│   ├── alertsHandler.js         # NEW alerts system
│   ├── toursHandler.js          # NEW tours integration
│   ├── analyticsHandler.js      # NEW analytics tracking
│   └── utils.js                 # NEW utility functions
├── components/
│   ├── navbar.html              # NEW navigation component
│   ├── sidebar.html             # NEW sidebar navigation
│   ├── searchForm.html          # NEW search form component
│   ├── routeCard.html           # NEW route result card
│   ├── trackingWidget.html      # NEW tracking widget
│   └── modals.html              # NEW modal templates
└── pages/
    ├── search.html              # NEW route search page
    ├── directions.html          # NEW step-by-step directions
    ├── tracking.html            # NEW premium tracking dashboard
    ├── tours.html               # NEW tours page
    ├── info.html                # NEW information page
    └── premium.html             # NEW premium subscription page
```

**Files that will be READ (not modified):**
```
/locales/*.json                   ← SHARED translations (read-only)
/static/**/*                      ← SHARED assets (read-only)
```

**Files that will NEVER be touched:**
```
/index.html                       ← MOBILE VERSION (DO NOT TOUCH!)
/js/**/*                          ← MOBILE VERSION (DO NOT TOUCH!)
/manifest.json                    ← MOBILE VERSION (DO NOT TOUCH!)
/service-worker.js                ← MOBILE VERSION (DO NOT TOUCH!)
/offline.html                     ← MOBILE VERSION (DO NOT TOUCH!)
```

---

## 3. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Goal:** Set up the foundation for the desktop application

**⚠️ REMEMBER: All work in `/desktop/` folder only! Mobile version stays untouched!**

#### Tasks:

1. **Setup & Preparation**
   - [ ] ✅ Verify mobile version works perfectly (baseline test)
   - [ ] Create `/desktop/` folder structure
   - [ ] Document current mobile functionality
   - [ ] Set up version control branch for desktop
   - [ ] Create `.gitignore` rules to protect mobile files

2. **Layout & Navigation**
   - [ ] Create NEW responsive desktop layout with sidebar in `/desktop/index.html`
   - [ ] Implement NEW top navigation bar
   - [ ] Create NEW sidebar component with all sections
   - [ ] Add desktop-optimized header with logo and language selector
   - [ ] Implement NEW client-side routing system
   - [ ] Add smooth page transitions

2. **Styling System**
   - [ ] Set up Tailwind CSS configuration for desktop
   - [ ] Create custom CSS variables for theming
   - [ ] Define breakpoints for desktop (1024px, 1280px, 1536px)
   - [ ] Create component library with reusable styles
   - [ ] Implement dark mode support (optional)

3. **API Integration**
   - [ ] COPY `/js/apiHandler.js` to `/desktop/js/apiHandler.js` and adapt for desktop
   - [ ] COPY `/js/offlineHandler.js` to `/desktop/js/offlineHandler.js` and adapt
   - [ ] Implement error handling and retry logic
   - [ ] Add loading states for all API calls
   - [ ] Set up offline detection and fallback
   - [ ] ⚠️ DO NOT modify original `/js/*.js` files!

4. **Internationalization**
   - [ ] COPY `/js/i18n.js` to `/desktop/js/i18n.js` and adapt
   - [ ] COPY `/js/languageModal.js` to `/desktop/js/languageModal.js` and adapt
   - [ ] READ translations from `/locales/*.json` (shared, read-only)
   - [ ] Create desktop-optimized language picker UI
   - [ ] Ensure all NEW desktop UI text is translatable
   - [ ] Test all 8 languages
   - [ ] ⚠️ DO NOT modify `/locales/*.json` files - they're shared!

**Deliverables:**
- Functional navigation system in `/desktop/`
- Working API connections for desktop
- Multi-language support reading from shared `/locales/`
- Responsive layout shell for desktop
- ✅ **Mobile version verified still working perfectly**

---

### Phase 2: Route Search Features (Week 3-4)

**Goal:** Implement core route search functionality

#### Tasks:

1. **Search Form**
   - [ ] Create desktop-optimized search form
   - [ ] Implement autocomplete for origin/destination
   - [ ] Add date picker with calendar UI
   - [ ] Add time picker with better UX
   - [ ] Implement swap button with animation
   - [ ] Add form validation with user-friendly errors
   - [ ] Add keyboard shortcuts (Enter to search, Tab navigation)

2. **Route Results Display**
   - [ ] Create route card component
   - [ ] Implement expandable intermediate stops
   - [ ] Add transfer count and travel time display
   - [ ] Implement like/dislike voting system
   - [ ] Add "no routes found" state with helpful messaging
   - [ ] Implement sort/filter options
   - [ ] Add route comparison feature (optional)

3. **Desktop Enhancements**
   - [ ] Split-pane view (search on left, results on right)
   - [ ] Sticky search form while scrolling results
   - [ ] Table view option for routes
   - [ ] Print-friendly route view
   - [ ] Export route as PDF/image (optional)

4. **Offline Support**
   - [ ] Implement service worker
   - [ ] Cache stops data
   - [ ] Offline route search with cached data
   - [ ] Show offline indicator

**Deliverables:**
- Fully functional route search
- Desktop-optimized results view
- Offline capabilities
- Enhanced UX features

---

### Phase 3: Step-by-Step Directions (Week 5-6)

**Goal:** Implement Google Maps-based multi-modal directions

#### Tasks:

1. **Directions Search**
   - [ ] Create directions search form
   - [ ] Integrate Google Maps Directions API
   - [ ] Handle multi-modal transit queries
   - [ ] Process walking + bus combinations
   - [ ] Add error handling for API failures

2. **Results Display**
   - [ ] Create journey card component
   - [ ] Display walking distance and bus distance
   - [ ] Show departure/arrival times
   - [ ] Implement expandable step details
   - [ ] Add transfer information

3. **Map Integration**
   - [ ] Integrate Leaflet.js maps
   - [ ] Display route polylines
   - [ ] Add markers for start/end points
   - [ ] Add bus stop markers
   - [ ] Different colors for walking vs transit
   - [ ] Interactive map with clickable markers

4. **Desktop Optimizations**
   - [ ] Larger map view (50% screen width)
   - [ ] Map + directions side-by-side
   - [ ] Sticky map while scrolling directions
   - [ ] Full-screen map option
   - [ ] Print-friendly directions

**Deliverables:**
- Full step-by-step directions feature
- Interactive maps
- Multi-modal journey support
- Desktop-optimized layout

---

### Phase 4: Premium Features & Tracking (Week 7-9)

**Goal:** Implement all premium subscription features

#### Tasks:

1. **Subscription System**
   - [ ] Create pricing modal with 3 plans
   - [ ] Integrate Stripe payment links
   - [ ] Implement email verification system
   - [ ] Create subscription management interface
   - [ ] Add premium badge/indicator
   - [ ] Implement cookie-based premium state
   - [ ] Add subscription expiry handling

2. **Bus Tracking System**
   - [ ] Port tracking handler from mobile
   - [ ] Create tracking UI components
   - [ ] Implement countdown calculations
   - [ ] Add active tracking dashboard
   - [ ] Create tracking disclaimer modal
   - [ ] Implement tracking limits (5 active max)
   - [ ] Add stop tracking functionality

3. **Pinned Routes**
   - [ ] Implement route pinning system
   - [ ] Create pinned routes widget
   - [ ] Add auto-tracking scheduler
   - [ ] Implement day-aware tracking
   - [ ] Create pin management interface
   - [ ] Add remove confirmation modal

4. **Journey-Specific Tracking**
   - [ ] Integrate with directions feature
   - [ ] Create journey tracking button
   - [ ] Implement journey disclaimer modal
   - [ ] Track specific departure times
   - [ ] Show progress for journeys

5. **Desktop Tracking Dashboard**
   - [ ] Create dedicated tracking page
   - [ ] Show all active tracking in cards
   - [ ] Show all pinned routes
   - [ ] Real-time countdown updates
   - [ ] Status indicators (waiting, active, completed)
   - [ ] Progress bars for active journeys
   - [ ] Quick actions (stop tracking, view details)

6. **Ad Removal**
   - [ ] Implement ad hiding for premium users
   - [ ] Update all ad placeholders
   - [ ] Show premium benefits messaging

**Deliverables:**
- Complete premium subscription system
- Bus tracking features
- Pinned routes functionality
- Desktop tracking dashboard
- Ad-free experience for premium

---

### Phase 5: Additional Features (Week 10-11)

**Goal:** Implement favorites, tours, alerts, and info sections

#### Tasks:

1. **Favorites System**
   - [ ] Create favorites handler
   - [ ] Implement add/remove favorites
   - [ ] Create favorites display section
   - [ ] Add favorite routes cards
   - [ ] Cookie-based persistence
   - [ ] Show favorites on homepage

2. **Tours Section**
   - [ ] Create tours page
   - [ ] Integrate tours widget
   - [ ] Add loading states
   - [ ] Premium ad-free viewing
   - [ ] Add fallback link

3. **Alerts System**
   - [ ] Create alerts modal
   - [ ] Fetch alerts from API
   - [ ] Display alert badge with count
   - [ ] Multi-language alert support
   - [ ] Expandable alert messages
   - [ ] Link to alert sources

4. **Info Section**
   - [ ] Create info page
   - [ ] Add about section
   - [ ] Add bus company contacts
   - [ ] Add developer contact
   - [ ] Add ticket pricing info
   - [ ] Add terms and privacy links
   - [ ] Add social media links

5. **Desktop-Specific Features**
   - [ ] Create FAQ section
   - [ ] Add help/tutorial tooltips
   - [ ] Implement keyboard shortcuts guide
   - [ ] Add accessibility features

**Deliverables:**
- Favorites system
- Tours integration
- Alerts system
- Complete info section
- Help and documentation

---

### Phase 6: Analytics, Ads & Polish (Week 12-13)

**Goal:** Finalize analytics, ads, and polish the UX

#### Tasks:

1. **Analytics Integration**
   - [ ] Integrate Umami Analytics
   - [ ] Integrate Google Analytics
   - [ ] Add event tracking for all interactions
   - [ ] Add prefix 'desktop-' to all events
   - [ ] Test analytics in production

2. **Ad System (for non-premium)**
   - [ ] Create ad banners for desktop
   - [ ] Implement top banner ads
   - [ ] Implement sidebar ads (optional)
   - [ ] Implement inline ads between results
   - [ ] Implement interstitial ads
   - [ ] Add bottom sticky ads
   - [ ] Randomize ad content
   - [ ] Track ad views and clicks

3. **Performance Optimization**
   - [ ] Optimize images and assets
   - [ ] Minify CSS and JavaScript
   - [ ] Implement lazy loading
   - [ ] Optimize API calls
   - [ ] Add caching strategies
   - [ ] Test page load speed

4. **UX Polish**
   - [ ] Add loading animations
   - [ ] Add micro-interactions
   - [ ] Improve error messages
   - [ ] Add success notifications
   - [ ] Implement toast messages
   - [ ] Add confirmation dialogs
   - [ ] Smooth transitions between pages

5. **Accessibility**
   - [ ] Add ARIA labels
   - [ ] Ensure keyboard navigation
   - [ ] Test with screen readers
   - [ ] Add focus indicators
   - [ ] Ensure color contrast
   - [ ] Add alt text to images

**Deliverables:**
- Complete analytics tracking
- Functional ad system
- Optimized performance
- Polished UX
- Accessibility compliance

---

### Phase 7: Testing & Deployment (Week 14)

**Goal:** Test thoroughly and deploy the desktop version

#### Tasks:

1. **Testing**
   - [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
   - [ ] Test all responsive breakpoints
   - [ ] Test offline functionality
   - [ ] Test all premium features
   - [ ] Test payment flow
   - [ ] Test internationalization
   - [ ] Test with real users
   - [ ] Fix bugs and issues

2. **Documentation**
   - [ ] Update README
   - [ ] Create user guide
   - [ ] Document API changes
   - [ ] Create developer documentation

3. **Deployment**
   - [ ] Set up production environment
   - [ ] Configure CDN (if needed)
   - [ ] Set up monitoring
   - [ ] Deploy to production
   - [ ] Monitor for issues

4. **Post-Launch**
   - [ ] Monitor analytics
   - [ ] Gather user feedback
   - [ ] Fix critical bugs
   - [ ] Plan future iterations

**Deliverables:**
- Fully tested application
- Complete documentation
- Production deployment
- Monitoring setup

---

## 4. Detailed Component Specifications

### 4.1 Navigation Components

#### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] São Miguel Bus              🌐 Language   👤 Premium │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Fixed position at top
- Logo and branding on left
- Language selector on right
- Premium status indicator
- Responsive collapse for smaller screens

#### Sidebar Navigation
```
┌──────────────────┐
│ 🚌 Routes        │ ← Active
│ 🗺️  Directions   │
│ 📌 My Routes     │ (Premium only)
│ 🎯 Tours         │
│ ℹ️  Info         │
└──────────────────┘
```

**Features:**
- Always visible on desktop (1024px+)
- Active state indicator
- Icons + labels
- Premium badge on premium features
- Collapsible on smaller screens

### 4.2 Search Interface

#### Split-Pane Layout
```
┌────────────────┬──────────────────────────────────┐
│                │                                  │
│  Search Form   │      Results                     │
│                │                                  │
│  [Origin]      │  ┌──────────────────────────┐   │
│  [Destination] │  │ Route Card               │   │
│  [Date]        │  │ 🚌 301                    │   │
│  [Time]        │  │ Ponta Delgada → Furnas   │   │
│                │  │ 08:00 -------- 09:30     │   │
│  [Search]      │  └──────────────────────────┘   │
│                │                                  │
│  Favorites     │  ┌──────────────────────────┐   │
│  [Favorite 1]  │  │ Route Card               │   │
│  [Favorite 2]  │  └──────────────────────────┘   │
│                │                                  │
└────────────────┴──────────────────────────────────┘
```

**Breakpoints:**
- ≥1280px: Split-pane (30% / 70%)
- 1024-1279px: Split-pane (35% / 65%)
- <1024px: Stacked layout

### 4.3 Route Card Component

```
┌─────────────────────────────────────────────────────────┐
│ 🚌 Route 301                              🔄 2 transfers│
│ ─────────────────────────────────────────────────────── │
│                                                         │
│   08:00                 1h 30m                09:30     │
│   Ponta Delgada  ─────────────────→  Furnas            │
│                                                         │
│ [▼ Show Details]          [📍 Directions]  [📌 Track]  │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│ 👍 85%  👎 15%                                          │
└─────────────────────────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────────────────────────┐
│ 🚌 Route 301                              🔄 2 transfers│
│ ─────────────────────────────────────────────────────── │
│                                                         │
│   08:00                 1h 30m                09:30     │
│   Ponta Delgada  ─────────────────→  Furnas            │
│                                                         │
│ [▲ Hide Details]          [📍 Directions]  [📌 Track]  │
│                                                         │
│ All Stops:                                              │
│ • Ponta Delgada - Terminal          08:00               │
│ • Lagoa                             08:15               │
│ • Vila Franca do Campo              08:30               │
│ • Povoação                          09:00               │
│ • Furnas                            09:30               │
│                                                         │
│ 👍 85%  👎 15%                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Premium Tracking Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ 🎖️  Premium Tracking Dashboard                          │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ Active Tracking (2)                                     │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 🚌 301: Ponta Delgada → Furnas                      ││
│ │ Status: En Route | Next: Lagoa (15 min)             ││
│ │ ████████░░░░ 65% Complete                           ││
│ │ [View Details] [Stop Tracking]                      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 🚌 205: Furnas → Ribeira Grande                     ││
│ │ Status: Waiting to Start | Departs in 1h 30m        ││
│ │ ░░░░░░░░░░░░ 0% Complete                            ││
│ │ [View Details] [Stop Tracking]                      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Pinned Routes (3)                                       │
│ ┌───────────────────────┬───────────────────────────┐  │
│ │ 🚌 301                │ 🚌 205                    │  │
│ │ Weekdays              │ Weekdays                  │  │
│ │ Next: 08:00 (30 min)  │ Next: Tomorrow 07:30      │  │
│ │ [Track Now] [Remove]  │ [Track Now] [Remove]      │  │
│ └───────────────────────┴───────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small devices (phones, < 640px) */
/* Use mobile version */

/* Medium devices (tablets, 640px - 1023px) */
@media (min-width: 640px) {
  /* Enhanced mobile layout */
}

/* Large devices (laptops, 1024px - 1279px) */
@media (min-width: 1024px) {
  /* Desktop layout starts here */
  /* Sidebar + content */
}

/* Extra large devices (desktops, 1280px - 1535px) */
@media (min-width: 1280px) {
  /* Optimal desktop layout */
  /* Split-pane views */
}

/* 2XL devices (large desktops, ≥ 1536px) */
@media (min-width: 1536px) {
  /* Maximum width container */
  /* Extra whitespace on sides */
}
```

---

## 6. API Endpoints Reference

All existing API endpoints will be reused:

### Route Search
- `GET https://api.saomiguelbus.com/api/v2/route`
  - Query params: `origin`, `destination`, `day`, `start`

### Stops
- `GET https://api.saomiguelbus.com/api/v2/stops`

### Directions
- `GET https://api.saomiguelbus.com/api/v1/gmaps`
  - Query params: `origin`, `destination`, `day`, `start`, `languageCode`, `key`, `version`

### Subscription
- `POST https://api.saomiguelbus.com/api/v1/subscription/verify/`
  - Body: `{ email, create_subscription? }`

### Ads
- `GET https://api.saomiguelbus.com/api/v1/ad`
  - Query params: `on`, `platform`
- `POST https://api.saomiguelbus.com/api/v1/ad/click`
  - Query params: `id`

### Stats
- `POST https://api.saomiguelbus.com/api/v1/stat`
  - Query params: `request`, `origin`, `destination`, `time`, `language`, `platform`, `day`

### App Data
- `GET https://api.saomiguelbus.com/api/v2/webapp/load`
  - Returns: stops, holidays, infos, routes

### Like/Dislike
- `POST https://api.saomiguelbus.com/api/v2/like/{trip_id}`
  - Query params: `type_route`, `count`
- `POST https://api.saomiguelbus.com/api/v2/dislike/{trip_id}`
  - Query params: `type_route`, `count`

---

## 7. Data Storage Strategy

### LocalStorage
```javascript
{
  // Offline data
  apiData: { stops: [], routes: [], holidays: [], infos: [] },
  
  // User preferences
  language: "pt",
  
  // Premium status (backup)
  premiumEmail: "user@example.com",
  premiumExpiresAt: "2024-12-31T23:59:59Z",
  
  // Tracking data
  busTracking: {
    activeTracking: [],
    pinnedRoutes: [],
    trackingHistory: [],
    preferences: {},
    lastCleanup: timestamp
  }
}
```

### Cookies
```
- language: User's preferred language (30 days)
- premiumEmail: Premium user email (30 days or subscription expiry)
- premiumExpiresAt: Premium subscription expiry (30 days)
- premiumLastVerified: Last verification timestamp (30 days)
- favoriteRoutes: JSON array of favorite routes (30 days)
- trackingDisclaimerAccepted: Boolean (365 days)
- vote_{trip_id}_{type}: User's vote for route (365 days)
```

### Service Worker Cache
```
- API responses (stops, routes)
- Static assets (CSS, JS, images)
- Translation files
- Offline page
```

---

## 8. Premium Feature Details

### 8.1 Subscription Plans

| Plan | Price | Duration | Free Trial | Features |
|------|-------|----------|------------|----------|
| **Weekly** | €0.50 | 7 days | No | All premium features |
| **Monthly** | €1.99 | 30 days | 14 days | All premium features + Most Popular badge |
| **Yearly** | €19.99 | 365 days | No | All premium features + Save 17% badge |

### 8.2 Premium Features List

1. **Ad-Free Experience**
   - Remove all banner ads
   - Remove interstitial ads
   - Remove sticky bottom ads
   - Remove inline ads

2. **Bus Tracking**
   - Track up to 5 routes simultaneously
   - Real-time countdown estimates
   - Status indicators (waiting, active, completed)
   - Progress bars for active journeys
   - Current stop indicator
   - Next stop predictions

3. **Pinned Routes**
   - Pin unlimited favorite routes
   - Daily tracking for pinned routes
   - Auto-tracking on specific days
   - Smart countdown calculations
   - Homepage widget display

4. **Journey Tracking**
   - Track specific journeys from directions
   - Time-based tracking (4 hours max)
   - Departure time tracking
   - Multi-transfer journey support

5. **Priority Support**
   - Direct email support
   - Faster response times

6. **Early Access**
   - Beta features access
   - Feature request priority

### 8.3 Tracking System Details

**Active Tracking:**
- Maximum 5 concurrent trackings
- Automatic expiry after 4 hours
- Real-time countdown updates (every minute)
- Status states:
  - `waiting` - Bus hasn't started yet
  - `active` - Bus is en route
  - `completed` - Route finished
  - `expired` - Tracking time limit reached

**Pinned Routes:**
- No limit on pinned routes
- Persistent across sessions
- Day-aware tracking (weekday/saturday/sunday)
- Auto-detection of route availability
- Smart countdown to next departure

**Journey Tracking:**
- Tracks specific departure time
- Based on directions search
- Shows progress through journey
- Supports multi-transfer journeys
- 4-hour maximum duration

---

## 9. Internationalization (i18n)

### 9.1 Supported Languages

1. **Portuguese (PT)** - Default
2. **English (EN)**
3. **Spanish (ES)**
4. **French (FR)**
5. **German (DE)**
6. **Italian (IT)**
7. **Ukrainian (UK)**
8. **Chinese (ZH)**

### 9.2 Translation System

All UI text must use the translation function:

```javascript
// Get translated text
const text = t('keyName');

// With fallback
const text = t('keyName', 'Fallback text');

// With placeholders
const text = t('greeting', 'Hello {name}!')
  .replace('{name}', userName);
```

### 9.3 Translation Keys Required

All translation keys from `locales/en.json` must be available. Key categories:

- **Navigation:** navBar*, banner*, pageTitle
- **Forms:** *Label, *Placeholder, *Button
- **Messages:** noRoutes*, error*, success*
- **Features:** tracking*, premium*, favorite*
- **General:** yes, no, cancel, close, save, etc.

**Machine Translation Warning:**
Display warning that non-PT/EN languages are machine-translated and may contain errors.

---

## 10. Analytics & Tracking

### 10.1 Umami Analytics Events

All events should have `data-umami-event` attribute with `desktop-` prefix:

**Navigation Events:**
```
desktop-nav-search-click
desktop-nav-directions-click
desktop-nav-tours-click
desktop-nav-info-click
desktop-language-select
```

**Search Events:**
```
desktop-input-origin
desktop-input-destination
desktop-input-date
desktop-input-time
desktop-swap-origin-destination
desktop-search-button
```

**Route Events:**
```
desktop-route-card-click
desktop-expand-route-details
desktop-like-route
desktop-dislike-route
desktop-directions-button
desktop-track-button
desktop-pin-button
```

**Premium Events:**
```
desktop-pricing-modal-open
desktop-subscribe-plan-{weekly|monthly|yearly}
desktop-verify-subscription
desktop-tracking-started
desktop-tracking-stopped
desktop-route-pinned
desktop-route-unpinned
```

**Ad Events:**
```
desktop-ad-view
desktop-ad-click
desktop-dismiss-ad
```

### 10.2 Google Analytics

Integrate `gtag.js` with:
- Page views
- Custom events
- User engagement metrics
- Conversion tracking (subscriptions)

---

## 11. Error Handling & Edge Cases

### 11.1 Network Errors

**Scenarios:**
- API timeout
- No internet connection
- API returns error response

**Handling:**
```javascript
try {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('API Error');
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Network error:', error);
  // Try offline data
  const cachedData = getOfflineData();
  if (cachedData) {
    return cachedData;
  }
  // Show user-friendly error
  showErrorMessage(t('networkError'));
}
```

### 11.2 Empty States

**No Routes Found:**
- Show friendly message
- Suggest trying different parameters
- Offer "Try Directions Instead" button
- Show popular routes as alternative

**No Favorites:**
- Show empty state with icon
- Explain how to add favorites
- Show call-to-action

**No Active Tracking:**
- Show empty state
- Explain premium feature
- Show upgrade button if not premium

### 11.3 Premium Verification Failures

**Scenarios:**
- Invalid email
- Subscription not found
- Subscription expired
- Network error during verification

**Handling:**
- Clear error messages
- Suggest contacting support
- Offer to re-subscribe
- 24-hour delay warning for new subscriptions

### 11.4 Browser Compatibility

**Minimum Requirements:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Fallbacks:**
- Polyfills for older browsers
- Graceful degradation for unsupported features
- Warning message for very old browsers

---

## 12. Performance Optimization

### 12.1 Initial Load Performance

**Target Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.0s
- Largest Contentful Paint (LCP): < 2.5s

**Optimizations:**
- Minify CSS and JavaScript
- Compress images (WebP format)
- Lazy load images and components
- Code splitting for large features
- Service Worker caching
- CDN for static assets

### 12.2 Runtime Performance

**Optimizations:**
- Debounce autocomplete searches (300ms)
- Throttle scroll events (100ms)
- Virtual scrolling for long lists
- Efficient DOM updates (avoid reflows)
- Request animation frame for animations
- Web Workers for heavy computations

### 12.3 Bundle Size

**Targets:**
- Initial bundle: < 100KB (gzipped)
- Vendor bundle: < 150KB (gzipped)
- Feature bundles: < 50KB each

**Tools:**
- Webpack Bundle Analyzer
- Lighthouse CI
- Chrome DevTools Performance

---

## 13. Accessibility (a11y)

### 13.1 WCAG 2.1 Level AA Compliance

**Requirements:**
- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Color contrast ratios (4.5:1 minimum)
- Alt text for images
- Form labels and validation
- Screen reader compatibility

### 13.2 Keyboard Navigation

**Shortcuts:**
- `Tab` / `Shift+Tab` - Navigate between elements
- `Enter` - Activate buttons and links
- `Space` - Toggle checkboxes
- `Esc` - Close modals
- `/` - Focus search input
- `Ctrl+K` - Open search (future)

### 13.3 Screen Reader Support

**Considerations:**
- Announce dynamic content changes
- Use `aria-live` for countdown timers
- Descriptive link text
- Form error announcements
- Loading state announcements

---

## 14. Testing Strategy

### 14.1 Unit Tests (Optional but Recommended)

**Framework:** Jest

**Test Coverage:**
- Utility functions
- API handlers
- Data transformations
- Tracking calculations
- i18n functions

### 14.2 Integration Tests (Optional)

**Framework:** Cypress or Playwright

**Test Scenarios:**
- Complete search flow
- Favorites add/remove
- Premium subscription flow
- Tracking activation
- Offline functionality

### 14.3 Manual Testing Checklist

**⚠️ PRIORITY: Test Mobile Version Hasn't Changed**
- [ ] ✅ Mobile version still loads at `/` (or original URL)
- [ ] ✅ All mobile features still work (search, directions, tracking, etc.)
- [ ] ✅ Mobile premium features still work
- [ ] ✅ Mobile offline mode still functions
- [ ] ✅ Mobile service worker still works
- [ ] ✅ Mobile analytics still tracking
- [ ] ✅ Mobile ads still showing (for non-premium)
- [ ] ✅ No console errors on mobile version
- [ ] ✅ Mobile performance unchanged

**Desktop Functionality:**
- [ ] All search parameters work correctly
- [ ] Routes display with correct information
- [ ] Directions integrate properly
- [ ] Premium features work after subscription
- [ ] Tracking countdowns update correctly
- [ ] Favorites persist across sessions
- [ ] Language switching works
- [ ] Offline mode functions
- [ ] All modals open and close
- [ ] Forms validate correctly

**Cross-Browser:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Responsive:**
- [ ] 1024px (iPad landscape)
- [ ] 1280px (small laptop)
- [ ] 1440px (standard desktop)
- [ ] 1920px (large desktop)
- [ ] 2560px (4K display)

**Performance:**
- [ ] Lighthouse score > 90
- [ ] Page load < 3s
- [ ] Smooth animations
- [ ] No console errors

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes
- [ ] Focus indicators visible

---

## 15. Deployment & DevOps

### 15.1 Build Process

**Steps:**
1. Minify CSS
2. Minify and bundle JavaScript
3. Optimize images
4. Generate service worker
5. Create production bundle

**Tools:**
- Webpack or Vite
- PostCSS
- Terser
- ImageOptim

### 15.2 Deployment Strategy

**⚠️ CRITICAL: Mobile version must remain accessible at its current URL!**

**Options:**

**Option 1: Separate Paths (Recommended - Safest for Mobile)**
```
saomiguelbus.com/          → Mobile version (UNCHANGED, existing)
saomiguelbus.com/desktop/  → Desktop version (NEW)
```
✅ **Best choice:** Mobile URL unchanged, zero risk to existing users

**Option 2: Smart Detection at Root**
```html
<!-- Add to current /index.html ONLY at the very top -->
<script>
  // Only redirect desktop users, mobile stays on this page
  if (window.innerWidth >= 1024 && !window.location.pathname.includes('/desktop/')) {
    window.location.href = '/desktop/';
  }
</script>
<!-- Rest of mobile index.html stays EXACTLY the same -->
```
⚠️ Requires minimal change to mobile `index.html` but keeps mobile experience intact

**Option 3: Subdomain (Complete Separation)**
```
saomiguelbus.com          → Mobile version (UNCHANGED)
desktop.saomiguelbus.com  → Desktop version (NEW domain)
```
✅ **Maximum safety:** Complete separation, zero chance of conflicts

**Option 4: Do Nothing Special**
```
saomiguelbus.com/          → Mobile version (default for all users)
saomiguelbus.com/desktop/  → Desktop version (manually accessed)
```
Users can choose, no automatic redirects, safest option

**Recommended Approach:** Start with **Option 1** (separate paths) or **Option 4** (no redirects), then optionally add **Option 2** (smart detection) later after thorough testing.

### 15.3 CDN Configuration

**Static Assets:**
- Images: CloudFlare or similar CDN
- JavaScript/CSS: CDN with fallback
- Fonts: Google Fonts or self-hosted

**Cache Headers:**
```
- HTML: no-cache
- CSS/JS: 1 year (with versioning)
- Images: 1 year
- API responses: no-cache
```

### 15.4 Monitoring

**Tools:**
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry - optional)
- Analytics (Umami + Google Analytics)
- Performance monitoring (Lighthouse CI)

**Alerts:**
- API downtime
- Error rate spike
- Performance degradation
- Premium payment issues

---

## 16. Future Enhancements (Post-Launch)

### Phase 8+: Advanced Features

1. **Desktop Notifications**
   - Browser notifications for tracked buses
   - Permission request flow
   - Notification settings

2. **Advanced Tracking**
   - Live GPS tracking (if API available)
   - Push notifications
   - Route delay predictions

3. **Social Features**
   - Share routes with friends
   - Community reviews
   - Route photos

4. **Calendar Integration**
   - Add bus trips to calendar
   - Recurring trip reminders
   - iCal export

5. **Advanced Search**
   - Multi-destination planning
   - Cheapest route option
   - Fastest route option
   - Least transfers option

6. **Accessibility++**
   - High contrast mode
   - Dyslexia-friendly font option
   - Voice search
   - Text-to-speech for routes

7. **Offline Maps**
   - Downloadable map tiles
   - Full offline routing
   - Offline directions

8. **Data Insights**
   - Most popular routes
   - Busiest times
   - Route reliability stats
   - User travel patterns

---

## 17. Success Metrics

### 17.1 Launch Goals (Month 1)

- [ ] 1,000+ unique desktop visitors
- [ ] 10% desktop-to-mobile ratio
- [ ] 50+ premium subscriptions from desktop
- [ ] < 2% error rate
- [ ] > 85 Lighthouse score
- [ ] < 5s average page load

### 17.2 Growth Goals (Month 3)

- [ ] 5,000+ unique desktop visitors
- [ ] 15% desktop-to-mobile ratio
- [ ] 200+ premium subscriptions from desktop
- [ ] 100+ daily active tracking users
- [ ] > 90 Lighthouse score
- [ ] 30%+ returning user rate

### 17.3 User Satisfaction

- [ ] < 3% bounce rate on desktop
- [ ] Average session > 5 minutes
- [ ] > 3 pages per session
- [ ] Positive user feedback
- [ ] < 1% support tickets for desktop

---

## 18. Risk Assessment & Mitigation

### 18.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **API Changes** | Medium | High | Version API, maintain backwards compatibility |
| **Browser Incompatibility** | Low | Medium | Comprehensive testing, polyfills |
| **Performance Issues** | Medium | High | Continuous monitoring, optimization |
| **Security Vulnerabilities** | Low | High | Regular security audits, HTTPS only |
| **Third-party Service Downtime** | Medium | Medium | Graceful fallbacks, error handling |

### 18.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low Desktop Adoption** | Medium | High | Marketing, SEO optimization, user education |
| **Premium Conversion** | High | High | Clear value proposition, free trial |
| **Development Delays** | Medium | Medium | Phased approach, MVP focus |
| **Maintenance Burden** | Low | Medium | Good documentation, modular code |

### 18.3 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Confusing Navigation** | Medium | High | User testing, clear labeling |
| **Feature Overload** | Medium | Medium | Progressive disclosure, onboarding |
| **Mobile User Confusion** | Low | Medium | Clear redirects, messaging |
| **Poor Accessibility** | Low | High | A11y testing, WCAG compliance |

---

## 19. Budget & Resource Estimates

### 19.1 Development Time

**Total Estimated Time:** 14 weeks (3.5 months)

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1: Core Infrastructure | 2 weeks | Medium |
| Phase 2: Route Search | 2 weeks | Medium |
| Phase 3: Directions | 2 weeks | High |
| Phase 4: Premium Features | 3 weeks | High |
| Phase 5: Additional Features | 2 weeks | Low-Medium |
| Phase 6: Analytics & Polish | 2 weeks | Medium |
| Phase 7: Testing & Deployment | 1 week | Medium |

**Assumes:** 1 full-time developer

### 19.2 Ongoing Costs

**Monthly:**
- API hosting: Existing (no additional cost)
- CDN: €0-20/month (depending on traffic)
- Monitoring: €0 (free tiers)
- Domain: Existing
- Stripe fees: 2.9% + €0.30 per transaction

**Annual:**
- None (besides transaction fees)

### 19.3 Tools & Services

**Free:**
- Umami Analytics (self-hosted)
- Google Analytics
- Leaflet.js
- Tailwind CSS
- Font Awesome (free tier)

**Paid:**
- Stripe (payment processing)
- Google Maps API (pay-per-use, already in use)

---

## 20. Mobile Version Protection Summary

### ✅ What Gets Protected (NEVER TOUCHED)

```
/index.html                    ← Mobile entry point
/js/                          ← ALL mobile JavaScript
/manifest.json                ← Mobile PWA config
/service-worker.js            ← Mobile offline functionality
/offline.html                 ← Mobile offline page
```

### 📖 What Gets Shared (READ-ONLY)

```
/locales/*.json               ← Translations (desktop reads, never writes)
/static/                      ← Images, fonts, icons (both use)
API at api.saomiguelbus.com   ← Same backend for both
```

### 🆕 What Gets Created (NEW)

```
/desktop/                     ← EVERYTHING for desktop goes here
  ├── index.html             ← New desktop entry
  ├── css/                   ← New desktop styles
  ├── js/                    ← Copied & adapted from mobile
  ├── components/            ← New desktop components
  └── pages/                 ← New desktop pages
```

### 🔒 Safety Mechanisms

1. **Separate Folders:** Desktop is completely isolated in `/desktop/`
2. **Version Control:** Use separate branch for desktop development
3. **Testing Protocol:** Test mobile after EVERY phase
4. **Deployment:** Desktop can deploy independently
5. **URL Strategy:** Mobile keeps its URL (saomiguelbus.com/)
6. **Zero Dependencies:** Desktop doesn't import mobile JS files
7. **Copy, Don't Reference:** All mobile code is COPIED to desktop and adapted

### 🚫 Forbidden Actions

**NEVER do these:**
- ❌ Modify `/index.html`
- ❌ Edit files in `/js/` folder
- ❌ Change `/manifest.json`
- ❌ Touch `/service-worker.js`
- ❌ Alter mobile styles
- ❌ Import mobile JS from desktop
- ❌ Change `/locales/*.json` files
- ❌ Redirect mobile users away from their current experience

### ✅ Required Actions

**ALWAYS do these:**
- ✅ Work only in `/desktop/` folder
- ✅ Copy mobile files to `/desktop/js/` before adapting
- ✅ Test mobile version after each phase
- ✅ Keep mobile and desktop completely separate
- ✅ Use relative paths from `/desktop/` for desktop resources
- ✅ Read shared resources (locales, static) with absolute paths
- ✅ Document any shared resource usage

### 🔄 Development Workflow

```
1. Before Starting Each Phase:
   → Test mobile version (should be perfect)
   → Document current mobile state

2. During Development:
   → Work exclusively in /desktop/
   → COPY mobile files, never edit originals
   → Test desktop features

3. After Completing Each Phase:
   → Test mobile version AGAIN (should still be perfect)
   → Verify no mobile files were touched
   → Document desktop progress

4. Before Final Deployment:
   → Full mobile regression test
   → Verify file separation
   → Test both versions independently
```

### 📊 Verification Checklist

Before deployment, verify:

- [ ] Git diff shows ZERO changes to mobile files
- [ ] `/index.html` is unchanged (unless adding optional tiny redirect script)
- [ ] `/js/` folder is unchanged
- [ ] `/manifest.json` is unchanged
- [ ] `/service-worker.js` is unchanged
- [ ] Mobile version loads and works perfectly
- [ ] Desktop version is completely in `/desktop/` folder
- [ ] No desktop code references mobile code directly
- [ ] Both versions tested independently
- [ ] Analytics tracking works for both
- [ ] Premium features work for both
- [ ] No console errors in either version

---

## 21. Conclusion & Next Steps

### 21.1 Summary

This implementation plan provides a comprehensive roadmap for building a full-featured desktop version of the São Miguel Bus web application. The plan ensures:

✅ **Mobile Protection** - Existing mobile version remains 100% INTACT and UNTOUCHED
✅ **Complete Separation** - Desktop lives in `/desktop/` folder, zero overlap with mobile
✅ **Feature Parity** - All mobile features replicated for desktop
✅ **Enhanced UX** - Desktop-optimized layouts and interactions
✅ **Premium Features** - Full tracking and subscription system
✅ **Maintainability** - Modular code, good documentation
✅ **Performance** - Optimized load times and runtime
✅ **Accessibility** - WCAG 2.1 AA compliance
✅ **Scalability** - Architecture supports future growth

**Most Important:** The mobile version will continue to work exactly as it does now. This is a new, separate desktop experience that coexists with the mobile version without interfering with it in any way.

### 21.2 Immediate Next Steps

1. **Pre-Development Verification**
   - ✅ Test mobile version thoroughly (baseline)
   - ✅ Document all current mobile features
   - ✅ Take screenshots of mobile version for reference
   - ✅ Run mobile analytics to establish baseline metrics

2. **Review & Approval**
   - Review plan with stakeholders
   - Adjust timeline if needed
   - Approve budget and resources
   - Confirm mobile protection strategy

3. **Development Setup**
   - Set up development environment
   - Create `/desktop/` folder structure
   - Create separate git branch for desktop
   - Configure build tools
   - Set up `.gitignore` rules

4. **Start Phase 1**
   - Begin core infrastructure in `/desktop/`
   - Set up layout and navigation
   - Implement routing system
   - ⚠️ Verify mobile still works after Phase 1

5. **Regular Updates**
   - Weekly progress reports
   - Demo after each phase
   - Mobile regression test after each phase
   - Gather feedback iteratively

### 21.3 Final Reminder

**🔒 THE MOBILE VERSION STAYS INTACT 🔒**

This cannot be overstated. The success of this project depends on:

1. **NOT** touching any existing mobile files
2. **ALL** work happening in `/desktop/` folder
3. **REGULAR** testing of mobile version
4. **COMPLETE** separation between mobile and desktop

If at any point during development you're about to modify a file in `/js/`, `/index.html`, or any mobile-specific file, **STOP** and reconsider. Copy it to `/desktop/` instead and adapt the copy.

### 21.4 Contact & Support

**Developer:** Sousa Dev
**Email:** info@saomiguelbus.com
**Website:** https://www.saomiguelbus.com

---

## Appendix A: Technology Reference

### Core Technologies

**HTML5**
- Semantic elements
- Form validation API
- LocalStorage API
- Service Worker API

**CSS3 / Tailwind CSS**
- Flexbox & Grid layouts
- Custom properties (variables)
- Animations & transitions
- Media queries

**JavaScript (ES6+)**
- Async/await
- Fetch API
- Modules
- Classes
- Arrow functions

**Leaflet.js**
- Interactive maps
- Markers & popups
- Polylines
- Tile layers

**Third-Party APIs**
- São Miguel Bus API
- Google Maps Directions API
- Stripe Payment API

### Browser APIs Used

- **Fetch API** - HTTP requests
- **LocalStorage** - Client-side storage
- **Service Worker** - Offline capabilities
- **History API** - Client-side routing
- **Geolocation API** - User location (future)
- **Notification API** - Browser notifications (future)

---

## Appendix B: Glossary

**PWA** - Progressive Web App, web application that works offline and can be installed

**SPA** - Single Page Application, web app that loads a single HTML page and dynamically updates

**i18n** - Internationalization, designing software to support multiple languages

**a11y** - Accessibility, designing for users with disabilities

**UX** - User Experience, overall experience a user has with a product

**API** - Application Programming Interface, set of rules for software communication

**CDN** - Content Delivery Network, distributed network of servers for faster content delivery

**SEO** - Search Engine Optimization, improving visibility in search engines

**WCAG** - Web Content Accessibility Guidelines, international standard for web accessibility

**ARIA** - Accessible Rich Internet Applications, set of attributes for accessibility

---

## Document Control

**Version:** 1.0
**Date:** October 6, 2025
**Author:** AI Assistant (Claude)
**Status:** Draft for Review
**Last Updated:** October 6, 2025

**Change Log:**
- v1.0 (2025-10-06): Initial comprehensive implementation plan created

---

**End of Implementation Plan**
