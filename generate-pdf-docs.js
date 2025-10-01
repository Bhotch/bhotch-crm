/**
 * PDF Documentation Generator
 * Generates comprehensive PDF documentation for Bhotch CRM
 */

const fs = require('fs');
const { jsPDF } = require('jspdf');

// Create new PDF document
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Page settings
const pageWidth = 210;
const pageHeight = 297;
const margin = 20;
const contentWidth = pageWidth - (margin * 2);
let yPosition = margin;

// Colors
const primaryColor = '#3B82F6';
const secondaryColor = '#10B981';
const darkColor = '#1F2937';
const lightColor = '#6B7280';

// Helper function to add new page if needed
function checkAddPage(requiredSpace = 20) {
  if (yPosition + requiredSpace > pageHeight - margin) {
    doc.addPage();
    yPosition = margin;
    return true;
  }
  return false;
}

// Helper function to add text with wrapping
function addText(text, fontSize, color, isBold = false, maxWidth = contentWidth) {
  doc.setFontSize(fontSize);
  doc.setTextColor(color);
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');

  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach(line => {
    checkAddPage();
    doc.text(line, margin, yPosition);
    yPosition += fontSize * 0.4;
  });
  yPosition += 2;
}

// Helper function to add heading
function addHeading(text, level = 1) {
  checkAddPage(15);
  const fontSize = level === 1 ? 20 : level === 2 ? 16 : 14;
  const color = level === 1 ? primaryColor : level === 2 ? darkColor : darkColor;

  if (level === 1) {
    yPosition += 5;
  }

  addText(text, fontSize, color, true);
  yPosition += level === 1 ? 5 : 3;
}

// Helper function to add bullet point
function addBullet(text) {
  checkAddPage();
  doc.setFontSize(11);
  doc.setTextColor(darkColor);
  doc.text('•', margin + 5, yPosition);

  const lines = doc.splitTextToSize(text, contentWidth - 10);
  lines.forEach((line, index) => {
    if (index > 0) checkAddPage();
    doc.text(line, margin + 10, yPosition);
    yPosition += 5;
  });
}

// Helper function to add horizontal line
function addHorizontalLine() {
  checkAddPage();
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
}

// ============================================
// GENERATE PDF CONTENT
// ============================================

// Cover Page
doc.setFillColor(59, 130, 246);
doc.rect(0, 0, pageWidth, 80, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(32);
doc.setFont('helvetica', 'bold');
doc.text('Bhotch CRM', pageWidth / 2, 35, { align: 'center' });

doc.setFontSize(18);
doc.setFont('helvetica', 'normal');
doc.text('Complete Features & User Guide', pageWidth / 2, 50, { align: 'center' });

doc.setFontSize(12);
doc.text('Version 2.0.0', pageWidth / 2, 65, { align: 'center' });

yPosition = 100;

// System Overview
addHeading('System Overview', 1);
addText('Bhotch CRM is a state-of-the-art Customer Relationship Management system designed specifically for roofing and exterior home improvement companies. It combines cutting-edge door-to-door canvassing tools with advanced 3D visualization capabilities.', 11, darkColor);

yPosition += 5;
addHeading('Key Highlights', 2);
addBullet('Advanced Canvassing System with GPS tracking and route optimization');
addBullet('360° Product Visualization with interactive 3D placement');
addBullet('Real-time Analytics and team leaderboards');
addBullet('Offline-Ready with local storage synchronization');
addBullet('Mobile Optimized for field sales teams');
addBullet('Production Deployed on Vercel');

yPosition += 5;
addHorizontalLine();

// Feature 1: Canvassing System
addHeading('Feature 1: Advanced Canvassing System', 1);

addHeading('Overview', 2);
addText('A comprehensive door-to-door canvassing solution that rivals industry leaders like SalesRabbit and SPOTIO. Designed to maximize field sales efficiency with real-time GPS tracking, intelligent route optimization, and territory management.', 11, darkColor);

yPosition += 5;
addHeading('Core Features', 2);

addHeading('1. Real-Time GPS Tracking', 3);
addBullet('Update Interval: 30 seconds');
addBullet('Battery Optimized: Distance-based filtering (minimum 10 meters)');
addBullet('High Accuracy: GPS mode with 10-second timeout');
addBullet('Persistent Location History');

yPosition += 3;
addHeading('2. Property Status Management', 3);
addText('Eight distinct property statuses with color-coded markers:', 11, darkColor);
addBullet('Not Contacted (Gray) - Property not yet visited');
addBullet('Interested (Green) - Homeowner showed interest');
addBullet('Appointment (Blue) - Appointment scheduled');
addBullet('Sold (Purple) - Sale completed');
addBullet('Callback (Amber) - Needs follow-up call');
addBullet('Not Home (Gray) - Nobody answered');
addBullet('Not Interested (Red) - Homeowner declined');
addBullet('DNC (Black) - Do Not Contact list');

yPosition += 3;
addHeading('3. Territory Management', 3);
addBullet('Hand-drawn territory creation with polygon, rectangle, and circle tools');
addBullet('Editable boundaries with drag-and-drop');
addBullet('Territory statistics (area in square miles)');
addBullet('Color-coded territories with overlap detection');

yPosition += 3;
addHeading('4. Route Optimization', 3);
addBullet('AI-powered nearest neighbor algorithm');
addBullet('Traffic-aware route optimization');
addBullet('Multi-stop planning with time estimates');
addBullet('Turn-by-turn navigation');

yPosition += 3;
addHeading('5. Analytics Dashboard', 3);
addBullet('Total doors knocked tracking');
addBullet('Contact rate percentage');
addBullet('Appointments and sales metrics');
addBullet('Conversion funnel visualization');
addBullet('Performance trends and comparisons');

yPosition += 5;
addHeading('Expected Performance Improvements', 2);
addBullet('40% increase in doors knocked per day');
addBullet('25% improvement in contact rate');
addBullet('60% reduction in territory management time');
addBullet('Sub-3 second map load time');

yPosition += 5;
addHorizontalLine();

// Feature 2: 360° Visualization
addHeading('Feature 2: 360° Visualization & Product Designer', 1);

addHeading('Overview', 2);
addText('A revolutionary 3D visualization system that allows customers to see exactly how roofing products and exterior lighting will look on their home before purchasing. Includes advanced photogrammetry, AI surface detection, and real-time product placement.', 11, darkColor);

yPosition += 5;
addHeading('Core Features', 2);

addHeading('1. Malarkey Shingle System', 3);
addText('Seven premium shingle options with realistic 3D preview:', 11, darkColor);
addBullet('Legacy® Weathered Wood - $125/sq (30-year warranty)');
addBullet('Vista® Stonewood - $115/sq (Wind Resistant)');
addBullet('Highland® Midnight Black - $135/sq (Impact Rated)');
addBullet('Highlander® Driftwood - $145/sq (50-year premium)');
addBullet('Windsor® Charcoal - $105/sq (Economy line)');
addBullet('Legacy® Terra Cotta - $130/sq (Cool Roof)');
addBullet('Vista® Storm Grey - $120/sq (ENERGY STAR®)');

yPosition += 3;
addHeading('2. Rime Lighting Designer', 3);
addText('Four lighting product types with advanced controls:', 11, darkColor);
addBullet('Track Lighting - $28/ft (Continuous run, adjustable)');
addBullet('Accent Spotlight - $85 each (30° beam, RGB color)');
addBullet('Flood Wash - $125 each (120° beam, high lumens)');
addBullet('Ground Uplight - $95 each (60° beam, weatherproof)');

yPosition += 2;
addText('Auto-Placement Patterns:', 11, darkColor, true);
addBullet('Uniform Spacing - Even distribution along eaves');
addBullet('Dramatic Accent - Highlight architectural features');
addBullet('Architectural Highlight - Emphasize specific elements');
addBullet('Ambient Wash - Soft overall illumination');

yPosition += 3;
addHeading('3. Photo Capture System', 3);
addText('8-Photo workflow for 3D reconstruction:', 11, darkColor);
addBullet('Front Left Corner (45° angle)');
addBullet('Front Center (Direct facing)');
addBullet('Front Right Corner (45° angle)');
addBullet('Right Side (Perpendicular)');
addBullet('Rear corners and center views');
addBullet('Left Side (Perpendicular)');

yPosition += 3;
addHeading('4. AI Surface Detection', 3);
addBullet('Automatic roof surface detection (95%+ accuracy)');
addBullet('Multi-surface analysis (walls, eaves, windows)');
addBullet('Edge and corner detection');
addBullet('Measurement extraction');
addBullet('Smart placement recommendations');

yPosition += 3;
addHeading('5. Cost Estimator', 3);
addText('Automatic calculations include:', 11, darkColor);
addBullet('Material quantities (squares, linear feet)');
addBullet('Product pricing with waste factor (10-15%)');
addBullet('Labor costs and fees');
addBullet('Detailed breakdown by component');
addBullet('Total project cost estimation');

yPosition += 3;
addHeading('6. PDF Report Generator', 3);
addText('Professional reports include:', 11, darkColor);
addBullet('Customer information and property address');
addBullet('Before/After visualizations');
addBullet('Product specifications');
addBullet('Detailed cost breakdown');
addBullet('Company branding and digital signature section');

yPosition += 5;
addHorizontalLine();

// Technical Stack
addHeading('Technical Stack', 1);

addHeading('Core Technologies', 2);
addBullet('React 18.3.1 - Frontend framework');
addBullet('Zustand 5.0.8 - State management');
addBullet('TailwindCSS 3.3.0 - Styling');
addBullet('Lucide React - Icon library');

yPosition += 3;
addHeading('3D Rendering', 2);
addBullet('Three.js 0.180.0 - 3D engine');
addBullet('React Three Fiber 8.18.0 - React integration');
addBullet('React Three Drei 9.122.0 - Helper components');

yPosition += 3;
addHeading('Mapping & Location', 2);
addBullet('@react-google-maps/api 2.20.7 - Google Maps');
addBullet('@turf/turf 7.2.0 - Geospatial calculations');
addBullet('GeoJSON 0.5.0 - Geographic data');

yPosition += 3;
addHeading('Data Management', 2);
addBullet('Dexie 4.2.0 - IndexedDB wrapper');
addBullet('LocalForage 1.10.0 - Local storage');
addBullet('Redux Persist 6.0.0 - State persistence');

yPosition += 5;
addHorizontalLine();

// Deployment Information
addHeading('Deployment Information', 1);

addHeading('Current Production Deployment', 2);
addText('Platform: Vercel', 11, darkColor, true);
addText('URL: https://bhotch-plzxctsa2-brandon-hotchkiss-projects.vercel.app', 10, primaryColor);
addText('Status: Ready (Active)', 11, secondaryColor, true);
addText('Environment: Production', 11, darkColor);
addText('Node Version: 22.x', 11, darkColor);
addText('Build Time: ~2 minutes', 11, darkColor);
addText('Region: Washington, D.C. (iad1)', 11, darkColor);

yPosition += 5;
addHeading('Build Statistics', 2);
addText('File sizes after gzip compression:', 11, darkColor);
addBullet('Main JS: 863.47 kB');
addBullet('Chunk 239: 46.35 kB');
addBullet('Chunk 455: 43.26 kB');
addBullet('Main CSS: 9.14 kB');

yPosition += 5;
addHorizontalLine();

// Getting Started
addHeading('Getting Started', 1);

addHeading('Installation', 2);
addText('1. Clone the repository from GitHub', 11, darkColor);
addText('2. Install dependencies: npm install', 11, darkColor);
addText('3. Configure environment variables (.env.local)', 11, darkColor);
addText('4. Start development server: npm start', 11, darkColor);
addText('5. Open http://localhost:3000 in browser', 11, darkColor);

yPosition += 5;
addHeading('Required Environment Variables', 2);
addBullet('REACT_APP_GOOGLE_MAPS_API_KEY - Google Maps API key');
addBullet('REACT_APP_FIREBASE_API_KEY - Firebase API key');
addBullet('REACT_APP_FIREBASE_AUTH_DOMAIN - Firebase auth domain');
addBullet('REACT_APP_FIREBASE_PROJECT_ID - Firebase project ID');

yPosition += 5;
addHeading('Build for Production', 2);
addText('npm run build', 11, darkColor, true);
addText('This creates an optimized production build in the /build folder.', 11, darkColor);

yPosition += 3;
addHeading('Deploy to Vercel', 2);
addText('vercel deploy --prod', 11, darkColor, true);
addText('Automatic deployment on push to main branch is configured.', 11, darkColor);

yPosition += 5;
addHorizontalLine();

// Best Practices
addHeading('Best Practices', 1);

addHeading('Canvassing System', 2);
addBullet('Start GPS tracking before leaving the office');
addBullet('Update property status immediately after contact');
addBullet('Use notes to document homeowner preferences');
addBullet('Create optimized routes every morning');
addBullet('Review analytics at end of each day');

yPosition += 3;
addHeading('360° Visualization', 2);
addBullet('Use good lighting for photo capture');
addBullet('Stand 20-30 feet from house for photos');
addBullet('Follow on-screen guidance for photo angles');
addBullet('Allow 2-3 minutes for 3D processing');
addBullet('Start with shingles, then add lighting');
addBullet('Export designs regularly to avoid data loss');

yPosition += 5;
addHorizontalLine();

// Support
addHeading('Support & Resources', 1);

addHeading('Documentation', 2);
addBullet('CANVASSING_README.md - Detailed canvassing guide');
addBullet('PHASE3_COMPLETE.md - 360° system documentation');
addBullet('API_DOCUMENTATION.md - API reference guide');
addBullet('MASTER_FEATURES_GUIDE.md - This comprehensive guide');

yPosition += 3;
addHeading('Contact Information', 2);
addText('Email: brandon@rimehq.net', 11, primaryColor);
addText('GitHub: https://github.com/your-repo/bhotch-crm', 11, primaryColor);
addText('Production: https://bhotch-plzxctsa2-brandon-hotchkiss-projects.vercel.app', 10, primaryColor);

yPosition += 10;

// Footer
doc.setFontSize(10);
doc.setTextColor(lightColor);
doc.text('© 2025 Bhotch CRM. All rights reserved.', pageWidth / 2, pageHeight - 15, { align: 'center' });
doc.text('Version 2.0.0 - October 1, 2025', pageWidth / 2, pageHeight - 10, { align: 'center' });

// Save PDF
const outputPath = 'BHOTCH_CRM_COMPLETE_GUIDE.pdf';
doc.save(outputPath);

console.log(`✅ PDF documentation generated successfully: ${outputPath}`);
console.log(`📄 Total pages: ${doc.internal.getNumberOfPages()}`);
console.log(`📦 File saved to: ${__dirname}/${outputPath}`);
