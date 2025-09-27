const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware Setup
// Enable Cross-Origin Resource Sharing for your React frontend
app.use(cors()); 
// Enable parsing of JSON bodies, with a higher limit for the base64 image data
app.use(express.json({ limit: '10mb' })); 

// --- API Endpoints ---

// A simple health check endpoint to verify the server is running
app.get('/', (req, res) => {
    res.send('Node.js Backend is running!');
});

/**
 * The main prediction endpoint. It receives an image, saves it temporarily,
 * calls the Python script to get a prediction, and returns the result.
 */
app.post('/predict', (req, res) => {
    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'No image data provided.' });
    }

    // 1. Save the Base64 image data to a temporary file
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const tempImagePath = path.join(__dirname, `temp_image_${Date.now()}.png`);

    fs.writeFile(tempImagePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error("Error saving temporary image:", err);
            return res.status(500).json({ error: 'Failed to process image.' });
        }

        // 2. Define paths for the Python script and the ML model
        const pythonScriptPath = path.join(__dirname, 'predict.py');
        const modelPath = path.join(__dirname, '../ml/mnist_vgg19.h5');

        // 3. Execute the Python script as a child process
        const pythonProcess = spawn('python', [pythonScriptPath, tempImagePath, modelPath]);

        let predictionData = '';
        let errorData = '';

        // Capture standard output from the script (the prediction)
        pythonProcess.stdout.on('data', (data) => {
            predictionData += data.toString();
        });

        // Capture standard error from the script (any error messages)
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // 4. Handle the script's completion
        pythonProcess.on('close', (code) => {
            // Clean up by deleting the temporary image file
            fs.unlink(tempImagePath, (delErr) => {
                if (delErr) console.error("Error deleting temp image:", delErr);
            });

            // If the script exited with an error code
            if (code !== 0) {
                console.error(`Python script error: ${errorData}`);
                return res.status(500).json({ error: 'Prediction script failed.', details: errorData });
            }

            // 5. Parse and send the successful prediction
            try {
                const result = JSON.parse(predictionData);
                res.json(result);
            } catch (parseErr) {
                console.error("Error parsing python output:", parseErr, "Raw output:", predictionData);
                res.status(500).json({ error: 'Failed to parse prediction output.' });
            }
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
