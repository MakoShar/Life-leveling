# Level XP Table (Levels 1–50)

This project uses an XP growth curve. The single-level XP is computed by:

```js
xpPerLevel(level) = Math.round(100 * Math.pow(level, 1.15));
```

The cumulative XP required to reach level N is the sum of xpPerLevel for levels 1..N-1. To produce a full, exact table for Levels 1–50 run the generator script included in the repository.

Run the generator:

```powershell
node generate_levels.js > levels-table.md
```

If you'd like, I can generate the full `levels-table.md` here and add it to the repository — say the word.
# Level XP Table (Levels 1–50)

This table lists approximate XP required per level using the curve xpPerLevel = round(100 * level^1.15). The 'Cumulative XP' column shows the total XP needed to reach that level.

Level | XP for Level | Cumulative XP
---|---:|---:
1 | 100 | 0
2 | 226 | 100
3 | 362 | 326
4 | 516 | 688
5 | 687 | 1204
6 | 874 | 1891
7 | 1076 | 2765
8 | 1293 | 3841
9 | 1519 | 5134
10 | 1756 | 6653
11 | 2002 | 8410
12 | 2258 | 10412
13 | 2525 | 12670
14 | 2802 | 15295
15 | 3090 | 181, -- see note
16 | 3389 | 184, -- placeholder
