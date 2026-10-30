# Concept Browser

A static web page (plain HTML, CSS and JavaScript, no build step) that lists concepts in a searchable table. Each concept expands to show its components and subcomponents, and clicking a concept's name opens a side panel with its ID, group and definition.

## Where to edit what

| To change | Edit |
|---|---|
| Company name (top-left banner), logo, heading text, subtext | `js/config.js` |
| The concepts, components, subcomponents and definitions | `js/data.js` |
| Banner color, company name size, colors, spacing | `css/styles.css` (variables at the top) |

Everything in `js/data.js` is placeholder content right now. The file has comments explaining the structure. If something in it is broken (a missing name, a duplicate ID), the page shows a plain list of the problems instead of failing silently.

## What the page does

- **Expand:** the chevron next to a concept shows its components. The chevron next to a component shows its subcomponents.
- **Side panel:** click a concept name. Esc or the X closes it.
- **Group:** groups rows under their Concept Group heading.
- **Filter:** show only one Concept Group.
- **Sort:** by name (A-Z or Z-A), Concept ID, or Concept Group. Numbers sort naturally ("Concept 2" before "Concept 10").
- **Search:** matches names, IDs, groups and definitions, including components and subcomponents. A match inside a concept opens that concept automatically.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server 8080` in this folder.

## Deploy (GitHub Pages)

Repo Settings -> Pages -> Source: GitHub Actions. The workflow in `.github/workflows/pages.yml` publishes the site on every push to `main`. Private repos need a paid GitHub plan for Pages, and a Pages site may be publicly reachable even when the repo is private, so do not publish confidential content this way unless you have checked the access settings.
