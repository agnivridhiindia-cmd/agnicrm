async function testLogin() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kshitiz007singh@gmail.com',
        password: 'password123'
      })
    });
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', data);
  } catch (error) {
    console.log('ERROR:', error);
  }
}

testLogin();
