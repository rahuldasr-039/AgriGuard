async function testGetProductTests() {
  const res = await fetch("http://localhost:5000/api/v1/product-tests");
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data count:", data.length);
  console.log("Sample test:", data[0]);
}

testGetProductTests().catch(console.error);
