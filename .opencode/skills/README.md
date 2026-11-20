# AI Skills for MICROTRONIC (Thailand)

Skills library for AI agents supporting Khung (พี่ฆัง) in product management, marketing strategy, and business operations.

## Available Skills

### 1. Marketing Strategy Skills
📁 `marketing-strategy/`

Specialized skills for CRO, content strategy, SEO, analytics, and growth engineering.

**Use When:**
- Planning marketing campaigns
- Optimizing conversion rates
- Writing content/copywriting
- Analyzing marketing metrics
- Designing growth initiatives

**Key Topics:** Product-marketing foundation, CRO, content & copywriting, SEO, analytics, growth loops

### 2. Product Manager Core Skills
📁 `product-manager-core/`

PRD writing, roadmap planning, OKR setting, user story generation, sprint planning, and backlog management.

**Use When:**
- Writing product requirements (PRD)
- Planning product launches
- Setting OKRs and goals
- Building sprint plans
- Prioritizing features

**Key Topics:** PRD generation, story mapping, pricing strategy, project planning (Gantt), sprint planning, OKR management

**References:**
- `references/product-strategy-guide.md` — MICROTRONIC 12-month product strategy
- Strategic priorities for 2026-2027

### 3. Campaign & Marketing Launch Skills
📁 `campaign-marketing-launch/`

End-to-end campaign planning, go-to-market strategies, content calendars, and launch execution.

**Use When:**
- Planning a product launch campaign
- Creating content calendars
- Designing go-to-market (GTM) strategies
- Coordinating launch day operations
- Planning lead-gen campaigns

**Key Topics:** Campaign briefs, GTM strategy, content calendars, channel strategy, launch playbooks

**Microtronic-Specific Campaigns:**
- GWS Reseller Expansion
- AI Transformation Services

---

## Skills Organization

```
.opencode/skills/
├── marketing-strategy/
│   └── SKILL.md
├── product-manager-core/
│   ├── SKILL.md
│   └── references/
│       └── product-strategy-guide.md
├── campaign-marketing-launch/
│   └── SKILL.md
├── micro-account-tax/           (existing — tax/accounting)
│   ├── SKILL.md
│   ├── references/
│   │   ├── filing.md
│   │   └── tax-evidence.md
│   └── scripts/
└── README.md                     (this file)
```

---

## How to Use These Skills with AI Agents

### When Asking an AI Agent

Use trigger phrases that match the skill focus:

**Marketing Strategy:**
- "Design a marketing campaign for..."
- "How do we improve conversion rate on..."
- "Create a content strategy..."
- "Analyze SEO performance..."

**Product Management:**
- "Write a PRD for..."
- "Create a sprint plan..."
- "Design our OKRs for Q4..."
- "Plan a product launch..."
- "Prioritize our backlog..."

**Campaign & Launch:**
- "Plan a campaign for..."
- "How do we launch the new product..."
- "Create a content calendar..."
- "Design a go-to-market strategy..."
- "Build a launch day plan..."

### Loading Skills in Agent Sessions

1. **Manual Load:** Reference the skill file path when briefing the agent
2. **Auto-Trigger:** Agent recognizes trigger phrases and loads relevant skill
3. **Custom Agents:** Create `.kiro/agents/` entries that auto-load these skills

---

## Skill Interaction Map

These skills work together:

```
┌─────────────────────────────────────┐
│     Product Strategy Guide          │
│   (Market, positioning, pricing)    │
└──────────────┬──────────────────────┘
               │ informs
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────┐   ┌────────────────┐
│ Product Mgmt │   │ Marketing      │
│ (roadmap,    │   │ (campaigns,    │
│  PRD, sprints)   │  content,      │
└──────┬───────┘   │  growth)       │
       │           └────────────────┘
       │ enables        │ amplifies
       │                │
       └────────┬───────┘
                ▼
         ┌──────────────┐
         │  Campaign &  │
         │  Launch      │
         │  (execution) │
         └──────────────┘
```

---

## Microtronic Context

### Current Business
- **Primary Revenue:** Google Workspace resale (137 lic/month to Dominick Corp.)
- **Secondary:** MS Office 365, Adobe licensing
- **Services:** Professional services, AI training (underdeveloped)
- **Internal Product:** Micro-Account (accounting + Thai tax automation)

### Strategic Goals (Next 12 Months)
1. **Stabilize Revenue:** 10,000+ THB/month recurring (diversify customer base)
2. **Services:** 1 AI transformation pilot by Q2 2027
3. **Channels:** 20% revenue from new channels by Q4 2027

### Key Metrics
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Customer lifetime value (LTV)
- Campaign ROI

---

## Updating Skills

When updating skills:
1. Document changes in this README
2. Update `Last Updated` date in each skill file
3. Store reference documents in `references/`
4. Commit changes with clear message: "docs(skills): update [skill-name] with [change]"

### Version History
- **v1.0** (2026-10-06): Initial launch
  - Marketing Strategy Skills (CRO, growth)
  - Product Manager Core (PRD, roadmap, OKR)
  - Campaign & Launch (GTM, content calendar)

---

## References & Sources

- **Marketing Skills:** [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) — MIT licensed
- **Product Manager Skills:** 
  - [AgentSkill Wiki](https://agentskill.wiki/topics/product-manager/)
  - [Kimi AI — Product Manager Skills](https://www.kimi.ai/resources/product-manager-skills-for-agents)
- **Microtronic Strategy:** `docs/DECISIONS.md`, `docs/TAX_WORKLOG.md`

---

## Contributing

To add or update skills:
1. Create new folder under `.opencode/skills/[skill-name]/`
2. Add `SKILL.md` with skill definition
3. Add reference docs in `references/`
4. Update this README with skill summary
5. Commit and notify team

---

**Maintained By:** Kiro Agent  
**Last Updated:** 2026-10-06  
**For:** MICROTRONIC (Thailand) Co., Ltd. — Khung (พี่ฆัง)
