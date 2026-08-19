from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import Booking
from app.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post("/")
def book_ticket(
    bus_id: int = Form(...),
    seat_number: str = Form(...),
    travel_date: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    existing_booking = db.query(Booking).filter(
        Booking.bus_id == bus_id,
        Booking.travel_date == travel_date,
        Booking.seat_number == seat_number,
        Booking.booking_status == "Booked"
    ).first()

    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="Seat already booked"
        )

    new_booking = Booking(
        user_id=current_user.id,
        bus_id=bus_id,
        seat_number=seat_number,
        travel_date=travel_date,
        booking_status="Booked"
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return RedirectResponse(
        url="/my-bookings",
        status_code=303
    )


@router.get("/")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).all()

    return bookings


@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking.booking_status = "Cancelled"

    db.commit()

    return {
        "message": "Booking cancelled successfully"
    }