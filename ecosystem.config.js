module.exports = {
  apps: [
    {
      name: "backone-frontend",
      script: "./.next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 8009
      }
    },
    {
      name: "backone-backend",
      script: "./backend/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "backone-proxy",
      script: "./proxy/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
