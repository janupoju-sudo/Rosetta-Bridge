# Design

<!-- impeccable:design-schema 1 -->
<!-- Surface: Rosetta Bridge sidebar webview (VS Code). Mode: Operate. World: Signal Station / Codebook. Seed key c348e88d, direction assigned index 7 (Telegraph codebook / signal station). Staging: tethered bench (intercept clamped, decode tethered). -->

## World: Signal Station / Codebook

The panel is a **decoding station**, not a chat box. The product's single idea —
*the same source code has multiple registers, and choosing the audience is
hoisting a channel* — is made physical. A codebook is an apparatus that maps one
register to another; that is literally what Rosetta Bridge does (code ↔ plain,
code ↔ business). Streaming output is a message **decoding as it comes across the
wire**. This world refuses the category-default message-bubble transcript and the
neon-terminal opposite.

## Durable rules

### Palette (Restrained — correct for an Operate tool inside an editor)
- Ground, ink, and chrome inherit from VS Code theme tokens (`--vscode-*`) so the
  station stays legible in light, dark, and high-contrast themes. Never hard-code
  a background that fights the theme.
- Exactly **two signal-channel accents**, used as small precise marks (flag fill,
  active-channel rule, intercept tick, decode cursor) — never as large fills:
  - `--sig-plain` (Vibe Coder / Plain channel): maritime teal-green.
  - `--sig-exec` (Executive channel): signal amber.
- Hairline rules (register lines, tether) are low-alpha `currentColor`, ~0.18–0.28.
- **Never** carry the accent as a thick colored left-border side-tab on a card
  (the AI-slop tell). The accent enters through precise marks: the label signal
  dot, channel underline, hoisted pennants, the tether, and the decode cursor.

### Type (codebook-tabular)
- **Station codes & labels:** monospace (`--vscode-editor-font-family`), uppercase,
  tracked (`letter-spacing`), small — the telegraph/codebook register.
- **Decoded body prose:** UI font (`--vscode-font-family`) for readability.
- Section headers in decoded output get a small-caps register-marker treatment.
- No bundled/novelty display face; distinctiveness comes from composition, rules,
  the flag toggle, the intercept chip, and precise signal accents (brand-in-details,
  the Operate way). Keeps the webview CSP tight (no `font-src` widening).

### Composition (vertical, survives ~320–400px)
1. **Station header:** bridge mark + `ROSETTA BRIDGE` tracked mono caps + `STATION` tag.
2. **Channel selector (the mode toggle):** two signal pennants — `CH·1 PLAIN` and
   `CH·2 EXEC`. The active channel is *hoisted* (raised, filled, colored underline);
   the inactive is furled (muted). This is the product's core idea as a control.
3. **Decode keys:** primary `DECODE SELECTION`, secondary `DECODE STAGED DIFF`.
4. **Intercept strip:** the captured source shown as a clamped chip
   (`⧉ INTERCEPT · file.ts · selection · 42 ln` or `STAGED DIFF`), with a hairline
   **tether** dropping into the decode area. Idle shows a station-idle plate.
5. **Decode output:** streaming markdown behind a left register rule, small-caps
   section markers, a blinking station cursor while decoding.
6. **Transmit action:** `COPY TRANSMISSION` (copy to clipboard), appears when done.
7. **Signal notices:** errors render as a station notice (`SIGNAL LOST — …`), not raw text.

### Motion (bounded, `prefers-reduced-motion` honored)
- Channel change: the chosen pennant *hoists* (short translateY + fade) and its
  signal accent sweeps in. Decode cursor: a slow blink. Nothing else animates.

### States that must always exist
idle/first-run · decoding (busy) · decoded (copyable) · signal-lost (no model / no
selection / no staged changes / not a repo). Never leave the panel blank.

## Direction contract
- **THESIS:** A decoding station that owns "one source, many registers"; refuses the message-bubble transcript.
- **OWN-WORLD:** Theme-neutral instrument ground; codebook-tabular mono labels meeting humanist body; hairline register rules and tether; two precise signal accents, one per channel.
- **STORY:** Visitor hoists a channel, drops in an intercepted selection, watches it decode line by line, copies the transmission out.
- **FIRST VIEWPORT:** Header → hoisted channel pennants → decode keys → intercept chip with tether → decode field. Primary action is the lit `DECODE SELECTION` key.
- **FORM:** Signal Station / Codebook; grounded rank #7; staging = tethered bench; seed key c348e88d.
