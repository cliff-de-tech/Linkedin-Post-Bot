# 🚀 Complete Setup Guide for New Users

This guide will walk you through setting up the LinkedIn Post Bot from scratch. Follow each step carefully.

## 📋 Prerequisites

- Python 3.10 or higher
- A LinkedIn account
- A GitHub account
- Basic knowledge of terminal/command line

## ⏱️ Estimated Setup Time: 30-45 minutes

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd Linkedin-Post-Bot-App
```

## Step 2: Install Python Dependencies

### Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### Install Required Packages
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install requests python-dateutil groq python-dotenv
```

---

## Step 3: Set Up LinkedIn OAuth (Required)

### 3.1 Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **"Create app"**
3. Fill in the required information:
   - **App name**: Your Bot Name (e.g., "My LinkedIn Post Bot")
   - **LinkedIn Page**: Select or create a LinkedIn page
   - **App logo**: Upload any image (optional)
   - **Legal agreement**: Check the box
4. Click **"Create app"**

### 3.2 Configure OAuth Settings

1. In your app dashboard, go to the **"Auth"** tab
2. Under **"OAuth 2.0 settings"**, add redirect URL:
   ```
   http://localhost:8000/callback
   ```
3. Click **"Update"**
4. Under **"OAuth 2.0 scopes"**, request these permissions:
   - ✅ `r_liteprofile` or `openid`
   - ✅ `r_emailaddress` or `email`
   - ✅ `w_member_social` (Required for posting)
5. Click **"Update"**

### 3.3 Get Your Credentials

From the **"Auth"** tab, copy:
- **Client ID**
- **Client Secret**

### 3.4 Generate Access Token

1. Run the authentication script:
   ```bash
   python auth.py
   ```

2. Follow the prompts:
   - Click the authorization URL
   - Sign in to LinkedIn
   - Authorize the app
   - You'll see an error page - **this is normal!**
   - Copy the **code** from the URL bar:
     ```
     http://localhost:8000/callback?code=AQT...&state=...
     ```
     Copy everything after `code=` and before `&state`

3. Paste the code when prompted

4. The script will output:
   - ✅ Access Token
   - ✅ User URN

**Keep these safe!** You'll need them in the next step.

---

## Step 4: Set Up Groq API (Required for AI)

### 4.1 Create Groq Account

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Verify your email

### 4.2 Generate API Key

1. Navigate to [API Keys](https://console.groq.com/keys)
2. Click **"Create API Key"**
3. Name it (e.g., "LinkedIn Bot")
4. Copy the key immediately (you won't see it again!)

**Free Tier:** 30 requests/minute - plenty for this bot!

---

## Step 5: Set Up GitHub (Optional but Recommended)

### 5.1 Your GitHub Username

Simply use your GitHub username (e.g., `your-username`)

### 5.2 Personal Access Token (Optional)

Without a token: 60 API requests/hour
With a token: 5,000 API requests/hour

**To create a token:**

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name it: "LinkedIn Bot"
4. Select scopes:
   - ✅ `public_repo` (access public repositories)
5. Click **"Generate token"**
6. **Copy immediately** (you won't see it again!)

---

## Step 6: Set Up Unsplash (Optional - For Images)

### 6.1 Create Unsplash Developer Account

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Sign up or log in
3. Go to [Your Applications](https://unsplash.com/oauth/applications)

### 6.2 Create New Application

1. Click **"New Application"**
2. Accept the terms
3. Fill in:
   - **Application name**: LinkedIn Post Bot
   - **Description**: Bot for posting to LinkedIn
4. Click **"Create Application"**

### 6.3 Get Access Key

From your application page, copy the **Access Key**

**Free Tier:** 50 requests/hour

---

## Step 7: Configure Environment Variables

### 7.1 Create .env File

Copy the example file:
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### 7.2 Fill in Your Credentials

Open `.env` and replace all placeholder values:

```env
# LinkedIn OAuth
LINKEDIN_ACCESS_TOKEN=AQT...  # From Step 3.4
LINKEDIN_USER_URN=abc123...    # From Step 3.4
LINKEDIN_CLIENT_ID=77hpf...    # From Step 3.3
LINKEDIN_CLIENT_SECRET=WPL_AP1... # From Step 3.3
LINKEDIN_REDIRECT_URI=http://localhost:8000/callback

# GitHub
GITHUB_USERNAME=your-username  # Your actual GitHub username
GITHUB_TOKEN=ghp_...           # From Step 5.2 (optional)

# Groq API
GROQ_API_KEY=gsk_...           # From Step 4.2

# Unsplash (Optional)
UNSPLASH_ACCESS_KEY=...        # From Step 6.3 (optional)
```

**⚠️ IMPORTANT:** Never commit this file to Git! It's already in `.gitignore`.

---

## Step 8: Customize Your Bot

### 8.1 Update Bot Persona

Edit the `LINKEDIN_PERSONA` in `services/ai_service.py` (lines 11-90) to match your voice:

```python
LINKEDIN_PERSONA = """You are writing LinkedIn posts for [YOUR NAME], a [YOUR ROLE].

ABOUT THE VOICE:
- [Your characteristics]
- [Your expertise]
- [Your interests]
...
```

### 8.2 Adjust Settings

In `bot.py`, you can modify:
- **Test Mode**: Line 535 - `TEST_MODE = True/False`
- **Max Posts**: Via environment variable `MAX_POSTS=3`
- **Post Delay**: Via environment variable `POST_DELAY_SECONDS=3600`

---

## Step 9: Test the Bot

### 9.1 Test Mode (Safe!)

Make sure `TEST_MODE = True` in `bot.py`:

```bash
python bot.py
```

You should see:
- ✅ GitHub activity detected
- ✅ Posts generated with AI
- ✅ Images fetched
- ✅ Preview saved to `last_generated_post.txt`
- ✅ Nothing posted to LinkedIn

### 9.2 Review Generated Posts

```bash
# Windows
type last_generated_post.txt

# macOS/Linux
cat last_generated_post.txt
```

Check if the posts:
- ✅ Match your voice
- ✅ Have relevant content
- ✅ Include proper hashtags
- ✅ Are engaging and professional

---

## Step 10: Go Live!

### 10.1 Enable Live Posting

In `bot.py`, change line 535:
```python
TEST_MODE = False  # Live mode!
```

### 10.2 Post Manually

```bash
python bot.py
```

Your posts will now go live on LinkedIn! 🎉

---

## Step 11: Automate with GitHub Actions (Optional)

### 11.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 11.2 Add GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** for each:

| Secret Name | Value |
|-------------|-------|
| `LINKEDIN_ACCESS_TOKEN` | Your LinkedIn access token |
| `LINKEDIN_USER_URN` | Your LinkedIn user URN |
| `GROQ_API_KEY` | Your Groq API key |
| `UNSPLASH_ACCESS_KEY` | Your Unsplash key (optional) |
| `MY_GITHUB_USERNAME` | Your GitHub username |
| `MY_GITHUB_TOKEN` | Your GitHub token (optional) |

### 11.3 Enable Workflow

The workflow file `.github/workflows/daily-post.yml` is already configured!

- Runs daily at 9:00 AM UTC
- Posts up to 3 activities per run
- 1 hour delay between posts

### 11.4 Test Manually

Go to **Actions** tab → **Daily LinkedIn Post** → **Run workflow**

---

## 🎉 You're All Set!

Your bot is now ready to:
- ✅ Detect your GitHub activities
- ✅ Generate AI-powered LinkedIn posts
- ✅ Add relevant images
- ✅ Post automatically on schedule

---

## 🛠️ Troubleshooting

### LinkedIn Authentication Fails

**Error**: "Invalid client" or "Authentication failed"

**Solutions**:
1. Double-check `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
2. Verify redirect URI is exactly: `http://localhost:8000/callback`
3. Ensure `w_member_social` permission is granted
4. Try generating a new access token with `python auth.py`

### No GitHub Activities Found

**Solutions**:
1. Check `GITHUB_USERNAME` is correct
2. Make sure you have public activity in the last 24 hours
3. Add a `GITHUB_TOKEN` for better API access
4. Try making a commit or push to trigger activity

### Groq API Errors

**Error**: "API key invalid" or "Rate limit exceeded"

**Solutions**:
1. Verify `GROQ_API_KEY` is correct
2. Check your usage at [Groq Console](https://console.groq.com/)
3. Free tier: 30 requests/min - bot respects this
4. Wait a minute and try again

### Images Not Loading

**Solutions**:
1. Check `UNSPLASH_ACCESS_KEY` is set
2. Verify your Unsplash app is approved
3. Images are optional - bot works without them
4. Check rate limits (50 req/hour on free tier)

### Posts Look Wrong

**Solutions**:
1. Customize `LINKEDIN_PERSONA` in `services/ai_service.py`
2. Adjust temperature in AI settings (higher = more creative)
3. Review generated posts in `last_generated_post.txt`
4. Test in `TEST_MODE` before going live

### GitHub Actions Not Running

**Solutions**:
1. Check all secrets are added correctly
2. Verify workflow file is in `.github/workflows/`
3. Check Actions tab for error messages
4. Make sure GitHub Actions is enabled for your repo
5. Review workflow logs for specific errors

---

## 📚 Additional Resources

- **LinkedIn API Docs**: https://learn.microsoft.com/en-us/linkedin/shared/api-reference/api-reference
- **Groq Documentation**: https://console.groq.com/docs
- **GitHub API Docs**: https://docs.github.com/en/rest
- **Unsplash API**: https://unsplash.com/documentation

---

## 🔐 Security Best Practices

1. ✅ **Never commit `.env`** - It's in `.gitignore`
2. ✅ **Use GitHub Secrets** for automation
3. ✅ **Regenerate tokens** if exposed
4. ✅ **Rotate credentials** periodically
5. ✅ **Use environment variables** in production
6. ✅ **Keep dependencies updated**
7. ✅ **Review permissions** granted to LinkedIn app

---

## 💡 Pro Tips

1. **Start with TEST_MODE** - Always preview before posting
2. **Customize the persona** - Make it sound like YOU
3. **Monitor engagement** - Adjust based on what works
4. **Use hashtags wisely** - 8-12 relevant tags per post
5. **Enable images** - They get 2-3x better engagement
6. **Set MAX_POSTS=3** - Don't overwhelm your network
7. **Check generated posts** - Review `last_generated_post.txt`
8. **Space out posts** - Use `POST_DELAY_SECONDS`

---

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages carefully
3. Verify all credentials are correct
4. Check API rate limits
5. Look at `last_generated_post.txt` for clues

---

**Happy Posting! 🚀**

Built with ❤️ for developers who code more than they post!
