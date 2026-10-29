# Index Questionnaire

Static web app (plain HTML/CSS/JS, no build step, no dependencies) that hosts a multi-section questionnaire, computes an index score, and lets the respondent export results.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npm start        # or: python3 -m http.server 8080
npm test         # unit tests for scoring/validation (Node 18+)
```

## Two modes: pick one

1. **SurveyMonkey mode (`surveymonkey.html`)**: use this if the questionnaire is built in SurveyMonkey. This page is a branded wrapper (company name top-left) around SurveyMonkey's embedded survey. Questions, logic and responses all stay in SurveyMonkey.
2. **Standalone mode (`index.html`)**: the questionnaire is defined in `js/questionnaire.js` and runs entirely in this app, with its own scoring and CSV/JSON export. No responses are collected centrally.

Do not run both for the same questionnaire. Delete the one you are not using.

### Using SurveyMonkey

1. In SurveyMonkey: **Collect Responses -> Website collector -> Embedded survey -> Copy Code** (steps per [SurveyMonkey's help page](https://help.surveymonkey.com/en/surveymonkey/send/website-collector/)).
2. Open `surveymonkey.html` and paste the code where the placeholder `<div id="sm-placeholder">` is. Remove the placeholder. Do not edit the code.
3. Set `companyName` (and optionally `surveyTitle`, `logoUrl`) in `js/config.js`.
4. The embed only works when the page is served from a real web address (GitHub Pages, your own host), not always when opened as a local file. Test it on the deployed URL.

Per SurveyMonkey's documentation, embedded surveys have no survey end page and no instant results, and a custom thank-you page shows SurveyMonkey branding. Later survey edits appear after refresh without changing the embed code.

## Who edits what (standalone mode)

| File | Owner | Purpose |
|---|---|---|
| `js/config.js` | anyone | **Company name (top-left)**, optional logo, accent color |
| `js/questionnaire.js` | questionnaire designer | All sections, questions, scoring, bands |
| `js/core.js`, `js/app.js`, `css/` | developer | Logic, UI, styling |

The app validates `questionnaire.js` on load. If something is wrong, the page shows a list of exact problems instead of breaking silently.

## Company name and logo

Edit `js/config.js`:

```js
companyName: "Acme Corp",
logoUrl: "assets/logo.png",   // optional; create an assets/ folder
accentColor: "#0b5fff"
```

## Questionnaire schema (`js/questionnaire.js`)

```js
window.QUESTIONNAIRE = {
  id, version, title, description, estimatedMinutes,
  scoring: { enabled, scale, bands: [{ min, label, description }] },
  sections: [{ id, title, description, questions: [ ...question ] }]
};
```

- `id` + `version`: key for saved progress. **Bump `version` whenever questions change**, otherwise respondents resuming old sessions will carry stale answers.
- `scoring.scale`: index is reported out of this number (default 100).
- `scoring.bands`: `min` is a **percentage (0-100)** of possible points; highest matching band wins.
- Set `scoring.enabled: false` for a plain questionnaire with no score.

### Question types

| `type` | Extra fields | Scored |
|---|---|---|
| `single` | `options: [{ label, value?, score }]` | yes (score of chosen option) |
| `multi` | `options: [{ label, value?, score, exclusive? }]` | yes (sum of chosen; `exclusive` = "None of the above" behavior) |
| `scale` | `min`, `max` (integers, max 20 points apart), `minLabel`, `maxLabel`, `reverse?` | yes (`reverse: true` flips so low = good) |
| `number` | `min?`, `max?`, `step?` | no |
| `text` | `maxLength?` (default 2000) | no |

Common fields on every question: `id` (unique), `text`, `help?`, `required?` (**defaults to true**; set `false` to allow skipping), `weight?` (default 1), `scored?` (set `false` to exclude a single/multi/scale question from the index).

### Scoring rules

```
index = sum(points earned x weight) / sum(max points x weight) x scale
```

- Skipped optional questions are excluded from both numerator and denominator (skipping does not lower the score).
- Section percentages use the same formula within the section.
- Scores that would go negative are clamped to 0 per question.

## Exports and data handling

Respondents can download **CSV** and **JSON**, or print the results page. CSV cells that start with `=`, `+`, `-` or `@` are prefixed with `'` to prevent spreadsheet formula injection from free-text answers.

**There is no backend.** Answers live in the respondent's browser (`localStorage`) and nowhere else. The organization does not receive responses unless the respondent sends them an export. If you need centralized collection, a backend or form endpoint has to be added.

## Publish to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<org-or-user>/<repo>.git
git push -u origin main
```

Or with the GitHub CLI: `gh repo create <repo> --private --source=. --push`

### Optional: host it with GitHub Pages

`.github/workflows/pages.yml` runs the tests and deploys on every push to `main`. One-time setup: repo **Settings -> Pages -> Source: GitHub Actions**. Private repos need a paid GitHub plan to use Pages. Note that a Pages site is publicly reachable even when the repo is private on some plans, so do not put confidential question content in it unless you have verified the access settings.
