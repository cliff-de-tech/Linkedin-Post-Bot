# GitHub Actions Setup for LinkedIn Post Bot

## What This Does

The bot will **automatically post to LinkedIn every day at 9:00 AM UTC** using GitHub Actions—no local machine needed. It'll run for 60 days (or indefinitely until you disable it).

## Setup Steps

### 1. Push Code to GitHub

Make sure your repo is on GitHub (if not already):

```bash
git add .
git commit -m "Add GitHub Actions automation"
git push origin main
```

### 2. Add Secrets to GitHub

Go to your repo on GitHub → **Settings → Secrets and variables → Actions**

Click **New repository secret** and add these 5 secrets:

| Secret Name | Value |
|---|---|
| `LINKEDIN_ACCESS_TOKEN` | Your LinkedIn OAuth token (from bot.py) |
| `LINKEDIN_USER_URN` | Your LinkedIn user URN (from bot.py) |
| `GROQ_API_KEY` | Your Groq API key (from bot.py) |
| `UNSPLASH_ACCESS_KEY` | Your Unsplash API key (for images, optional) |
| `GITHUB_TOKEN` | GitHub auto-generates this; use default |

Note: GitHub does NOT allow secret names that start with `GITHUB_`. If you tried to add a secret named `GITHUB_USERNAME` you will see an error. You have two options:

- Use the built-in `${{ github.actor }}` in the workflow (the workflow already uses this by default), so you do not need to set a username secret.
- Or add a secret or repository variable with a different name (for example `MY_GITHUB_USERNAME`) and set that value in your repo Settings → Secrets (or Variables). If you choose this, update the workflow to pass it into the job as `MY_GITHUB_USERNAME`.

**⚠️ NEVER commit credentials to your repo!** Secrets keep them safe.

### 3. Verify the Workflow File

The file `.github/workflows/daily-post.yml` is already created. GitHub will automatically detect it.

### 4. Test the Workflow

Go to your repo on GitHub → **Actions** tab

Click **Daily LinkedIn Post** → **Run workflow** → Select **main** branch → **Run workflow**

This triggers an immediate test. Check the logs to see if it succeeds.

### 5. Adjust Post Time (Optional)

Edit `.github/workflows/daily-post.yml` line 8:

```yaml
- cron: '0 9 * * *'  # Current: 9:00 AM UTC
```

Change to your timezone:
- `'0 9 * * *'` = 9:00 AM UTC
- `'0 14 * * *'` = 2:00 PM UTC (UTC+5)
- `'0 18 * * *'` = 6:00 PM UTC (UTC+9)

[Cron converter](https://crontab.guru/)

### 6. Monitor Posts

Each day:
1. GitHub Actions runs the workflow automatically
2. Bot generates & posts to LinkedIn
3. You can view logs in **Actions** tab
4. Generated posts are saved as artifacts

### Disable Automation

If you want to stop:
1. Go to **Actions** tab
2. Click **Daily LinkedIn Post**
3. Click **...** → **Disable workflow**

Or delete the file `.github/workflows/daily-post.yml` and push.

## Troubleshooting

**"Secrets are not defined"** → Check that you added all 4 secrets correctly in repo Settings

**"Authentication failed"** → Verify your LinkedIn token is still valid (tokens expire)

**"Bot didn't post"** → Check **Actions** tab logs for error details

**Want to change post time?** → Edit the `cron` value in the workflow file

## Summary

✅ Posts automatically every day at 9:00 AM UTC
✅ Runs even when your laptop is off or offline
✅ Logs & generated posts saved for 60 days
✅ Can disable anytime from GitHub
