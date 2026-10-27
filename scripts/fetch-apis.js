const fs = require('fs');
const path = require('path');

async function fetchJson(url, token) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.url}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function main() {
  const endpointKeys = ['API_URL_1', 'API_URL_2', 'API_URL_3'];
  const results = {};

  for (const key of endpointKeys) {
    const url = process.env[key];
    if (!url) {
      continue;
    }

    const index = key.split('_').pop();
    const token = process.env[`API_TOKEN_${index}`];

    try {
      const payload = await fetchJson(url, token);
      results[key] = {
        url,
        success: true,
        data: payload,
        fetchedAt: new Date().toISOString(),
      };
      console.log(`Fetched successfully: ${key}`);
    } catch (error) {
      results[key] = {
        url,
        success: false,
        error: error.message,
        fetchedAt: new Date().toISOString(),
      };
      console.error(`Failed to fetch ${key}: ${error.message}`);
    }
  }

  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const latestPath = path.join(dataDir, 'latest.json');
  const snapshotPath = path.join(dataDir, `api-snapshot-${timestamp}.json`);

  fs.writeFileSync(latestPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  fs.writeFileSync(snapshotPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));

  console.log('Saved API data snapshots to data/');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
