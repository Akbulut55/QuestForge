# QuestForge Mobile Iterations

## Iteration 1 - Quest Board
- Date: 2026-03-31
- Design source: Stitch project `4285400526736348128`, screen `Quest Board`
- Goal: Build a single dark-themed Quest Board screen with static quest data
- Implemented:
  - App title: Quest Forge
  - Hero card with Level, XP, and Rank Title
  - Three quest sections: Main Quest, Side Quests, Completed Quests
  - Three static quest cards showing title, difficulty, XP reward, and status
- Verification:
  - `npm test -- --runInBand`
  - `npx eslint App.tsx __tests__/App.test.tsx`
- Screenshot: Capture after running the app locally for this iteration
- Commit: Use the assignment commit format after verifying the screen locally

## Iteration 2 - Quest Input Flow
- Date: 2026-03-31
- Design source: Stitch project `4285400526736348128`, screen `Add Quest`
- Goal: Add a minimal in-memory quest creation flow inside the existing Quest Board
- Implemented:
  - Added an inline `Forge New Quest` input card on the current board
  - Added quest title input
  - Added difficulty selection: Easy, Medium, Hard, Epic
  - Added category selection: Main Quest or Side Quest
  - Added save button that immediately inserts the quest into the matching board section
  - Kept quest creation in memory only with no storage or navigation added
- Verification:
  - `npm test -- --runInBand`
  - `npx eslint App.tsx __tests__/App.test.tsx`
  - `npx tsc --noEmit`
- Screenshot: Capture after creating a quest successfully in the running app
- Commit: Use the assignment commit format after verifying the flow locally

## Iteration 3 - Multi-Screen Navigation
- Date: 2026-03-31
- Design source: Stitch project `4285400526736348128`, screens `Quest Board` and `Add Quest`
- Goal: Separate the board and quest creation flow into dedicated screens while keeping the in-memory quest flow working
- Implemented:
  - Kept Quest Board as the home screen
  - Moved the quest creation form into a dedicated Add Quest screen
  - Added navigation from Quest Board to Add Quest
  - Added a back action from Add Quest to Quest Board
  - Kept quest creation in memory and returned to the board after saving
  - Confirmed saved quests appear immediately on the Quest Board
- Verification:
  - `npm test -- --runInBand`
  - `npx eslint App.tsx __tests__/App.test.tsx`
  - `npx tsc --noEmit`
- Screenshot: Capture after navigating to Add Quest, saving a quest, and returning to the board
- Commit: Use the assignment commit format after verifying the flow locally

## Iteration 4 - Local Quest Persistence
- Date: 2026-03-31
- Goal: Persist the quest list locally on the device while preserving the current UI flow
- Storage approach: `@react-native-async-storage/async-storage`
- Implemented:
  - Added a minimal storage helper for loading and saving quests
  - Loaded persisted quests when the app starts
  - Saved quest changes locally whenever the quest list changes
  - Kept the current Quest Board and Add Quest screens unchanged in behavior
  - Preserved in-memory quest creation while adding local device persistence underneath it
- Verification:
  - `npm test -- --runInBand`
  - `npx eslint App.tsx __tests__/App.test.tsx src/storage/questStorage.ts`
  - `npx tsc --noEmit`
- Screenshot: Capture after saving a quest, closing the app, and confirming it still appears after reopening
- Commit: Use the assignment commit format after verifying persistence locally

## Iteration 5 - XP And Rank Progression
- Date: 2026-03-31
- Goal: Add quest completion, XP awards, and rank progression while keeping the current quest flow simple
- Implemented:
  - Added a `Mark Completed` action for active quests on the Quest Board
  - Awarded XP on completion using difficulty-based values: Easy `10`, Medium `20`, Hard `35`, Epic `50`
  - Moved completed quests into the existing Completed Quests section
  - Updated the hero card to show live XP and rank title progression
  - Added simple rank milestones: `Novice`, `Adventurer`, `Knight`, `Champion`
  - Persisted hero progress together with quests in local storage
  - Added migration support for the previous quest-only storage format from Iteration 4
- Verification:
  - `npm test -- --runInBand`
  - `npx eslint App.tsx __tests__/App.test.tsx src/storage/questStorage.ts`
  - `npx tsc --noEmit`
- Screenshot: Capture after completing a quest and seeing XP and rank update on the board
- Commit: Use the assignment commit format after verifying the progression flow locally
