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
| Total Iterations | 6 |
| Total Weight (kg) | 70 |
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
