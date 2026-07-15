import express from 'express'
import axios from 'axios'

const app = express()
const PORT = process.env.PORT || 3004

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001'
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003'

app.use(express.json())

// In-memory data store
const orders = new Map()
let orderIdCounter = 1

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service', timestamp: new Date().toISOString() })
})

// Get all orders
app.get('/orders', (req, res) => {
  res.json(Array.from(orders.values()))
})

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const order = orders.get(parseInt(req.params.id))
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }
  res.json(order)
})

// Create order
app.post('/orders', async (req, res) => {
  const { userId, productId, quantity } = req.body
  
  if (!userId || !productId || !quantity) {
    return res.status(400).json({ error: 'userId, productId, and quantity are required' })
  }
  
  try {
    // Fetch user
    const userResponse = await axios.get(`${USER_SERVICE_URL}/users/${userId}`)
    const user = userResponse.data
    
    // Fetch product
    const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`)
    const product = productResponse.data
    
    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock', available: product.stock })
    }
    
    const total = product.price * quantity
    
    // Create order
    const order = {
      id: orderIdCounter++,
      userId,
      productId,
      quantity,
      total,
      status: 'pending',
      user: { id: user.id, name: user.name, email: user.email },
      product: { id: product.id, name: product.name, price: product.price },
      createdAt: new Date().toISOString()
    }
    
    orders.set(order.id, order)
    
    // Reserve stock (decrease product stock)
    await axios.put(`${PRODUCT_SERVICE_URL}/products/${productId}`, {
      stock: product.stock - quantity
    })
    
    // Process payment
    try {
      const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, {
        orderId: order.id,
        amount: total,
        userId
      })
      
      order.payment = paymentResponse.data
      order.status = 'completed'
      order.completedAt = new Date().toISOString()
      orders.set(order.id, order)
      
      return res.status(201).json(order)
    } catch (paymentError) {
      order.status = 'payment_failed'
      order.paymentError = paymentError.message
      orders.set(order.id, order)
      
      // Rollback stock
      await axios.put(`${PRODUCT_SERVICE_URL}/products/${productId}`, {
        stock: product.stock
      }).catch(() => {})
      
      return res.status(400).json({ error: 'Payment failed', order })
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'User or product not found' })
    }
    console.error('Order creation error:', error.message)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

app.listen(PORT, () => {
  console.log(`Order service listening on port ${PORT}`)
})