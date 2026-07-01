const db = require('../database');

function runTest() {
  console.log('=== STARTING TDD TEST FOR AGENT GLOBE TRAFFIC ===');

  const agentUuid = '8A-V3-PB-85';
  console.log(`- Fetching countries for agent: ${agentUuid}`);
  const countries = db.getLatestCountries(15, null, agentUuid);

  if (!Array.isArray(countries)) {
    throw new Error('Countries result should be an array');
  }

  console.log(`- Retrieved ${countries.length} country stats`);
  if (countries.length === 0) {
    throw new Error('No country records found for agent flows. Verify if sample flows/geoip cache is set up.');
  }

  // Check each record has country_code and country_name, and valid values
  for (const r of countries) {
    console.log(`  Country: ${r.country_name} (${r.country_code}) | Download: ${r.download} | Upload: ${r.upload} | Flows: ${r.flow_count}`);
    
    if (!r.country_name) {
      throw new Error('Record has missing country_name');
    }
    if (!r.country_code) {
      throw new Error(`Record for ${r.country_name} is missing country_code!`);
    }
    if (r.country_code.length !== 2) {
      throw new Error(`Invalid country_code format for ${r.country_name}: ${r.country_code}`);
    }
    if (typeof r.download !== 'number' || typeof r.upload !== 'number') {
      throw new Error(`Invalid download/upload type for ${r.country_name}`);
    }
  }

  console.log('\n=== ALL AGENT GLOBE TRAFFIC TESTS PASSED SUCCESSFULLY! ===');
}

try {
  runTest();
} catch (err) {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
}
