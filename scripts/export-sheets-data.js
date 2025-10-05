// Run this script BEFORE migrating to capture current data
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Get the Apps Script URL from environment
const APPS_SCRIPT_URL = process.env.REACT_APP_GAS_WEB_APP_URL;

if (!APPS_SCRIPT_URL) {
  console.error('❌ Error: REACT_APP_GAS_WEB_APP_URL environment variable is not set');
  console.error('Please set it in your .env file or run:');
  console.error('  REACT_APP_GAS_WEB_APP_URL=<your-url> node scripts/export-sheets-data.js');
  process.exit(1);
}

async function exportAllData() {
  try {
    // Create data-export directory if it doesn't exist
    const exportDir = path.join(__dirname, '..', 'data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      console.log('📁 Created data-export directory');
    }

    console.log('🔄 Starting data export from Google Sheets...\n');
    console.log(`Using URL: ${APPS_SCRIPT_URL}\n`);

    // Export leads
    console.log('📊 Exporting leads...');
    try {
      const leadsResponse = await axios.post(APPS_SCRIPT_URL, {
        action: 'getLeads'
      }, {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      const leadsData = leadsResponse.data;
      if (leadsData.success === false) {
        throw new Error(leadsData.message || 'Failed to fetch leads');
      }

      const leads = leadsData.data || leadsData.leads || [];
      fs.writeFileSync(
        path.join(exportDir, 'leads.json'),
        JSON.stringify(leads, null, 2)
      );
      console.log(`✅ Exported ${leads.length} leads`);
    } catch (error) {
      console.error(`❌ Failed to export leads: ${error.message}`);
      throw error;
    }

    // Export job counts
    console.log('📊 Exporting job counts...');
    try {
      const jobCountsResponse = await axios.post(APPS_SCRIPT_URL, {
        action: 'getJobCounts'
      }, {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      const jobCountsData = jobCountsResponse.data;
      if (jobCountsData.success === false) {
        throw new Error(jobCountsData.message || 'Failed to fetch job counts');
      }

      const jobCounts = jobCountsData.data || jobCountsData.jobCounts || [];
      fs.writeFileSync(
        path.join(exportDir, 'jobcounts.json'),
        JSON.stringify(jobCounts, null, 2)
      );
      console.log(`✅ Exported ${jobCounts.length} job counts`);
    } catch (error) {
      console.error(`❌ Failed to export job counts: ${error.message}`);
      // Don't fail the entire export if job counts fail
    }

    // Export metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      sourceUrl: APPS_SCRIPT_URL,
      version: '1.0.0'
    };
    fs.writeFileSync(
      path.join(exportDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n✅ Export complete! Files saved to data-export/');
    console.log('📁 Files created:');
    console.log('   - data-export/leads.json');
    console.log('   - data-export/jobcounts.json');
    console.log('   - data-export/metadata.json');
    console.log('\nYou can now run: node scripts/migrate-to-supabase.js');
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

exportAllData();
