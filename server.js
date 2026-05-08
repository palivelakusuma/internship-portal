const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/internshipDB")
.then(() => console.log("DB Connected"));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Schema
const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  skills: String,
  resume: String,
  status: { type: String, default: "Pending" }
});

const Application = mongoose.model("Application", applicationSchema);

// CREATE (with resume upload)
app.post("/applications", upload.single("resume"), async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const data = new Application({
    name: req.body.name,
    email: req.body.email,
    skills: req.body.skills,
    resume: req.file ? req.file.filename : ""
  });

  await data.save();
  res.send("Saved");
});

// READ (search + filter)
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

app.listen(5000, () => console.log("Server running on 5000"));