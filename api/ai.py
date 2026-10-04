"""summaries and practice quizzes from a student's notes, using google gemini.

nothing the student sends is stored or logged here: it goes to gemini and
the answer comes straight back."""

import os
import time

from google import genai
from google.genai import errors, types
from pydantic import BaseModel

MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
MAX_CHARS = 60_000
RETRIES = 2

PROMPT = """you are a study assistant for a university student.
from the study material provided, write:
1. a summary of at most 120 words, in plain language
2. 4 to 6 key points, one short sentence each
3. a practice quiz of {num_questions} multiple-choice questions, each with exactly 4 options,
   the index (0-3) of the correct option, and a one-sentence explanation of why it is correct

only use what is in the material. if the material is too short or unclear to
make a fair quiz, return fewer questions rather than inventing facts."""


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer_index: int
    explanation: str


class StudyAid(BaseModel):
    summary: str
    key_points: list[str]
    quiz: list[QuizQuestion]


class MissingKey(RuntimeError):
    pass


_shared_client: genai.Client | None = None


def _client() -> genai.Client:
    # keep one client alive: a throwaway one closes its connection before
    # the request is sent
    global _shared_client
    if _shared_client is None:
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            raise MissingKey("GEMINI_API_KEY is not set; add it to the .env file")
        _shared_client = genai.Client(api_key=key)
    return _shared_client


def _generate(material, num_questions: int) -> StudyAid:
    # gemini sometimes answers 503 "high demand"; a short wait usually clears it
    for attempt in range(RETRIES + 1):
        try:
            response = _client().models.generate_content(
                model=MODEL,
                contents=[PROMPT.format(num_questions=num_questions), material],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=StudyAid,
                ),
            )
            return StudyAid.model_validate_json(response.text)
        except errors.ServerError:
            if attempt == RETRIES:
                raise
            time.sleep(2 * (attempt + 1))


def from_text(text: str, num_questions: int = 5) -> StudyAid:
    return _generate(text[:MAX_CHARS], num_questions)


def from_file(data: bytes, mime_type: str, num_questions: int = 5) -> StudyAid:
    return _generate(types.Part.from_bytes(data=data, mime_type=mime_type), num_questions)


DUCK = """you are spookie, a small rubber duck in a witch hat who lives in a magic pond inside a
student dashboard. you do rubber-duck debugging for academic challenges: the student talks through
what is going wrong in a course and you help them think it through.

how you talk:
- warm, a little playful, a little magical. never mocking. write in lowercase.
- keep every reply under 80 words.
- ask one short question at a time and reflect back what you heard.
- end with one small, concrete next step the student could do today.
- you believe the student can pass this class. say so, and say why, based on what they tell you.

limits:
- help them plan and understand; do not write their assignments for them.
- you are not a counsellor. if the student says they are in crisis or unsafe, tell them kindly to
  contact campus counselling or emergency services right away.
- you only know what is in this conversation and the notes below. do not invent grades or facts."""


def duck_reply(messages: list[tuple[str, str]], context: str) -> str:
    """messages are (who, text) pairs, who is "student" or "duck"."""
    contents = [
        types.Content(
            role="user" if who == "student" else "model",
            parts=[types.Part.from_text(text=text)],
        )
        for who, text in messages
    ]
    for attempt in range(RETRIES + 1):
        try:
            response = _client().models.generate_content(
                model=MODEL,
                contents=contents,
                config=types.GenerateContentConfig(system_instruction=DUCK + chr(10) * 2 + context),
            )
            return (response.text or "").strip()
        except errors.ServerError:
            if attempt == RETRIES:
                raise
            time.sleep(2 * (attempt + 1))
