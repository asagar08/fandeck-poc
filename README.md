# Asian Paints Static Digital Fandeck

This is the cleaned static project.

## What changed

- Uses `apcatalogue.json` directly. No live API, `/api/shades`, Netlify function, or local proxy is required.
- Removed non-required server/deployment/minified/source duplicates from the final project.
- Kept both `style.css` and `style.scss`.
- `script.js` was updated to understand the catalogue keys: `shade`, `entityName`, `entityCode`, `shadeFamily`, and `shadeHexCode`.
- The copy buttons in the shade popup now copy the exact modal colour when a strip/cap sample is opened.

## Files

```text
index.html
style.css
style.scss
script.js
apcatalogue.json
package.json
README.md
```

## Run locally

Because the app fetches `apcatalogue.json`, open it with a static web server instead of double-clicking `index.html`.

Example options:

```bash
# Option 1: VS Code Live Server
# Right-click index.html -> Open with Live Server

# Option 2: Python static server
python3 -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```

## Optional commands

```bash
npm install
npm run check:js
npm run build:css
```
## Mobile UI fix

- Fixed the mobile selected shade beacon alignment.
- The pill now uses left/right mobile gutters without inheriting the desktop `translateX(-50%)`, so it stays fully visible and centered inside the fan canvas.
- Added a slightly tighter beacon layout for very narrow phones.

