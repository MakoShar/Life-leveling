# Solo Leveling — Skill Tracker

This is a small single-file web app that implements a Solo Leveling–style XP/quest system to help track practice and level progression.

Features
- XP and level progress bar
- Quick-add XP buttons and undo
- Add custom quests with XP rewards
- Complete quests to gain XP (buttons temporarily disable to prevent accidental spam)
- Local persistence using localStorage
- Confetti animation on level up

How to open

- Open `index.html` directly in your browser (double-click the file).
- Or serve the folder with a simple static server (recommended for best experience).

Using PowerShell (Windows)

1. Open PowerShell in the project folder `c:\Users\ANOOP\Documents\Code\web\Solo Leveling system`.
2. (Optional) If you have Python installed, run:

```powershell
python -m http.server 8000
```

3. Open http://localhost:8000 in your browser.

Notes
- Data is stored locally in your browser. Clearing site data will reset progress.
- This is intentionally lightweight and dependency-free. If you'd like syncing (Google Drive, Git, or remote DB), I can add that.

Next steps (optional ideas)
- Add login and cloud sync
- Add streaks, daily quest scheduling, and reminders
- Export/import progress
- More polished confetti or particle library

Enjoy! Open `index.html` to try it.
