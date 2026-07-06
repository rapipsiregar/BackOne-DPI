fetch("https://backend.demoplace.my.id/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "password" })
}).then(res => res.text()).then(text => {
  console.log("RESPONSE:", text.substring(0, 100));
}).catch(console.error);
