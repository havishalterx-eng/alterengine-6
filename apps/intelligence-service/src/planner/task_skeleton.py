"""Internal DAG representation for task skeletons.

This is the canonical Python type for `task_skeleton_json` /
`revised_skeleton_json` fields that travel across the planner proto contract
as opaque JSON strings.  Nothing in this module is part of the proto wire
format itself; the proto only cares about the serialised string.
"""

import json

from pydantic import BaseModel, Field, field_validator


class TaskNode(BaseModel):
    model_config = {"frozen": True}

    key: str
    type: str  # "llm" | "tool" | "branch" | "join"
    config: dict[str, object] = Field(default_factory=dict)
    depends_on: list[str] = Field(default_factory=list)
    success_criteria: list[str] | None = None

    @field_validator("success_criteria")
    @classmethod
    def _validate_success_criteria(cls, criteria: list[str] | None) -> list[str] | None:
        if criteria is not None and (
            not criteria or any(not criterion.strip() for criterion in criteria)
        ):
            raise ValueError("success_criteria must contain non-empty strings")
        return criteria


class TaskSkeleton(BaseModel):
    model_config = {"frozen": True}

    version: str = "1"
    nodes: list[TaskNode]
    entry_point: str

    def to_json(self) -> str:
        return self.model_dump_json(exclude_none=True)

    @classmethod
    def from_json(cls, raw: str) -> "TaskSkeleton":
        return cls.model_validate(json.loads(raw))
