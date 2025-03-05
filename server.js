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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

app.post('/processPost', async (req, res) => {
    console.log('Received payload:', req.body); // Log the incoming payload
    const { postUrl, postDescription } = req.body;

    if (!postUrl || !postDescription) {
        console.error('Invalid payload:', req.body); // Log invalid payload
        return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    try {
        console.log('Generating comment for description:', postDescription);
        const comment = await generateComment(postDescription);
        console.log('Generated comment:', comment);

        console.log('Posting comment to Facebook for URL:', postUrl);
        await postCommentToFacebook(postUrl, comment);
        return res.json({ success: true, comment });
    } catch (error) {
        console.error('Error processing post:', error);
        return res.status(500).json({ success: false, message: error.message });
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

    await page.goto('https://www.facebook.com/login');
    await page.type('#email', process.env.FB_USERNAME);
    await page.type('#pass', process.env.FB_PASSWORD);
    await page.click('button[name="login"]');
    await page.waitForNavigation();

    await page.goto(postUrl);
    await page.waitForSelector('[aria-label="Write a comment"]');
    await page.click('[aria-label="Write a comment"]');
    await page.keyboard.type(comment);
    await page.click('[aria-label="Press enter to post."]');

    await browser.close();
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});