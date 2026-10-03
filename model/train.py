"""train the at-risk decision tree and write everything the dashboard needs.

run from the repo root:  python model/train.py
outputs go to model/artifacts/: tree.joblib, metrics.json, tree_rules.txt, tree.png
"""

import json
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    fbeta_score,
    make_scorer,
    precision_score,
    recall_score,
)
from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_predict,
    cross_validate,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier, export_text, plot_tree

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "student_outcomes.csv"
OUT = ROOT / "model" / "artifacts"

SEED = 42
PERCENT_COLUMNS = ["on_time_submission_rate", "late_night_study_pct", "attendance_rate"]
CLASS_YEARS = {"Freshman": 1, "Sophomore": 2, "Junior": 3, "Senior": 4}
DEPTHS = range(1, 11)
MIN_SAMPLES_LEAF = 10
THRESHOLDS = [round(0.2 + 0.05 * i, 2) for i in range(9)]  # 0.20 to 0.60
F2 = make_scorer(fbeta_score, beta=2, zero_division=0)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """turn the raw sheet into numeric features. missing values are left as
    NaN here and filled inside the pipeline, so the fill value is learned
    from training rows only."""
    df = df.copy()
    for col in PERCENT_COLUMNS:
        df[col] = df[col].str.rstrip("%").astype(float) / 100
    df["class_year"] = df["class_year"].map(CLASS_YEARS)
    # a blank quiz score means the student took no quizzes, so keep that as a
    # signal instead of pretending they scored the median
    df["took_practice_quizzes"] = (df["practice_quizzes_taken"] > 0).astype(int)
    df = pd.get_dummies(df, columns=["course"], prefix="course", dtype=int)
    return df.drop(columns=["student_id"])


def build_model(depth: int) -> Pipeline:
    return Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            (
                "tree",
                DecisionTreeClassifier(
                    max_depth=depth,
                    min_samples_leaf=MIN_SAMPLES_LEAF,
                    class_weight="balanced",
                    random_state=SEED,
                ),
            ),
        ]
    )


def score(y_true, y_pred) -> dict:
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 3),
        "recall": round(recall_score(y_true, y_pred, zero_division=0), 3),
        "precision": round(precision_score(y_true, y_pred, zero_division=0), 3),
        "f2": round(fbeta_score(y_true, y_pred, beta=2, zero_division=0), 3),
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    raw = pd.read_csv(DATA)
    df = clean(raw)
    X, y = df.drop(columns=["at_risk"]), df["at_risk"]

    # hold out 20% before looking at anything; it is scored once, at the end
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )

    # pick the depth with 5-fold cross-validation on the training rows only.
    # f2 counts recall twice as much as precision: missing a struggling
    # student costs more than a false alarm.
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    depth_curve = []
    for depth in DEPTHS:
        res = cross_validate(
            build_model(depth),
            X_train,
            y_train,
            cv=cv,
            scoring={"recall": "recall", "accuracy": "accuracy", "f2": F2},
            return_train_score=True,
        )
        depth_curve.append(
            {
                "depth": depth,
                "train_f2": round(res["train_f2"].mean(), 3),
                "cv_f2": round(res["test_f2"].mean(), 3),
                "train_recall": round(res["train_recall"].mean(), 3),
                "cv_recall": round(res["test_recall"].mean(), 3),
                "train_accuracy": round(res["train_accuracy"].mean(), 3),
                "cv_accuracy": round(res["test_accuracy"].mean(), 3),
            }
        )

    # the tree outputs a probability; where we draw the line is a choice too.
    # pick depth and cutoff together on out-of-fold predictions, so the
    # held-out rows stay untouched.
    best_depth, threshold, best_f2 = 1, 0.5, -1.0
    for depth in DEPTHS:
        proba = cross_val_predict(
            build_model(depth), X_train, y_train, cv=cv, method="predict_proba"
        )[:, 1]
        for cut in THRESHOLDS:
            f2 = fbeta_score(y_train, (proba >= cut).astype(int), beta=2)
            if f2 > best_f2:
                best_depth, threshold, best_f2 = depth, cut, f2

    model = build_model(best_depth).fit(X_train, y_train)

    def predict(features: pd.DataFrame):
        return (model.predict_proba(features)[:, 1] >= threshold).astype(int)

    # baselines, scored on the same held-out rows
    majority = [0] * len(y_test)
    midterm_cut = _best_midterm_cut(X_train["midterm_score"], y_train)
    midterm_rule = (X_test["midterm_score"] < midterm_cut).astype(int)

    tree = model.named_steps["tree"]
    importances = sorted(
        zip(X.columns, tree.feature_importances_), key=lambda pair: -pair[1]
    )
    metrics = {
        "rows": {"total": len(df), "train": len(X_train), "test": len(X_test)},
        "at_risk_rate": round(float(y.mean()), 3),
        "missing_values": {
            col: int(n) for col, n in raw.isna().sum().items() if n > 0
        },
        "chosen_depth": best_depth,
        "min_samples_leaf": MIN_SAMPLES_LEAF,
        "depth_curve": depth_curve,
        "threshold": threshold,
        "cv_f2_at_threshold": round(best_f2, 3),
        "train": score(y_train, predict(X_train)),
        "test": score(y_test, predict(X_test)),
        "baselines": {
            "always_not_at_risk": score(y_test, majority),
            "midterm_rule": {"cutoff": midterm_cut, **score(y_test, midterm_rule)},
        },
        "feature_importances": [
            {"feature": name, "importance": round(float(value), 3)}
            for name, value in importances
            if value > 0
        ],
        "features": list(X.columns),
    }

    joblib.dump({"model": model, "threshold": threshold}, OUT / "tree.joblib")
    (OUT / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (OUT / "tree_rules.txt").write_text(
        export_text(tree, feature_names=list(X.columns))
    )
    fig, ax = plt.subplots(figsize=(22, 10))
    plot_tree(
        tree,
        feature_names=list(X.columns),
        class_names=["on track", "at risk"],
        filled=True,
        rounded=True,
        impurity=False,
        fontsize=8,
        ax=ax,
    )
    fig.savefig(OUT / "tree.png", dpi=150, bbox_inches="tight")

    print(f"chosen depth: {best_depth}, threshold: {threshold}")
    print(f"train:        {metrics['train']}")
    print(f"test:         {metrics['test']}")
    for name, values in metrics["baselines"].items():
        print(f"{name}: {values}")
    print("top features:", metrics["feature_importances"][:5])


def _best_midterm_cut(midterm: pd.Series, y: pd.Series) -> int:
    """the strongest one-line rule we can find on the training rows:
    flag everyone whose midterm is below the cutoff."""
    cuts = range(40, 91)
    return max(cuts, key=lambda cut: fbeta_score(y, (midterm < cut).astype(int), beta=2))


if __name__ == "__main__":
    main()
