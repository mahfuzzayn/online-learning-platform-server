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

// Enrollment documeNt
// {
//   userEmail: String (required)
//   courseId: String (required) - ObjectId as string
//   enrolledAt: Date (auto-generated)
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

// health check endpoint
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: db ? 'Connected' : 'Disconnected'
    };

    res.status(200).json(healthStatus);
});

// crEate new course
app.post('/courses', async (req, res) => {
    try {
        const courseData = req.body;

        // basic validaton
        if (!courseData.title || !courseData.price || !courseData.category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // set default for isFeatured if not providd
        if (courseData.isFeatured === undefined) {
            courseData.isFeatured = false;
        }

        const result = await coursesCollection.insertOne(courseData);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            courseId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
});

// Get all courses with optinal category filter
app.get('/courses', async (req, res) => {
    try {
        const { category } = req.query;

        // build query object
        const query = {};
        if (category) {
            query.category = category;
        }

        const courses = await coursesCollection.find(query).toArray();

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
});

// get single course by id
app.get('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ObjectId } = require('mongodb');

        // validate objectid format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }

        const course = await coursesCollection.findOne({ _id: new ObjectId(id) });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
});

// Update course by id
app.put('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const { ObjectId } = require('mongodb');

        // validate objectid
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }

        // remove _id from update data if present
        delete updateData._id;

        const result = await coursesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
});

// deLete course by id
app.delete('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ObjectId } = require('mongodb');

        // validate objectid format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }

        const result = await coursesCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
});

// Enroll user in a course
app.post('/enrollments', async (req, res) => {
    try {
        const { userEmail, courseId } = req.body;
        const { ObjectId } = require('mongodb');

        // validte required fields
        if (!userEmail || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'userEmail and courseId are required'
            });
        }

        // validate courseid format
        if (!ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }

        // check if course exists
        const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // check if already enrolld
        const existingEnrollment = await enrollmentsCollection.findOne({
            userEmail: userEmail,
            courseId: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'User already enrolled in this course'
            });
        }

        // create enrollment
        const enrollmentData = {
            userEmail: userEmail,
            courseId: courseId,
            enrolledAt: new Date()
        };

        const result = await enrollmentsCollection.insertOne(enrollmentData);

        res.status(201).json({
            success: true,
            message: 'Enrollment successful',
            enrollmentId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating enrollment',
            error: error.message
        });
    }
});

// Get enrolled courses by user email
app.get('/enrollments', async (req, res) => {
    try {
        const { userEmail } = req.query;
        const { ObjectId } = require('mongodb');

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'userEmail query parameter is required'
            });
        }

        // get enrollments for user
        const enrollments = await enrollmentsCollection.find({ userEmail: userEmail }).toArray();

        // populate course data for each enrollment
        const enrolledCourses = [];
        for (const enrollment of enrollments) {
            const course = await coursesCollection.findOne({ _id: new ObjectId(enrollment.courseId) });
            if (course) {
                enrolledCourses.push({
                    enrollmentId: enrollment._id,
                    userEmail: enrollment.userEmail,
                    enrolledAt: enrollment.enrolledAt,
                    course: course
                });
            }
        }

        res.status(200).json({
            success: true,
            count: enrolledCourses.length,
            data: enrolledCourses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching enrollments',
            error: error.message
        });
    }
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log('Server Status: Running');
    console.log(`Port: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Database: ${db ? 'Connected' : 'Connecting...'}`);
});
