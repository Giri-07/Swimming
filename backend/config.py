"""
Database Configuration for Swimming Management System
Modify these settings based on your MySQL setup
"""
from urllib.parse import quote_plus

# MySQL Database Configuration
DB_USERNAME = 'root'
DB_PASSWORD = 'Swim@12345'
DB_HOST = 'localhost'
DB_PORT = '3306'
DB_NAME = 'swimming_db'

# URL-encode the password to handle special characters like @, #, %, etc.
encoded_password = quote_plus(DB_PASSWORD)

# Construct the database URI
SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{DB_USERNAME}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

# SQLAlchemy settings
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,      # Verify connections before using
    'pool_recycle': 3600,        # Recycle connections after 1 hour
    'pool_size': 10,             # Maximum number of connections
    'max_overflow': 20           # Maximum overflow connections
}

# ── Email Configuration (for OTP / forgot password) ──────────────────────────
# Fill in your Gmail credentials to enable email sending.
# Leave MAIL_USERNAME as None to run in dev mode (OTP printed to console).
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USERNAME = None          # e.g. 'yourname@gmail.com'
MAIL_PASSWORD = None          # Gmail App Password (not your Google password)

# Alternative: Use root user (not recommended for production)
# SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://root:your_root_password@localhost:3306/{DB_NAME}'
