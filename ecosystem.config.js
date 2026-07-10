module.exports = {
  apps: [
    {
      name: "backone-frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
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
