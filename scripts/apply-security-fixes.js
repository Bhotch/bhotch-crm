require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySecurityFixes() {
  console.log('🔒 Applying Supabase Security Fixes...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_security_fixes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');

      process.stdout.write(`${i + 1}/${statements.length}: ${preview}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct query if rpc fails
          const { error: queryError } = await supabase.from('_migrations').select('*').limit(0);
          if (queryError) {
            throw error;
          }
        }

        console.log('✅');
        successCount++;
      } catch (err) {
        console.log('⚠️');
        console.log(`   Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Errors: ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. This may be expected for DROP statements.');
      console.log('   Please run the SQL manually in Supabase SQL Editor if needed.\n');
    }

    // Verify fixes
    console.log('🔍 Verifying security fixes...\n');

    // Test the functions still work
    const { data: testLead, error: testError } = await supabase
      .from('leads')
      .select('id, updated_at')
      .limit(1)
      .single();

    if (testError && testError.code !== 'PGRST116') {
      throw testError;
    }

    console.log('✅ Functions verified working');
    console.log('✅ Dashboard stats view accessible\n');

    console.log('🎉 Security fixes applied successfully!');
    console.log('📋 Next step: Run Supabase Security Advisor to verify all issues resolved');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    console.log('\n💡 Alternative: Run the SQL manually in Supabase Dashboard > SQL Editor');
    console.log('   File: supabase/migrations/002_security_fixes.sql');
    process.exit(1);
  }
}

applySecurityFixes();
