# Product Requirement Document (PRD): Rosetta Bridge

**Project Name:** Rosetta Bridge  
**Version:** 1.0.0  
**Document Status:** Draft / Approved  
**Author:** Jayesh Anupoju  
**Target Release:** Q3 2026  

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**Rosetta Bridge** is an intelligent AI-powered VS Code extension designed to act as a real-time translation layer between raw source code and strategic business value. It bridges the communication gap between non-technical "vibe coders" who lack formal Computer Science backgrounds and business stakeholders, as well as software engineers seeking to quantify and articulate the business impact, risk reduction, and ROI of their technical implementations.

### 1.2 Target Audience & Persona Mapping

#### Persona A: Alex — The "Vibe Coder" / Non-Technical Founder
* **Background:** Uses AI code generators (Cursor, Claude, GitHub Copilot) to build MVP products without formal CS training.
* **Pain Point:** Struggles to comprehend what generated code actually does when bugs arise or when explaining system mechanics to investors, lawyers, or partners.
* **Needs:** Clear, jargon-free plain-English explanations of program flow, data handling, and third-party API cost drivers.

#### Persona B: Marcus — The Senior Engineer / Tech Lead
* **Background:** Manages core infrastructure, refactoring, security patches, and system architecture.
* **Pain Point:** Finds it tedious and difficult to translate technical work (e.g., database indexing, memory optimization, technical debt reduction) into executive-friendly language for PMs, CEOs, and non-technical stakeholders.
* **Needs:** Automated generation of high-level PR summaries, ROI justifications, and risk mitigation bullet points ready for Jira, Slack, or executive briefings.

---

## 2. Core Value Propositions & Use Cases

| Persona | Feature Mode | Primary Input | Output / Deliverable |
| :--- | :--- | :--- | :--- |
| **Vibe Coder** | **Vibe Coder Mode** | Highlighted code snippet / File selection | Plain-English workflow breakdown, safety check warnings, API cost flags |
| **Tech Lead / Engineer** | **Executive Mode** | Code selection or Git Staged Diff (`git diff`) | Executive briefing, ROI metrics, risk assessment, draft Slack/Jira PR update |

---

## 3. Architecture & LLM Multi-Provider Strategy

Rosetta Bridge implements a flexible **Multi-Provider LLM Orchestration Engine** prioritizing zero-friction default usage while supporting enterprise-grade security, custom model selections, and local execution.

```
                                  ┌─────────────────────────┐
                                  │   User Code / Selection │
                                  └────────────┬────────────┘
                                               │
                                               ▼
                                ┌─────────────────────────────┐
                                │   Rosetta Bridge Core Engine │
                                └──────────────┬──────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
   ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
   │ Native VS Code LM     │       │ Commercial Provider   │       │ Local Ollama API      │
   │ (vscode.lm / Copilot) │       │ (OpenAI / Anthropic)  │       │ (100% Private/Offline)│
   │ [Default / Free Tier] │       │ [BYOK via SecretStore]│       │ [Localhost REST]      │
   └───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

### 3.1 LLM Tier Hierarchy

1. **Native VS Code Language Model API (`vscode.lm`) — Default:**
   * Utilizes the user's active GitHub Copilot seat (including **Copilot Free**).
   * **Zero hosting costs** for extension maintainers.
   * **Zero configuration** required for end users upon installation.

2. **Bring-Your-Own-Key (BYOK) Commercial APIs:**
   * Support for **OpenAI** (`gpt-4o`, `gpt-4o-mini`) and **Anthropic** (`claude-3-5-sonnet`, `claude-3-5-haiku`).
   * Keys stored securely in the OS-encrypted keychain via `vscode.SecretStorage`.

3. **Local Offline LLMs (Ollama / LocalAI):**
   * Endpoint configuration for local instances (e.g., `http://localhost:11434`).
   * Supports models such as `llama3.2`, `mistral`, and `codellama`.
   * Ensures 100% data privacy for enterprise and strictly confidential codebases.

---

## 4. Prompt Engineering & System Prompts

### 4.1 Vibe Coder Mode Prompt Template

```text
You are an executive technology translator and educator. Analyze the provided code snippet and explain it strictly in plain, accessible language for a non-technical creator. Avoid computer science jargon (such as 'O(n) complexity', 'pointers', 'arrays', 'monads').

Format your response in Markdown with the following structured sections:
1. 💡 **Core Purpose:** (1-2 sentences on what real-world task this code performs).
2. 🔄 **Step-by-Step Logic Flow:** (Numbered list of how data moves through the code using plain analogies).
3. ⚠️ **Safety & Cost Watchouts:** (Flag any external API calls, billing drivers, or sensitive unencrypted data handlings).
```

### 4.2 Executive Mode Prompt Template

```text
You are a Principal Software Architect turned Chief Technology Officer. Analyze the provided code snippet or Git diff and frame its value strictly for non-technical executives (CEOs, Product Managers, Investors). Avoid granular code syntax and focus on strategic impact.

Format your response in Markdown with the following structured sections:
1. 🎯 **Executive Summary:** (1-2 sentences on business outcome, e.g., 'Improves checkout reliability during peak traffic').
2. 📊 **Business Impact & ROI:**
   - **Cost & Efficiency:** (Server cost reductions, latency improvements, automated manual tasks).
   - **Risk & Security:** (Vulnerability patches, GDPR/data compliance, system crash prevention).
3. 📝 **Ready-to-Share Stakeholder Briefing:** (3 concise bullet points formatted for Slack/Jira/PR descriptions).
```

---

## 5. Functional Requirements

### FR-1: Editor & Selection Capture
* **FR-1.1:** The extension shall allow users to highlight any active block of code and trigger translation via command palette (`Rosetta Bridge: Translate Selection`) or context menu right-click.
* **FR-1.2:** If no text is selected, the extension shall automatically capture the entire active document text.

### FR-2: Git Diff Integration
* **FR-2.1:** The extension shall provide a command (`Rosetta Bridge: Summarize Git Staged Changes`) that fetches `git diff --cached`.
* **FR-2.2:** The extension shall pass the staged diff to the active LLM provider in Executive Mode to output a PR-ready summary.

### FR-3: Multi-Provider Configuration & Key Storage
* **FR-3.1:** The extension configuration panel (`package.json` contributes) shall allow switching between `vscode-lm`, `openai`, `anthropic`, and `ollama`.
* **FR-3.2:** Commercial API keys shall be written to and retrieved from `vscode.ExtensionContext.secrets` (`vscode.SecretStorage`). Keys shall never be logged or stored in plain JSON config.

### FR-4: Sidebar UI Panel (Webview)
* **FR-4.1:** The extension shall register a primary Sidebar Webview View in the VS Code Activity Bar.
* **FR-4.2:** The Webview shall render markdown outputs with real-time text streaming.
* **FR-4.3:** The Webview shall include profile toggles (`Vibe Coder` vs. `Executive Mode`) and a one-click "Copy to Clipboard" button for generated summaries.

---

## 6. Non-Functional & Technical Requirements

* **Performance:** Stream LLM responses progressively to the UI with first-token latency under 1.5 seconds.
* **Security:** Zero telemetry collection of proprietary code. API keys stored via native OS credentials (macOS Keychain, Windows Credential Manager, Linux Secret Service).
* **Compatibility:** Compatible with VS Code version `^1.85.0` and above.
* **Extensibility:** Standardized TypeScript provider interface (`LLMProvider`) to facilitate adding future providers (e.g., Google Gemini, Azure OpenAI).

---

## 7. Success Metrics & KPIs

1. **Marketplace Adoption:** 5,000+ active installs within 60 days of release.
2. **User Retention:** >40% weekly active user retention across both Vibe Coder and Technical Lead segments.
3. **Provider Usage Ratio:** ~70% Native `vscode.lm` usage, ~20% Custom API Keys (OpenAI/Anthropic), ~10% Offline Ollama usage.

---

## 8. Milestone Roadmap

```
Q3 2026: V1.0 Core Release
 ├── Scaffold extension & SecretStorage integration
 ├── Implement vscode.lm, OpenAI, and Ollama strategy pattern
 └── Build Webview sidebar with Vibe Coder and Executive modes

Q4 2026: V1.1 Feature Expansion
 ├── Git Diff & PR description auto-generator
 ├── Cost & Compliance warning detector flags
 └── Custom prompt template customization in settings
```
