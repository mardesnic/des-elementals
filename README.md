# Elementals

A free puzzle game for young kids that works offline. You guide little element friends, first fire on its own, then fire and water, then fire, water and earth, across a small board until each reaches its own temple: there fire becomes the sun, water a rain cloud and earth a tree in bloom, and the flowers grow. Each one can do something the others can't: fire melts ice, burns away thorny bushes and keeps a brazier burning to raise a grate; water swims and turns a water wheel to raise a sluice gate; earth fills holes and pushes round stones, which become little bridges in water. Helping one clears the way for the others.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over resets the level.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-elementals/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Levels in worlds, one friend more in each: first fire alone, learning to walk and to burn thorny bushes, then fire and water, from a first walk together to long puzzles, then all three with earth
- Fire melts ice into water and burns thorny bushes away; only water can swim
- Fire on the brazier holds the grate up, water on the wheel holds the sluice up; only the others can go through
- Earth fills holes nobody else can cross and pushes round stones; a stone pushed into water becomes a bridge for everyone
- Everything on the board is drawn by hand as SVG
- Tap a friend, then any square: it walks there by itself, or up to an ice, bush, hole or round stone and melts, burns, fills or pushes it
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
