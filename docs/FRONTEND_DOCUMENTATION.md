# ConfCert Frontend Documentation

## Overview

ConfCert Frontend is a modern web application built with Next.js 16, React 19, and Tailwind CSS. It provides an intuitive interface for blockchain-based certificate management, including certificate issuance, verification, and user management.

## Technology Stack

### Core Technologies
- **Next.js 16.1.1**: React framework with App Router
- **React 19.2.3**: UI library with hooks and context
- **Tailwind CSS 4**: Utility-first CSS framework
- **TypeScript/JavaScript**: ES6+ JavaScript

### Key Libraries
- **ethers.js 6.16.0**: Ethereum blockchain interaction
- **@supabase/supabase-js 2.90.1**: Authentication and database
- **axios 1.13.2**: HTTP client with interceptors
- **framer-motion 12.23.26**: Animations and transitions
- **lucide-react 0.562.0**: Modern icon library
- **html2canvas 1.4.1 & jspdf 4.0.0**: Certificate export
- **xlsx 0.18.5**: Excel file handling for bulk operations

### UI Components
- **Radix UI**: Accessible component primitives
  - Dialog, Select, Tabs, Avatar, Separator
- **Shadcn/ui**: Pre-built component system
- **next-themes 0.4.6**: Dark/light mode support

## Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.js            # Root layout with providers
│   ├── page.js              # Home/landing page
│   ├── globals.css          # Global styles and Tailwind
│   ├── about/               # About page
│   ├── admin/               # Admin dashboard
│   ├── club-admin/          # Club admin dashboard
│   ├── create/              # Certificate creation page
│   ├── edit-template/       # Template editor
│   ├── login/               # Login page (all roles)
│   ├── profile/             # User profile
│   ├── register/            # Student registration
│   └── verify/              # Certificate verification
│
├── components/              # React components
│   ├── AuthGuard.jsx        # Route protection HOC
│   ├── GuestGuard.jsx       # Unauthenticated route protection
│   ├── navbar.js            # Navigation bar
│   ├── footer.js            # Footer component
│   ├── CertificateEditor.jsx # Canvas-based certificate editor
│   ├── background-paths.jsx # Animated background
│   └── ui/                  # Reusable UI components
│       ├── alert.jsx
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       ├── input.jsx
│       ├── select.jsx
│       ├── separator.jsx
│       └── tabs.jsx
│
├── contexts/                # React contexts
│   └── AuthContext.js       # Authentication state management
│
├── lib/                     # Utility libraries
│   ├── axiosClient.js       # Configured axios instance
│   ├── certificate-api.js   # Certificate issuance API
│   ├── web3.js              # Blockchain read operations
│   ├── ipfs.js              # IPFS utilities
│   ├── supabase.js          # Supabase client
│   ├── utils.js             # General utilities
│   └── canvas-constants.js  # Certificate editor constants
│
├── public/                  # Static assets
│   ├── animations/          # Lottie animation files
│   ├── certificate_bg/      # Certificate backgrounds
│   └── icons/               # App icons
│
├── .env.local               # Environment variables
├── next.config.mjs          # Next.js configuration
├── tailwind.config.js       # Tailwind configuration
├── components.json          # Shadcn/ui config
└── package.json             # Dependencies
```

## Setup and Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- Backend API running (see Backend Documentation)

### Installation Steps

1. **Clone the repository**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` file:
   ```env
   # Backend API
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5500

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Blockchain
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   NEXT_PUBLIC_CHAIN_ID=11155111
   NEXT_PUBLIC_NETWORK_NAME=Sepolia

   # IPFS (for verification)
   NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
   NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Application will be available at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Pages and Routes

### Public Routes

#### `/` - Landing Page
- **Purpose**: Home page with app introduction
- **Features**:
  - Hero section with call-to-action
  - Feature highlights
  - Navigation to key sections
  - Responsive design

#### `/about` - About Page
- **Purpose**: Information about the platform
- **Features**:
  - Project description
  - Team information
  - Technology stack overview
  - Contact information

#### `/verify` - Certificate Verification
- **Purpose**: Public certificate verification
- **Features**:
  - Certificate ID input
  - Blockchain verification
  - Certificate details display
  - IPFS image loading with fallback gateways
  - Download certificate option
  - Share verification link
- **Query Parameters**: `?certificateid=123` (auto-verify)
- **No Authentication Required**

#### `/login` - Authentication
- **Purpose**: Login for all user roles
- **Features**:
  - Role-based login (Student, Admin, Club Admin)
  - Email/username + password authentication
  - Remember me functionality
  - Error handling and validation
  - Redirect to appropriate dashboard

#### `/register` - Student Registration
- **Purpose**: New student account creation
- **Features**:
  - VIT AP email validation
  - Password strength requirements
  - Email verification flow
  - Success confirmation
  - Auto-redirect to login

### Protected Routes (Requires Authentication)

#### `/profile` - User Profile
- **Purpose**: View and manage user profile
- **Access**: All authenticated users
- **Features**:
  - User information display
  - Certificate count
  - Account settings
  - Logout functionality

#### `/create` - Certificate Creation
- **Purpose**: Issue new certificates
- **Access**: Admin and Club Admin only
- **Features**:
  - Interactive certificate editor
  - Student information input
  - Registration number validation
  - Email notification toggle
  - Real-time preview
  - Export as PNG/PDF
  - Direct blockchain issuance
  - Bulk certificate upload (Excel)
  - Progress tracking

#### `/edit-template` - Template Editor
- **Purpose**: Create and edit certificate templates
- **Access**: Admin and Club Admin only
- **Features**:
  - Canvas-based editor
  - Drag-and-drop text elements
  - Image upload and positioning
  - Font customization
  - Background selection
  - Save templates
  - Load existing templates

#### `/admin` - Admin Dashboard
- **Purpose**: System administration
- **Access**: Admin role only
- **Features**:
  - User management
    - Create club admins
    - View all admins
    - Delete users
  - Blockchain admin management
    - Add admin addresses to smart contract
    - Remove admin addresses
    - View contract info
  - Statistics dashboard
    - Wallet balance
    - Total certificates
    - User counts
    - Recent activity
  - Certificate overview

#### `/club-admin` - Club Admin Dashboard
- **Purpose**: Club-level administration
- **Access**: Club Admin role only
- **Features**:
  - Issue certificates
  - View issued certificates
  - Club statistics
  - Export reports

## Core Components

### Authentication Components

#### `AuthGuard`
**Location**: `components/AuthGuard.jsx`

**Purpose**: Higher-order component for route protection

**Props**:
```javascript
{
  children: ReactNode,           // Protected content
  requireAuth: boolean,           // Require authentication (default: true)
  allowedRoles: string[],        // Allowed user roles
  redirectTo: string,            // Redirect if not authenticated (default: '/login')
  unauthorizedRedirect: string,  // Redirect if wrong role (default: '/login')
  loadingComponent: ReactNode    // Custom loading component
}
```

**Usage**:
```jsx
<AuthGuard allowedRoles={['admin', 'club.admin']}>
  <AdminDashboard />
</AuthGuard>
```

#### `GuestGuard`
**Location**: `components/GuestGuard.jsx`

**Purpose**: Redirect authenticated users away from auth pages

**Usage**:
```jsx
<GuestGuard>
  <LoginPage />
</GuestGuard>
```

### UI Components

#### `CertificateEditor`
**Location**: `components/CertificateEditor.jsx`

**Purpose**: Canvas-based certificate creation and editing

**Features**:
- Text element manipulation
- Image upload and positioning
- Background selection
- Font customization
- Export to PNG/PDF
- Responsive canvas

**Usage**:
```jsx
<CertificateEditor
  onSave={(certificateBlob) => handleSave(certificateBlob)}
  initialData={templateData}
/>
```

#### Navbar
**Location**: `components/navbar.js`

**Purpose**: Main navigation component

**Features**:
- Responsive design
- Role-based menu items
- Authentication status
- Dark mode toggle
- Mobile menu

#### Footer
**Location**: `components/footer.js`

**Purpose**: Site footer with links

**Features**:
- Quick links
- Social media
- Copyright info
- Responsive layout

### UI Library Components

All UI components are located in `components/ui/` and follow Radix UI patterns:

- **Alert**: Notification messages
- **Avatar**: User profile images
- **Badge**: Status indicators
- **Button**: Interactive buttons with variants
- **Card**: Content containers
- **Dialog**: Modal dialogs
- **Input**: Form inputs
- **Select**: Dropdown selects
- **Separator**: Visual dividers
- **Tabs**: Tabbed interfaces

## State Management

### AuthContext

**Location**: `contexts/AuthContext.js`

**Purpose**: Global authentication state

**Provides**:
```javascript
{
  user: {
    id: string,
    email: string,
    userType: 'admin' | 'club.admin' | 'student',
    ...userData
  },
  session: SupabaseSession,
  loading: boolean,
  signOut: () => Promise<void>,
  clearAuth: () => void
}
```

**Usage**:
```jsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Welcome, {user.email}</div>;
}
```

**Provider Setup**:
```jsx
// In app/layout.js
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## API Integration

### Axios Client

**Location**: `lib/axiosClient.js`

**Features**:
- Automatic bearer token injection
- Request/response interceptors
- Error handling
- Automatic logout on 401

**Configuration**:
```javascript
import axiosClient from '@/lib/axiosClient';

// GET request
const response = await axiosClient.get('/api/endpoint');

// POST request
const response = await axiosClient.post('/api/endpoint', data);

// File upload
const formData = new FormData();
formData.append('file', file);
const response = await axiosClient.post('/api/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Certificate API

**Location**: `lib/certificate-api.js`

**Functions**:

#### `issueCertificate()`
```javascript
import { issueCertificate } from '@/lib/certificate-api';

const result = await issueCertificate(
  certificateFile,  // File/Blob
  'John Doe',       // studentName
  '24BCC7026',      // regNo
  'john@vit.ac.in', // email (optional)
  true              // sendEmail
);

if (result.success) {
  console.log('Certificate ID:', result.data.certificate.certificateId);
}
```

#### `bulkIssueCertificates()`
```javascript
import { bulkIssueCertificates } from '@/lib/certificate-api';

const result = await bulkIssueCertificates(
  certificateFiles,  // Array<File/Blob>
  studentNames,      // string[]
  regNos,           // string[]
  emails,           // string[] (optional)
  true              // sendEmail
);

if (result.success) {
  console.log('Summary:', result.data.summary);
}
```

## Web3 Integration

### Web3 Utilities

**Location**: `lib/web3.js`

**Purpose**: Read-only blockchain interactions (no wallet required)

**Key Functions**:

#### `getCertificate(certificateId)`
```javascript
import { getCertificate } from '@/lib/web3';

const result = await getCertificate(123);

if (result.success) {
  const cert = result.certificate;
  console.log('Student:', cert.studentName);
  console.log('IPFS Hash:', cert.ipfsHash);
  console.log('Issuer:', cert.issuerAddress);
}
```

#### `verifyCertificate(certificateId)`
```javascript
import { verifyCertificate } from '@/lib/web3';

const isValid = await verifyCertificate(123);
console.log('Certificate valid:', isValid);
```

#### `getCertificatesByRegNo(regNo)`
```javascript
import { getCertificatesByRegNo } from '@/lib/web3';

const result = await getCertificatesByRegNo('24BCC7026');
console.log('Certificate IDs:', result.certificateIds);
```

**Utility Functions**:
- `getEtherscanLink(txHash)`: Get Etherscan transaction URL
- `getAddressLink(address)`: Get Etherscan address URL
- `shortenAddress(address)`: Format address (0x1234...5678)
- `formatTimestamp(timestamp)`: Convert Unix timestamp to readable date

### Contract Configuration

**Environment Variables**:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Smart contract address
NEXT_PUBLIC_RPC_URL=https://...    # Ethereum RPC endpoint
NEXT_PUBLIC_CHAIN_ID=11155111      # Sepolia testnet
```

**No Private Keys Required**: Frontend only performs read operations

## IPFS Integration

**Location**: `lib/ipfs.js`

**Purpose**: Certificate image retrieval from IPFS

**Functions**:

```javascript
import { getIPFSUrl, getAllIPFSUrls } from '@/lib/ipfs';

// Get primary gateway URL
const url = getIPFSUrl('Qm...');

// Get all gateway URLs for fallback
const urls = getAllIPFSUrls('Qm...');
```

**Supported Gateways**:
1. Pinata Gateway (primary)
2. IPFS.io
3. Cloudflare IPFS
4. Dweb.link

## Authentication Flow

### Student Registration Flow

1. User visits `/register`
2. Enters VIT AP email (@vitapstudent.ac.in) and password
3. Frontend validates email format
4. POST to `/api/auth/register/student`
5. Backend creates Supabase auth user
6. Email verification sent
7. User redirected to `/login`
8. User verifies email via link
9. User can now login

### Login Flow (All Roles)

1. User visits `/login`
2. Selects user type (Student/Admin/Club Admin)
3. Enters credentials
4. POST to appropriate login endpoint
5. Backend validates credentials
6. Returns JWT token and user data
7. Frontend stores token and user data
8. AuthContext updates
9. User redirected to appropriate dashboard

### Protected Route Access

1. User navigates to protected route
2. `AuthGuard` checks authentication status
3. If not authenticated → redirect to `/login`
4. If wrong role → redirect to `/login`
5. If authorized → render page content

### Logout Flow

1. User clicks logout
2. `signOut()` called from AuthContext
3. Supabase session cleared
4. localStorage cleared
5. User state reset
6. Redirect to home page

## Styling and Theming

### Tailwind Configuration

**Location**: `tailwind.config.js`

**Custom Theme**:
```javascript
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...},
      accent: {...},
    },
    animation: {
      'spin-slow': 'spin 3s linear infinite',
    }
  }
}
```

### Global Styles

**Location**: `app/globals.css`

**Includes**:
- Tailwind directives
- CSS variables for theming
- Custom scrollbar styles
- Print styles
- Responsive utilities

### Dark Mode

**Implementation**: `next-themes`

**Usage**:
```jsx
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

## Error Handling

### API Errors

**Axios Interceptor** handles:
- 401 Unauthorized: Auto logout and redirect
- 403 Forbidden: Show error message
- 500 Server Error: Show error alert
- Network errors: Retry or show offline message

**Component Level**:
```jsx
try {
  const response = await axiosClient.get('/api/data');
  setData(response.data);
} catch (error) {
  setError(error.response?.data?.message || 'An error occurred');
}
```

### Form Validation

**Client-side validation**:
```javascript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setError('Invalid email format');
}

// VIT AP email validation
if (!email.endsWith('@vitapstudent.ac.in')) {
  setError('Please use your VIT AP email');
}

// Password validation
if (password.length < 6) {
  setError('Password must be at least 6 characters');
}
```

### Blockchain Errors

**Web3 error handling**:
```javascript
try {
  const result = await getCertificate(certificateId);
  if (!result.success) {
    setError(result.error || 'Certificate not found');
  }
} catch (error) {
  setError('Blockchain connection failed. Please try again.');
}
```

## Performance Optimization

### Code Splitting

**Next.js automatic code splitting**:
- Each page is a separate bundle
- Dynamic imports for heavy components
- Lazy loading for off-screen content

**Example**:
```jsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

### Image Optimization

**Next.js Image component**:
```jsx
import Image from 'next/image';

<Image
  src="/certificate.png"
  width={800}
  height={600}
  alt="Certificate"
  priority // For above-the-fold images
/>
```

### Memoization

**React hooks for optimization**:
```jsx
import { useMemo, useCallback } from 'react';

const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(value);
}, [value]);
```

## Testing

### Manual Testing Checklist

**Authentication**:
- [ ] Student registration with valid email
- [ ] Email verification flow
- [ ] Login for each role
- [ ] Logout functionality
- [ ] Protected route access
- [ ] Token expiration handling

**Certificate Operations**:
- [ ] Certificate creation with editor
- [ ] Single certificate issuance
- [ ] Bulk certificate issuance
- [ ] Certificate verification
- [ ] IPFS image loading
- [ ] Export certificate as PDF

**Admin Functions**:
- [ ] Create club admin
- [ ] Delete users
- [ ] View statistics
- [ ] Add blockchain admin
- [ ] Remove blockchain admin

**UI/UX**:
- [ ] Responsive design on mobile
- [ ] Dark mode toggle
- [ ] Form validation
- [ ] Error messages
- [ ] Loading states
- [ ] Success notifications

### Testing Commands

```bash
# Run linter
npm run lint

# Build for production (catches build errors)
npm run build

# Test production build
npm start
```

## Deployment

### Vercel Deployment (Recommended)

1. **Connect repository to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure environment variables**
   - Add all `.env.local` variables to Vercel dashboard
   - Use production backend URL
   - Use production blockchain network

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Build and run**:
```bash
docker build -t confcert-frontend .
docker run -p 3000:3000 confcert-frontend
```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Use process manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "confcert-frontend" -- start
   pm2 save
   pm2 startup
   ```

## Environment Configuration

### Development
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5500
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/...
```

### Production
```env
NEXT_PUBLIC_BACKEND_URL=https://api.confcert.com
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/...
NEXT_PUBLIC_CHAIN_ID=1
```

## Common Issues and Solutions

### Issue: "Module not found" errors
**Solution**: Clear `.next` cache and reinstall dependencies
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: API requests failing with CORS
**Solution**: Ensure backend CORS is configured to allow frontend origin

### Issue: Web3 connection errors
**Solution**: 
- Check RPC URL is correct
- Verify contract address
- Ensure network is accessible

### Issue: Images not loading from IPFS
**Solution**: 
- Check IPFS hash is correct
- Try alternative gateways
- Verify IPFS pin is active

### Issue: Authentication token expired
**Solution**: Token refresh is handled automatically by axios interceptor. If issues persist, clear localStorage and login again.

## Security Best Practices

1. **Never store private keys in frontend**
2. **Use environment variables for sensitive data**
3. **Validate all user inputs**
4. **Sanitize data before displaying**
5. **Use HTTPS in production**
6. **Keep dependencies updated**
7. **Implement rate limiting on API calls**
8. **Use CSP headers**

## Contributing

### Code Style
- Use ES6+ syntax
- Follow React hooks best practices
- Use functional components
- Maintain consistent naming conventions
- Add comments for complex logic

### Component Structure
```jsx
'use client'; // If using client-side features

import statements...

export default function ComponentName({ prop1, prop2 }) {
  // State declarations
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Event handlers
  const handleEvent = () => {};
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues and questions:
- Check Backend API Documentation
- Review Smart Contract Documentation
- Check browser console for errors
- Verify environment variables are set correctly

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintainer**: ConfCert Team