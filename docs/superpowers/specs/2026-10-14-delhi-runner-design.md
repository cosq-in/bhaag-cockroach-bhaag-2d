# Delhi Runner: Design

A Subway Surfers-style endless runner, in plain HTML canvas, inspired by the 2026 Cockroach Janta Party (CJP) protests at Jantar Mantar. Tone is satirical and playful.

## Background (from news coverage, Oct 2026)
- **Season 1:** CJP began as online satire after the CJI reportedly called unemployed youth "cockroaches" (May 2026). Protests over the NEET-UG paper leak led to talks and the Education Minister's resignation.
- **Season 2:** Protests against the Election Commission over the voter-roll revision (SIR), with a Delhi lockdown and mass detentions. Detention counts vary by outlet, so the game uses no numbers.
- **Meme references:** "Subway Surfer IRL at Jantar Mantar" (a cop with a lathi chasing a protester, POV), and Hinglish placard humour (e.g. mythology-themed signs).

## Constraints
- No real faces or likenesses. Officials appear only as fictional cartoon stand-ins.
- No Subway Surfers assets (music, art, name). The chase, three lanes and inspector are an homage. Music is original WebAudio chiptune.
- No build step. Open `index.html` to play. Desktop keys and mobile swipe.

## Core mechanics
- **Controls:** Left/Right or A/D or swipe changes lane. Up/W/swipe up jumps. Down/S/swipe down slides. Space uses the banked power-up.
- **Perspective:** Fixed camera behind the runner. Objects spawn at the horizon and scale toward the player. Three trapezoid lanes. Collision when an object reaches the player's depth in the same lane and the jump/slide state does not clear it.
- **Speed and score:** Speed ramps gradually. Score is distance plus pickups, with a combo multiplier for unbroken pickups.
- **Chaser:** A lathi inspector sprints behind the player. First stumble: he closes in and the player loses speed. Second stumble while he is close: detained (game over). Clean running and pickups push him back. A meter shows his distance.
- **Obstacles:** Jump over low barricades and rubble. Slide under overhead barriers and banners. Switch lane for police vans, bus blockades and water-cannon trucks. Tear gas clouds drift across lanes.
- **Collectibles:** Petitions (points), phone-cam "witness" tokens (fill the power-up meter), chai (small speed boost).
- **Power-ups (one banked at a time):** Meme-drop (slows chasers and stuns hazards for a few seconds), WiFi revive (auto-saves from one detention), Crowd-surge shield (temporary invincibility).

## Stages
- **Stage 1, "Paper Leak":** Jantar Mantar street, cardboard-poster walls, free library and food stalls. Barricades and rubble. Hinglish placards. Boss moment: chase through a giant exam hall.
- **Stage 2, "Voter Roll":** Lockdown Delhi, barricaded roads, shuttered metro gates. Police vans, water-cannon trucks, giant "SIR" paperwork walls. Boss moment: surge toward a faceless "Election Bhawan" gate.
- **Look:** Warm Delhi dusk palette, hand-lettered placard font, cockroach runner in a scrappy cape. Meme text popups appear on witness-token pickups.
- Slogans in Stage 2 are placeholders for tone and will be replaced by real ones from the user's references where provided.

## Architecture
```
delhi-runner/
├── index.html      canvas + HUD shell
├── style.css       full-screen, touch-safe layout
├── src/
│   ├── main.js       game loop, state machine: menu → play → detained
│   ├── input.js      keyboard + swipe → intents
│   ├── camera.js     perspective: (lane, depth) → screen (x, y, scale)
│   ├── player.js     lane, jump/slide state, stumble count
│   ├── chaser.js     lathi inspector distance and behaviour
│   ├── spawner.js    obstacle/collectible patterns, difficulty ramp
│   ├── collision.js  lane + depth + jump/slide checks
│   ├── powerups.js   meme-drop, WiFi revive, crowd-surge shield
│   ├── stages.js     stage data: palette, hazards, slogans, boss moment
│   ├── render.js     road, props, sprites (shapes/emoji), HUD
│   └── audio.js      original chiptune via WebAudio
└── refs/           reference screenshots
```
- **Data flow:** `input` emits intents. `main` runs the update tick (player, chaser, spawner, powerups, collision), then `render` draws via `camera`. Rendering never mutates state.
- `camera.js` is the only file with perspective math. Everything else uses (lane, depth).
- `stages.js` is pure data.
- Fixed 60 Hz timestep so behaviour matches across machines.
- High score in `localStorage`, wrapped in try/catch.
- If audio is blocked, the game starts muted and enables sound on first input.

## Testing
- Plain Node unit tests (no framework) for `camera`, `collision`, `chaser`, `spawner`.
- Manual play-test checklist: feel, keyboard controls, phone swipe.

## Out of scope (for now)
Three.js/3D, online leaderboards, real-person likenesses, copyrighted assets, further stages beyond the two above.
