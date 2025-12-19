# 🖼️ Image Feature Setup Guide

Your LinkedIn bot can now automatically add relevant images to posts!

## How It Works

1. **Automatic Image Selection**: The bot analyzes your post content and fetches a relevant image from Unsplash
2. **Smart Matching**: Keywords like "design", "coding", "learning" trigger appropriate image searches
3. **Seamless Upload**: Images are automatically uploaded to LinkedIn and attached to your post

## Setup Instructions

### Option 1: Use Unsplash (Recommended - Free)

1. **Get Unsplash API Key** (Free):
   - Go to https://unsplash.com/developers
   - Click "Register as a developer"
   - Create a new application
   - Copy your "Access Key"

2. **Add to Environment**:
   
   **For Local Testing** (`.env` file):
   ```
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   ```
   
   **For GitHub Actions** (Settings → Secrets):
   - Add secret: `UNSPLASH_ACCESS_KEY` = your access key

### Option 2: Skip Images

If you don't set `UNSPLASH_ACCESS_KEY`, the bot will work normally but posts won't include images.

## Testing

Run the bot in TEST_MODE to preview images without posting:

```python
TEST_MODE = True  # In bot.py
```

Then run:
```bash
python bot.py
```

You'll see which image would be used without actually posting to LinkedIn.

## Image Types

The bot automatically selects images based on your post content:
- **Design/UI posts** → Web design images
- **GitHub/Coding posts** → Programming images  
- **Learning posts** → Study/education images
- **General posts** → Random tech/developer images

## Troubleshooting

**No images appearing?**
- Check if `UNSPLASH_ACCESS_KEY` is set
- Verify your API key is valid on Unsplash
- Check terminal output for error messages

**Image upload failing?**
- Verify LinkedIn token has correct permissions (`w_member_social`)
- Check LinkedIn API rate limits
- Review error messages in terminal

**Want different images?**
Modify the `get_relevant_image()` function in [bot.py](bot.py) to change search terms.

## Advanced: Use Local Images

You can modify the code to use local images instead:

```python
def get_local_image():
    """Use a local image file"""
    image_path = "path/to/your/image.jpg"
    with open(image_path, 'rb') as f:
        return f.read()  # Return bytes instead of URL
```

Then update the upload function accordingly.

---

**Questions?** Check the main [README.md](README.md) for general setup help.
