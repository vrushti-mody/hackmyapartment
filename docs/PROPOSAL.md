# HackMyApartment — Automation Proposal v1

## 1) Objective
Build a local-first content pipeline that turns a daily idea (theme + budget) into:
- 1 Reel package
- 1 Story package with affiliate links
- 1 Community post package

Primary KPI: reduce daily production time while increasing consistency and conversion.

---

## 2) Current Workflow (Manual)
1. Pick theme + budget
2. Find products + affiliate links + images
3. Generate room visual
4. Record/generate voiceover
5. Edit reel (bg + product overlays + audio)
6. Post reel
7. Post story with direct links
8. Share in community

Estimated manual time: **2.5–4.5 hours/day**

---

## 3) Automation Opportunities

## A. Episode Planning (Automatable)
**Input:** theme, budget, room type, audience angle  
**Output:** daily episode brief (`episode.json`)

Automations:
- content angle suggestions
- hook options (3 variants)
- CTA suggestions
- shot plan template

Human still does:
- approve final angle

## B. Product Sourcing + Packaging (Semi-automatable)
**Input:** theme/budget constraints  
**Output:** curated product list with links + images (`products.json`)

Automations:
- scrape/search candidates
- filter by budget/style
- format affiliate links
- collect product images + metadata

Human still does:
- final product approval
- affiliate compliance checks

## C. Visual + Script Generation (Automatable)
**Output:**
- room visual prompt set
- generated room images
- voiceover script + short caption options

Automations:
- prompt builder based on selected products
- script generation (hook/body/CTA)
- TTS draft voiceover generation

Human still does:
- final script tone check
- final visual pick (A/B)

## D. Video Assembly (Automatable)
**Output:** ready Reel mp4

Automations:
- add room background
- overlay product images with timed popups
- attach voiceover
- optional subtitles

Human still does:
- final quality review before posting

## E. Distribution Packaging (Automatable)
**Output:**
- Reel caption pack
- Story cards with links
- Community post text + link bundle

Automations:
- generate posting copy
- build story sequence assets
- build community summary card

Human still does:
- manual publish on Instagram
- final link sanity check

---

## 4) Time-Saved Estimate

Baseline manual: **150–270 min/day**

With v1 automation:
- planning: 30 -> 8 min
- product ops: 60 -> 20 min
- script/voice: 30 -> 10 min
- video assembly: 60 -> 15 min
- posting prep: 30 -> 10 min

New total: **63 min/day** (roughly 50–75 min range)

Expected daily savings: **~90–200 minutes/day**

---

## 5) Human-in-the-loop model (important)
We keep humans in control where brand/compliance quality matters:
- final product selection
- final script/voice approval
- final visual pick
- final publish action

This protects quality and policy safety while still saving major time.

---

## 6) Local-First Deployment Plan
Run daily on Mac mini with scheduled job:
- inputs file (`inputs/today.json`)
- one command: `run_daily_pipeline.sh`
- outputs into dated folder (`output/YYYY-MM-DD/`)

No required cloud hosting for pipeline.
Variable costs: AI image/voice/text generation and affiliate tooling APIs.

---

## 7) Suggested Phase Plan

### Phase 1 (MVP, 1 week)
- episode brief generator
- product pack formatter
- script + caption generator
- basic reel assembler template

### Phase 2 (2nd week)
- story asset builder
- community post builder
- A/B hooks and caption variants

### Phase 3
- performance feedback loop
- auto recommendations based on CTR/conversions

---

## 8) Cost Breakdown by Step (local-first)

| Step | What runs | Existing stack coverage | Estimated incremental cost |
|---|---|---|---|
| Episode planning | prompt/template generation | OpenClaw + existing models | $0 incremental (uses current subscriptions) |
| Product sourcing + formatting | scraping/search/parsing scripts | Mac mini + local scripts | $0 to low (depends on any paid data API used) |
| Script + caption generation | LLM drafting | OpenClaw/Codex/Claude setup | $0 incremental (within existing usage caps) |
| Room visual generation | image model inference | optional local/free tiers first | low variable cost if external image APIs used |
| Voice generation | TTS draft | local recording first; optional TTS API | $0 if manual/local, low if API TTS |
| Reel assembly | ffmpeg/local compositing | Mac mini local | $0 |
| Story/community package | text/image packaging scripts | Mac mini local | $0 |
| Publishing | manual final publish | human in loop | $0 |

### Cost policy
- Default to free/local execution first.
- Use paid APIs only where they create clear time/quality ROI.
- Track variable AI/API usage per content piece once pipeline starts.

## 9) Deliverables in this repo
- workflow diagrams
- automation blueprint
- human task checklist
- implementation roadmap
- cost-first operating model

