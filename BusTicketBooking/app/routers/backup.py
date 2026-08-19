from fastapi import APIRouter, HTTPException

from app.services.backup_service import (
    create_backup,
    restore_backup
)


router = APIRouter(
    prefix="/backup",
    tags=["Backup & Restore"]
)


@router.post("/create")
def backup_database():

    try:

        backup_file = create_backup()

        return {
            "message": "Database backup created successfully",
            "backup_file": backup_file
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



@router.post("/restore")
def restore_database(
    backup_file: str
):

    try:

        success = restore_backup(
            backup_file
        )


        if not success:

            raise HTTPException(
                status_code=404,
                detail="Backup file not found"
            )


        return {
            "message": "Database restored successfully"
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )