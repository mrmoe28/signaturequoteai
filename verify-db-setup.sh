#!/bin/bash
# Database Setup Verification Script

echo "🔍 Verifying Database Setup..."
echo ""

# Check .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check DATABASE_URL is set
if grep -q "DATABASE_URL=postgresql://" .env.local; then
    echo "✅ DATABASE_URL is configured"
else
    echo "❌ DATABASE_URL not properly configured"
    exit 1
fi

# Test database connection
echo ""
echo "🔌 Testing database connection..."
DB_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2-)

# Count tables
TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    echo "📊 Found $TABLE_COUNT tables in the database"
    echo ""
    echo "📋 Tables:"
    psql "$DB_URL" -c "\dt" 2>/dev/null | grep "public" | awk '{print "   - " $2}'
else
    echo "❌ Database connection failed"
    exit 1
fi

echo ""
echo "✨ Database setup verification complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Run 'npm install' to install dependencies"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Access the app at http://localhost:3000"
