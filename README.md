# Dataroom App

A Next.js application for secure data room management with file storage, user authentication.

## Features

- Next.js 15 with App Router
- NextAuth.js for authentication
- React Hook Form with Zod validation
- Radix UI components with Tailwind CSS
- Docker support for containerized deployment
- Vercel-ready for cloud deployment

### Local Development

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

   Edit `.env` and configure:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dataroom
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Vercel Deployment

This application is optimized for deployment on Vercel.

#### Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**

   In your Vercel project settings, add:

   ```env
   DATABASE_URL=your-postgresql-connection-string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-generated-secret
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

#### Database Options for Vercel

Since Vercel doesn't provide PostgreSQL, use one of these services:

- **Vercel Postgres** (Neon-powered, native integration)
  ```bash
  vercel postgres create
  ```

- **Supabase** - PostgreSQL + Auth + Storage
  - [supabase.com](https://supabase.com)
  - Free tier available

- **Neon** - Serverless PostgreSQL
  - [neon.tech](https://neon.tech)
  - Auto-scaling, free tier

- **Railway** - PostgreSQL hosting
  - [railway.app](https://railway.app)
  - Simple deployment

#### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Project Structure

```
dataroom-app/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Utility functions and configurations
├── public/                 # Static assets
├── .dockerignore          # Docker ignore rules
├── .env.example           # Environment variables template
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker build instructions
├── next.config.ts         # Next.js configuration
└── package.json           # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No |

## Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

This project is licensed under the MIT License.
