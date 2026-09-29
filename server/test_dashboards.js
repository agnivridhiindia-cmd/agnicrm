const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        let json = null;
        try { json = JSON.parse(body); } catch(e) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json, duration });
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function login(email, password = 'password123') {
  const payload = JSON.stringify({ email, password });
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);
  return res;
}

async function apiGet(path, token) {
  return request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/v1${path}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function testAll() {
  console.log('=== 1. TESTING HEALTH & LATENCY ===');
  const health = await request({ hostname: 'localhost', port: 5000, path: '/health', method: 'GET' });
  console.log(`GET /health: ${health.status} (${health.duration}ms)`);

  const accounts = [
    { role: 'Admin', email: 'admin@agni.com' },
    { role: 'Sales Manager (West)', email: 'eli@agni.com' },
    { role: 'Sales Manager (North)', email: 'ananya.sm@agni.com' },
    { role: 'Salesperson (West)', email: 'mia@agni.com' },
    { role: 'Salesperson (North)', email: 'arjun.sales@agni.com' },
  ];

  for (const acc of accounts) {
    console.log(`\n=== TESTING ROLE: ${acc.role} (${acc.email}) ===`);
    const loginRes = await login(acc.email);
    console.log(`Login status: ${loginRes.status} (${loginRes.duration}ms)`);
    if (loginRes.status !== 200) {
      console.error(`Login failed for ${acc.email}:`, loginRes.body);
      continue;
    }
    const token = loginRes.json?.token || loginRes.json?.data?.token;
    const user = loginRes.json?.user || loginRes.json?.data?.user;
    console.log(`User: ${user?.fullName}, Role: ${user?.role}, Branch: ${user?.branchId}`);

    // Test common endpoints
    const endpoints = [
      '/auth/me',
      '/clients',
      '/clients?isDeleted=true',
      '/requests',
      '/invoices',
      '/auth/users',
      '/branches',
      '/analytics/dashboard'
    ];

    for (const ep of endpoints) {
      const epRes = await apiGet(ep, token);
      const count = Array.isArray(epRes.json?.data) ? epRes.json?.data?.length : (epRes.json?.data ? 'object' : 'null');
      console.log(`  GET ${ep.padEnd(25)} -> ${epRes.status} (${String(epRes.duration).padStart(4)}ms) [Items: ${count}]`);
    }
  }

  // Check clients in DB
  console.log('\n=== TESTING CLIENT ROLE ===');
  const adminLogin = await login('admin@agni.com');
  const adminToken = adminLogin.json?.token || adminLogin.json?.data?.token;
  const clientsRes = await apiGet('/clients', adminToken);
  const clients = clientsRes.json?.data || [];
  console.log(`Total active clients found: ${clients.length}`);
  if (clients.length > 0) {
    const client = clients[0];
    console.log(`Testing client: ${client.name} (${client.email})`);
    const clientLogin = await login(client.email);
    console.log(`Client login status: ${clientLogin.status} (${clientLogin.duration}ms)`);
    if (clientLogin.status === 200) {
      const clientToken = clientLogin.json?.token || clientLogin.json?.data?.token;
      const myProfile = await apiGet('/clients/my-profile', clientToken);
      console.log(`  GET /clients/my-profile -> ${myProfile.status} (${myProfile.duration}ms)`);
      const myRequests = await apiGet('/requests', clientToken);
      console.log(`  GET /requests           -> ${myRequests.status} (${myRequests.duration}ms)`);
    } else {
      console.log('Client login response:', clientLogin.body);
    }
  }
}

testAll().catch(console.error);
