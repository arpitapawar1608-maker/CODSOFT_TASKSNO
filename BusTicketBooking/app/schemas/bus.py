from pydantic import BaseModel


class BusCreate(BaseModel):
    bus_name: str
    source: str
    destination: str
    departure_time: str
    arrival_time: str
    total_seats: int


class BusResponse(BusCreate):
    id: int

    class Config:
        from_attributes = True