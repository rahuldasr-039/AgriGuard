async function testLogin() {
  const res = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "tester1@example.com",
      password: "Password@123"
    })
  });

  const data = await res.json();
  console.log("Login test response:", res.status, data.user);
}

testLogin().catch(console.error);
