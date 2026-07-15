import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
const PORT = process.env.PORT || 8000

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001'
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003'
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3004'

// app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway', timestamp: new Date().toISOString() })
})

// Proxy to User Service
app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' }
}))

// Proxy to Product Service
app.use('/api/products', createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '/products' }
}))

// Proxy to Payment Service
app.use('/api/payments', createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/payments' }
}))

// Proxy to Order Service
app.use('/api/orders', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/orders' }
}))

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'API Gateway',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments'
    }
  })
})

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`)
  console.log(`  User Service: ${USER_SERVICE_URL}`)
  console.log(`  Product Service: ${PRODUCT_SERVICE_URL}`)
  console.log(`  Order Service: ${ORDER_SERVICE_URL}`)
  console.log(`  Payment Service: ${PAYMENT_SERVICE_URL}`)
})