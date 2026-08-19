import shutil
import os
from datetime import datetime


DATABASE_FILE = "bus_booking.db"

BACKUP_FOLDER = "backups"


def create_backup():

    if not os.path.exists(BACKUP_FOLDER):
        os.makedirs(BACKUP_FOLDER)


    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )


    backup_file = (
        f"{BACKUP_FOLDER}/backup_{timestamp}.db"
    )


    shutil.copy(
        DATABASE_FILE,
        backup_file
    )


    return backup_file



def restore_backup(backup_file):

    if not os.path.exists(backup_file):
        return False


    shutil.copy(
        backup_file,
        DATABASE_FILE
    )


    return True