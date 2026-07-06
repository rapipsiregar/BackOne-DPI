fetch("https://backend.demoplace.my.id/api/auth/login", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" 
  },
  body: JSON.stringify({ username: "admin", password: "password" })
}).then(res => {
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  return res.text();
}).then(text => {
  console.log("Body:", text.substring(0, 150));
}).catch(console.error);
