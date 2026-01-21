module.exports = {
  apps: [
    {
      name: "next-app",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // 👇 这里就是解决 Fetch Error 的关键
        NODE_TLS_REJECT_UNAUTHORIZED: "0"
      }
    }
  ]
}
