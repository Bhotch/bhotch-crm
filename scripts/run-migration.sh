#!/bin/bash

# Bhotch CRM - Supabase Migration Helper Script
# This script automates the complete migration process

set -e  # Exit on any error

echo "=========================================="
echo "Bhotch CRM - Supabase Migration"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo ""
    echo "Please create .env.local with your Supabase credentials:"
    echo "  cp .env.example .env.local"
    echo "  # Then edit .env.local with your actual values"
    echo ""
    exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

# Check required variables
if [ -z "$REACT_APP_SUPABASE_URL" ] || [ -z "$REACT_APP_SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    echo ""
    echo "Required variables:"
    echo "  REACT_APP_SUPABASE_URL"
    echo "  REACT_APP_SUPABASE_ANON_KEY"
    echo "  REACT_APP_SUPABASE_SERVICE_KEY"
    echo ""
    exit 1
fi

if [ -z "$REACT_APP_GAS_WEB_APP_URL" ]; then
    echo "❌ Error: Missing Google Apps Script URL"
    echo ""
    echo "Required for data export:"
    echo "  REACT_APP_GAS_WEB_APP_URL"
    echo ""
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Step 1: Export data from Google Sheets
echo "Step 1: Exporting data from Google Sheets..."
echo "----------------------------------------"
node scripts/export-sheets-data.js

if [ ! -f data-export/leads.json ]; then
    echo "❌ Error: Export failed - leads.json not found"
    exit 1
fi

echo ""
echo "✅ Data exported successfully"
echo ""

# Step 2: Migrate to Supabase
echo "Step 2: Migrating data to Supabase..."
echo "----------------------------------------"
node scripts/migrate-to-supabase.js

echo ""
echo "=========================================="
echo "✅ Migration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Verify data in Supabase Dashboard"
echo "  2. Test locally: npm start"
echo "  3. Check Database Health Monitor"
echo "  4. Deploy to production: vercel --prod"
echo ""
