module.exports = {
  apps: [
    {
      name: "backone-proxy",
      script: "./proxy/index.js",
      env_file: ".env.production"
    },
    {
      name: "backone-backend",
      script: "./backend/server.js",
      env_file: ".env.production"
    },
    {
      name: "backone-frontend",
      script: "server.js",
      env_file: ".env.production",
      env: {
        PORT: 8009
      }
    }
  ]
};
