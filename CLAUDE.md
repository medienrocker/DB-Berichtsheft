# Moodle DB Preset Project

This is a **Moodle Database Activity preset** project by bildungssprit.

## On First Contact

When starting work on this project:
1. Read `*.project.json` to understand the DB (fields, views, didactics).
2. Read all files in `preset/` (HTML templates, CSS, JS, preset.xml).
3. Apply the **moodle-preset** skill — if `preset/` already has content, use the **Existing DB Workflow** (analyze, find bugs, optimize, apply brand, add footer-banner, sync files).
4. Apply **brand-config** skill with **bs brand styles** (bildungssprit).

## Brand Rules (always active)

- **Style set:** bs = bildungssprit
- **License:** CC-BY-SA
- **File header:** `/* CC-BY-SA bildungssprit.de | Falk Szyba @medienrocker */`
- **Logo:** `https://img.bildungssprit.de/dbimg/bildungssprit_logo.png`
- **DB images:** `https://img.bildungssprit.de/dbimg/` (start with `default.png`, ask for actual image)
- **Borders:** `1px solid` + `border-radius: 1px` (--bs_radius-sm)
- **Footer-banner border:** `1px solid var(--bs_color-pink)`, background: `var(--bs_color-bg-alt)`
- **Images:** every `<img>` needs descriptive `alt` + `title` attributes
- **Links:** every `<a>` needs a `title` attribute describing the target
- **Footer-banner:** mandatory in every view (add, single, list footer)
- **Hover transforms:** max `scale(1.3)` — never `scale(2)` (causes overflow bugs)

## Skills to Apply

| Skill | When |
|-------|------|
| `moodle-preset` | Always — this is the core pipeline |
| `brand-config` | Always — bs brand styles |
| `code-review` | After significant code changes |
| `accessibility-review` | When modifying UI/templates |
| `quality-gate` | Before packaging the ZIP |

## File Sync Rules

After editing preset files, always sync:
- `preset/csstemplate.css` → `design/assets/bs_styles.css`
- `preset/jstemplate.js` → `design/assets/bs_app.js`

## Mandatory Deliverables (every DB)

| File | Content |
|------|---------|
| `preset/` + ZIP | The 11 Moodle preset files + packaged ZIP |
| `HANDREICHUNG_<id>.md` | Lehrkraefte-Guide: Teil A (Technik) + Teil B (Paedagogik mit Hauptszenario + Einsatzvariante) |
| `HANDREICHUNG_<id>.pdf` | Beautifully formatted PDF version with bildungssprit branding (logo, colors, footer) |
| `VIDEOSCRIPT_<id>.md` | 60-90 sec Tutorial-Script in Du-Form mit Szenen, Sprechtext, Aktionen |

See `moodle-preset` skill Phase 8 for full specs.

## Packaging

ZIP command: `cd preset && zip -j "../<project-id>_preset.zip" *`
