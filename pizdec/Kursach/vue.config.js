module.exports = {
  devServer: {
    host: "0.0.0.0",
    allowedHosts: "all",
    client: {
      webSocketURL: {
        protocol: "wss",
        hostname: "localhost",
        port: 8080,
      },
    },
  },
};
