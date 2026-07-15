function App() {
  return (
    <div className="app">
      <header>
        <h1>CloudNative Platform</h1>
        <p>Microservices Demo</p>
      </header>
      <main>
        <section className="services">
          <h2>Services</h2>
          <div className="service-grid">
            <div className="service-card">
              <h3>User Service</h3>
              <button onClick={() => fetch('/api/users')}>Get Users</button>
            </div>
            <div className="service-card">
              <h3>Product Service</h3>
              <button onClick={() => fetch('/api/products')}>Get Products</button>
            </div>
            <div className="service-card">
              <h3>Order Service</h3>
              <button onClick={() => fetch('/api/orders')}>Get Orders</button>
            </div>
            <div className="service-card">
              <h3>Payment Service</h3>
              <button onClick={() => fetch('/api/payments')}>Get Payments</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App