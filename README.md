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

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

## License

MIT
