# Expense Tracker

Static vanilla JS app: `index.html` + `app.js`, no build step. Open `index.html` directly in a browser.

## Stack
- Bootstrap 5.3 and Chart.js 4 loaded from CDN; do not add a bundler or npm dependencies unless asked.
- Plain JavaScript (no frameworks, no TypeScript).

## Conventions
- Prefer Bootstrap utility classes over custom CSS; put any custom CSS in the `<style>` block in `index.html`.
- Currency is euro (€); label amounts accordingly.
- Keep markup accessible: use `aria-*` attributes and `scope` on table headers as existing code does.
- Keep changes minimal and consistent with the existing style (2-space indentation).

## Buttons
- All `.btn` button background colors must be pink (e.g. `#e83e8c`), including `.btn` variants.
- Nav tabs/links (`.nav-link`) must not be pink; keep them white with dark text.
- Define this once via a CSS rule or custom property in `index.html`; do not use inline styles per button.
- Use readable text color on pink backgrounds (white or dark, with sufficient contrast).
