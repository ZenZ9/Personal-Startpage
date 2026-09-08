# Personal Startpage Dashboard

A lightweight, minimalist, and ultra-fast static personal dashboard built for daily browser use. Hosted directly on GitHub Pages.

🔗 **Live Demo:** [https://zenz9.github.io/Personal-Startpage/](https://zenz9.github.io/Personal-Startpage/)

## Features

- **Live Clock & Date:** Real-time digital clock and localized date display.
- **Omnibox Search:** Quick search switching between Google, DuckDuckGo, Bing, and GitHub.
- **Customizable Bookmarks Grid:** Add, edit, and delete bookmark cards directly from the UI.
- **Persistent Quick Notes:** Auto-saving notes widget powered by `localStorage`.
- **Live Custom CSS Injector:** Write and apply raw CSS on the fly via the settings modal.
- **Config Backup:** Export and import your entire setup (bookmarks, theme, CSS) as a JSON file.
- **100% Static & Client-side:** Zero external backend, ultra-fast load time, and privacy-focused.

## Customizing the Theme

You can override the UI colors and layout directly inside the **Settings Modal** on the web page.

### Default CSS Variables

```css
:root {
  --bg: #090d18;
  --bg-alt: #0f172a;
  --panel: rgba(15, 23, 42, 0.85);
  --text: #edf2ff;
  --muted: #9aa8c7;
  --accent: #7c9cff;
  --border: rgba(148, 163, 184, 0.16);
}

```

### Example Custom CSS

Inject this in the Custom CSS editor inside the Settings modal:

```css
:root {
  --bg: #111827;
  --text: #f9fafb;
  --accent: #8b5cf6;
}

body {
  background: linear-gradient(135deg, #111827, #1f2937);
}

```

## Local Setup

No build tools or `npm install` required. Simply clone the repository and open `index.html` in any browser:

```bash
git clone https://github.com/ZenZ9/Personal-Startpage.git

```

and run a simple local web server:

```bash
python -m http.server 8000

```

Then visit `http://localhost:8000` in your browser.

## Data & Storage

All configurations, custom CSS, bookmarks, and notes are strictly saved in your browser's `localStorage`. No data is sent to external servers.