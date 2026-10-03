"""turn the tree's decision path for one student into plain-language reasons
and next steps. wording is supportive on purpose: it names what to work on,
not what went wrong."""

import pandas as pd
from sklearn.pipeline import Pipeline

# feature -> (how to say it, how to format the value, what to do about it)
FEATURES = {
    "midterm_score": (
        "midterm score",
        lambda v: f"{v:.1f}".removesuffix(".0"),
        "go to office hours or tutoring this week and go over the midterm topics you missed",
    ),
    "on_time_submission_rate": (
        "share of deadlines submitted on time",
        lambda v: f"{v:.0%}",
        "put every deadline on the deadlines page and start each assignment two days earlier",
    ),
    "attendance_rate": (
        "class attendance",
        lambda v: f"{v:.0%}",
        "aim to attend every class for the next two weeks",
    ),
    "late_night_study_pct": (
        "share of studying done between midnight and 4 a.m.",
        lambda v: f"{v:.0%}",
        "move one late-night study session per week to the afternoon or evening",
    ),
    "avg_days_started_before_exam": (
        "average head start before exams",
        lambda v: f"{v:.1f} days",
        "start studying at least five days before your next exam",
    ),
    "avg_practice_quiz_score": (
        "average practice quiz score",
        lambda v: f"{v:.0f}",
        "take a practice quiz on the study page for your weakest topic",
    ),
    "practice_quizzes_taken": (
        "practice quizzes taken",
        lambda v: f"{v:.0f}",
        "take one practice quiz on the study page this week",
    ),
    "took_practice_quizzes": (
        "practice quizzes taken",
        lambda v: "none" if v < 0.5 else "some",
        "take one practice quiz on the study page this week",
    ),
    "avg_weekly_study_hours": (
        "weekly study hours for this course",
        lambda v: f"{v:.1f}",
        "add two short study sessions for this course to your week",
    ),
    "study_sessions_logged": (
        "study sessions logged",
        lambda v: f"{v:.0f}",
        "add two short study sessions for this course to your week",
    ),
    "flashcards_reviewed": (
        "flashcards reviewed",
        lambda v: f"{v:.0f}",
        "review a set of flashcards before your next class",
    ),
    "materials_uploaded": (
        "study materials uploaded",
        lambda v: f"{v:.0f}",
        "upload your notes or slides on the study page to get a summary and a quiz",
    ),
    "missed_deadlines": (
        "missed deadlines",
        lambda v: f"{v:.0f}",
        "put every deadline on the deadlines page and start each assignment two days earlier",
    ),
    "work_hours_per_week": (
        "paid work hours per week",
        lambda v: f"{v:.0f}",
        "block fixed study times around your work shifts, and talk to your advisor if the load feels too heavy",
    ),
    "avg_sleep_hours": (
        "average hours of sleep",
        lambda v: f"{v:.1f}",
        "protect your sleep on the nights before class and exams",
    ),
    "credit_hours": (
        "credit hours this semester",
        lambda v: f"{v:.0f}",
        "talk to your advisor about how to balance this semester's course load",
    ),
}


def explain(model: Pipeline, row: pd.DataFrame, provided: set[str]) -> dict:
    """walk the path this student takes through the tree. at each split,
    compare the branch they took with the one they didn't: if theirs carries
    more risk, that split is something to work on; otherwise it's a strength.

    `provided` holds the features the student actually gave us, so we never
    describe a value we filled in ourselves."""
    tree = model.named_steps["tree"].tree_
    filled = model.named_steps["impute"].transform(row)[0]
    columns = list(row.columns)

    def risk(node: int) -> float:
        return float(tree.value[node][0][1])

    work_on, strengths = {}, {}
    node = 0
    while tree.children_left[node] != -1:
        index, cut = tree.feature[node], tree.threshold[node]
        name, value = columns[index], filled[index]
        below = value <= cut
        taken = tree.children_left[node] if below else tree.children_right[node]
        other = tree.children_right[node] if below else tree.children_left[node]
        if name in provided:
            bucket = work_on if risk(taken) > risk(other) else strengths
            # the same feature can split twice; the deeper split is the tighter one
            bucket[name] = _sentence(name, value, cut, below)
        node = taken

    return {
        "reasons": [work_on[name] for name in work_on],
        "strengths": [strengths[name] for name in strengths if name not in work_on],
        "actions": _unique(_action(name) for name in work_on),
    }


def _sentence(name: str, value: float, cut: float, below: bool) -> str:
    if name.startswith("course_"):
        course = name.removeprefix("course_")
        return f"this pattern is more common in {course}" if not below else f"you are not in {course}"
    label, fmt, _ = FEATURES.get(name, (name.replace("_", " "), lambda v: f"{v:g}", ""))
    if name == "took_practice_quizzes":
        return "you haven't taken any practice quizzes yet" if below else "you have taken practice quizzes"
    side = "at or below" if below else "above"
    return f"your {label} ({fmt(value)}) is {side} {fmt(cut)}"


def _action(name: str) -> str:
    if name in FEATURES:
        return FEATURES[name][2]
    return "talk to your instructor or advisor about support for this course"


def _unique(items) -> list[str]:
    return list(dict.fromkeys(items))
