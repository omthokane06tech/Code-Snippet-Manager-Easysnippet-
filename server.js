const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors({
  origin: "https://your-frontend.vercel.app", // 🔁 replace after Vercel deploy
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ❌ REMOVE static serving if using Vercel frontend
// app.use(express.static(path.join(__dirname, 'public')));

// ✅ Database (Connection Pool - better for production)

// this connection code is according to the render deployment
const db = mysql.createPool({
  mysql.createConnection(process.env.mysql:root:oPiLGCKqLygxlqdmdYUfpxNaOXQUNnub@switchback.proxy.rlwy.net:55032/railway);
  

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database!");
    connection.release();
  }
});

// ------------------- ROUTES -------------------

// ✅ Health check (important for Render)
app.get('/health', (req, res) => {
  res.send("Backend is running 🚀");
});

// ---------------- AUTH ----------------

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "User registered!" });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// Login
app.post('/login-user', (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }

    if (results.length > 0) {
      const match = await bcrypt.compare(password, results[0].password);

      if (match) {
        res.json({ success: true, user: results[0] });
      } else {
        res.json({ success: false, message: "Invalid credentials" });
      }
    } else {
      res.json({ success: false, message: "User not found" });
    }
  });
});

// ---------------- SNIPPETS ----------------

// Add snippet
app.post('/add-snippet', (req, res) => {
  const { userId, title, language, tags, code } = req.body;

  const sql = `
    INSERT INTO snippets 
    (user_id, title, language, tags, code, is_deleted, is_favorite) 
    VALUES (?, ?, ?, ?, ?, 0, 0)
  `;

  db.query(sql, [userId, title, language, tags, code], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, message: "Snippet saved!" });
  });
});

// Get snippets
app.get('/get-snippets/:userId', (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT * FROM snippets 
    WHERE user_id = ? AND is_deleted = 0 
    ORDER BY id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, snippets: results });
  });
});

// Soft delete (move to trash)
app.post('/delete-snippet', (req, res) => {
  const { id } = req.body;

  const sql = "UPDATE snippets SET is_deleted = 1 WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, message: "Moved to Trash" });
  });
});

// Toggle favorite
app.post('/toggle-favorite', (req, res) => {
  const { id } = req.body;

  const sql = "UPDATE snippets SET is_favorite = NOT is_favorite WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, message: "Favorite updated" });
  });
});

// Permanent delete
app.delete('/permanent-delete/:id', (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM snippets WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, message: "Snippet deleted permanently!" });
  });
});

// Update snippet
app.put('/update-snippet', (req, res) => {
  const { id, title, language, tags, code } = req.body;

  const sql = `
    UPDATE snippets 
    SET title = ?, language = ?, tags = ?, code = ? 
    WHERE id = ?
  `;

  db.query(sql, [title, language, tags, code, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, message: "Snippet updated!" });
  });
});

// ---------------- START SERVER ----------------

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
