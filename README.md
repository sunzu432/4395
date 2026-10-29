# Questionnaire site

A branded web page that hosts an embedded SurveyMonkey survey. The company name appears in the top-left banner. All questions, logic, scoring and responses live in SurveyMonkey; this page only wraps it.

## Edit the company name, logo, heading

`js/config.js`:

```js
companyName: "Your Company Name",  // top-left banner and browser tab
logoUrl: "",                        // optional, e.g. "assets/logo.png" (use a white/transparent logo; banner is dark blue)
surveyTitle: "",                    // optional heading above the survey
accentColor: "#0b5fff"
```

## Edit colors and sizes

`css/styles.css`:

- Banner color and text: `--banner-bg`, `--banner-text` (top of file)
- Company name size: `.brand-name { font-size: ... }`

## Add the SurveyMonkey survey

1. In SurveyMonkey: Collect Responses -> Website collector -> Embedded survey -> Copy Code (see [SurveyMonkey help](https://help.surveymonkey.com/en/surveymonkey/send/website-collector/)).
2. Open `index.html` and paste the code in place of the `<div id="sm-placeholder">` block. Do not edit the code.
3. Commit and push. Later changes to the survey itself appear on refresh without touching this page.

Notes from SurveyMonkey's docs: embedded surveys have no survey end page and no instant results; custom thank-you pages show SurveyMonkey branding. Test on the deployed URL, since the embed may not work from a local file.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server 8080` in this folder.

## Deploy (GitHub Pages)

Repo Settings -> Pages -> Source: GitHub Actions. The workflow deploys on every push to `main`. Private repos need a paid GitHub plan for Pages, and the published site may be publicly reachable.
