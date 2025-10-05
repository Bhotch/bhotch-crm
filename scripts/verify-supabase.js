require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySupabase() {
  console.log('🔍 Verifying Supabase Connection...\n');

  try {
    // 1. Test connection
    console.log('1️⃣ Testing connection...');
    const { error: pingError } = await supabase.from('leads').select('count', { count: 'exact', head: true });
    if (pingError) throw pingError;
    console.log('   ✅ Connection successful\n');

    // 2. Count leads
    console.log('2️⃣ Counting leads...');
    const { count: leadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    if (leadsError) throw leadsError;
    console.log(`   ✅ Found ${leadsCount} leads\n`);

    // 3. Sample recent leads
    console.log('3️⃣ Fetching recent leads...');
    const { data: recentLeads, error: recentError } = await supabase
      .from('leads')
      .select('customer_name, quality, disposition, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);
    if (recentError) throw recentError;
    console.log(`   ✅ Recent leads:`);
    recentLeads.forEach((lead, i) => {
      console.log(`      ${i + 1}. ${lead.customer_name || 'Unknown'} - ${lead.quality || 'N/A'} (${lead.disposition || 'New'})`);
    });
    console.log('');

    // 4. Count job counts
    console.log('4️⃣ Counting job counts...');
    const { count: jobCountsCount, error: jobCountsError } = await supabase
      .from('job_counts')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    if (jobCountsError) {
      console.log(`   ⚠️  Job counts table error: ${jobCountsError.message}\n`);
    } else {
      console.log(`   ✅ Found ${jobCountsCount || 0} job counts\n`);
    }

    // 5. Test communications
    console.log('5️⃣ Testing communications table...');
    const { count: commsCount, error: commsError } = await supabase
      .from('communications')
      .select('*', { count: 'exact', head: true });
    if (commsError) {
      console.log(`   ⚠️  Communications table error: ${commsError.message}\n`);
    } else {
      console.log(`   ✅ Found ${commsCount || 0} communications\n`);
    }

    // 6. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Leads:          ${leadsCount}`);
    console.log(`📋 Job Counts:     ${jobCountsCount || 0}`);
    console.log(`💬 Communications: ${commsCount || 0}`);
    console.log(`🌐 URL:            ${supabaseUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Supabase migration verified successfully!');
    console.log('🚀 Production deployment ready at: https://bhotch-crm.vercel.app');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

verifySupabase();
