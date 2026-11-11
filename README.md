# Elementals

A free puzzle game for young kids that works offline. You guide little element friends, first fire on its own and then fire and water together, across a small board until each reaches its own temple: there fire becomes the sun and water a rain cloud, and the flowers grow. Each one can do something the other can't: fire melts ice, burns away thorny bushes and keeps a brazier burning to raise a grate; water swims and turns a water wheel to raise a sluice gate. Helping one clears the way for the other.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over resets the level.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-elementals/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Levels in worlds, one friend more in each: first fire alone, learning to walk and to burn thorny bushes, then 21 levels with fire and water, from a first walk together to long puzzles
- Fire melts ice into water and burns thorny bushes away; only water can swim
- Fire on the brazier holds the grate up, water on the wheel holds the sluice up; only the other one can go through
- Everything on the board is drawn by hand as SVG
- Tap fire or water, then any square: it walks there by itself, or up to an ice or bush and melts or burns it
- Soft dots show where the picked one can go; swipe to take a single step
- Every obstacle on a level is needed, so there are no shortcuts
- Nothing you do can make a level unwinnable
- Undo and Start over
- Picks up where you left off after a reload, and remembers which levels are done; progress can be reset in Settings
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
