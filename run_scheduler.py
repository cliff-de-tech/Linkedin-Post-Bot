import asyncio
import os
import sys
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add current directory to path so we can import from services
sys.path.append(os.getcwd())

# Load environment variables
load_dotenv()

try:
    from services.db import connect_db, disconnect_db
    from services.scheduler import scheduler_loop
except ImportError as e:
    logger.error(f"Failed to import services: {e}")
    sys.exit(1)

async def main():
    """Run the scheduler worker."""
    logger.info("🚀 Starting Scheduler Worker...")
    
    # Connect to database
    await connect_db()
    
    try:
        # Run the scheduler loop
        await scheduler_loop()
    except KeyboardInterrupt:
        logger.info("🛑 Scheduler stopped by user")
    except Exception as e:
        logger.error(f"💥 Scheduler crashed: {e}", exc_info=True)
    finally:
        await disconnect_db()
        logger.info("👋 Scheduler shutdown complete")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
