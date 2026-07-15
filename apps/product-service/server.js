import express from 'express'

const app = express()
const PORT = process.env.PORT || 3002

app.use(express.json())

// In-memory data store
const products = new Map()
let productIdCounter = 1

// Initialize with sample products
function initProducts() {
  const sampleProducts = [
    { id: productIdCounter++, name: 'Laptop', description: 'High-performance laptop', price: 999.99, stock: 50, category: 'Electronics', createdAt: new Date().toISOString() },
    { id: productIdCounter++, name: 'Smartphone', description: 'Latest smartphone model', price: 699.99, stock: 100, category: 'Electronics', createdAt: new Date().toISOString() },
    { id: productIdCounter++, name: 'Headphones', description: 'Noise-cancelling headphones', price: 199.99, stock: 200, category: 'Audio', createdAt: new Date().toISOString() },
    { id: productIdCounter++, name: 'Keyboard', description: 'Mechanical keyboard', price: 129.99, stock: 150, category: 'Accessories', createdAt: new Date().toISOString() },
    { id: productIdCounter++, name: 'Monitor', description: '27-inch 4K monitor', price: 449.99, stock: 75, category: 'Electronics', createdAt: new Date().toISOString() }
  ]
  sampleProducts.forEach(product => products.set(product.id, product))
}

initProducts()

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-service', timestamp: new Date().toISOString() })
})

// Get all products
app.get('/products', (req, res) => {
  res.json(Array.from(products.values()))
})

// Get product by ID
app.get('/products/:id', (req, res) => {
  const product = products.get(parseInt(req.params.id))
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  res.json(product)
})

// Create product
app.post('/products', (req, res) => {
  const { name, description, price, stock, category } = req.body
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' })
  }
  const product = {
    id: productIdCounter++,
    name,
    description: description || '',
    price: parseFloat(price),
    stock: parseInt(stock) || 0,
    category: category || 'General',
    createdAt: new Date().toISOString()
  }
  products.set(product.id, product)
  res.status(201).json(product)
})

// Update product
app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const product = products.get(id)
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }
  const { name, description, price, stock, category } = req.body
  if (name) product.name = name
  if (description) product.description = description
  if (price !== undefined) product.price = parseFloat(price)
  if (stock !== undefined) product.stock = parseInt(stock)
  if (category) product.category = category
  product.updatedAt = new Date().toISOString()
  products.set(id, product)
  res.json(product)
})

// Delete product
app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id)
  if (!products.has(id)) {
    return res.status(404).json({ error: 'Product not found' })
  }
  products.delete(id)
  res.status(204).send()
})

app.listen(PORT, () => {
  console.log(`Product service listening on port ${PORT}`)
})