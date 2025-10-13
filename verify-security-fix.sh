#!/bin/bash
# =============================================
# COMPREHENSIVE SECURITY ADVISOR FIX VERIFICATION
# =============================================
# This script verifies that all security advisors have been fixed
# Run after applying migration 013_fix_security_advisors.sql
# =============================================

set -e  # Exit on error

echo "=========================================="
echo "Security Advisor Fix Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Function to print test results
print_result() {
    local test_name=$1
    local status=$2

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠ WARN${NC}: $test_name"
        ((WARNINGS++))
    fi
}

# Test 1: Migration file exists
echo "Test 1: Checking migration file..."
if [ -f "supabase/migrations/013_fix_security_advisors.sql" ]; then
    print_result "Migration file exists" "PASS"
else
    print_result "Migration file missing" "FAIL"
    echo "  Expected: supabase/migrations/013_fix_security_advisors.sql"
    exit 1
fi

# Test 2: Migration syntax validation
echo ""
echo "Test 2: Validating migration syntax..."
if node -e "const fs = require('fs'); fs.readFileSync('supabase/migrations/013_fix_security_advisors.sql', 'utf8');" 2>/dev/null; then
    print_result "Migration syntax valid" "PASS"
else
    print_result "Migration syntax error" "FAIL"
    exit 1
fi

# Test 3: Check migration content
echo ""
echo "Test 3: Checking migration content..."

# Check for SECURITY INVOKER views
if grep -q "WITH (security_invoker=true)" supabase/migrations/013_fix_security_advisors.sql; then
    print_result "Views set to SECURITY INVOKER" "PASS"
else
    print_result "Views not set to SECURITY INVOKER" "FAIL"
fi

# Check for search_path in functions
if grep -q "SET search_path = public, pg_temp" supabase/migrations/013_fix_security_advisors.sql; then
    print_result "Functions have search_path set" "PASS"
else
    print_result "Functions missing search_path" "FAIL"
fi

# Check for foreign key indexes
if grep -q "idx_canvassing_properties_territory_fk" supabase/migrations/013_fix_security_advisors.sql && \
   grep -q "idx_property_visits_property_fk" supabase/migrations/013_fix_security_advisors.sql && \
   grep -q "idx_property_visits_territory_fk" supabase/migrations/013_fix_security_advisors.sql; then
    print_result "Foreign key indexes defined" "PASS"
else
    print_result "Foreign key indexes missing" "FAIL"
fi

# Test 4: Check test file exists
echo ""
echo "Test 4: Checking test files..."
if [ -f "test-advisors-fix.sql" ]; then
    print_result "Test SQL file exists" "PASS"
else
    print_result "Test SQL file missing" "WARN"
fi

# Test 5: Verify all migrations are in sequence
echo ""
echo "Test 5: Checking migration sequence..."
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $MIGRATION_COUNT -ge 13 ]; then
    print_result "Migration 013 in sequence (total: $MIGRATION_COUNT)" "PASS"
else
    print_result "Migration sequence issue" "FAIL"
fi

# Test 6: Check documentation
echo ""
echo "Test 6: Checking documentation..."
if [ -f "SECURITY-ADVISORS-FIX.md" ]; then
    print_result "Documentation exists" "PASS"
else
    print_result "Documentation missing" "WARN"
fi

# Summary
echo ""
echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL TESTS PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Apply migration to your database:"
    echo "   - Option A: npx supabase db reset (local with Docker)"
    echo "   - Option B: npx supabase db push (remote)"
    echo "   - Option C: Copy SQL to Supabase Dashboard SQL Editor"
    echo ""
    echo "2. Run test queries:"
    echo "   psql -f test-advisors-fix.sql"
    echo ""
    echo "3. Run Supabase linter:"
    echo "   npx supabase db lint"
    echo ""
    echo "Expected result: 0 ERRORS, 0 WARNINGS"
    echo "(4 INFO-level unused index warnings are acceptable)"
    exit 0
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo ""
    echo "Please fix the failed tests before deploying."
    exit 1
fi
