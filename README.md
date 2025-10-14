# Signature QuoteCrawler

A Next.js application that crawls Signature Solar for current prices and generates professional PDF quotes.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mrmoe28/signaturequoteai.git
   cd signaturequoteai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Verify database setup**
   ```bash
   ./verify-db-setup.sh
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📚 Documentation

- `docs/TLDR.md` — Complete project specification
- `docs/DATABASE_SETUP.md` — Database configuration and schema guide
- `CLAUDE.md` — Development guidelines for Claude Code
- `PRODUCTION_SETUP.md` — Production deployment guide

## 🗄️ Database

**Provider:** NeonDB (PostgreSQL)
**ORM:** Drizzle ORM

**Schema:** 8 tables
- Products, Price Snapshots
- Quotes, Quote Items
- Users, Sessions
- Crawl Jobs, Company Settings

See `docs/DATABASE_SETUP.md` for complete setup instructions.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **UI:** SuperDesign, Tailwind CSS, Radix UI
- **Database:** NeonDB + Drizzle ORM
- **PDF Generation:** @react-pdf/renderer
- **Web Scraping:** Playwright, Cheerio
- **Authentication:** Custom (Google OAuth + Email/Password)
- **Deployment:** Vercel

## 📁 Project Structure

```
signaturequoteai/
├── app/                  # Next.js app router pages
├── components/           # Reusable React components
├── lib/                  # Utilities and configurations
│   ├── db/              # Database schema, queries, migrations
│   └── utils/           # Helper functions
├── scripts/             # Database and utility scripts
├── docs/                # Project documentation
├── public/              # Static assets
└── .env.local          # Environment variables (not in git)
```

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:studio        # Open Drizzle Studio
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
```

### Testing
```bash
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Crawling
```bash
npm run crawl:start      # Start crawler
npm run crawl:test       # Test crawler
npm run crawl:freshness  # Check data freshness
```

## 🔐 Environment Variables

Required variables in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your-secret-here

# Google OAuth (optional)
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=

# Square (optional)
SQUARE_APPLICATION_ID=
SQUARE_ACCESS_TOKEN=
```

See `.env.example` for complete list.

## 📦 Key Features

- ✅ Product catalog from Signature Solar
- ✅ Real-time price tracking
- ✅ Professional PDF quote generation
- ✅ Customer management
- ✅ User authentication
- 🔄 Payment integration (Square)
- 🔄 Email quote delivery

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## 📄 License

Private repository - All rights reserved

## 🔗 Links

- **Repository:** https://github.com/mrmoe28/signaturequoteai
- **Issues:** https://github.com/mrmoe28/signaturequoteai/issues

---

Created: 2025-09-10
Last Updated: 2025-10-11
