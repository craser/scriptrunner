# ScriptLink

Run local scripts from your Stream Deck and let the button show you what happened.

## The Problem

Your Stream Deck buttons are static. They show the same icon and title all the time, whether your dev server's running, your build passed, or your coffee's ready. You could check those things manually, but that's what computers are for.

## The Solution

ScriptLink runs your local scripts and updates the button based on what they return. Script says the server's down? Button turns red. Build's passing? Green button, happy developer.

## Two Flavors

- **Run Script**: Press the button, run a script, update the display.

- **Run Interval**: Same thing, but also runs a "monitor" script automatically on a timer.

## What Your Scripts Return

Your scripts just print JSON to stdout. ScriptLink reads it and updates the button:

```json
{
  "title": "Server Up",
  "color": "green"
}
```

That's it. Title goes on the button, color becomes the background.  Or, you can specify a background image:

```json
{
  "title": "Server Up",
  "image": "path/to/thumbnail/histogram.png"
}
```

### Available Properties

- **title**: Text displayed on the button
- **color**: Background color (supports 140+ CSS color names like "red", "chartreuse", "darkolivegreen")  
- **image**: Path to a custom image file (overrides color)

### Examples

Show server status:
```json
{ "title": "API Up", "color": "green" }
```

Display build results:
```json
{ "title": "Build #47", "color": "red" }
```

Custom icon with data:
```json
{ "title": "5 Issues", "image": "/path/to/warning-icon.png" }
```

## Setting Up Actions

### Run Script Action

1. Drag the "Run Script" action to a button
2. Set **Script Path** to your executable script
3. Optionally add **Script Arguments** 
4. Set **Default Title** (shown when button first loads)

**Script Arguments** supports shell-style quoting:
- `arg1 arg2` → `["arg1", "arg2"]`
- `"quoted arg" simple` → `["quoted arg", "simple"]`  
- `'single quotes' work\ too` → `["single quotes", "work too"]`

### Run Interval Action

Same as Run Script, plus:

4. Set **Interval Script Path** (script to run on timer)
5. Set **Interval Arguments** (optional)
6. Set **Interval Delay** in seconds

The interval script runs automatically. The main script still runs when you press the button.

## Example Scripts

### Server Status Check (Bash)
```bash
#!/bin/bash
if curl -s http://localhost:3000/health > /dev/null; then
  echo '{"title": "Server Up", "color": "green"}'
else
  echo '{"title": "Server Down", "color": "red"}'
fi
```

### Git Status (Node.js)
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
try {
   const repo = process.argv[2];
   if (!repo) {
      throw new Error("no repo specified");
   }
   const status = execSync(`cd "${repo}" && git status --porcelain`, { encoding: 'utf8' });
   const changes = status.trim().split('\n').length;

   if (status.trim() === '') {
      console.log(JSON.stringify({ title: "Clean", color: "green" }));
   } else {
      console.log(JSON.stringify({ title: `${changes}\nchanges`, color: "orange" }));
   }
} catch (e) {
   console.log(JSON.stringify({ title: "Not a repo", color: "gray" }));
}
```

### Random Color Demo
```javascript
#!/usr/bin/env node
const colors = ['red', 'blue', 'green', 'purple', 'orange'];
const color = colors[Math.floor(Math.random() * colors.length)];
console.log(JSON.stringify({ title: color.toUpperCase(), color }));
```

## Installation

If you just want to install ScriptLink on your Stream Deck:

1. Download the latest release
2. Double-click the `.streamDeckPlugin` file
3. Stream Deck software will install it automatically

## Development 

If you want to make changes to the code & run this as a custom plugin on your Stream Deck:

1. Install [Stream Deck](https://www.elgato.com/us/en/s/downloads?product=Stream%20Deck)
2. Install the [Stream Deck CLI](https://docs.elgato.com/streamdeck/cli/intro/)
   - `npm install -g @elgato/cli@latest`
3. Clone this repo
   - `git clone https://github.com/craser/streamdeck-scriptlink.git`
4. cd into the repo & do the usual
   - `npm install`
   - `npm run build`
5. Link the local output directory to the Stream Deck
   - `npm run link`
6. Start the `watch` process to automatically rebuild when anything in `src` changes
   - `npm run watch`

Stream Deck will now automatically reload the plugin when you make changes.

## Why ScriptLink?

Because your Stream Deck should be as dynamic as your workflow. Static buttons are fine for launching apps, but when you need real-time feedback from your development environment, ScriptLink bridges the gap between your scripts and your hardware.

No more alt-tabbing to check if your server's running. No more wondering if your tests passed. Just glance at your Stream Deck.

