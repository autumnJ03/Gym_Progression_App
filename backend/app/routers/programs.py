from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_programs():
    # TODO: query programs table
    raise NotImplementedError


@router.get("/{program_id}")
async def get_program(program_id: int):
    # TODO: query program + sessions + exercises
    raise NotImplementedError
