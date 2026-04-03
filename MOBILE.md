# MOBILE.md - NAIM Evolution Log

> This file is the autoresearch log for QuestForge.
> Every iteration gets documented here.

---

## Identity

**NAIM Name:** `Quest Blacksmith`
**App Concept:** `QuestForge turns daily tasks into RPG-style quests with XP, ranks, and progression.`
**Starting Tool:** `Stitch + Codex`

---

## Process Note

Iterations 1-14 reflect the real step-by-step feature work completed on QuestForge, but they were mostly prompt-driven UI and app updates rather than a strictly backend-driven and Stitch-first workflow.

After teacher feedback, the project direction was corrected beginning in Iteration 15. Iterations 15 onward represent the intentional shift toward a backend-driven architecture while keeping the earlier work visible as honest project history.

---

## Scoreboard

| Metric | Value |
|--------|-------|
| Total Iterations | 24 |
| Total Weight (kg) | 250 |
| Total Time (min) | Not tracked |
| Failed Attempts | Not tracked |

---

## Iterations

---

### Phase 1: Initial Prompt-Driven Development

These iterations show the actual feature growth of the app before the architecture correction.

---

### Iteration 1

| Field | Value |
|-------|-------|
| Feature | `Basic Quest Board UI` |
| Weight | `5 kg` |
| Tool Used | `Stitch + Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are working inside my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build the whole app at once

Use the connected Stitch MCP server as the design source.

Task: Implement ONLY Iteration 1.

Project concept:
QuestForge turns daily tasks into RPG-style quests with XP, ranks, and progression.

Iteration 1 goal:
Build a single Quest Board screen only.
```

**What happened:**
- Built the first Quest Board screen using the Stitch `Quest Board` screen as the reference.
- The app got a dark RPG-inspired layout with hero stats and three static quest sections.

**Screenshot:** `iteration-1-quest-board.png`

**Commit:** `[NAIM: Quest Blacksmith] Basic Quest Board UI - 5kg`

---

### Iteration 2

| Field | Value |
|-------|-------|
| Feature | `Add quest input flow` |
| Weight | `10 kg` |
| Tool Used | `Stitch + Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is already done
- The app already has a Quest Board screen with static mock quest sections and quest cards

Task: Implement ONLY Iteration 2.

Iteration 2 goal:
Add the quest creation input flow.
```

**What happened:**
- Added an in-memory quest creation flow directly onto the Quest Board.
- Users could enter a title, choose difficulty and category, and see the new quest appear immediately.

**Screenshot:** `iteration-2-add-quest-flow.png`

**Commit:** `[NAIM: Quest Blacksmith] Add quest input flow - 10kg`

---

### Iteration 3

| Field | Value |
|-------|-------|
| Feature | `Multi-screen navigation` |
| Weight | `15 kg` |
| Tool Used | `Stitch + Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is already done: Quest Board UI
- Iteration 2 is already done: in-memory add quest flow

Task: Implement ONLY Iteration 3.

Iteration 3 goal:
Add proper multi-screen navigation.
```

**What happened:**
- Split the flow into a dedicated `Quest Board` screen and `Add Quest` screen.
- Saving a quest returned the user to the board with the new quest visible.

**Screenshot:** `iteration-3-navigation.png`

**Commit:** `[NAIM: Quest Blacksmith] Add multi-screen navigation - 15kg`

---

### Iteration 4

| Field | Value |
|-------|-------|
| Feature | `Local quest persistence` |
| Weight | `20 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation

Task: Implement ONLY Iteration 4.

Iteration 4 goal:
Add local persistence for quests.
```

**What happened:**
- Added AsyncStorage-based local persistence for the quest list.
- Saved quests now stay on the device after the app is closed and reopened.

**Screenshot:** `iteration-4-persistence.png`

**Commit:** `[NAIM: Quest Blacksmith] Add local quest persistence - 20kg`

---

### Iteration 5

| Field | Value |
|-------|-------|
| Feature | `XP and rank progression` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence

Task: Implement ONLY Iteration 5.

Iteration 5 goal:
Add XP and rank progression logic.
```

**What happened:**
- Added quest completion, XP gain by difficulty, and rank progression on the hero card.
- Completed quests now move into the completed section and hero progress is persisted with quest data.

**Screenshot:** `iteration-5-xp-rank.png`

**Commit:** `[NAIM: Quest Blacksmith] Add XP and rank progression - 10kg`

---

### Iteration 6

| Field | Value |
|-------|-------|
| Feature | `Search and filter quests` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `6 min` |
| Attempts | `1` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression

Task: Implement ONLY Iteration 6.

Iteration 6 goal:
Add search and filter functionality for quests.
```

**What happened:**
- Added a live search input and simple filters for difficulty, category, and status on the Quest Board.
- The filters work together in real time while preserving the existing quest state, XP/rank progression, and persistence behavior.

**Screenshot:** `iteration-6-search-filter.png`

**Commit:** `[NAIM: Quest Blacksmith] Add search and filter quests - 10kg`

---

### Iteration 7

| Field | Value |
|-------|-------|
| Feature | `Add theme toggle` |
| Weight | `5 kg` |
| Tool Used | `Codex` |
| Time | `8 min` |
| Attempts | `1` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests

Task: Implement ONLY Iteration 7.

Iteration 7 goal:
Add a manual theme toggle for light mode and dark mode.
```

**What happened:**
- Added a manual light and dark theme toggle that works across the Quest Board and Add Quest screens.
- The selected theme is now stored with the existing game state, so the visual mode stays the same after restarting the app.

**Screenshot:** `iteration-7-theme-toggle.png`

**Commit:** `[NAIM: Quest Blacksmith] Add theme toggle - 5kg`

---

### Iteration 8

| Field | Value |
|-------|-------|
| Feature | `Profile / Progress screen` |
| Weight | `15 kg` |
| Tool Used | `Codex` |
| Time | `7 min` |
| Attempts | `1` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle

Task: Implement ONLY Iteration 8.

Iteration 8 goal:
Add a dedicated Profile / Progress screen.
```

**What happened:**
- Added a dedicated Progress screen that reuses the existing hero and quest state instead of introducing new data or new persistence rules.
- The screen shows current XP, rank title, total quests created, total quests completed, active quests, and completed quests while preserving theme support and the current app flow.

**Screenshot:** `iteration-8-profile-progress.png`

**Commit:** `[NAIM: Quest Blacksmith] Add profile progress screen - 15kg`

---

### Iteration 9

| Field | Value |
|-------|-------|
| Feature | `Quest completion animation / visual feedback` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `11 min` |
| Attempts | `1` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle
- Iteration 8 is done: profile progress screen

Task: Implement ONLY Iteration 9.

Iteration 9 goal:
Add a custom quest completion animation / visual feedback.
```

**What happened:**
- Added a lightweight quest completion feedback banner on the Quest Board that appears when a quest is marked complete.
- The banner shows a clear `Quest Complete` reward message with the quest title and XP gained, while keeping the existing completion, persistence, theme, and progression logic unchanged.

**Screenshot:** `iteration-9-completion-feedback.png`

**Commit:** `[NAIM: Quest Blacksmith] Add quest completion animation - 10kg`

---

### Iteration 10

| Field | Value |
|-------|-------|
| Feature | `Daily streak system` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle
- Iteration 8 is done: profile progress screen
- Iteration 9 is done: quest completion animation

Task: Implement ONLY Iteration 10.

Iteration 10 goal:
Add a daily streak system.
```

**What happened:**
- Added a simple date-based daily streak system that stores the last quest-completion day and current streak count in local state.
- The streak increases only once per day, grows on consecutive days, resets after a missed day during hydration, and is shown in both the hero summary and the Progress screen.

**Screenshot:** `iteration-10-daily-streak.png`

**Commit:** `[NAIM: Quest Blacksmith] Add daily streak system - 10kg`

---

### Iteration 11

| Field | Value |
|-------|-------|
| Feature | `Edit and delete quest management` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle
- Iteration 8 is done: profile progress screen
- Iteration 9 is done: quest completion animation
- Iteration 10 is done: daily streak system

Task: Implement ONLY Iteration 11.

Iteration 11 goal:
Add edit and delete quest management.
```

**What happened:**
- Reused the existing Add Quest screen as an add-or-edit form so quests can now be updated without adding another screen.
- Added edit access from quest cards and a delete action inside the edit form, while keeping persistence, XP, streaks, and completed-quest progress behavior simple by only changing the saved quest details.

**Screenshot:** `iteration-11-edit-delete-quests.png`

**Commit:** `[NAIM: Quest Blacksmith] Add edit and delete quest management - 10kg`

---

### Iteration 12

| Field | Value |
|-------|-------|
| Feature | `Achievement badge system` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle
- Iteration 8 is done: profile progress screen
- Iteration 9 is done: quest completion animation
- Iteration 10 is done: daily streak system
- Iteration 11 is done: edit and delete quest management

Task: Implement ONLY Iteration 12.

Iteration 12 goal:
Add an achievement badge system.
```

**What happened:**
- Added a small centralized achievement badge system that unlocks automatically from existing quest, XP, and streak data.
- The unlocked badges are persisted with the saved game state and displayed on the Progress screen, while locked badges remain visible in a muted style for simple progress tracking.

**Screenshot:** `iteration-12-achievement-badges.png`

**Commit:** `[NAIM: Quest Blacksmith] Add achievement badge system - 10kg`

---

### Iteration 13

| Field | Value |
|-------|-------|
| Feature | `Quest sorting options` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle
- Iteration 8 is done: profile progress screen
- Iteration 9 is done: quest completion animation
- Iteration 10 is done: daily streak system
- Iteration 11 is done: edit and delete quest management
- Iteration 12 is done: achievement badge system

Task: Implement ONLY Iteration 13.

Iteration 13 goal:
Add quest sorting options.
```

**What happened:**
- Added a simple sort control on the Quest Board for newest, oldest, difficulty, and title ordering.
- The sort runs after the existing search and filter logic, and the selected sort option is persisted in the saved game state so the board keeps the same ordering after restart.

**Screenshot:** `iteration-13-quest-sorting.png`

**Commit:** `[NAIM: Quest Blacksmith] Add quest sorting options - 10kg`

---

### Iteration 14

| Field | Value |
|-------|-------|
| Feature | `Daily quest suggestions` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
You are continuing my local React Native project called QuestForge.

Important assignment constraints:
- This is for a NAIM-style iterative mobile app assignment
- I must build one small feature per iteration
- I must document each iteration in MOBILE.md
- I must take a screenshot after each successful iteration
- I must commit after each iteration
- So do NOT build extra features beyond this iteration

Current state:
- Iteration 1 is done: Quest Board UI
- Iteration 2 is done: add quest input flow
- Iteration 3 is done: multi-screen navigation
- Iteration 4 is done: local persistence
- Iteration 5 is done: XP and rank progression
- Iteration 6 is done: search and filter quests
- Iteration 7 is done: manual theme toggle
- Iteration 8 is done: profile progress screen
- Iteration 9 is done: quest completion animation
- Iteration 10 is done: daily streak system
- Iteration 11 is done: edit and delete quest management
- Iteration 12 is done: achievement badge system
- Iteration 13 is done: quest sorting options

Task: Implement ONLY Iteration 14.

Iteration 14 goal:
Add daily quest suggestions.
```

**What happened:**
- Added a local rule-based daily suggestion section on the Quest Board using a fixed rotating template pool and the current day to choose quest ideas.
- Each suggestion can be added directly into the real quest list with one tap, and the rest of the app flow stays unchanged because suggested quests reuse the existing save and persistence logic.

**Screenshot:** `iteration-14-daily-suggestions.png`

**Commit:** `[NAIM: Quest Blacksmith] Add daily quest suggestions - 10kg`

---

### Phase 2: Backend-Driven Correction

These iterations document the correction toward the teacher's intended backend-driven and Stitch-centered direction.

---

### Iteration 15

| Field | Value |
|-------|-------|
| Feature | `Backend-driven game state foundation` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
i did this project wrong teacher said the main goal was to iterate updates inside the app it should be a backend driven app and you should use stitch for new screens themes etc. like when there is a new screen needed you should generate a new screen from stitch and use it you are already connected to stitch lets turn this app into backend driven app
```

**What happened:**
- Started the correction by making QuestForge backend-driven in the smallest safe slice instead of rewriting the whole app at once.
- Added a local backend server that stores the full game state, changed the React Native app to load and save through that API, preserved the current Stitch-derived UI, and added a clear retry state when the backend is offline.

**Screenshot:** `iteration-15-backend-foundation.png`

**Commit:** `[NAIM: Quest Blacksmith] Add backend-driven foundation - 10kg`

---

### Iteration 16

| Field | Value |
|-------|-------|
| Feature | `Backend quest action endpoints` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
yes
```

**What happened:**
- Took the next backend-driven step by moving quest create, edit, delete, complete, theme, and sort updates into dedicated backend endpoints instead of mutating them locally and saving the whole state afterward.
- The React Native app now treats the backend as the source of truth for those actions, while keeping the current Stitch-derived screens, progression systems, and persistence flow intact.

**Screenshot:** `iteration-16-backend-actions.png`

**Commit:** `[NAIM: Quest Blacksmith] Move quest actions to backend - 10kg`

---

### Iteration 17

| Field | Value |
|-------|-------|
| Feature | `Backend-driven app config refresh` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
yes
```

**What happened:**
- Added a small backend-driven app config system so the Quest Board can load visible copy like the board kicker, hero eyebrow, sync message, and section titles from the backend instead of hardcoding all of it in the mobile app.
- Added an in-app refresh flow so changing the backend app config updates the board inside the running app, which better matches the teacher's idea of iterations happening through the app rather than only through mobile code edits.

**Screenshot:** `iteration-17-backend-app-config.png`

**Commit:** `[NAIM: Quest Blacksmith] Add backend app config refresh - 10kg`

---

### Iteration 18

| Field | Value |
|-------|-------|
| Feature | `Backend-driven Progress screen config` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do all 4 iterations and after each iteration commit them and update mobile.md when there is a new screen needed you are already connected to stitch you should generate a new screen then use it on the app
```

**What happened:**
- Moved the Progress screen copy into the backend app config instead of hardcoding its headings and intro text in the React Native screen.
- After a realm refresh, the Progress screen now picks up backend-controlled titles, subtitles, section headings, and achievement copy while keeping the same screen structure and data.

**Screenshot:** `iteration-18-backend-progress-config.png`

**Commit:** `[NAIM: Quest Blacksmith] Add backend progress screen config - 10kg`

---

### Iteration 19

| Field | Value |
|-------|-------|
| Feature | `Backend daily suggestions feed` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do all 4 iterations and after each iteration commit them and update mobile.md when there is a new screen needed you are already connected to stitch you should generate a new screen then use it on the app
```

**What happened:**
- Moved the daily suggestion generation behind a backend endpoint instead of deriving those quests only inside the mobile app.
- The Quest Board now fetches the current backend-issued suggestions on load, on realm refresh, and after quest changes so the suggestion list can update inside the app without rewriting the screen.

**Screenshot:** `iteration-19-backend-daily-suggestions.png`

**Commit:** `[NAIM: Quest Blacksmith] Move daily suggestions to backend - 10kg`

---

### Iteration 20

| Field | Value |
|-------|-------|
| Feature | `Backend-driven feature flags` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do all 4 iterations and after each iteration commit them and update mobile.md when there is a new screen needed you are already connected to stitch you should generate a new screen then use it on the app
```

**What happened:**
- Added simple feature flags to the backend app config so the server can decide whether the app shows realm sync, daily suggestions, search/filter controls, and achievements.
- After a realm refresh, the app now changes visible sections from backend config alone, which makes the UI feel more like an app that evolves from server-driven iterations.

**Screenshot:** `iteration-20-backend-feature-flags.png`

**Commit:** `[NAIM: Quest Blacksmith] Add backend feature flags - 10kg`

---

### Iteration 21

| Field | Value |
|-------|-------|
| Feature | `Stitch-generated Realm Codex screen` |
| Weight | `10 kg` |
| Tool Used | `Stitch + Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do all 4 iterations and after each iteration commit them and update mobile.md when there is a new screen needed you are already connected to stitch you should generate a new screen then use it on the app
```

**What happened:**
- Generated a new mobile `Realm Codex` screen in Stitch and then implemented that screen inside the app as a backend-driven status surface.
- Added a dedicated backend endpoint for the codex data, wired navigation from the Quest Board, and displayed live realm status, feature flags, and connected modules using the new screen.

**Screenshot:** `iteration-21-realm-codex.png`

**Commit:** `[NAIM: Quest Blacksmith] Add Stitch realm codex screen - 10kg`

---

### Iteration 22

| Field | Value |
|-------|-------|
| Feature | `Backend-driven navigation config` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do iteration 22 and 23 dont forget to commit
```

**What happened:**
- Expanded the backend app config so it can now turn the Add Quest, Progress, and Realm Codex screens on or off from the server.
- The Quest Board navigation updates after a realm refresh, and the app automatically returns to the Quest Board if a currently open screen gets disabled by backend config.

**Screenshot:** `iteration-22-backend-navigation-config.png`

**Commit:** `[NAIM: Quest Blacksmith] Add backend navigation config - 10kg`

---

### Iteration 23

| Field | Value |
|-------|-------|
| Feature | `Backend-driven Quest Board layout` |
| Weight | `10 kg` |
| Tool Used | `Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do iteration 22 and 23 dont forget to commit
```

**What happened:**
- Added backend-controlled Quest Board layout fields so the server can now change the hero-card title copy, hero guidance text, and the order of the main, side, and completed quest sections.
- After a realm refresh, the board visibly reorders its sections and updates the hero messaging from backend config instead of needing another mobile layout rewrite.

**Screenshot:** `iteration-23-backend-board-layout.png`

**Commit:** `[NAIM: Quest Blacksmith] Add backend quest board layout config - 10kg`

---

### Iteration 24

| Field | Value |
|-------|-------|
| Feature | `Stitch-generated Theme Sanctum screen` |
| Weight | `10 kg` |
| Tool Used | `Stitch + Codex` |
| Time | `Not tracked` |
| Attempts | `Not tracked` |
| Status | `Success` |

**Prompt given to AI:**
```text
do 24 and 25
```

**What happened:**
- Generated a new mobile `Theme Sanctum` screen in Stitch and wired it into QuestForge as a backend-driven visual summary screen.
- Added a dedicated backend endpoint for the sanctum data, added navigation from the Quest Board, and displayed the active theme state plus available theme essences inside the app without creating another local-only screen.

**Screenshot:** `iteration-24-theme-sanctum.png`

**Commit:** `[NAIM: Quest Blacksmith] Add Stitch theme sanctum screen - 10kg`

---

## Reflection

**Hardest part:**
> Keeping each iteration small while still making the app feel meaningfully better every step.

**What AI did well:**
> It kept the work iterative, respected the assignment boundaries, and handled both feature development and debugging.

**Where AI failed:**
> Some dependency and local Android build issues needed extra troubleshooting outside the core app code.

**If I started over, I would:**
> Track exact time, attempts, screenshot names, and commit hashes from the first iteration instead of filling placeholders later.

**Best feature I built:**
> XP and rank progression, because it made QuestForge feel like a real game-inspired productivity app.

**Biggest surprise:**
> Even simple systems like completion, persistence, and filtering made the app feel much more polished without needing complex backend work.
