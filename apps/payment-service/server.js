import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

const app = express()
const PORT = process.env.PORT || 3003

app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

// In-memory payment store
const payments = new Map()
let paymentIdCounter = 1

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service', timestamp: new Date().toISOString() })
})

// Get all payments
app.get('/payments', (req, res) => {
  res.json(Array.from(payments.values()))
})

// Get payment by ID
app.get('/payments/:id', (req, res) => {
  const payment = payments.get(parseInt(req.params.id))
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }
  res.json(payment)
})

// Process payment
app.post('/payments', (req, res) => {
  const { orderId, amount, userId, paymentMethod = 'credit_card' } = req.body
  
  if (!orderId || !amount || !userId) {
    return res.status(400).json({ error: 'orderId, amount, and userId are required' })
  }
  
  // Simulate payment processing (90% success rate)
  const success = Math.random() > 0.1
  
  const payment = {
    id: paymentIdCounter++,
    orderId,
    amount,
    userId,
    paymentMethod,
    status: success ? 'completed' : 'failed',
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    processedAt: new Date().toISOString()
  }
  
  payments.set(payment.id, payment)
  
  if (success) {
    res.status(201).json(payment)
  } else {
    res.status(402).json({ error: 'Payment declined', payment })
  }
})

// Refund payment
app.post('/payments/:id/refund', (req, res) => {
  const id = parseInt(req.params.id)
  const payment = payments.get(id)
  
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' })
  }
  
  if (payment.status !== 'completed') {
    return res.status(400).json({ error: 'Only completed payments can be refunded' })
  }
  
  const refund = {
    id: paymentIdCounter++,
    originalPaymentId: id,
    amount: payment.amount,
    status: 'completed',
    refundedAt: new Date().toISOString()
  }
  
  payments.set(refund.id, refund)
  payment.refunded = true
  payments.set(id, payment)
  
  res.json(refund)
})

app.listen(PORT, () => {
  console.log(`Payment service listening on port ${PORT}`)
})