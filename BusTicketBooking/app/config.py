from dotenv import load_dotenv
import os


load_dotenv()


# Application Environment
ENVIRONMENT = os.getenv(
    "ENVIRONMENT",
    "development"
)


# Security Configuration
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "change_this_to_a_long_random_secret_key"
)


ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)


ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        60
    )
)


# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./bus_booking.db"
)