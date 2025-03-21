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

// Rate limiting variables
const MAX_DAILY_COMMENTS = 20;
let dailyCommentCount = 0;
let lastCommentDate = new Date().toDateString();
let lastCommentTime = 0;
const MIN_DELAY = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_DELAY = 60 * 60 * 1000; // 60 minutes in milliseconds

app.use(cors());
app.use(express.json());

// Helper function for random delays
async function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Helper function for human-like typing
async function humanLikeTyping(page, text) {
    for (const char of text) {
        await page.keyboard.type(char);
        await randomDelay(50, 250); // Random delay between keystrokes
    }
}

// Helper function to simulate human behavior
async function simulateHumanBehavior(page) {
    // Random scrolling
    await page.evaluate(() => {
        window.scrollBy({
            top: Math.floor(Math.random() * 500),
            behavior: 'smooth'
        });
    });
    await randomDelay(500, 2000);
    
    // Random mouse movements
    const viewportWidth = page.viewport().width;
    const viewportHeight = page.viewport().height;
    
    // Generate 3-7 random mouse movements
    const movements = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < movements; i++) {
        const x = Math.floor(Math.random() * viewportWidth);
        const y = Math.floor(Math.random() * viewportHeight);
        await page.mouse.move(x, y);
        await randomDelay(100, 500);
    }
}

// POST endpoint to process Facebook post
app.post('/processPost', async (req, res) => {
    console.log('Received payload:', req.body);
    
    // Validate the payload
    if (!req.body) {
        return res.status(400).json({ success: false, message: 'Request body is undefined' });
    }
    
    const { postUrl, postDescription } = req.body;
    
    if (!postUrl || !postDescription) {
        console.error('Invalid payload:', req.body);
        return res.status(400).json({ success: false, message: 'Invalid payload. Both postUrl and postDescription are required.' });
    }
    
    // Validate URL format
    const urlPattern = /^https:\/\/www\.facebook\.com\/(groups\/[\w.]+\/posts\/|[\w.]+\/posts\/|[\w.]+\/)/;
    if (!urlPattern.test(postUrl)) {
        return res.status(400).json({ success: false, message: 'Invalid Facebook URL format' });
    }
    
    // Reset counter if it's a new day
    const today = new Date().toDateString();
    if (today !== lastCommentDate) {
        dailyCommentCount = 0;
        lastCommentDate = today;
    }
    
    // Check if daily limit reached
    if (dailyCommentCount >= MAX_DAILY_COMMENTS) {
        return res.status(429).json({ 
            success: false, 
            message: 'Daily comment limit reached. Try again tomorrow.' 
        });
    }
    
    // Calculate required delay
    const now = Date.now();
    const timeElapsed = now - lastCommentTime;
    const randomDelay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    
    if (lastCommentTime > 0 && timeElapsed < randomDelay) {
        console.log(`Comment request received but waiting for delay period. Next comment will be processed in ${Math.floor((randomDelay - timeElapsed)/60000)} minutes`);
        return res.status(202).json({
            success: true,
            message: 'Comment queued for delayed processing',
            estimatedDelay: Math.floor((randomDelay - timeElapsed)/60000) + ' minutes'
        });
    }

    try {
        console.log('Generating comment for description:', postDescription);
        const comment = await generateComment(postDescription);
        console.log('Generated comment:', comment);

        console.log('Posting comment to Facebook for URL:', postUrl);
        await postCommentToFacebook(postUrl, comment);
        
        // Update tracking variables
        lastCommentTime = Date.now();
        dailyCommentCount++;
        
        return res.json({ success: true, comment });
    } catch (error) {
        console.error('Error processing post:', error);
        
        // Specific error handling
        if (error.message.includes('navigation timeout')) {
            return res.status(500).json({ success: false, message: 'Navigation timeout. The Facebook page took too long to load.' });
        } else if (error.message.includes('invalid session')) {
            return res.status(500).json({ success: false, message: 'Facebook login failed. Please check credentials.' });
        }
        
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Function to generate a comment using ChatGPT API
async function generateComment(postDescription) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ 
                role: 'user', 
                content: `You are an AI comment replier. Respond to the provided Facebook post in the same language, maintaining a helpful and empathetic tone. Subtly mention the brand without being promotional. The post says: ${postDescription}` 
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('OpenAI response:', response.data);
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating comment:', error);
        throw error;
    }
}

// Function to automate Facebook login and post comment
async function postCommentToFacebook(postUrl, comment) {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36`
        ],
        defaultViewport: {
            width: 1280,
            height: 800
        }
    });
    const page = await browser.newPage();

    try {
        // Random delay before starting
        await randomDelay(2000, 5000);
        
        // Navigate to Facebook login
        await page.goto('https://www.facebook.com/login');
        await randomDelay(1000, 3000);
        
        // Login process
        await page.type('#email', process.env.FB_USERNAME);
        await randomDelay(800, 1500);
        await page.type('#pass', process.env.FB_PASSWORD);
        await randomDelay(500, 1200);
        await page.click('button[name="login"]');
        await page.waitForNavigation();
        
        // Navigate to post URL
        await page.goto(postUrl);
        await page.waitForSelector('[aria-label="Write a comment"]');
        
        // Simulate human behavior
        await simulateHumanBehavior(page);
        await randomDelay(2000, 5000);
        
        // Click comment box and type with human-like behavior
        await page.click('[aria-label="Write a comment"]');
        await humanLikeTyping(page, comment);
        
        // Small delay before posting
        await randomDelay(1000, 2000);
        await page.click('[aria-label="Press enter to post."]');
        
        // Wait for comment to be posted
        await randomDelay(3000, 5000);
        
        console.log('Comment posted successfully!');
    } catch (error) {
        console.error('Error posting comment:', error);
        throw error; // Re-throw to be handled by the caller
    } finally {
        await browser.close();
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});