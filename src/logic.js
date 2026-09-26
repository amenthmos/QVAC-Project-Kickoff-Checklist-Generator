// QVAC Project Kickoff Checklist Generator — core logic.
// Turns a project description into a grounded kickoff checklist:
// stakeholders to loop in, first decisions to make, early risks to flag.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 5) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "not enough information"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function stripPreamble(text) {
  return text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .replace(/^sure[,!]?\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

// Parse a loosely-formatted response into three bucketed lists based on
// header keywords. Falls back gracefully if the model doesn't follow format.
function parseSections(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections = { stakeholders: [], decisions: [], risks: [] };
  let current = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/stakeholder/.test(lower)) {
      current = "stakeholders";
      continue;
    }
    if (/decision/.test(lower)) {
      current = "decisions";
      continue;
    }
    if (/risk/.test(lower)) {
      current = "risks";
      continue;
    }
    const item = line.replace(/^[-*•\d.)\s]+/, "").trim();
    if (!item) continue;
    if (current) sections[current].push(item);
  }

  return sections;
}

function fallbackChecklist(description) {
  return {
    stakeholders: [
      `Whoever owns budget/approval for "${description}"`,
      "The team members who will do the day-to-day work",
      "Anyone whose existing work this project might affect",
    ],
    decisions: [
      "What does success look like and by when",
      "Who has final say when there's disagreement",
      "What's explicitly out of scope",
    ],
    risks: [
      "Unclear ownership causing stalled decisions",
      "Scope creep once work starts",
      "Dependencies on people or systems outside the core team",
    ],
  };
}

export async function generate(modelId, { description }) {
  const desc = (description || "").trim();
  if (!desc) {
    return { error: "Please describe your project first." };
  }

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You help teams kick off new projects. Given a project description, produce a kickoff checklist " +
          "with exactly three labeled sections: STAKEHOLDERS, DECISIONS, RISKS. Each section has 3 short bullet " +
          "lines starting with '-'. Base every bullet on specifics from the project description, not generic filler. " +
          "Reply with ONLY the three labeled sections, no preamble, no extra commentary.",
      },
      {
        role: "user",
        content: "Project: A small bakery wants to launch online ordering with local delivery within 2 months.",
      },
      {
        role: "assistant",
        content:
          "STAKEHOLDERS\n" +
          "- Bakery owner, who signs off on budget and delivery radius\n" +
          "- Kitchen staff, since order volume will change prep schedules\n" +
          "- Whoever handles delivery drivers or the courier partner\n" +
          "DECISIONS\n" +
          "- Which delivery radius and minimum order size to launch with\n" +
          "- Whether to build custom ordering or use an existing platform\n" +
          "- How refunds and missed deliveries will be handled\n" +
          "RISKS\n" +
          "- Kitchen can't keep up with order volume during peak hours\n" +
          "- 2-month timeline slips if a delivery partner isn't locked in early\n" +
          "- Online orders conflict with in-store walk-in demand",
      },
      { role: "user", content: `Project: ${desc}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 350 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = stripPreamble(text);

  if (looksUnusable(text)) {
    return fallbackChecklist(desc);
  }

  const sections = parseSections(text);
  const hasContent = sections.stakeholders.length || sections.decisions.length || sections.risks.length;
  if (!hasContent) {
    return fallbackChecklist(desc);
  }

  // Fill in any empty section with a grounded fallback item rather than
  // leaving it blank or letting the model leave it out entirely.
  const fb = fallbackChecklist(desc);
  for (const key of ["stakeholders", "decisions", "risks"]) {
    if (sections[key].length === 0) sections[key] = fb[key];
  }

  return sections;
}
