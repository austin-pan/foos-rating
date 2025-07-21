import { createProxyMiddleware } from 'http-proxy-middleware';

const serviceProxy = createProxyMiddleware({
  target: process.env.SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  },
  on: {
    error: (err, req, res, target) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Failed to connect to the API server' });
    },
    proxyReq: (proxyReq, req) => {
      console.log(process.env.SERVICE_URL);
      console.log(proxyReq.path);
      proxyReq.setHeader('X-Auth-Token', process.env.SHARED_SECRET);
    }
  }
});

export default serviceProxy;
