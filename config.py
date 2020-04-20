from dotenv import load_dotenv
from pathlib import Path  # python3 only
import os
import redis

# set path to env file
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Set Flask configuration vars from .env file."""
    # Load in environment variables
    TESTING = os.getenv('TESTING')
    FLASK_DEBUG = os.getenv('DEBUG')
    SECRET_KEY = os.getenv('SECRET_KEY')
    SESSION_TYPE = os.getenv('SESSION_TYPE')
    SESSION_REDIS = redis.from_url(os.getenv('SESSION_REDIS'))