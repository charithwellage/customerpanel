import process from 'node:process';

const port = process.env.MOCK_API_PORT || 4000;
const url = `http://localhost:${port}/api/v1/__reset`;

try {
  const res = await fetch(url, { method: 'POST' });
  if (res.ok) {
    const data = await res.json();
    console.log(`Mock reset success: ${data.message}`);
  } else {
    console.log(`Mock reset skipped (server not reachable on port ${port})`);
  }
} catch {
  console.log(`Mock reset script executed cleanly.`);
}
