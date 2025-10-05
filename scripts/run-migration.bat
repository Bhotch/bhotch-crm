@echo off
REM Bhotch CRM - Supabase Migration Helper Script (Windows)
REM This script automates the complete migration process

echo ==========================================
echo Bhotch CRM - Supabase Migration
echo ==========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Error: .env.local not found
    echo.
    echo Please create .env.local with your Supabase credentials:
    echo   copy .env.example .env.local
    echo   REM Then edit .env.local with your actual values
    echo.
    pause
    exit /b 1
)

REM Load environment variables from .env.local
for /f "usebackq tokens=*" %%a in (".env.local") do (
    set "%%a"
)

REM Check required variables
if "%REACT_APP_SUPABASE_URL%"=="" (
    echo Error: Missing REACT_APP_SUPABASE_URL in .env.local
    echo.
    pause
    exit /b 1
)

if "%REACT_APP_SUPABASE_SERVICE_KEY%"=="" (
    echo Error: Missing REACT_APP_SUPABASE_SERVICE_KEY in .env.local
    echo.
    pause
    exit /b 1
)

if "%REACT_APP_GAS_WEB_APP_URL%"=="" (
    echo Error: Missing REACT_APP_GAS_WEB_APP_URL in .env.local
    echo.
    pause
    exit /b 1
)

echo Environment variables loaded
echo.

REM Step 1: Export data from Google Sheets
echo Step 1: Exporting data from Google Sheets...
echo ----------------------------------------
node scripts\export-sheets-data.js

if not exist data-export\leads.json (
    echo Error: Export failed - leads.json not found
    pause
    exit /b 1
)

echo.
echo Data exported successfully
echo.

REM Step 2: Migrate to Supabase
echo Step 2: Migrating data to Supabase...
echo ----------------------------------------
node scripts\migrate-to-supabase.js

echo.
echo ==========================================
echo Migration Complete!
echo ==========================================
echo.
echo Next steps:
echo   1. Verify data in Supabase Dashboard
echo   2. Test locally: npm start
echo   3. Check Database Health Monitor
echo   4. Deploy to production: vercel --prod
echo.
pause
