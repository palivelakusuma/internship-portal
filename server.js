const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploads
app.use("/uploads", express.static("uploads"));

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/internshipDB")
.then(() => console.log("DB Connected"));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// Schema
const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  skills: String,
  resume: String,
  status: { type: String, default: "Pending" }
});

const Application = mongoose.model("Application", applicationSchema);

// CREATE
app.post("/applications", upload.single("resume"), async (req, res) => {
  const data = new Application({
    name: req.body.name,
    email: req.body.email,
    skills: req.body.skills,
    resume: req.file ? req.file.filename : ""
  });

  await data.save();
  res.send("Saved");
});

// READ
app.get("/applications", async (req, res) => {
  const { search, status } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") }
    ];
  }

  if (status && status !== "All") {
    query.status = status;
  }

  const data = await Application.find(query);
  res.json(data);
});

// UPDATE
app.put("/applications/:id", async (req, res) => {
  await Application.findByIdAndUpdate(req.params.id, {
    status: req.body.status
  });
  res.send("Updated");
});

// 🔥 DELETE (IMPORTANT)
app.delete("/applications/:id", async (req, res) => {
  await Application.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

app.listen(5000, () => console.log("Server running on 5000"));