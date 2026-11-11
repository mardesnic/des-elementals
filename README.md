# Elementals

A free puzzle game for young kids that works offline. You guide two little element friends, fire and water, across a small board until they meet. Each one can do something the other can't: fire melts ice and burns away thorny bushes, water swims and can reach the buttons that open doors. Helping one clears the way for the other.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over resets the level.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-elementals/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- 12 hand-made levels with fire and water, from a first walk to longer puzzles
- Fire melts ice into water and burns thorny bushes away; only water can swim
- Standing on a button opens the doors, so one friend can hold it while the other walks through
- Tap a friend to pick it, then tap or swipe to a square next to it
- Every level can be won, and nothing you do can make it unwinnable
- From level 4 on, it takes both friends to finish
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

The levels are drawn as text in `src/lib/levels.ts`, one letter a square. The tests check that each one can be won, that later ones need both friends, and that no move can leave a level unwinnable.
