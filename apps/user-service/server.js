import express from "express";
import pool from "./db.js";

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() })
})

// Get all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Database error",
    });
  }
});

// Get user by ID
app.get('/users/:id', (req, res) => {
  const user = users.get(parseInt(req.params.id))
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

// Create user
app.post('/users', (req, res) => {
  const { name, email } = req.body
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }
  const user = {
    id: userIdCounter++,
    name,
    email,
    createdAt: new Date().toISOString()
  }
  users.set(user.id, user)
  res.status(201).json(user)
})

// Update user
app.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const user = users.get(id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  const { name, email } = req.body
  if (name) user.name = name
  if (email) user.email = email
  user.updatedAt = new Date().toISOString()
  users.set(id, user)
  res.json(user)
})

// Delete user
app.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id)
  if (!users.has(id)) {
    return res.status(404).json({ error: 'User not found' })
  }
  users.delete(id)
  res.status(204).send()
})

app.listen(PORT, () => {
  console.log(`User service listening on port ${PORT}`)
})