# Chandara VR

A global platform where anyone can stream sports events from anywhere in the world and monetize them. Experience live sports in immersive 360° virtual reality.

## Features

- **Live Sports Streaming**: Watch football, cricket, basketball, volleyball, esports, and more in VR
- **Monetization**: Streamers earn 90% of ticket revenue, platform takes 10% commission
- **VR Support**: 180° and 360° VR camera support with A-Frame and WebXR
- **User Roles**: Viewers, Streamers, and Admins with dedicated dashboards
- **Real-time Chat**: Live chat during events
- **Ticket System**: Secure ticket purchasing and access verification
- **Event Management**: Create, approve, and manage sports events

## Tech Stack

### Frontend
- React 18
- Vite
- React Router 6
- TailwindCSS
- Firebase Auth
- Firestore
- Firebase Storage
- A-Frame (WebXR)
- Lucide React (Icons)
- date-fns

### Backend
- Firebase Cloud Functions
- Firestore Database
- Firebase Storage

### Hosting
- Vercel (Frontend)
- Firebase Hosting (Optional)

## Project Structure

```
chandara-vr/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── context/            # React Context
│   │   └── AuthContext.jsx
│   ├── firebase/           # Firebase configuration
│   │   └── firebase.js
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Register.jsx
│   │   ├── Login.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── StreamerDashboard.jsx
│   │   ├── CreateEvent.jsx
│   │   ├── EventDetails.jsx
│   │   ├── Watch.jsx
│   │   ├── VRViewer.jsx
│   │   └── AdminDashboard.jsx
│   ├── services/           # API services
│   │   ├── authService.js
│   │   ├── eventService.js
│   │   ├── ticketService.js
│   │   ├── userService.js
│   │   └── adminService.js
│   ├── utils/              # Utility functions
│   │   ├── formatDate.js
│   │   └── validators.js
│   ├── App.jsx             # Main app component with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── functions/              # Firebase Cloud Functions
│   ├── index.js
│   └── package.json
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
├── firestore.indexes.json  # Firestore indexes
├── tailwind.config.js      # TailwindCSS configuration
├── vite.config.js          # Vite configuration
├── package.json
└── README.md
```

## Database Structure

### Users Collection
```javascript
{
  uid: string,
  name: string,
  email: string,
  country: string,
  role: 'user' | 'streamer' | 'admin',
  isBanned: boolean,
  createdAt: timestamp
}
```

### Events Collection
```javascript
{
  eventId: string,
  title: string,
  description: string,
  sport: string,
  country: string,
  city: string,
  date: string,
  time: string,
  ticketPrice: number,
  cameraType: 'mobile' | '180vr' | '360vr',
  thumbnail: string,
  streamKey: string,
  streamUrl: string,
  status: 'pending' | 'approved' | 'live' | 'ended' | 'rejected',
  ownerId: string,
  createdAt: timestamp
}
```

### Tickets Collection
```javascript
{
  ticketId: string,
  eventId: string,
  buyerId: string,
  amount: number,
  createdAt: timestamp
}
```

### Transactions Collection
```javascript
{
  transactionId: string,
  eventId: string,
  amount: number,
  platformCommission: number,
  streamerAmount: number,
  ticketId: string,
  createdAt: timestamp
}
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chandara-vr
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Create Storage bucket
   - Copy your Firebase configuration

4. Create environment file:
```bash
cp .env.example .env
```

5. Edit `.env` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

6. Deploy Firestore and Storage rules:
```bash
firebase login
firebase deploy --only firestore,storage
```

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Deploy to Firebase Hosting

1. Build the project:
```bash
npm run build
```

2. Deploy:
```bash
firebase deploy
```

## Cloud Functions

The project includes Firebase Cloud Functions for:

- **processTicketPurchase**: Handle ticket purchases and create transactions
- **getStreamerRevenue**: Calculate streamer revenue
- **notifyEventApproval**: Send notifications when events are approved
- **cleanupOldEvents**: Scheduled cleanup of old events

To deploy Cloud Functions:
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Pages

1. **Home Page**: Hero section, live events, upcoming events, top streamers, how it works
2. **Register Page**: User registration with email verification
3. **Login Page**: User authentication
4. **User Dashboard**: View purchased tickets, favorite events, recent activity
5. **Streamer Dashboard**: View revenue, tickets sold, upcoming/live events, create events
6. **Create Event Page**: Create new sports events with stream key generation
7. **Event Details Page**: View event information, purchase tickets
8. **Watch Page**: Live video streaming with chat
9. **VR Viewer Page**: Immersive 360°/180° VR viewing with A-Frame
10. **Admin Dashboard**: Manage users, approve/reject events, view platform statistics

## Revenue Split

- **Streamer**: 90% of ticket revenue
- **Platform**: 10% commission

## Camera Types

- **Mobile Camera**: Standard mobile camera streaming
- **180 VR Camera**: Immersive 180-degree VR experience
- **360 VR Camera**: Full 360-degree VR experience

## Security

- Firebase Authentication for user management
- Firestore security rules for data access control
- Storage rules for file upload restrictions
- Protected routes for authenticated pages
- Role-based access control (user, streamer, admin)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@chandaravr.com or create an issue in the repository.
