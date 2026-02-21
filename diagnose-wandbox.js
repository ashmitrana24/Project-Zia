import axios from 'axios';

async function testWandbox() {
  console.log('--- Wandbox Diagnostic Tool ---');
  
  const payload = {
    compiler: 'cpython-3.13.8',
    code: 'print("Python Test Success")'
  };

  try {
    const response = await axios.post('https://wandbox.org/api/compile.json', payload);
    console.log('✅ SUCCESS!');
    console.log('Program Output:', response.data.program_message);
    console.log('Status:', response.data.status);
  } catch (error) {
    console.error('❌ API CALL FAILED');
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testWandbox();
