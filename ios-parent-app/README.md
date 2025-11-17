# BlueGO Parent - iOS App

A native iOS application for parents to manage their children's school pickup using the BlueGO system.

## Features

- **Authentication**: Login and register as a parent with email or phone
- **Student Management**: Add, view, and manage your children
- **Dismissal Workflow**: Request pickup, view real-time status, and confirm receipt
- **NFC Card Linking**: Link your NFC card to all children for automatic check-in
- **Real-time Updates**: Get instant notifications when your child is ready for pickup
- **Multi-school Support**: Manage children across different schools

## Requirements

- iOS 15.0 or later
- Xcode 14.0 or later
- Swift 5.0 or later
- iPhone with NFC capability (for NFC features)

## Installation

### 1. Open the Project

```bash
cd ios-parent-app/BlueGOParent
open BlueGOParent.xcodeproj
```

### 2. Configure Backend URL

Open `BlueGOParent/Services/NetworkService.swift` and update the `baseURL`:

```swift
// For local development
private let baseURL = "http://localhost:5000"

// For production (replace with your actual backend URL)
private let baseURL = "https://your-backend-url.com"
```

### 3. Configure Code Signing

1. Select the BlueGOParent project in Xcode
2. Select the BlueGOParent target
3. Go to "Signing & Capabilities"
4. Select your development team
5. Xcode will automatically manage provisioning profiles

### 4. Enable NFC Capability

1. In "Signing & Capabilities", click "+ Capability"
2. Add "Near Field Communication Tag Reading"
3. The Info.plist already includes the required NFC usage description

### 5. Build and Run

1. Select your target device or simulator
2. Press Cmd+R to build and run
3. The app will launch on your device/simulator

## Project Structure

```
BlueGOParent/
├── BlueGOParent/
│   ├── BlueGOParentApp.swift      # App entry point
│   ├── ContentView.swift          # Root navigation
│   ├── Models/                    # Data models
│   │   ├── User.swift            # Parent user model
│   │   ├── Student.swift         # Student/child model
│   │   ├── Dismissal.swift       # Dismissal/pickup model
│   │   └── Organization.swift    # School/class models
│   ├── Services/                  # API services
│   │   ├── NetworkService.swift  # Core networking
│   │   ├── AuthService.swift     # Authentication API
│   │   └── ParentService.swift   # Parent-specific APIs
│   ├── ViewModels/                # State management
│   │   ├── AuthViewModel.swift   # Auth state
│   │   └── ParentViewModel.swift # Parent operations
│   └── Views/                     # UI components
│       ├── AuthView.swift        # Login/Register
│       ├── ParentDashboardView.swift  # Main dashboard
│       ├── StudentCardView.swift      # Student card
│       ├── AddStudentView.swift       # Add child dialog
│       └── NFCLinkingView.swift       # NFC linking
├── Info.plist                     # App configuration
└── BlueGOParent.xcodeproj/       # Xcode project
```

## Usage Guide

### First Time Setup

1. **Register**: Open the app and tap "Register"
2. **Enter Details**: Provide your name, email/phone, and password
3. **Login**: After registration, you'll be automatically logged in

### Adding Your First Child

1. On the dashboard, tap "Add Child"
2. Enter your child's:
   - Full name
   - Student ID
   - Gender
3. Select their school from the dropdown
4. Select their grade and class
5. Tap "Add" to save

### Requesting Pickup

1. On the dashboard, find your child's card
2. Tap "Request Pick-up" button
3. The status will change to "Waiting for teacher..."
4. When the teacher confirms, you'll see "Ready for Pick-up!"
5. Tap "Confirm I Received My Child" when you pick them up

### Linking NFC Card

1. Tap your profile icon in the top-right
2. Select "Link NFC Card"
3. Choose one of two methods:
   - **Manual Entry**: Type in your card ID
   - **Scan**: Hold your NFC card to the back of your iPhone
4. The card will be automatically linked to all your children

### Real-time Updates

- The app polls the server every 2 seconds for updates
- When your child's status changes, you'll see it immediately
- No manual refresh needed

## API Integration

The app connects to the BlueGO backend and uses these endpoints:

### Authentication
- `POST /api/register` - Register new parent
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Student Management
- `GET /api/students` - Get all children
- `POST /api/students` - Add new child
- `PATCH /api/students/:id` - Update child
- `DELETE /api/students/:id` - Delete child

### Dismissals
- `POST /api/parent/request-pickup` - Request pickup
- `GET /api/parent/dismissals` - Get active dismissals
- `PATCH /api/parent/dismissals/:id/confirm` - Confirm pickup

### NFC & Schools
- `POST /api/parent/nfc-card` - Link NFC card
- `GET /api/parent/organizations` - Get schools
- `GET /api/parent/classes/:orgId` - Get classes

## Development Notes

### Network Configuration

The app uses `URLSession` with cookie support for session management. The backend session cookie is automatically stored and sent with each request.

### State Management

- Uses SwiftUI's `@StateObject` and `@ObservableObject` for reactive state
- `AuthViewModel`: Manages authentication state
- `ParentViewModel`: Manages parent operations and data

### Real-time Updates

The app uses polling (every 2 seconds) to fetch dismissal updates. This provides a good balance between real-time updates and server load.

### Error Handling

All API errors are caught and displayed to the user with meaningful messages. Network errors, authentication errors, and server errors are all handled gracefully.

### NFC Support

- Requires iOS 13+ and NFC-capable iPhone
- Uses Core NFC framework
- Falls back to manual entry if NFC is unavailable
- Reads tag identifier and normalizes format

## Testing

### Manual Testing Checklist

- [ ] Register new parent account
- [ ] Login with credentials
- [ ] Add a child (select school and class)
- [ ] View children on dashboard
- [ ] Request pickup for a child
- [ ] Wait for teacher to mark ready (use web app)
- [ ] Confirm pickup
- [ ] Link NFC card (manual or scan)
- [ ] Verify NFC status shows on children
- [ ] Logout and login again
- [ ] Delete a child

### Testing with Simulator

**Note**: NFC scanning won't work on simulator. Use manual NFC card entry for testing.

To test the full flow:
1. Run the iOS app in simulator
2. Run the web app in a browser
3. Use the web app as a teacher to mark dismissals ready
4. Observe real-time updates in the iOS app

## Troubleshooting

### "Cannot connect to server"

- Verify the backend is running
- Check the `baseURL` in NetworkService.swift
- For simulator: use `http://localhost:5000`
- For physical device: use your computer's IP address (e.g., `http://192.168.1.100:5000`)

### "No schools available"

- Ensure your parent account is registered in at least one organization
- Check that organizations exist in the database
- Verify the `/api/parent/organizations` endpoint is working

### NFC not working

- Ensure you're testing on a physical iPhone (not simulator)
- Check that NFC capability is added in Xcode
- Verify Info.plist includes NFC usage description
- Make sure your iPhone supports NFC (iPhone 7 and later)

### Session expires

- The app will automatically redirect to login
- Backend sessions typically last 30 days
- Re-login to create a new session

## Architecture Decisions

### SwiftUI over UIKit

SwiftUI was chosen for:
- Modern, declarative UI
- Less boilerplate code
- Better integration with async/await
- Automatic reactive updates

### Polling over WebSocket

Polling was chosen for the MVP because:
- Simpler implementation
- More reliable on mobile networks
- Lower battery impact with 2-second intervals
- Easy to implement (no additional libraries)

Future enhancement: Add WebSocket support for push notifications

### Session Cookies over JWT

The backend uses session cookies, so the app:
- Relies on URLSession's automatic cookie management
- Doesn't need to manually handle tokens
- Works seamlessly with the existing backend

## Future Enhancements

- [ ] Push notifications for dismissal status changes
- [ ] Offline support with local caching
- [ ] Dark mode support
- [ ] iPad optimization
- [ ] Home screen widgets
- [ ] Historical pickup logs
- [ ] Multi-child quick actions
- [ ] Parent-to-school messaging
- [ ] Calendar integration for pickup schedules
- [ ] Avatar photo upload for children

## Contributing

This is a native iOS client for the BlueGO system. The backend code is located in the parent directory.

## License

Same license as the main BlueGO project.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API documentation in the parent directory
3. Check the backend logs for API errors
4. Verify network connectivity and backend URL

## Backend Setup

Make sure the BlueGO backend is running:

```bash
cd ..  # Go to BlueGO root directory
npm install
npm run dev
```

The backend should be running on `http://localhost:5000`.
