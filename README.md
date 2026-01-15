# Store IT - Dataroom App

A secure data room management application built with Next.js 15 and React 19. Features file management, folder organization, file sharing, and user authentication.

## Features

### Authentication
- Email/password sign-up and sign-in
- Google OAuth integration (optional)
- JWT session management with NextAuth.js
- Secure password hashing with bcrypt

### File Management
- Drag-and-drop file upload
- File type detection (PDF, images, documents, etc.)
- Search and filter files by type
- Sort by date, name, or size
- Rename, delete, and move files
- PDF viewer in dialog

### Folder Management
- Create nested folder hierarchies
- Rename, delete, and move folders
- Breadcrumb navigation
- Cascade delete for folders with contents

### File Sharing
- Share files with specific email addresses
- Share with unregistered users (pending registration)
- View files shared with you
- Manage and revoke shares

### User Interface
- Responsive design with mobile navigation
- Dashboard with recent files
- Shared files board
- Data table with sorting and filtering
- Toast notifications
- Dark mode support

## Tech Stack

- **Framework**: Next.js 15.5.9 with App Router
- **UI**: React 19, Tailwind CSS, Radix UI
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack React Table
- **Auth**: NextAuth.js 4.24
- **Storage**: IndexedDB (client-side)
- **Testing**: Jest + React Testing Library
- **Build**: Turbopack

## Getting Started

### Prerequisites

- Node.js v22.21.1
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dataroom-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   copy .env.example .env
   ```

   Configure your `.env` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

   # Optional: Google OAuth
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
dataroom-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (sign-in, sign-up)
│   ├── (root)/                   # Main app pages
│   │   ├── page.tsx              # Dashboard
│   │   ├── documents/            # Recent files
│   │   ├── shared/               # Shared files
│   │   └── [id]/                 # Folder view
│   └── api/auth/                 # NextAuth API routes
├── components/                   # React components
│   ├── ui/                       # Shadcn/Radix UI primitives
│   ├── dialogs/                  # Modal dialogs
│   ├── Dashboard.tsx             # Main dashboard
│   ├── DataTable.tsx             # File/folder table
│   ├── FileUploader.tsx          # Upload component
│   └── ...
├── lib/
│   ├── contexts/                 # React contexts (Auth, File, Folder, Share)
│   ├── db/                       # IndexedDB service
│   ├── hooks/                    # Custom React hooks
│   ├── server/                   # Server-side utilities
│   └── utils/                    # Helper functions
└── public/                       # Static assets
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No |

## Docker Deployment

Build and run with Docker:

```bash
docker-compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Testing

Run the test suite:

```bash
npm run test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

## License

This project is licensed under the MIT License.
