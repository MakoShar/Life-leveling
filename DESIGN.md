# Life-Leveling System — Visual & Component Spec

This document provides a pixel-focused design spec for the Main Player Status Screen, Radar Chart, and interaction patterns. Use as a reference for building high-fidelity mockups in Figma/Sketch.

Color tokens (CSS variables)
- --bg1: #0f1724 (deep navy)
- --bg2: #071029 (near black)
- --accent: #7C5CFF (violet)
- --accent-2: #00E0A1 (teal)
- --gold: #FFC857 (gold)
- --danger: #FF6B6B (failure)
- --muted: #9AA4B2

Typography
- Heading: Inter Black / 700, large sizes for Level number (48–72px)
- Body: Inter Regular / 400, 14–16px for labels.

Main HUD layout
- Container: max-width 980px, center aligned, glass card with radius 12px.
- Left column: Level number, XP ring, quick actions.
- Center: Radar SVG 220x220 (viewBox: -110 -110 220 220) with polygon overlay.
- Right: Stat tiles and Shop CTA.

Radar chart
- 5 axes, equal angular distribution (start at -90deg), radius 100 units.
- Fill: linear gradient from --gold to --accent.
- Labels outside at radius + 14 with small font (8–10px).
- Animations: use morph for polygon points (SVG 'points' animated with JS easing), small particle on value increase.

Level-up modal
- Large headline, show new level and earned stat points.
- Buttons: Allocate Now (primary), Later (ghost).

Stat allocation
- Modal with 5 rows, each row shows stat name, current value, +/- buttons. Live validation for stat points left.
- Auto-allocate presets: Balanced, Strength, Learning.

Shop lock overlay
- Blurred/locked shop card with padlock emblem, progress meter to required level, preview carousel with blurred thumbnails for gated items.

Assets & export
- Provide vector SVG icons for STR, VIT, AGI, INT, PER and shop padlock.
- Export tokens as CSS variables; export color swatches and font styles.

Deliverables
- Figma file with artboard for Desktop (1366x768) and Mobile (375x812)
- Exported SVG icons and CSS variables file.
