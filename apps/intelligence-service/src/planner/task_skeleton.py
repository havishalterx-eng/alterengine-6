"""Internal DAG representation for task skeletons.

This is the canonical Python type for `task_skeleton_json` /
`revised_skeleton_json` fields that travel across the planner proto contract
as opaque JSON strings.  Nothing in this module is part of the proto wire
format itself; the proto only cares about the serialised string.
"""

import json

from pydantic import BaseModel, Field, field_validator


def _validate_criteria(criteria: list[str] | None) -> list[str] | None:
    if criteria is not None and (
        not criteria or any(not criterion.strip() for criterion in criteria)
    ):
        raise ValueError("success_criteria must contain non-empty strings")
    return criteria


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
        return _validate_criteria(criteria)


class TaskSkeleton(BaseModel):
    model_config = {"frozen": True}

    version: str = "1"
    nodes: list[TaskNode]
    entry_point: str
    success_criteria: list[str] | None = None

    @field_validator("success_criteria")
    @classmethod
    def _validate_success_criteria(cls, criteria: list[str] | None) -> list[str] | None:
        return _validate_criteria(criteria)

    def to_json(self) -> str:
        return self.model_dump_json(exclude_none=True)

    @classmethod
    def from_json(cls, raw: str) -> "TaskSkeleton":
        return cls.model_validate(json.loads(raw))


def retain_and_validate_criteria(
    skeleton: TaskSkeleton, criteria: list[str]
) -> TaskSkeleton:
    """Keep intake criteria unchanged and require explicit node coverage."""
    assigned = {
        criterion
        for node in skeleton.nodes
        for criterion in node.success_criteria or []
    }
    expected = set(criteria)
    missing = [criterion for criterion in criteria if criterion not in assigned]
    unexpected = sorted(assigned - expected)
    if missing or unexpected:
        details: list[str] = []
        if missing:
            details.append(f"unassigned criteria: {', '.join(missing)}")
        if unexpected:
            details.append(f"criteria not supplied at intake: {', '.join(unexpected)}")
        raise ValueError("; ".join(details))
    return skeleton.model_copy(update={"success_criteria": list(criteria) if criteria else None})
