const express = require("express")
const mysql = require("mysql2/promise")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "user_access_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Initialize database tables
async function initDb() {
  try {
    const connection = await pool.getConnection()

    // Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('Employee', 'Manager', 'Admin') DEFAULT 'Employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create Software table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS software (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        access_levels JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create Requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        software_id INT NOT NULL,
        access_type VARCHAR(50) NOT NULL,
        reason TEXT,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (software_id) REFERENCES software(id)
      )
    `)

    connection.release()
    console.log("Database tables initialized")
  } catch (error) {
    console.error("Database initialization error:", error)
  }
}

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    req.user = decoded
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

// Authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" })
    }
    next()
  }
}

// Auth routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if user exists
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE username = ?", [username])
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Username already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    await pool.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
      username,
      email,
      hashedPassword,
    ])

    res.status(201).json({ message: "User created successfully" })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" })
    }

    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username])
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const user = users[0]

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" },
    )

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Software routes
app.post("/api/software", authenticate, async (req, res) => {
  try {
    // Only admin can create software
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    const { name, description, accessLevels } = req.body

    // Validate input
    if (!name || !accessLevels || !Array.isArray(accessLevels)) {
      return res.status(400).json({ message: "Name and access levels are required" })
    }

    // Create software
    const [result] = await pool.query("INSERT INTO software (name, description, access_levels) VALUES (?, ?, ?)", [
      name,
      description,
      JSON.stringify(accessLevels),
    ])

    res.status(201).json({
      message: "Software created successfully",
      software: {
        id: result.insertId,
        name,
        description,
        accessLevels,
      },
    })
  } catch (error) {
    console.error("Create software error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.get("/api/software", authenticate, async (req, res) => {
  try {
    const [software] = await pool.query("SELECT * FROM software")

    // Format the response
    const formattedSoftware = software.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      accessLevels: JSON.parse(item.access_levels),
    }))

    res.status(200).json({ software: formattedSoftware })
  } catch (error) {
    console.error("Get software error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Request routes
app.post("/api/requests", authenticate, async (req, res) => {
  try {
    // Only employees can create requests
    if (req.user.role !== "Employee") {
      return res.status(403).json({ message: "Access denied" })
    }

    const { softwareId, accessType, reason } = req.body
    const userId = req.user.id

    // Validate input
    if (!softwareId || !accessType) {
      return res.status(400).json({ message: "Software ID and access type are required" })
    }

    // Check if software exists
    const [software] = await pool.query("SELECT * FROM software WHERE id = ?", [softwareId])
    if (software.length === 0) {
      return res.status(404).json({ message: "Software not found" })
    }

    // Check if access type is valid
    const accessLevels = JSON.parse(software[0].access_levels)
    if (!accessLevels.includes(accessType)) {
      return res.status(400).json({ message: "Invalid access type" })
    }

    // Create request
    const [result] = await pool.query(
      "INSERT INTO requests (user_id, software_id, access_type, reason) VALUES (?, ?, ?, ?)",
      [userId, softwareId, accessType, reason],
    )

    res.status(201).json({
      message: "Access request created successfully",
      request: {
        id: result.insertId,
        userId,
        softwareId,
        accessType,
        reason,
        status: "Pending",
      },
    })
  } catch (error) {
    console.error("Create request error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.get("/api/requests/pending", authenticate, async (req, res) => {
  try {
    // Only managers and admins can view pending requests
    if (req.user.role !== "Manager" && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    const [requests] = await pool.query(`
      SELECT r.*, u.username, u.email, s.name as software_name 
      FROM requests r
      JOIN users u ON r.user_id = u.id
      JOIN software s ON r.software_id = s.id
      WHERE r.status = 'Pending'
    `)

    // Format the response
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      user: {
        id: request.user_id,
        username: request.username,
        email: request.email,
      },
      software: {
        id: request.software_id,
        name: request.software_name,
      },
      accessType: request.access_type,
      reason: request.reason,
      status: request.status,
      createdAt: request.created_at,
    }))

    res.status(200).json({ requests: formattedRequests })
  } catch (error) {
    console.error("Get pending requests error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.patch("/api/requests/:id", authenticate, async (req, res) => {
  try {
    // Only managers and admins can update requests
    if (req.user.role !== "Manager" && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    const { id } = req.params
    const { status } = req.body

    // Validate input
    if (status !== "Approved" && status !== "Rejected") {
      return res.status(400).json({ message: "Status must be Approved or Rejected" })
    }

    // Check if request exists
    const [requests] = await pool.query("SELECT * FROM requests WHERE id = ?", [id])
    if (requests.length === 0) {
      return res.status(404).json({ message: "Request not found" })
    }

    // Update request
    await pool.query("UPDATE requests SET status = ? WHERE id = ?", [status, id])

    res.status(200).json({
      message: `Request ${status.toLowerCase()} successfully`,
      request: {
        id: Number(id),
        status,
      },
    })
  } catch (error) {
    console.error("Update request error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

app.get("/api/requests/user", authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const [requests] = await pool.query(
      `
      SELECT r.*, s.name as software_name 
      FROM requests r
      JOIN software s ON r.software_id = s.id
      WHERE r.user_id = ?
    `,
      [userId],
    )

    // Format the response
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      software: {
        id: request.software_id,
        name: request.software_name,
      },
      accessType: request.access_type,
      reason: request.reason,
      status: request.status,
      createdAt: request.created_at,
    }))

    res.status(200).json({ requests: formattedRequests })
  } catch (error) {
    console.error("Get user requests error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
