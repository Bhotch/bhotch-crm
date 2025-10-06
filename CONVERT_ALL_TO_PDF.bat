@echo off
echo ===============================================
echo   Bhotch CRM - Convert All Documents to PDF
echo ===============================================
echo.

:: Check if pandoc is installed
where pandoc >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pandoc is not installed!
    echo.
    echo Please install Pandoc first:
    echo   1. Run: choco install pandoc
    echo   2. Or download from: https://pandoc.org/installing.html
    echo.
    pause
    exit /b 1
)

echo [OK] Pandoc is installed
echo.

:: Create output directory
if not exist "docs\generated" mkdir "docs\generated"
echo [OK] Output directory ready: docs\generated
echo.

:: Get current date
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "currentDate=%YYYY%-%MM%-%DD%"

:: Convert System Guide
echo ========================================
echo Converting: COMPREHENSIVE_SYSTEM_GUIDE.md
echo ========================================
cd docs
pandoc COMPREHENSIVE_SYSTEM_GUIDE.md ^
  -o generated/Bhotch_CRM_System_Guide.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  --toc-depth=3 ^
  --number-sections ^
  -V geometry:margin=1in ^
  -V fontsize=10pt ^
  -V documentclass=report ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V urlcolor=blue ^
  -V toccolor=gray ^
  --highlight-style=tango ^
  -V title="Bhotch CRM - Comprehensive System Guide" ^
  -V author="Bhotch CRM Development Team" ^
  -V date="%currentDate%"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] System Guide PDF created!
) else (
    echo [ERROR] System Guide conversion failed!
)
echo.

:: Convert User Guide
echo ========================================
echo Converting: USER_FEATURE_GUIDE.md
echo ========================================
pandoc USER_FEATURE_GUIDE.md ^
  -o generated/Bhotch_CRM_User_Guide.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  --toc-depth=2 ^
  --number-sections ^
  -V geometry:margin=1in ^
  -V fontsize=11pt ^
  -V documentclass=article ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V urlcolor=blue ^
  -V toccolor=gray ^
  --highlight-style=tango ^
  -V title="Bhotch CRM - User Feature Guide" ^
  -V author="Bhotch CRM Development Team" ^
  -V date="%currentDate%"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] User Guide PDF created!
) else (
    echo [ERROR] User Guide conversion failed!
)
echo.

cd ..

:: Convert root documentation files
echo ========================================
echo Converting: Root Documentation Files
echo ========================================

:: CRM Status
echo Converting: CRM_SUPABASE_STATUS.md...
pandoc CRM_SUPABASE_STATUS.md ^
  -o docs/generated/CRM_Supabase_Status.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  -V geometry:margin=1in ^
  -V fontsize=11pt ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V title="CRM Supabase Status" ^
  -V date="%currentDate%"

:: Field Mapping
echo Converting: FIELD_MAPPING_REFERENCE.md...
pandoc FIELD_MAPPING_REFERENCE.md ^
  -o docs/generated/Field_Mapping_Reference.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  -V geometry:margin=1in ^
  -V fontsize=10pt ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V title="Field Mapping Reference" ^
  -V date="%currentDate%"

:: Testing Guide
echo Converting: HOW_TO_TEST_REALTIME_SYNC.md...
pandoc HOW_TO_TEST_REALTIME_SYNC.md ^
  -o docs/generated/How_To_Test_Realtime_Sync.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  -V geometry:margin=1in ^
  -V fontsize=11pt ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V title="How To Test Real-Time Sync" ^
  -V date="%currentDate%"

:: Migration Summary
echo Converting: MIGRATION_FIXES_SUMMARY.md...
pandoc MIGRATION_FIXES_SUMMARY.md ^
  -o docs/generated/Migration_Fixes_Summary.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  -V geometry:margin=1in ^
  -V fontsize=11pt ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V title="Migration Fixes Summary" ^
  -V date="%currentDate%"

:: Project Completion
echo Converting: PROJECT_COMPLETION_SUMMARY.md...
pandoc PROJECT_COMPLETION_SUMMARY.md ^
  -o docs/generated/Project_Completion_Summary.pdf ^
  --pdf-engine=xelatex ^
  --toc ^
  -V geometry:margin=1in ^
  -V fontsize=11pt ^
  -V colorlinks=true ^
  -V linkcolor=blue ^
  -V title="Project Completion Summary" ^
  -V date="%currentDate%"

echo.
echo ===============================================
echo   PDF Conversion Complete!
echo ===============================================
echo.
echo Generated PDFs in docs\generated\:
echo   1. Bhotch_CRM_System_Guide.pdf
echo   2. Bhotch_CRM_User_Guide.pdf
echo   3. CRM_Supabase_Status.pdf
echo   4. Field_Mapping_Reference.pdf
echo   5. How_To_Test_Realtime_Sync.pdf
echo   6. Migration_Fixes_Summary.pdf
echo   7. Project_Completion_Summary.pdf
echo.
echo Opening output folder...
explorer docs\generated
echo.
pause
