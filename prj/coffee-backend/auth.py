# auth.py

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import select

from database import get_session
from models import Manager, Employee

# get these from your .env
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_ctx.hash(password)


def authenticate_user(email: str, password: str, session=Depends(get_session)) -> Optional[Employee]:
    print("🔑 Attempting login for:", email)
    user = session.exec(select(Employee).where(Employee.email == email)).first()
    print("👤 Lookup result:", user)
    if user:
        ok = verify_password(password, user.password_hash)
        print("🔒 Password match?", ok)
    if not user or not ok:
        print("❌ Authentication failed")
        return None
    print("✅ Authentication succeeded")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session=Depends(get_session),
) -> Employee:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(Employee).where(Employee.email == email)
    user = session.exec(stmt).first()
    if not user:
        raise credentials_exception
    return user


def require_manager_role(
    current: Employee = Depends(get_current_user),
    session = Depends(get_session)
) -> Employee:
    # check if current user exists as a manager
    is_mgr = session.exec(
        select(Manager).where(Manager.ssn == current.ssn)
    ).first()
    if not is_mgr:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers only"
        )
    return current
