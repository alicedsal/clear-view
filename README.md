# clear view

a dashboard web app for a hackathon. vite + react + typescript, tailwind for styling, recharts for charts.

## run it

```bash
npm install
npm run dev
```

## layout

- `src/App.tsx` — sidebar shell and routes
- `src/pages/` — one file per screen
- `src/data/sample.ts` — placeholder data, replace with the real source

## the model

a decision tree that predicts whether a student is at risk of finishing a course with a d or f.

```bash
pip install -r model/requirements.txt
python model/train.py
```

- `data/` — the synthetic wolfhacks dataset and its data dictionary
- `model/train.py` — cleaning, held-out split, baselines, depth and cutoff selection, evaluation
- `model/artifacts/` — the saved model, `metrics.json`, the tree as text and as a picture

## ai usage

parts of this project were written with claude code (anthropic's claude), including the project scaffold and the model training script. the team reviewed and directed the work.
