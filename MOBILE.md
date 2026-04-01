# MOBILE.md - NAIM Evolution Log

> This file is the autoresearch log for QuestForge.
> Every iteration gets documented here.

---

## Identity

**NAIM Name:** `Quest Blacksmith`
**Crew:** `[Fill in your group name]`
**App Concept:** `QuestForge turns daily tasks into RPG-style quests with XP, ranks, and progression.`
**Starting Tool:** `Stitch + Codex`

---

## Scoreboard

| Metric | Value |
|--------|-------|
| Total Iterations | 12 |
| Total Weight (kg) | 130 |
| Total Time (min) | Not tracked |
| Failed Attempts | Not tracked |

---

## Iterations

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
