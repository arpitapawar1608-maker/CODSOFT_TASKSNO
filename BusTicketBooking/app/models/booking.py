from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)

    seat_number = Column(String(10), nullable=False)

    travel_date = Column(String(20), nullable=False)

    booking_status = Column(String(20), default="Booked")

    # Relationship with Bus
    bus = relationship("Bus")