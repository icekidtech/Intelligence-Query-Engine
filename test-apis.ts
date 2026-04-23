import axios from 'axios';

async function testApis() {
  const name = 'John';
  
  console.log(`Testing APIs with name: ${name}\n`);

  try {
    console.log('1. Testing Genderize API...');
    const genderRes = await axios.get('https://api.genderize.io', {
      params: { name },
      timeout: 5000,
    });
    console.log('Genderize Response:', JSON.stringify(genderRes.data, null, 2));
  } catch (err) {
    console.error('Genderize Error:', (err as any).message);
  }

  try {
    console.log('\n2. Testing Agify API...');
    const ageRes = await axios.get('https://api.agify.io', {
      params: { name },
      timeout: 5000,
    });
    console.log('Agify Response:', JSON.stringify(ageRes.data, null, 2));
  } catch (err) {
    console.error('Agify Error:', (err as any).message);
  }

  try {
    console.log('\n3. Testing Nationalize API...');
    const natRes = await axios.get('https://api.nationalize.io', {
      params: { name },
      timeout: 5000,
    });
    console.log('Nationalize Response:', JSON.stringify(natRes.data, null, 2));
  } catch (err) {
    console.error('Nationalize Error:', (err as any).message);
  }
}

testApis();
