async function testApi() {
  const loginRes = await fetch('http://127.0.0.1:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'r.a.rimazmoulana@gmail.com', password: 'Password@1234' }),
  });
  const loginData = await loginRes.json();
  console.log('LOGIN RES:', loginData);
  const token = loginData.token;

  const authHeaders = { Authorization: `Bearer ${token}` };

  const dashRes = await fetch('http://127.0.0.1:4000/api/v1/customer/dashboard', { headers: authHeaders });
  const dashData = await dashRes.json();
  console.log('\nDASHBOARD DATA:', JSON.stringify(dashData, null, 2));

  const vehRes = await fetch('http://127.0.0.1:4000/api/v1/customer/vehicles', { headers: authHeaders });
  const vehData = await vehRes.json();
  console.log('\nVEHICLES COUNT:', vehData.items?.length);

  const invRes = await fetch('http://127.0.0.1:4000/api/v1/customer/invoices', { headers: authHeaders });
  const invData = await invRes.json();
  console.log('\nINVOICES COUNT:', invData.items?.length, 'TOTAL OUTSTANDING:', invData.totals?.totalOutstandingUsd);

  const notifRes = await fetch('http://127.0.0.1:4000/api/v1/customer/notifications', { headers: authHeaders });
  const notifData = await notifRes.json();
  console.log('\nNOTIFICATIONS COUNT:', notifData.items?.length, 'UNREAD COUNT:', notifData.unreadCount);

  const docRes = await fetch('http://127.0.0.1:4000/api/v1/customer/documents', { headers: authHeaders });
  const docData = await docRes.json();
  console.log('\nDOCUMENTS COUNT:', docData.items?.length, 'ITEMS:', docData.items);
}

testApi().catch(console.error);
