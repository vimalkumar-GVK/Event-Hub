const fetch = require('node-fetch');

async function testStats() {
    try {
        const response = await fetch('http://localhost:8000/api/system/stats');
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testStats();
