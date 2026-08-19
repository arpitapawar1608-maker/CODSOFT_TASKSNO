from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.bus import Bus
from app.schemas.bus import BusCreate


router = APIRouter(
    prefix="/buses",
    tags=["Buses"]
)


# =========================================================
# ADD BUS
# =========================================================

@router.post("/")
def add_bus(
    bus: BusCreate,
    db: Session = Depends(get_db)
):

    new_bus = Bus(
        bus_name=bus.bus_name,
        source=bus.source,
        destination=bus.destination,
        departure_time=bus.departure_time,
        arrival_time=bus.arrival_time,
        total_seats=bus.total_seats
    )

    db.add(new_bus)
    db.commit()
    db.refresh(new_bus)

    return {
        "message": "Bus added successfully",
        "bus_id": new_bus.id
    }


# =========================================================
# GET ALL BUSES
# =========================================================

@router.get("/")
def get_buses(
    db: Session = Depends(get_db)
):

    buses = db.query(Bus).all()

    return buses


# =========================================================
# SEARCH BUSES
# =========================================================

@router.get("/search")
def search_bus(
    source: str,
    destination: str,
    db: Session = Depends(get_db)
):

    buses = db.query(Bus).filter(
        func.lower(func.trim(Bus.source)) == source.strip().lower(),
        func.lower(func.trim(Bus.destination)) == destination.strip().lower()
    ).all()

    return buses


# =========================================================
# CREATE SAMPLE BUSES
# =========================================================

@router.post("/sample-data")
def create_sample_buses(
    db: Session = Depends(get_db)
):

    existing_buses = db.query(Bus).count()

    if existing_buses > 0:
        return {
            "message": "Sample buses already exist",
            "total_buses": existing_buses
        }

    sample_buses = [

        Bus(
            bus_name="KSRTC Express",
            source="Belagavi",
            destination="Bengaluru",
            departure_time="08:30 AM",
            arrival_time="02:30 PM",
            total_seats=40
        ),

        Bus(
            bus_name="VRL Travels",
            source="Belagavi",
            destination="Bengaluru",
            departure_time="10:00 AM",
            arrival_time="04:15 PM",
            total_seats=40
        ),

        Bus(
            bus_name="Neeta Travels",
            source="Belagavi",
            destination="Pune",
            departure_time="09:00 PM",
            arrival_time="04:00 AM",
            total_seats=36
        ),

        Bus(
            bus_name="SRS Travels",
            source="Belagavi",
            destination="Pune",
            departure_time="07:30 AM",
            arrival_time="02:00 PM",
            total_seats=40
        ),

        Bus(
            bus_name="VRL Sleeper",
            source="Pune",
            destination="Mumbai",
            departure_time="09:30 PM",
            arrival_time="05:30 AM",
            total_seats=32
        ),

        Bus(
            bus_name="KSRTC Rajahamsa",
            source="Bengaluru",
            destination="Belagavi",
            departure_time="06:00 AM",
            arrival_time="12:30 PM",
            total_seats=40
        ),

        Bus(
            bus_name="Airavat Club Class",
            source="Bengaluru",
            destination="Pune",
            departure_time="08:00 PM",
            arrival_time="07:00 AM",
            total_seats=36
        ),

        Bus(
            bus_name="Shivneri Express",
            source="Pune",
            destination="Mumbai",
            departure_time="07:00 AM",
            arrival_time="11:00 AM",
            total_seats=40
        )

    ]

    db.add_all(sample_buses)
    db.commit()

    return {
        "message": "Sample buses created successfully",
        "total_buses": len(sample_buses)
    }
    # =========================================================
# RESET SAMPLE BUSES
# =========================================================

@router.post("/reset-sample-data")
def reset_sample_buses(
    db: Session = Depends(get_db)
):

    # Delete all existing buses
    db.query(Bus).delete()
    db.commit()

    # Create fresh sample buses
    sample_buses = [

        Bus(
            bus_name="KSRTC Express",
            source="Belagavi",
            destination="Bengaluru",
            departure_time="08:30 AM",
            arrival_time="02:30 PM",
            total_seats=40
        ),

        Bus(
            bus_name="VRL Travels",
            source="Belagavi",
            destination="Bengaluru",
            departure_time="10:00 AM",
            arrival_time="04:15 PM",
            total_seats=40
        ),

        Bus(
            bus_name="Neeta Travels",
            source="Belagavi",
            destination="Pune",
            departure_time="09:00 PM",
            arrival_time="04:00 AM",
            total_seats=36
        ),

        Bus(
            bus_name="SRS Travels",
            source="Belagavi",
            destination="Pune",
            departure_time="07:30 AM",
            arrival_time="02:00 PM",
            total_seats=40
        ),

        Bus(
            bus_name="VRL Sleeper",
            source="Pune",
            destination="Mumbai",
            departure_time="09:30 PM",
            arrival_time="05:30 AM",
            total_seats=32
        ),

        Bus(
            bus_name="KSRTC Rajahamsa",
            source="Bengaluru",
            destination="Belagavi",
            departure_time="06:00 AM",
            arrival_time="12:30 PM",
            total_seats=40
        ),

        Bus(
            bus_name="Airavat Club Class",
            source="Bengaluru",
            destination="Pune",
            departure_time="08:00 PM",
            arrival_time="07:00 AM",
            total_seats=36
        ),

        Bus(
            bus_name="Shivneri Express",
            source="Pune",
            destination="Mumbai",
            departure_time="07:00 AM",
            arrival_time="11:00 AM",
            total_seats=40
        )

    ]

    db.add_all(sample_buses)
    db.commit()

    return {
        "message": "Sample bus data reset successfully",
        "total_buses": len(sample_buses)
    }