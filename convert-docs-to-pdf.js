const markdownpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

// List of documentation files to convert
const docs = [
  'API_DOCUMENTATION.md',
  'CANVASSING_IMPLEMENTATION_SUMMARY.md',
  'CANVASSING_MAP_FIX.md',
  'CANVASSING_README.md',
  'CLAUDE.md',
  'CLEANUP_SUMMARY.md',
  'DEVELOPER_GUIDE.md',
  'FINAL_FIX_SUMMARY.md',
  'MASTER_FEATURES_GUIDE.md',
  'PHASE2_FEATURES.md',
  'PHASE3_COMPLETE.md',
  'PROJECT_STATUS.md',
  'QUICK_START_CANVASSING.md',
  'README.md',
  'SYSTEM_HANDBOOK.md'
];

// Create PDF directory if it doesn't exist
const pdfDir = path.join(__dirname, 'docs-pdf');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
}

console.log('Converting markdown files to PDF...\n');

// Convert each file
let completed = 0;
let total = docs.length;

docs.forEach((doc, index) => {
  const inputPath = path.join(__dirname, doc);
  const outputPath = path.join(pdfDir, doc.replace('.md', '.pdf'));

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Skipping ${doc} - file not found`);
    total--;
    return;
  }

  markdownpdf()
    .from(inputPath)
    .to(outputPath, () => {
      completed++;
      console.log(`✓ Converted ${doc} -> ${path.basename(outputPath)}`);

      if (completed === total) {
        console.log(`\n✅ Successfully converted ${completed} files to PDF`);
        console.log(`📁 PDFs saved to: ${pdfDir}`);
      }
    });
});
