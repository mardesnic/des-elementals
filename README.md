# Elementals

A free puzzle game for young kids that works offline. You guide two little element friends, fire and water, across a small board until both stand on the heart where they meet. Each one can do something the other can't: fire melts ice and burns away thorny bushes, water swims and can reach the buttons that open doors. Helping one clears the way for the other.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over resets the level.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-elementals/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- 20 levels with fire and water, from a first walk to long puzzles
- Fire melts ice into water and burns thorny bushes away; only water can swim
- Orange and purple buttons open the doors of their colour while someone stands on them
- Tap fire or water, then any square: it walks there by itself, or up to an ice or bush and melts or burns it
- Soft dots show where the picked one can go; swipe to take a single step
- Every obstacle on a level is needed, so there are no shortcuts
- Nothing you do can make a level unwinnable
- Undo and Start over
- Picks up where you left off after a reload, and remembers which levels are done
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.

`npm run levels` makes the levels in `src/levels.json`: it tries many random boards and keeps those where turning any obstacle into rock makes the level impossible, ordered by how many taps they take. The tests check each level again with the game's own rules, including that no move can leave it unwinnable.
