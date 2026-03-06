import json
from typing import Any, List, Optional
from tortoise.fields.base import Field


class ArrayField(Field, list):
    """
    A custom wrapper that serializes python lists into MySQL JSON fields
    since MySQL does not support PostgreSQL native arrays.
    """
    SQL_TYPE = "JSON"

    def __init__(self, field: Field = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self.sub_field = field

    def to_python_value(self, value: Any) -> Optional[List[Any]]:
        if value is None:
            return None
        
        # MySQL returns JSON fields as lists or dicts natively in some drivers, 
        # or as strings in others.
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                return []
                
        if not isinstance(value, list):
            value = [value]
            
        if self.sub_field:
             return list(map(self.sub_field.to_python_value, value))
        return value

    def to_db_value(self, value: Any, instance: Any) -> Any:
        from pypika.terms import Term
        if value is None or isinstance(value, Term):
            return value
            
        if not isinstance(value, (list, tuple)):
            value = [value]
            
        if self.sub_field:
             value = [
                 val if isinstance(val, Term) else self.sub_field.to_db_value(val, instance) 
                 for val in value
             ]
             
        # MySQL JSON fields require string serialization in this Tortoise version
        return json.dumps(value)
