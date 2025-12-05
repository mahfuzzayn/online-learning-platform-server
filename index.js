const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

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
