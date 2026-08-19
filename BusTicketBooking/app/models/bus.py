from sqlalchemy import Column, Integer, String

from app.database import Base


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)

    bus_name = Column(String(100), nullable=False)

    source = Column(String(100), nullable=False)

    destination = Column(String(100), nullable=False)

    departure_time = Column(String(20), nullable=False)

    arrival_time = Column(String(20), nullable=False)

    total_seats = Column(Integer, nullable=False)

fare = Column(Integer, nullable=False, default=500)