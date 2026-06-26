"""Schemas Pydantic para categorías."""
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    parent_id: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    parent_id: int | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None
    full_path: str  # ej. "Matemáticas > Álgebra"

    class Config:
        from_attributes = True
