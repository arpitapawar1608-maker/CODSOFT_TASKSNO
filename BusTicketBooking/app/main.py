from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse

from app.database import Base, engine

# Import models
from app.models.user import User
from app.models.bus import Bus
from app.models.booking import Booking

# Import routers
from app.routers.auth import router as auth_router
from app.routers.buses import router as bus_router
from app.routers.bookings import router as booking_router
from app.routers.pages import router as pages_router
from app.routers.backup import router as backup_router

# Logger
from app.utils.logger import logger


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Cloud Bus Ticket Booking System",
    version="1.0.0",
    description="Cloud Hosted Bus Ticket Booking Application"
)


logger.info("Cloud Bus Ticket Booking System started")


# =========================================================
# STATIC FILES
# =========================================================

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)


# =========================================================
# TEMPLATES
# =========================================================

templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(bus_router)
app.include_router(booking_router)
app.include_router(pages_router)
app.include_router(backup_router)


# =========================================================
# HOME PAGE
# =========================================================

@app.get("/")
def home(request: Request):

    logger.info("Home page accessed")

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


# =========================================================
# GLOBAL ERROR HANDLER
# =========================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):

    logger.error(
        f"Error occurred: {exc}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error"
        }
    )