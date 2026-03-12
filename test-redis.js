const { createClient } = require('redis');

async function testRedis() {
  const client = createClient({
    url: 'redis://:ApexV2DBPassSecure2026GrowthScale!QazXswEdCv@127.0.0.1:6379'
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  try {
    await client.connect();
    console.log('Successfully connected to Redis');
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('Retrieved from Redis:', value);
    await client.disconnect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
}

testRedis();
