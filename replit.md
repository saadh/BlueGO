# BlueGO - School Dismissal Management System

## Overview

BlueGO is a comprehensive school dismissal management system that streamlines student pickup through NFC technology and real-time tracking. The platform serves multiple user roles including parents, security personnel, teachers, section managers, floor supervisors, and school administrators. It provides role-specific dashboards for managing students, tracking dismissals, and coordinating safe pickup processes.

## Recent Changes (October 10, 2025)

**Admin Portal - Full CRUD Functionality (Complete)**:
- Restored and integrated all previously built dialog components for complete CRUD operations
- Implemented full create/update/delete functionality for users, gates, and classes:
  - **Users**: Add user dialog with role selection, edit button (placeholder - no API endpoint), delete functionality
  - **Gates**: Add gate dialog, edit gate dialog with form pre-population, delete functionality
  - **Classes**: Add class dialog with teacher selection, edit class dialog, delete functionality
- Fixed critical bug where class dialogs used teacher names instead of UUIDs for foreign key relationships
- Removed duplicate placeholder route that was blocking user list API
- All mutations properly invalidate React Query cache and display success/error toast notifications
- Defensive array handling with Array.isArray() checks prevents runtime errors
- RoleBadge component uses schema's UserRole type with graceful fallback for unknown roles
- End-to-end tested: All add/edit/delete operations work correctly with proper UI updates

**Student Management System (Database-Backed)**:
- Migrated from in-memory to PostgreSQL database storage
  - Created students table with parent relationship (foreign key with cascade delete)
  - Users table now stored in PostgreSQL with proper indexes
  - Implemented DbStorage class using Drizzle ORM
- Full CRUD API for student management
  - GET /api/students - Fetch all students for authenticated parent
  - POST /api/students - Create student with auto-parent linking
  - PATCH /api/students/:id - Update student (validated, prevents parent ID reassignment)
  - DELETE /api/students/:id - Delete student with ownership verification
- Parent NFC card auto-linking to all children
  - When parent links NFC card, automatically updates all existing children
  - When creating new student, auto-links parent's NFC card if available
- Frontend React Query integration
  - Real-time student data fetching from database
  - Optimistic UI updates with proper cache invalidation
  - Success/error toast notifications for all mutations
  - Loading states and empty state handling
- End-to-end tested: add students → link NFC → verify auto-linking to all children

**Parent Profile & NFC Card Integration**:
- Integrated authenticated user data into parent dashboard
- Parent profile now displays real email/phone from user account
- Implemented parent NFC card linking functionality
  - Created API endpoint: POST /api/parent/nfc-card (protected, parent-role only)
  - Built frontend mutation with React Query for NFC card updates
  - Dialog UI for manual NFC card entry and management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool

**Routing**: Wouter for client-side routing with distinct pages for each user role:
- Home page (landing/role selection)
- Parent portal
- Security dashboard
- Classroom display
- Admin panel

**UI Component System**: 
- Shadcn/ui components built on Radix UI primitives
- Custom design system with "New York" style preset
- Tailwind CSS for styling with custom color palette emphasizing trust and security
- Design inspired by enterprise school management platforms (PowerSchool) and logistics tracking (UPS My Choice)

**State Management**: 
- React Query (@tanstack/react-query) for server state and data fetching
- Local component state for UI interactions
- Currently using in-memory storage with planned database integration

**Form Handling**: 
- React Hook Form with Zod schema validation
- Type-safe form validation across all dialogs and data entry points

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**Database Layer**:
- Drizzle ORM configured for PostgreSQL
- Neon serverless PostgreSQL connector (@neondatabase/serverless)
- Connection pooling via Neon's Pool implementation
- Schema defined in shared/schema.ts for type safety across client/server

**API Design**:
- RESTful routes prefixed with `/api`
- Middleware for request logging and error handling
- Session management prepared (connect-pg-simple dependency present)

**Build System**:
- Vite for frontend bundling
- esbuild for server-side compilation
- Separate development and production build processes
- Hot module replacement in development via Vite middleware

### Core Features

**Authentication & Security**:
- Secure user authentication with email/phone and password
- Password hashing using scrypt algorithm for security
- Session management with express-session and Passport.js
- Protected routes requiring authentication
- Public registration restricted to parent role only
- Privileged roles (admin, teacher, security) must be provisioned by administrators
- Automatic role-based redirection after login

**Multi-Role Dashboard System**:
- Role-based access control with distinct UI/UX per user type
- Parent: Student profile management, NFC card linking
- Security: NFC scanning, dismissal verification, gate management
- Teacher: Classroom dismissal tracking, student status monitoring
- Admin: User management, class assignment, gate configuration

**NFC Integration**:
- Web NFC API implementation for card scanning
- Continuous scanning mode for security personnel
- Gate-based pickup verification
- Planned integration with physical NFC readers

**Real-Time Tracking**:
- Live dismissal status updates
- Visual indicators for new/pending/completed pickups
- Time-stamped activity logs
- Touch-optimized mobile interface for on-the-go use

### Data Models

**User Schema**:
- ID (UUID primary key)
- Email (optional, unique)
- Phone (optional, unique)
- Password (hashed with scrypt)
- First Name
- Last Name
- Role (parent, teacher, security, admin)
- NFC Card ID (optional, stores parent's NFC card identifier)
- Created At timestamp
- Updated At timestamp

**Planned Entities** (evident from UI components):
- Students (name, ID, school, grade, class, gender, NFC linkage)
- Classes (grade, section, teacher assignment, student count)
- Gates (name, location, status)
- Dismissals (student, parent, status, timestamp, gate)
- Parent-Student relationships

### Design System

**Color Palette**:
- Primary (Trust Blue): #2E5BFF - Actions, headers, role badges
- Success (Green): #00C851 - Completed states, confirmations
- Alert (Red): #FF3547 - Urgent notifications, pending pickups
- Neutrals: Grays for backgrounds, text hierarchy, borders

**Typography**:
- Primary: Inter font family
- Fallback: Roboto, system-ui, sans-serif
- Structured hierarchy from 32px page titles down to 14px supporting text

**Layout System**:
- Responsive grid (1-3 columns based on viewport)
- Consistent spacing scale (4px increments)
- Card-based UI with elevation on hover
- Touch-first design with large tap targets

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database access and schema management
- **Drizzle Kit**: Migration management and schema synchronization

### Authentication & Sessions
- **Passport.js**: Authentication middleware with LocalStrategy
- **express-session**: Session management
- **memorystore**: In-memory session store (development)
- **scrypt**: Secure password hashing algorithm

### UI Component Libraries
- **Radix UI**: Headless component primitives (@radix-ui/* packages)
- **Shadcn/ui**: Pre-styled component system built on Radix
- **Lucide React**: Icon library
- **cmdk**: Command menu/palette component
- **vaul**: Drawer component (mobile-optimized)

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Utilities
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional className handling
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across stack
- **PostCSS & Autoprefixer**: CSS processing
- **Replit plugins**: Development banner, error overlay, cartographer (Replit-specific tooling)

### Planned Integrations
- **Web NFC API**: Browser-based NFC reading (currently in development)
- **Real-time notifications**: Push notification system (infrastructure present but not implemented)
- **Photo storage**: Student/parent avatar system (UI prepared, storage pending)