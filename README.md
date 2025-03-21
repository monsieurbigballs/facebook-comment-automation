# Facebook Comment Automation

An integrated system that automates the process of posting comments on Facebook posts based on data from Devi AI. This project includes an Express server with a webhook endpoint, ChatGPT API integration, and Puppeteer for browser automation.

## System Components

The system works in this sequence:
```
Devi AI → Webhook → Express Server → ChatGPT API → Puppeteer → Facebook
```

## Features

- 🔄 Webhook endpoint to receive post data from Devi AI
- 💬 Intelligent comment generation using ChatGPT API
- 🤖 Automated Facebook login and commenting with Puppeteer
- 🧠 Human-like behavior simulation to avoid detection
- ⏱️ Rate limiting to prevent account bans
- 🛡️ Comprehensive error handling
- 🌐 CORS support for cross-origin requests

## Requirements

- Node.js (v14 or later)
- npm (v6 or later)
- A ChatGPT API key from OpenAI
- Facebook account credentials
- Devi AI configured to send webhooks

## Installation Instructions

### For Windows Users

1. **Install Node.js and Git**
   - Download and install Node.js from [nodejs.org](https://nodejs.org/)
   - Download and install Git from [git-scm.com](https://git-scm.com/download/win)

2. **Clone the Repository**
   ```bash
   git clone https://github.com/monsieurbigballs/facebook-comment-automation.git
   cd facebook-comment-automation
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**
   - Create a file named `.env` in the project root
   - Add the following content (replace placeholders with your actual values):
   ```
   PORT=3000
   CHATGPT_API_KEY=your_chatgpt_api_key
   FB_USERNAME=your_facebook_email
   FB_PASSWORD=your_facebook_password
   ```

### For macOS Users

1. **Install Homebrew, Node.js and Git**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew install node
   brew install git
   ```

2. **Clone the Repository**
   ```bash
   git clone https://github.com/monsieurbigballs/facebook-comment-automation.git
   cd facebook-comment-automation
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**
   ```bash
   touch .env
   ```
   - Open `.env` in your text editor and add:
   ```
   PORT=3000
   CHATGPT_API_KEY=your_chatgpt_api_key
   FB_USERNAME=your_facebook_email
   FB_PASSWORD=your_facebook_password
   ```

## Exposing Your Local Server with ngrok

To receive webhooks from Devi AI, you need to expose your local server to the internet. Ngrok provides an easy way to do this.

### Windows
1. Download ngrok from [ngrok.com](https://ngrok.com/download)
2. Run ngrok: `ngrok http 3000`

### macOS
1. Install ngrok: `brew install --cask ngrok`
2. Run ngrok: `ngrok http 3000`

Take note of the HTTPS URL that ngrok provides (e.g., `https://abcd1234.ngrok.io`). This will be used to configure your webhook in Devi AI.

## Running the Server

```bash
node server.js
```

For development with automatic restarts:
```bash
npm install -g nodemon
nodemon server.js
```

## Testing with Postman

1. Download Postman from [postman.com](https://www.postman.com/downloads/)
2. Create a new POST request to your ngrok URL with the `/processPost` endpoint
3. Set the Content-Type header to `application/json`
4. Add a request body:
   ```json
   {
     "postUrl": "https://www.facebook.com/groups/123456789/posts/987654321",
     "postDescription": "This is an example post description."
   }
   ```
5. Send the request and check the server logs and Postman response

## Configuring Devi AI

Configure Devi AI to send webhook requests to your server:
1. Use the ngrok URL + `/processPost` as the webhook URL
2. Ensure Devi AI is configured to include both `postUrl` and `postDescription` in the webhook payload

## Rate Limiting and Safety Features

The system includes several safety features to prevent Facebook from detecting automated activity:

- Maximum of 20 comments per day
- Random 15-60 minute delay between comments
- Human-like typing with variable speeds
- Random mouse movements and scrolling
- Browser fingerprint management

## Troubleshooting

If you encounter issues:

1. **Webhook not receiving data**:
   - Ensure ngrok is running and the URL is correctly set in Devi AI
   - Check server console for incoming requests

2. **Login failures**:
   - Verify Facebook credentials in the `.env` file
   - Check if the account has two-factor authentication enabled (not supported)

3. **Comment posting failures**:
   - Check Facebook selectors in the code (they may change if Facebook updates their UI)
   - Verify the account has permission to comment on the target post

## Uploading to GitHub

If you make changes to the project and want to upload them to GitHub:

1. Create a new GitHub repository (if you don't already have one)
2. Initialize git in your project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Add your GitHub repository as a remote:
   ```bash
   git remote add origin https://github.com/yourusername/facebook-comment-automation.git
   ```
4. Push your changes:
   ```bash
   git push -u origin master
   ```

## License

MIT 