from pydantic import BaseModel


class BookingCreate(BaseModel):
    bus_id: int
    seat_number: str
    travel_date: str


class BookingResponse(BaseModel):
    id: int
    user_id: int
    bus_id: int
    seat_number: str
    travel_date: str
    booking_status: str

    class Config:
        from_attributes = True