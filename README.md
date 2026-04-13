# QuestForge

QuestForge is a React Native quest tracker that turns everyday tasks into an RPG-style progression loop. It uses a local Node backend as the source of truth for quests, hero progress, theme settings, suggestions, and board configuration.

## What the app does

- Create, edit, start, complete, fail, and delete quests
- Track XP, levels, ranks, achievements, and daily streaks
- Browse a dedicated quest history and streak calendar
- Search, filter, and sort the active quest board
- Pull daily quest suggestions from the backend
- Switch between light and dark mode plus backend-driven theme packs
- Show due-soon and overdue reminder prompts, with Android notifications for timed quests

## Tech stack

- React Native
- TypeScript
- Local Node backend in `backend/server.js`
- Android native notification bridge for reminder alerts

## Run the app locally

### Prerequisites

- Node.js
- Android Studio with an Android emulator
- JDK 17

### 1. Install dependencies

```sh
npm install
```

### 2. Start the backend

```sh
npm run backend
```

The backend runs on `http://localhost:4000`.

### 3. Start Metro

```sh
npm start
```

If you want a clean reload:

```sh
npm start -- --reset-cache
```

### 4. Run Android

```sh
npm run android
```

For the Android emulator, the app automatically tries emulator-safe backend hosts such as `10.0.2.2`.

## Reminder and notification flow

QuestForge supports reminder-based deadlines for in-progress quests.

- All-day deadline format: `YYYY-MM-DD`
- Timed deadline format: full date-time such as `2026-04-03T18:00`

When a timed quest is close to its deadline:

- the quest is highlighted on the board
- Android can show a local reminder notification
- if the quest becomes overdue, the app shows an in-app prompt asking whether the quest was completed

On Android 13 and above, the app may ask for notification permission the first time a reminder needs to be shown.

## Main app areas

- `Quest Board`: active quests, daily suggestions, filter/sort controls, and the main hero overview
- `Quest Forge`: create or edit a quest
- `Profile`: XP, ranks, progress, achievements, and reset flow
- `History`: completed and failed quests with day, month, and year filters
- `Streak Calendar`: active-day view of streak progress
- `Quest Details`: deeper view for one selected quest
- `Theme Sanctum`: backend-driven theme pack selection
- `Realm Codex`: backend summary screen

## Backend notes

The backend stores data in `backend/data/`.

- `game-state.json`: saved app state
- `app-config.json`: backend-driven board and screen copy

If the app shows the backend as offline:

1. Make sure `npm run backend` is still running
2. Check `http://localhost:4000/game-state`
3. Restart Metro with `npm start -- --reset-cache`
4. Relaunch the Android app

## Validation

Useful project checks:

```sh
npx tsc --noEmit
npx eslint App.tsx backend/server.js src/api/gameStateApi.ts src/notifications/questNotifications.ts __tests__/App.test.tsx
npm test -- --runInBand
```

## Final Note
This app was built to understand how a backend-driven app works.
