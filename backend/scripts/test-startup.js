const axios = require('axios');

async function testServerStartup() {
  console.log('🧪 Testing Dream Journal Pro API server startup...\n');
  
  const baseUrl = 'http://localhost:3000';
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/health`,
      expectedStatus: 200,
    },
    {
      name: 'API Info',
      url: `${baseUrl}/api`,
      expectedStatus: 200,
    },
    {
      name: 'Subscription Prices (Public)',
      url: `${baseUrl}/api/subscriptions/prices`,
      expectedStatus: 200,
    },
    {
      name: 'Invalid Route (404)',
      url: `${baseUrl}/invalid-route`,
      expectedStatus: 404,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await axios.get(test.url);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED (Expected: ${test.expectedStatus}, Got: ${response.status})`);
        failed++;
      }
    } catch (error) {
      if (error.response && error.response.status === test.expectedStatus) {
        console.log(`✅ ${test.name} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED (${error.message})`);
        failed++;
      }
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All basic connectivity tests passed!');
    console.log('✨ Server is ready for development and testing.');
  } else {
    console.log('⚠️  Some tests failed. Check server configuration.');
    process.exit(1);
  }
}

// Run tests with a delay to allow server startup
setTimeout(testServerStartup, 2000);