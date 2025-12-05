const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Database variables
let db;
let coursesCollection;
let enrollmentsCollection;

// Database Connection
const connectDB = async () => {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        db = client.db('onlineLearningDB');
        coursesCollection = db.collection('courses');
        enrollmentsCollection = db.collection('enrollments');
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// Connect to Database
connectDB();

// Course docuMent
// {
//   title: String (required)
//   image: String (required) - URL
//   price: Number (required)
//   duration: String (required) - e.g. "4 weeks"
//   category: String (required) - e.g. "Web Development"
//   description: String (required)
//   isFeatured: Boolean (default: false)
//   instructorName: String (required)
//   instructorEmail: String (required)
//   instructorPhoto: String (required) - URL
// }

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Online Learning Platform Server is running successfully!',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('Server Status: Running');
    console.log(`Port: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
});
