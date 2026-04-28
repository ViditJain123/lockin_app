# Lockin Club

_Started 2026-04-23 15:00 UTC_

---

## User

Okay, So I want to design a mobile app called Lockin Club.


Let me tell you what actually the app does and based on it you can decide on all the screens that you want to design for the app. So the app is a productivity app basically targeting students majorly from high school or college or people who are stuck with doom scolding and want to get out of it. So the basic functionality of the app will consist of shooting a grind. So grind can be of two types. Grind can be a time lapse or grind can be a normal timer. So basically the core functionality of the app is you will record a grind and based on the duration of the grind you will be rewarded with screen time. So by default all the mobile apps on your phone will be locked and in the onboarding you will be setting a target duration for which you want to go logged in for that day. And based on the time you have logged in for you will be rewarded with the screen time. By that what I mean is you will be logging in for let's say so basically on every one hour of recording you will be rewarded with one hour of screen time. You have to think about a lot of things here. First thing is the actual time lapse recording feature that screen will only consist of like a record button then a camera rotation button. That's it. I mean we don't really support a lot of other features like creating and the logic by default is defined so you don't need to worry about that. So no other things like shooting defining the duration of the time lapse or anything. So yeah that is one thing. After that there is just another screen where we will be shooting a grind without the timelapse.. so basically a step up timer..

After that you can consider other screen like analytics where we'll be giving all the description of work they have done based in different time frame and whatever like create a proper analytics page with all the data points which we have then a profile screen where we'll be sharing all the recordings and everything then there will be a leaderboard where we'll be showing where you stand in the monthly leaderboard after that we will have a task screen where you can create a proper to-do and you can select a to-do and start a grind for that item in the to-do list then we want to introduce medals as well so based on number of grinds or based on streak we want to introduce the concept of streak as well. Streak, you are continuing and think of all the other screens like screens for post time lapse like once a user is done recording the time lapse that screen where we will be giving him, awarding him with the screen time and screen time through which he can claim the screen time and screen through which he will receive the medal or screen through which he will be actually previewing the time lapse and on that preview screen we'll be having a share button and save to device button so those two buttons have also to be considered then we'll have a settings page in the settings page we will have to show few buttons not buttons but few data like logout button delete account button and Apple account button so yeah these are the few things so yeah can you please design it for me design all the screens that I told you but this is the basic item also if you want you can come up with the screens based on requirements

## Assistant

I'll design this properly. Before I start building, I have some important questions that will shape the direction significantly. Let me ask those first.

_[tool: questions_v2]_

## User

Questions answered:
- aesthetic: Decide for me
- primary_color: 0
- platform: iOS (iPhone)
- screens_priority: Home / today dashboard, Time-lapse recording, Normal timer (stopwatch) grind, Post-grind reward (screen time claim), Tasks / to-do with grind-start, Analytics, Leaderboard, Medals / achievements, Profile with recordings gallery, Time-lapse preview (share / save), App-lock overlay (what users see when blocked), Settings
- tone_copywriting: Hype bro / Gen-Z ("you're cooking", "grind mode")
- reward_mechanic_viz: Decide for me
- onboarding_depth: Skip onboarding
- time_lapse_recording_ui: Record + flip + elapsed + current task pill
- variations: One cohesive direction, fully designed
- medals_style: Decide for me
- tasks_complexity: Simple checklist
- app_lock_viz: Decide for me

## Assistant

I've got what I need. Let me plan and build.

**Direction I'm committing to:**
- **Aesthetic:** Gritty hardcore / locker-room energy — true black backgrounds, punchy red (#FF3B30) accent, off-white body, high-contrast editorial type. Think: training app meets receipt printer meets brutalist zine.
- **Type:** Bebas Neue / Archivo Black for display hits, Inter for UI, JetBrains Mono for numerics and timestamps.
- **Reward metaphor:** "Screen time receipt" — a thermal-printer style receipt that prints minutes earned. Pairs with the gritty aesthetic, feels earned, novel.
- **App lock:** Full blackout with giant countdown and "LOCK IN" — the receipt reward is the carrot.
- **Medals:** Engraved monochrome seals with red hot-stamp numerals.
- **Device:** iOS frame.
- **Canvas:** design_canvas with all screens in sections (Core Loop, Planning, Progress, Account).

Let me set up.

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: read_file]_

Now I'll read the design canvas briefly then build. The iOS frame uses its own nav/title system but I'll build custom content inside — the frame shell still works.

_[tool: read_file]_

Good enough — I know how to use it. Let me build. I'll make a tokens/shared file, then split screens across files to keep each under 1000 lines.

_[tool: write_file]_

Now the core loop screens — Home, Timer, Time-lapse record, Time-lapse preview, Reward receipt.

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

**Lockin Club** — 12 iOS screens on a design canvas, organized in 4 sections:

- **Intro** — design system card (palette, type, core loop)
- **Core loop** — Home, Timer, Timelapse recording, Preview, Reward receipt
- **Planning** — Tasks (Hit List), App-lock overlay
- **Progress** — Analytics, Leaderboard, Medals (The Vault)
- **Account** — Profile, Settings

**Direction:** true black + red hot-stamp accent, Bebas Neue / Inter / JetBrains Mono, hype-bro voice ("you're cooking", "lock in"). Core reward moment is a **thermal-printer receipt** that tears off with your earned minutes — pairs naturally with the gritty aesthetic and feels tangible.

**Notable moves:**
- Timelapse screen: camera feed + rule-of-thirds + task pill + live "+42 MIN UNLOCKED" ticker, exactly as you specified (record + flip + elapsed + task)
- App-lock overlay: frosted app peek behind a dark veil with hex seal lock + progress-to-unlock bar + emergency pass escape hatch
- Medals as engraved monochrome seals with red-stamped numerals; locked ones show a hex + padlock
- Leaderboard has a giant #1 podium card with faint numeric watermark, then a "YOU" sticky row with rank delta

Open any artboard fullscreen to present it. Let me know if you want me to add onboarding, push variants via Tweaks, or iterate on any specific screen.

## User

A background task has completed. Here are the results:

## Assistant

_[tool: snip]_

_[tool: read_file]_

Fixing the wrap issues. Bebas Neue has a short intrinsic line-height so I need to set line-height explicitly and add nowrap to the problem labels/values.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: grep]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Text-wrap fixes applied. Ending turn to let verifier check.

## User

A background task has completed. Here are the results:

## Assistant

_[tool: snip]_

All 12 screens verified clean. Let me know what to iterate on.

## User

We want to have one more screen which is Lockin screen, that will the landing screen of the app, by that what I mean is from there user will be selecting either they want to do a grind with a timelapse or they want to do a grind with just timer.. we want to push timelapse higher.. but that screen should not be empty with just two buttons.. follow the similar design pattern and create a sexy looking screen

## Assistant

_[tool: snip]_

_[tool: read_file]_

I'll create the Lockin landing screen — big hero timelapse option pushed to the top, timer option secondary, plus live context (streak, today's target, next task) to give it weight.

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Added the **Lockin** landing screen — hero timelapse card (with RECOMMENDED flag, 120× badge, stats row, faint 01 watermark, red CTA) dominates; stopwatch is a compact secondary row below a divider. Also includes greeting + streak pill up top, today's target progress, and a next-task pill at the bottom so the screen feels alive, not a chooser.

## User

A background task has completed. Here are the results:

## Assistant

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

<notifying-user>Fixes applied — tightened the headline, reduced paddings, and restructured the TODAY row so the progress bar is on its own line. Verifier is checking.</notifying-user>

## User

A background task has completed. Here are the results:

## Assistant

_[tool: snip]_

Lockin landing screen verified and in place. The deck now has 13 screens. Let me know what's next.

