import * as assert from "node:assert";
import { EXECUTIVE_SYSTEM_PROMPT, VIBE_CODER_SYSTEM_PROMPT } from "../../core/prompts";

suite("prompts", () => {
  test("Vibe Coder prompt has the three required sections", () => {
    assert.match(VIBE_CODER_SYSTEM_PROMPT, /Core Purpose/);
    assert.match(VIBE_CODER_SYSTEM_PROMPT, /Step-by-Step Logic Flow/);
    assert.match(VIBE_CODER_SYSTEM_PROMPT, /Safety & Cost Watchouts/);
  });

  test("Vibe Coder prompt forbids jargon", () => {
    assert.match(VIBE_CODER_SYSTEM_PROMPT, /Avoid computer science jargon/);
  });

  test("Executive prompt has the three required sections", () => {
    assert.match(EXECUTIVE_SYSTEM_PROMPT, /Executive Summary/);
    assert.match(EXECUTIVE_SYSTEM_PROMPT, /Business Impact & ROI/);
    assert.match(EXECUTIVE_SYSTEM_PROMPT, /Ready-to-Share Stakeholder Briefing/);
  });
});
