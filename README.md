# Elementals

A free puzzle game for young kids that works offline. You guide two little element friends, such as fire and water, across a small board until they meet. Each one can do something the other can't: fire melts ice and burns away brambles, water puts out flames and freezes a pond into a bridge. Helping one clears the way for the other.

Made for ages 5 and up. There is no timer and no way to lose. Undo takes back the last move, and Start over resets the level.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-elementals/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Work in progress: the first world, fire and water, is being built
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- Keeps the screen on while you play
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
