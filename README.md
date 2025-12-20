# LinkedIn Post Bot 🤖

An automated Python bot that posts engaging content to LinkedIn on a schedule. Perfect for maintaining consistent presence without being glued to social media.

## Features

✨ **60-Day Content Library** - Pre-written posts covering tech topics, career advice, coding best practices, and personal growth
🔐 **Secure OAuth2 Authentication** - Uses LinkedIn's official OAuth flow for safe credential handling
⚙️ **Automated Posting** - Randomly selects posts and publishes them to your LinkedIn profile
🎯 **Customizable Content** - Easily add, modify, or replace posts in the database
📅 **Scalable** - Can be deployed to cloud services for 24/7 operation

## Project Structure

```
.
├── auth.py          # OAuth authentication & token exchange
├── bot.py           # Main posting logic & content database
└── README.md        # This file
```

## Prerequisites

- Python 3.7+
- `requests` library
- `python-dateutil` library
- LinkedIn Developer Account with OAuth credentials

## Setup Instructions

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers)
2. Create a new app with your company/profile info
3. Under **Auth** settings, set your Authorized Redirect URL to: `http://localhost:8000/callback`
4. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:
```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
GROQ_API_KEY=your_groq_api_key_here
# Add other optional keys as needed
```

See [.env.example](.env.example) for detailed instructions on obtaining each API key.

### 3. Run Authentication

Run the authentication script to get your tokens:

```bash
python auth.py
```

Follow these steps:
1. Click the printed authorization link
2. Log in with your LinkedIn account
3. You'll see a "Site can't be reached" error (this is expected!)
4. Copy the `code` parameter from the URL bar
5. Paste it when prompted
6. The script will display your `ACCESS_TOKEN` and `USER_URN`

### 4. Update Bot Credentials

Edit `bot.py` and replace:
```python
ACCESS_TOKEN = "your_access_token_here"
USER_URN = "your_user_urn_here"
```

### 5. Install Dependencies

```bash
pip install requests python-dateutil
```

## Usage

### Manual Post

Run the bot once to post a random message:

```bash
python bot.py
```

### Scheduled Posting (Every Day)

**Windows (Task Scheduler):**
```powershell
schtasks /create /tn "LinkedInBot" /tr "python C:\path\to\bot.py" /sc daily /st 09:00
```

**macOS/Linux (Crontab):**
```bash
0 9 * * * /usr/bin/python3 /path/to/bot.py
```

**Cloud (Render/Heroku):**
Deploy `bot.py` with a scheduler service or cron job.

## Content Database

The bot includes 60 pre-written posts organized by topic:

- **Week 1**: Automation & Python Fundamentals
- **Week 2**: Coding Best Practices
- **Week 3**: Mindset & Career Growth
- **Week 4**: Developer Tools & Workflow
- **Week 5**: Creativity & Innovation
- **Week 6**: Problem Solving
- **Week 7**: Personal Development
- **Week 8**: Future of Tech
- **Week 9**: Reflection & Gratitude

Each post is optimized for engagement with relevant hashtags and compelling messaging.

### Adding Custom Posts

Edit `bot.py` and add your posts to the `POST_IDEAS` list:

```python
POST_IDEAS = [
    """Your post content here with #hashtags""",
    """Another post...""",
]
```

## How It Works

1. **Authentication** (`auth.py`):
   - Generates a LinkedIn OAuth authorization URL
   - Exchanges the authorization code for an access token
   - Retrieves your unique LinkedIn user ID (URN)

2. **Posting** (`bot.py`):
   - Selects a random post from the content library
   - Uses LinkedIn's UGC (User Generated Content) API to publish
   - Posts as a public update visible to your network

## API Details

### LinkedIn API Endpoints Used

- **Authorization**: `https://www.linkedin.com/oauth/v2/authorization`
- **Token Exchange**: `https://www.linkedin.com/oauth/v2/accessToken`
- **User Info**: `https://api.linkedin.com/v2/userinfo`
- **Post Creation**: `https://api.linkedin.com/v2/ugcPosts`

### Required Permissions

- `openid` - OpenID Connect
- `profile` - User profile information
- `w_member_social` - **Post on your behalf**
- `email` - Email access

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid client" error | Double-check CLIENT_ID and CLIENT_SECRET in `auth.py` |
| Token expired | Run `auth.py` again to get a fresh token |
| Post fails with 401 | ACCESS_TOKEN may be expired; re-authenticate |
| "Site can't be reached" on callback | This is expected! Copy the code from the URL bar |
| Bot doesn't post | Verify the bot has the `w_member_social` permission in LinkedIn app settings |

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `auth.py` or `bot.py` with real credentials to public repositories
- Use environment variables or `.env` files for production deployments
- Regenerate your tokens regularly
- The example credentials in the files are expired and non-functional

## Deployment Options

### Render (Free Tier)
1. Push code to GitHub
2. Create new Web Service on Render
3. Set up cron job with external service (cron-job.org)

### AWS Lambda
1. Package bot.py with dependencies
2. Create CloudWatch Events rule (daily trigger)
3. Connect to Lambda function

### DigitalOcean App Platform
1. Deploy from GitHub
2. Use background jobs for scheduling

## Future Enhancements

🚀 Potential upgrades:
- AI-powered post generation with OpenAI
- Sentiment analysis for engagement optimization
- Image/media attachments
- Hashtag trend integration
- Analytics dashboard
- Multi-account posting
- Comment response automation

## Contributing

Have ideas to improve the bot? Feel free to fork and submit pull requests!

## License

MIT License - Use freely for personal and commercial projects

## Support

For issues with:
- **LinkedIn API**: Check [LinkedIn Developer Docs](https://learn.microsoft.com/en-us/linkedin/shared/api-reference/api-reference)
- **Bot code**: Review the inline comments in `auth.py` and `bot.py`
- **Scheduling**: Search for OS-specific task scheduler guides

---

**Made with ❤️ for the tech community**

Happy posting! 🚀
