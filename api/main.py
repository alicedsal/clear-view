"""clear view api. run from the repo root:

    python -m uvicorn api.main:app --reload --port 8000

interactive docs: http://localhost:8000/docs
"""

import json
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

import joblib  # noqa: E402
import pandas as pd  # noqa: E402
from fastapi import FastAPI, File, Form, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from api import ai  # noqa: E402
from api.explain import explain  # noqa: E402

ARTIFACTS = ROOT / "model" / "artifacts"
CLASS_YEARS = {"Freshman": 1, "Sophomore": 2, "Junior": 3, "Senior": 4}
FILE_TYPES = {"application/pdf", "text/plain", "text/markdown"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024

saved = joblib.load(ARTIFACTS / "tree.joblib")
MODEL, THRESHOLD = saved["model"], saved["threshold"]
METRICS = json.loads((ARTIFACTS / "metrics.json").read_text())
FEATURES: list[str] = METRICS["features"]
COURSES = [name.removeprefix("course_") for name in FEATURES if name.startswith("course_")]

app = FastAPI(title="clear view api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/artifacts", StaticFiles(directory=ARTIFACTS), name="artifacts")


class Student(BaseModel):
    """one student in one course. rates are fractions (0.85, not 85).
    only the midterm score is required; anything left out is filled with the
    typical value from the training data and never shown back as a reason."""

    midterm_score: float = Field(ge=0, le=100)
    course: str | None = None
    class_year: Literal["Freshman", "Sophomore", "Junior", "Senior"] | None = None
    credit_hours: float | None = Field(default=None, ge=0, le=30)
    work_hours_per_week: float | None = Field(default=None, ge=0, le=80)
    avg_weekly_study_hours: float | None = Field(default=None, ge=0, le=80)
    study_sessions_logged: float | None = Field(default=None, ge=0)
    materials_uploaded: float | None = Field(default=None, ge=0)
    practice_quizzes_taken: float | None = Field(default=None, ge=0)
    avg_practice_quiz_score: float | None = Field(default=None, ge=0, le=100)
    flashcards_reviewed: float | None = Field(default=None, ge=0)
    avg_days_started_before_exam: float | None = Field(default=None, ge=0, le=60)
    on_time_submission_rate: float | None = Field(default=None, ge=0, le=1)
    missed_deadlines: float | None = Field(default=None, ge=0)
    late_night_study_pct: float | None = Field(default=None, ge=0, le=1)
    attendance_rate: float | None = Field(default=None, ge=0, le=1)
    avg_sleep_hours: float | None = Field(default=None, ge=0, le=24)


class Prediction(BaseModel):
    level: Literal["on track", "some support", "extra support"]
    flagged: bool
    score: float
    message: str
    reasons: list[str]
    strengths: list[str]
    actions: list[str]


class Notes(BaseModel):
    text: str = Field(min_length=50)
    num_questions: int = Field(default=5, ge=1, le=10)


MESSAGES = {
    "on track": "you look on track in this course. keep doing what's working.",
    "some support": "a few habits could use attention. small changes now make a real difference.",
    "extra support": "this course could use extra support right now. there is still time to turn it around, and here is where to start.",
}


def to_features(student: Student) -> tuple[pd.DataFrame, set[str]]:
    given = student.model_dump(exclude_none=True)
    row = {name: float("nan") for name in FEATURES}
    for name, value in given.items():
        if name in row and name != "class_year":
            row[name] = value
    if student.class_year:
        row["class_year"] = CLASS_YEARS[student.class_year]
    if student.practice_quizzes_taken is not None:
        row["took_practice_quizzes"] = int(student.practice_quizzes_taken > 0)
    for course in COURSES:
        row[f"course_{course}"] = int(student.course == course)

    provided = set(given) & set(FEATURES)
    if student.practice_quizzes_taken is not None:
        provided.add("took_practice_quizzes")
    if student.course in COURSES:
        provided |= {f"course_{course}" for course in COURSES}
    return pd.DataFrame([row], columns=FEATURES), provided


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/options")
def options() -> dict:
    """the values the risk form can offer."""
    return {"courses": COURSES, "class_years": list(CLASS_YEARS)}


@app.post("/predict")
def predict(student: Student) -> Prediction:
    row, provided = to_features(student)
    score = float(MODEL.predict_proba(row)[0, 1])
    if score < THRESHOLD:
        level = "on track"
    elif score < 0.5:
        level = "some support"
    else:
        level = "extra support"
    return Prediction(
        level=level,
        flagged=score >= THRESHOLD,
        # a relative score from the tree, not a calibrated chance of failing
        score=round(score, 2),
        message=MESSAGES[level],
        **explain(MODEL, row, provided),
    )


@app.get("/metrics")
def metrics() -> dict:
    """everything the "how the model works" page shows. the tree picture is
    at /artifacts/tree.png."""
    return METRICS


@app.post("/ai")
def study_aid(notes: Notes) -> ai.StudyAid:
    return _ask(lambda: ai.from_text(notes.text, notes.num_questions))


@app.post("/ai/file")
async def study_aid_from_file(
    file: UploadFile = File(...), num_questions: int = Form(default=5, ge=1, le=10)
) -> ai.StudyAid:
    if file.content_type not in FILE_TYPES:
        raise HTTPException(415, "upload a pdf, .txt or .md file")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "file is larger than 15 mb")
    return _ask(lambda: ai.from_file(data, file.content_type, num_questions))


def _ask(call):
    try:
        return call()
    except ai.MissingKey as error:
        raise HTTPException(503, str(error))
    except Exception:
        # don't echo the provider error: it can contain the student's text
        raise HTTPException(502, "the ai service could not answer; try again")
