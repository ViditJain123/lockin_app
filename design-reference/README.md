# design-reference/

Source-of-truth design artifacts for the Lockin Club visual redesign. Do **not** ship anything from here — it's reference material that coding agents (and humans) read before rebuilding screens in React Native.

## lockin-club/

The handoff bundle from Claude Design (claude.ai/design). Exported by the user on 2026-04-23 and stashed here so future sessions don't need to re-fetch the design URL.

Contents:

- `README.md` — the design tool's instructions to the implementing agent. Read first.
- `chats/chat1.md` — the back-and-forth between the user and the design assistant. The user's intent and stylistic choices (aesthetic, voice, primary color, priorities) live in the Q&A section.
- `project/Lockin Club.html` — the entrypoint prototype. It's a thin shell that mounts the JSX screens via Babel-standalone. You do not need to render it; the JSX sources are the real content.
- `project/tokens.jsx` — **palette, type stack, and primitives** (`LC`, `LCChip`, `LCTabBar`, `LCPhone`, `LCTitle`, `LCPlaceholder`). This is the file to pattern-match against when porting to RN.
- `project/screens-core.jsx` — Home (`LCHome`), Stopwatch timer (`LCTimer`), Timelapse recording (`LCTimelapse`), Timelapse preview (`LCPreview`), Reward receipt (`LCReward`).
- `project/screens-lockin.jsx` — **Lockin / Pick Your Weapon** (`LCLockin`) — mode-select landing screen. Hero timelapse card + compact stopwatch row + today's target + next-task pill. Added in the 2nd design iteration and intended to be the entry the LOCK IN tab lands on (before the camera).
- `project/screens-planning.jsx` — Tasks / Hit List (`LCTasks`), App-lock overlay (`LCAppLock`).
- `project/screens-progress.jsx` — Analytics / The Tape (`LCAnalytics`), Leaderboard / The Ranks (`LCLeaderboard`), Medals / The Vault (`LCMedals`).
- `project/screens-account.jsx` — Profile (`LCProfile`), Settings (`LCSettings`).
- `project/design-canvas.jsx`, `project/ios-frame.jsx` — prototype chrome (artboard layout, iOS frame). Ignore when porting.

## How to use this when rebuilding a screen

1. Find the screen's source function (e.g. `LCAnalytics` in `project/screens-progress.jsx`).
2. Read `project/tokens.jsx` once for the shared palette/type/primitives.
3. Recreate the visual output in React Native — **do not** port the DOM/CSS structure verbatim. The HTML is a prototype.
4. Pull colors from `constants/BrandColors.ts` (`LC` export) and fonts from `constants/Fonts.ts` (`display`, `monoRegular`, etc.). Do not inline hex values or font-family strings — they already live in the token exports.

## Features designed but not in the app

The design includes `LCAppLock` (device-level app-lock overlay) and a literal screen-time claim flow (`LCReward` → "CLAIM 47 MIN"). The current app has neither mechanic. Treat those screens as aesthetic reference only until the product decision is made to build the feature.
