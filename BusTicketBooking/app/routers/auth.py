from fastapi import APIRouter, Depends, HTTPException, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.config import SECRET_KEY, ALGORITHM

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# API Register
# -------------------------
@router.post("/register")
def register_api(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully"
    }


# -------------------------
# HTML Register
# -------------------------
@router.post("/register-form")
def register_form(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password)
    )

    db.add(new_user)
    db.commit()

    return RedirectResponse(
        url="/login",
        status_code=303
    )


# -------------------------
# API Login (Swagger)
# -------------------------
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user or not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# -------------------------
# HTML Login
# -------------------------
@router.post("/login-form")
def login_form(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == username
    ).first()

    if not user or not verify_password(
        password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    response = RedirectResponse(
        url="/",
        status_code=303
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60,
        expires=60 * 60,
        samesite="lax",
        secure=False
    )

    return response


# -------------------------
# Current Logged-in User
# -------------------------
@router.get("/me")
def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return {
        "logged_in": True,
        "full_name": user.full_name,
        "email": user.email
    }
    # -------------------------
# Logout
# -------------------------
@router.get("/logout")
def logout():
    response = RedirectResponse(
        url="/",
        status_code=303
    )

    response.delete_cookie(
        key="access_token"
    )

    return response
    # -------------------------
# Logout
# -------------------------
@router.get("/logout")
def logout():
    response = RedirectResponse(
        url="/",
        status_code=303
    )

    response.delete_cookie(
        key="access_token"
    )

    return response