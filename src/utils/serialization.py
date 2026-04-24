from typing import List, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def serialize_list(schema: Type[T], items) -> List[dict]:
    return [schema.model_validate(item).model_dump(mode="json") for item in items]
