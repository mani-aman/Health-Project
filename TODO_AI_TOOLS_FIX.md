# TODO: Make AI Tools Work with AI

## Plan & Progress

- [x] 1. Fix Frontend `AITools.jsx`
  - [x] Fix undefined `chatMutation` crash (replaced with `isChatLoading` state)
  - [x] Add state & UI for symptom analysis results
  - [x] Add state & UI for workout plan results
  - [x] Add chat loading spinner
- [x] 2. Harden Backend Controllers + Add Fallback AI
  - [x] `chat.controller.js` — mock fallback, save to Chat model
  - [x] `sympton.controller.js` — mock fallback, save to Symptom model
  - [x] `workout.controller.js` — mock fallback, save to Workout model
- [x] 3. Secure AI Routes (add `auth` middleware)
  - [x] `chat.routes.js`
  - [x] `symptom.routes.js`
  - [x] `workout.routes.js`
- [x] 4. Update `workout.model.js`
  - [x] Change `goal` from enum to plain String
