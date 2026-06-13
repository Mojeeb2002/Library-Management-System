from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import require_role
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])

_admin = require_role(UserRole.admin)


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(_admin)):
    return db.query(User).order_by(User.id).all()


@router.put("/{user_id}/role", response_model=UserOut)
def update_role(
    user_id: int,
    body: UserRoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user
