from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.bus import Bus
from app.models.booking import Booking
from app.models.user import User
from app.dependencies import get_current_user


router = APIRouter(tags=["Pages"])

templates = Jinja2Templates(directory="app/templates")


# =========================================================
# REGISTER PAGE
# =========================================================

@router.get("/register")
def register_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="register.html"
    )


# =========================================================
# LOGIN PAGE
# =========================================================

@router.get("/login")
def login_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="login.html"
    )


# =========================================================
# SEARCH PAGE
# =========================================================

@router.get("/search")
def search_page(
    request: Request,
    from_: str | None = None,
    to: str | None = None,
    date: str | None = None,
    db: Session = Depends(get_db)
):

    buses = []

    search_from = from_.strip() if from_ else ""
    search_to = to.strip() if to else ""

    if search_from and search_to:

        buses = db.query(Bus).filter(
            func.lower(func.trim(Bus.source))
            == search_from.lower(),

            func.lower(func.trim(Bus.destination))
            == search_to.lower()
        ).all()

    return templates.TemplateResponse(
        request=request,
        name="search.html",
        context={
            "buses": buses,
            "search_from": search_from,
            "search_to": search_to,
            "travel_date": date or ""
        }
    )


# =========================================================
# BUSES PAGE
# =========================================================

@router.get("/buses")
def buses_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="buses.html"
    )


# =========================================================
# BOOKING PAGE
# =========================================================

@router.get("/booking")
def booking_page(
    request: Request,
    bus_id: int | None = None,
    travel_date: str | None = None,
    db: Session = Depends(get_db)
):

    bus = None
    booked_seats = []

    if bus_id:

        bus = db.query(Bus).filter(
            Bus.id == bus_id
        ).first()

        if bus and travel_date:

            bookings = db.query(Booking).filter(
                Booking.bus_id == bus_id,
                Booking.travel_date == travel_date,
                Booking.booking_status == "Booked"
            ).all()

            booked_seats = [
                booking.seat_number
                for booking in bookings
            ]

    return templates.TemplateResponse(
        request=request,
        name="booking.html",
        context={
            "bus": bus,
            "travel_date": travel_date or "",
            "booked_seats": booked_seats
        }
    )


# =========================================================
# MY BOOKINGS PAGE
# =========================================================

@router.get("/my-bookings")
def my_bookings_page(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).order_by(
        Booking.id.desc()
    ).all()

    return templates.TemplateResponse(
        request=request,
        name="bookings.html",
        context={
            "bookings": bookings
        }
    )