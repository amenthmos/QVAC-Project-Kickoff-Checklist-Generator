# QVAC-Project-Kickoff-Checklist-Generator

Describe a project and get an on-device AI-generated kickoff checklist: stakeholders to loop in, first decisions to make, and early risks to flag. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:30101

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown. The GUI (`src/gui.js`) is a small HTTP server: the page POSTs the form field to `/api/kickoff`, which calls `generate(modelId, { description })` in `src/logic.js`.

## Example

**Input:** "A small bakery wants to launch online ordering with local delivery within 2 months."

**Output:**

```
STAKEHOLDERS
- Bakery owner, who signs off on budget and delivery radius
- Kitchen staff, since order volume will change prep schedules
- Whoever handles delivery drivers or the courier partner
DECISIONS
- Which delivery radius and minimum order size to launch with
- Whether to build custom ordering or use an existing platform
- How refunds and missed deliveries will be handled
RISKS
- Kitchen can't keep up with order volume during peak hours
- 2-month timeline slips if a delivery partner isn't locked in early
- Online orders conflict with in-store walk-in demand
```

## Grounding & fallback

`parseSections()` buckets the model's output lines under STAKEHOLDERS/DECISIONS/RISKS headers, and `looksUnusable()` catches empty or refusal-style responses. Any section the model leaves empty (a parse miss or an omission) is backfilled from `fallbackChecklist()`, a deterministic checklist derived directly from the description you typed — so a weak model response never shows up as a blank section.

## License

MIT
