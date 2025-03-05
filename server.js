/**
 * Facebook Comment Automation
 * 
 * This application automates the process of commenting on Facebook posts 
 * based on descriptions scraped from Facebook groups. It uses the ChatGPT 
 * API to generate comments and Puppeteer to automate browser interactions.
 * 
 * Workflow:
 * 1. Receive a POST request with a Facebook post URL and description.
 * 2. Generate a comment using the ChatGPT API.
 * 3. Automate the login to Facebook and post the comment.
 * 
 * Configuration:
 * - Set up a .env file with your ChatGPT API key and Facebook credentials.
 * 
 * To run the application:
 * 1. Clone the repository.
 * 2. Run `npm install`.
 * 3. Configure the .env file.
 * 4. Start the server with `node server.js`.
 */

const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const puppeteer = require('puppeteer');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes

// POST endpoint to process Facebook post
app.post('/processPost', async (req, res) => {
    const { postUrl, postDescription } = req.body;

    try {
        // Call ChatGPT API to generate a comment
        const comment = await generateComment(postDescription);
        
        // Automate Facebook interaction to post the comment
        await postCommentToFacebook(postUrl, comment);
        
        res.json({ success: true, comment });
    } catch (error) {
        console.error('Error processing post:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Function to generate a comment using ChatGPT API
async function generateComment(postDescription) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Generate a unique, engaging comment for the following Facebook post: ${postDescription}` }]
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

// Function to automate Facebook login and post comment
async function postCommentToFacebook(postUrl, comment) {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Navigate to Facebook login page
    await page.goto('https://www.facebook.com/login');
    await page.type('#email', process.env.FB_USERNAME);
    await page.type('#pass', process.env.FB_PASSWORD);
    await page.click('button[name="login"]');
    await page.waitForNavigation();

    // Navigate to the specific post URL
    await page.goto(postUrl);
    await page.waitForSelector('[aria-label="Write a comment"]');

    // Post the comment
    await page.click('[aria-label="Write a comment"]');
    await page.keyboard.type(comment);
    await page.click('[aria-label="Press enter to post."]');

    await browser.close();
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});