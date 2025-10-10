# BlueGO Design Guidelines

## Design Approach
**System-Based Approach** inspired by enterprise school management platforms (PowerSchool) and logistics tracking systems (UPS My Choice), emphasizing clarity, trust, and role-based efficiency. This is a utility-focused application where clear information hierarchy and touch-friendly interactions are paramount.

## Core Design Principles
1. **Role Clarity**: Each user role (parent, security, teacher, supervisor) gets distinct visual treatments and workflows
2. **Touch-First Mobile**: Large, accessible tap targets for NFC interactions and on-the-go use
3. **Real-Time Visibility**: Status indicators and live updates are prominent and unmistakable
4. **Trust & Security**: Professional color palette that conveys reliability in child safety context

## Color Palette

**Primary Colors:**
- Trust Blue: #2E5BFF (primary actions, headers, role badges)
- Success Green: #00C851 (completed deliveries, confirmation states)
- Alert Red: #FF3547 (urgent notifications, pending pickups)

**Neutrals:**
- Background: #F8F9FA (page backgrounds, card containers)
- Text Primary: #212529 (headings, critical information)
- Text Secondary: #6C757D (supporting text, timestamps)
- Border/Divider: #DEE2E6 (card borders, section separators)

**Semantic Colors:**
- Warning: #FFC107 (pending status, attention needed)
- Info: #17A2B8 (informational badges, helper text)

## Typography

**Font Stack:** Inter (primary) / Roboto (fallback) / system-ui / sans-serif

**Hierarchy:**
- Page Titles: 32px/2rem, font-bold, text-[#212529]
- Section Headers: 24px/1.5rem, font-semibold, text-[#212529]
- Card Titles: 18px/1.125rem, font-medium, text-[#212529]
- Body Text: 16px/1rem, font-normal, text-[#212529]
- Supporting Text: 14px/0.875rem, font-normal, text-[#6C757D]
- Button Text: 16px/1rem, font-medium, uppercase tracking-wide

## Layout System

**Spacing Scale:** Use Tailwind units of 4, 6, 8, 12, 16, 20 consistently
- Card padding: p-6 (24px)
- Section spacing: mb-8 (32px)
- Grid gaps: gap-6 (24px)
- Button padding: px-8 py-4

**Grid Structure:**
- Dashboard: 2-3 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Parent portal: Single column max-w-2xl for forms
- Security interface: Full-width cards with large touch targets
- Classroom displays: Full-screen grid for dismissal calls

## Component Library

**Cards:**
- Modern raised cards with subtle shadow (shadow-sm hover:shadow-md transition)
- White background (#F8F9FA), 12px rounded corners (rounded-xl)
- 24px internal padding (p-6)
- 1px border in #DEE2E6 for definition

**Buttons:**
- Primary: bg-[#2E5BFF], text-white, h-12 min-w-[140px], rounded-lg, font-medium
- Success: bg-[#00C851], text-white (for "Complete Delivery")
- Alert: bg-[#FF3547], text-white (for "Initiate Dismissal")
- Secondary: bg-transparent, border-2 border-[#2E5BFF], text-[#2E5BFF]
- Touch target minimum: 48px height for mobile

**Status Badges:**
- Pill-shaped (rounded-full), px-4 py-1, text-sm font-medium
- Active/Pending: bg-[#FFC107]/10, text-[#FFC107], border border-[#FFC107]/20
- Completed: bg-[#00C851]/10, text-[#00C851], border border-[#00C851]/20
- Alert: bg-[#FF3547]/10, text-[#FF3547], border border-[#FF3547]/20

**Forms:**
- Input fields: h-12, rounded-lg, border-2 border-[#DEE2E6], focus:border-[#2E5BFF]
- Labels: text-sm font-medium text-[#212529], mb-2
- Helper text: text-sm text-[#6C757D], mt-1
- Validation errors: text-sm text-[#FF3547], border-[#FF3547]

**Navigation:**
- Top navbar: bg-[#2E5BFF], text-white, h-16, shadow-md
- Role indicator badge in top-right corner
- Sidebar (desktop): w-64, bg-white, border-r border-[#DEE2E6]
- Mobile: Bottom nav bar with icon + label

**NFC Interaction Elements:**
- Large circular scan button: w-32 h-32, bg-[#2E5BFF], pulsing animation when active
- Scan status indicator: Real-time feedback with color transitions
- Confirmation overlay: Full-screen modal with large checkmark/student info

**Real-Time Displays:**
- Classroom screens: Full-screen grid of dismissal cards (grid-cols-2 lg:grid-cols-3)
- Auto-updating every 2 seconds without page refresh
- Large student names (text-3xl font-bold)
- Color-coded priority (new calls highlighted with #FF3547 border)

## Responsive Breakpoints
- Mobile: 320px-767px (single column, bottom nav, full-width cards)
- Tablet: 768px-1023px (2-column grid, condensed sidebar)
- Desktop: 1024px+ (3-column grid, full sidebar, optimized for web screens)

## Accessibility
- WCAG AA contrast ratios on all text (verified against backgrounds)
- Keyboard navigation for all interactive elements
- Screen reader labels for role indicators and status badges
- Focus states: 3px outline in #2E5BFF with offset
- Touch targets minimum 48x48px for mobile NFC interactions

## Images
**Hero Image:** Not applicable - this is a utility dashboard application. Replace with role-specific dashboard views immediately upon login.

**Supporting Visuals:**
- Student avatar placeholders: Circular, 64px, with gender-appropriate default icons
- School logos: Top-left navbar, max 120x40px
- Empty states: Friendly illustrations for "No students registered" or "No active dismissals"
- NFC scanner visual: Animated NFC wave icon during scan process

## Animations
Use sparingly for functional feedback only:
- Button hover: subtle scale(1.02) and shadow increase
- Card hover: shadow transition (shadow-sm to shadow-md)
- NFC scanning: pulsing ring animation (animate-pulse)
- Status changes: 300ms color fade transitions
- Dismissal call appearance: slide-in from top (duration-300)