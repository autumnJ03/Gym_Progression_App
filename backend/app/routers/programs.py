from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories import program as program_repo
from app.schemas.program import ProgramDetailOut, ProgramOut

router = APIRouter()


@router.get("", response_model=list[ProgramOut])
async def list_programs(db: AsyncSession = Depends(get_db)):
    return await program_repo.list_all(db)


@router.get("/{program_id}", response_model=ProgramDetailOut)
async def get_program(program_id: int, db: AsyncSession = Depends(get_db)):
    program = await program_repo.get_with_sessions(db, program_id)
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    return program
