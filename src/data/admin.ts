import type { Source, Draft, Post } from "@/types"

// ─── Sources ──────────────────────────────────────────────────────────────────
// Trusted feeds the future AI agent will monitor for editorial signals.

export const mockSources: Source[] = [
  {
    id: "s1",
    name: "MIT Technology Review",
    url: "https://technologyreview.com",
    type: "blog",
    status: "active",
    lastChecked: "2026-05-21T09:00:00Z",
    automationEnabled: true,
    description: "AI, computing, and technology coverage from MIT.",
  },
  {
    id: "s2",
    name: "McKinsey & Company Insights",
    url: "https://mckinsey.com/insights",
    type: "newsletter",
    status: "active",
    lastChecked: "2026-05-21T08:30:00Z",
    automationEnabled: true,
    description: "Strategy, operations, and management research.",
  },
  {
    id: "s3",
    name: "Harvard Business Review",
    url: "https://hbr.org",
    type: "blog",
    status: "active",
    lastChecked: "2026-05-21T07:45:00Z",
    automationEnabled: true,
    description: "Leadership, management, and business strategy.",
  },
  {
    id: "s4",
    name: "Stratechery",
    url: "https://stratechery.com",
    type: "newsletter",
    status: "active",
    lastChecked: "2026-05-21T10:00:00Z",
    automationEnabled: true,
    description: "Business and technology strategy analysis.",
  },
  {
    id: "s5",
    name: "The Batch — DeepLearning.AI",
    url: "https://deeplearning.ai/the-batch",
    type: "newsletter",
    status: "active",
    lastChecked: "2026-05-21T06:00:00Z",
    automationEnabled: true,
    description: "Curated AI research and applied ML news.",
  },
  {
    id: "s6",
    name: "CB Insights Research",
    url: "https://cbinsights.com/research",
    type: "research",
    status: "error",
    lastChecked: "2026-05-19T14:00:00Z",
    automationEnabled: true,
    description: "Market intelligence and business analytics.",
  },
]

// ─── Drafts ───────────────────────────────────────────────────────────────────
// AI-generated editorial drafts awaiting human review before becoming posts.

export const mockDrafts: Draft[] = [
  {
    id: "d1",
    title: "The Real Cost of AI Hallucinations in Enterprise Workflows",
    excerpt:
      "When AI models produce confident but incorrect outputs in business-critical processes, the cost is rarely just a corrected document — it compounds through decisions made downstream.",
    body:
      "## The Hidden Multiplier\n\n" +
      "When an AI model outputs a hallucinated figure in a financial report, the cost is not just one corrected cell. It is the hours spent auditing the broader analysis, the meetings triggered by the error, and the erosion of trust in the tool itself. In enterprise workflows, hallucinations compound.\n\n" +
      "## Why Enterprise Exposure Is Different\n\n" +
      "Consumer-facing hallucinations are embarrassing. Enterprise hallucinations are consequential. When AI is embedded into compliance workflows, supply chain decisions, or client-facing documents, a confident but wrong output does not stay contained — it propagates downstream before anyone catches it.\n\n" +
      "## What High-Reliability Organisations Are Doing\n\n" +
      "The teams deploying AI successfully in high-stakes contexts treat AI outputs as inputs to human judgment, not replacements for it. They build review checkpoints into workflows specifically designed to catch errors before they propagate.",
    sourceUrl: "https://technologyreview.com/2026/05/ai-hallucinations-enterprise",
    sourceId: "s1",
    type: "insight",
    topic: "AI Strategy",
    status: "review",
    createdAt: "2026-05-21T11:00:00Z",
    updatedAt: "2026-05-21T11:45:00Z",
  },
  {
    id: "d2",
    title: "Building Resilient Operations in an Age of Automation",
    excerpt:
      "Automation reduces routine failure modes but introduces new classes of systemic risk. The operations leaders getting this right are designing for resilience, not just efficiency.",
    body: "",
    type: "insight",
    topic: "Automation",
    status: "pending",
    createdAt: "2026-05-21T10:00:00Z",
    updatedAt: "2026-05-21T10:00:00Z",
  },
  {
    id: "d3",
    title: "What CFOs Need to Know About AI Budgeting in 2026",
    excerpt:
      "The first wave of enterprise AI spend was exploratory. The second wave is being held to the same standards as any other capital allocation — and many AI programmes are not ready for that scrutiny.",
    body:
      "## The Shift from Exploration to Accountability\n\n" +
      "The first wave of enterprise AI investment operated under different rules. Boards tolerated exploratory spend because AI was novel and the competitive stakes felt high. That era is over.\n\n" +
      "## What Scrutiny Looks Like Now\n\n" +
      "CFOs are now asking the same questions of AI programmes they ask of any other capital deployment: What is the payback period? What assumptions underpin the projected ROI? What happens if adoption stalls at 40% of the workforce? Most AI vendors and internal champions are not ready for these questions.\n\n" +
      "## How to Get AI Investment Ready for Finance Review\n\n" +
      "The AI programmes most likely to survive budget review have separated infrastructure spend from programme spend, built clear adoption metrics, and tied financial outcomes to workflow changes rather than tool usage.",
    sourceUrl: "https://mckinsey.com/insights/2026/05/cfo-ai-budgeting",
    sourceId: "s2",
    type: "article",
    topic: "Market Trends",
    status: "approved",
    createdAt: "2026-05-20T15:00:00Z",
    updatedAt: "2026-05-21T09:00:00Z",
  },
  {
    id: "d4",
    title: "The Governance Paradox: Moving Fast Without Breaking Trust",
    excerpt:
      "The companies that have moved fastest on AI adoption are also the ones with the most deliberate governance frameworks. This is not a coincidence.",
    body:
      "## The Speed Paradox\n\n" +
      "Conventional wisdom holds that governance slows AI adoption. The data suggests otherwise. The organisations that moved fastest to enterprise-wide AI deployment also invested earliest in governance infrastructure — not because governance enables speed, but because ungoverned AI creates the kind of incidents that stop programmes entirely.\n\n" +
      "## What Governance Actually Looks Like in Practice\n\n" +
      "Effective AI governance is not a review committee. It is a set of operational constraints embedded into the deployment process itself: model selection criteria, output review requirements, audit logging, and clear lines of accountability when something goes wrong.\n\n" +
      "## The Trust Dividend\n\n" +
      "Organisations with mature governance frameworks report a consistent secondary benefit: higher internal adoption. Employees are more willing to incorporate AI tools into their workflows when they trust that errors will be caught and accountability is clear.",
    sourceId: "s3",
    type: "insight",
    topic: "Leadership",
    status: "review",
    createdAt: "2026-05-20T12:00:00Z",
    updatedAt: "2026-05-20T14:30:00Z",
  },
  {
    id: "d5",
    title: "Case Study Draft: Predictive Maintenance ROI at Larson Industries",
    excerpt:
      "A twelve-month retrospective on Larson Industries' predictive maintenance pilot — what the model got right, where it failed, and whether the investment paid off.",
    body: "",
    type: "article",
    topic: "Case Study",
    status: "rejected",
    createdAt: "2026-05-18T09:00:00Z",
    updatedAt: "2026-05-18T16:00:00Z",
  },
]

// ─── Posts ────────────────────────────────────────────────────────────────────
// Publishable content. Telegram distribution state lives here as post-level metadata.

export const mockPosts: Post[] = [
  {
    id: "p1",
    title: "Why AI Strategy Fails Without Operational Readiness",
    excerpt:
      "Most AI initiatives stall not because of poor technology, but because the organisation was not ready to absorb the change.",
    type: "insight",
    topic: "AI Strategy",
    status: "published",
    slug: "ai-strategy-fails-without-operational-readiness",
    publishedAt: "2026-04-28",
    createdAt: "2026-04-25T10:00:00Z",
    updatedAt: "2026-04-28T09:00:00Z",
    telegramStatus: "sent",
  },
  {
    id: "p2",
    title: "Automating the Middle: Where AI Delivers Real ROI in Operations",
    excerpt:
      "The biggest efficiency gains from AI are not at the edges of your business — they are in the middle-office workflows most leaders never examine closely.",
    type: "insight",
    topic: "Automation",
    status: "published",
    slug: "automating-the-middle-where-ai-delivers-real-roi",
    publishedAt: "2026-05-05",
    createdAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-05-05T09:00:00Z",
    telegramStatus: "sent",
  },
  {
    id: "p3",
    title: "What Market Leaders Understand About AI Governance That Others Don't",
    excerpt:
      "Governance is not a constraint on AI adoption — it is the foundation that makes scale possible.",
    type: "insight",
    topic: "Market Trends",
    status: "published",
    slug: "what-market-leaders-understand-about-ai-governance",
    publishedAt: "2026-05-09",
    createdAt: "2026-05-07T10:00:00Z",
    updatedAt: "2026-05-09T09:00:00Z",
    telegramStatus: "ready",
  },
  {
    id: "p4",
    title: "The Manager's Guide to Running an AI-Augmented Team",
    excerpt:
      "When your team works alongside AI tools every day, the job of management changes.",
    type: "insight",
    topic: "Leadership",
    status: "published",
    slug: "managers-guide-to-running-ai-augmented-teams",
    publishedAt: "2026-05-01",
    createdAt: "2026-04-29T10:00:00Z",
    updatedAt: "2026-05-01T09:00:00Z",
    telegramStatus: "sent",
  },
  {
    id: "p5",
    title: "Inside the AI Pilot: A Case Study from Meridian Group's Finance Team",
    excerpt:
      "What actually happens when a mid-size company runs its first AI pilot in a finance function?",
    type: "insight",
    topic: "Case Study",
    status: "published",
    slug: "inside-ai-pilot-meridian-group-finance-case-study",
    publishedAt: "2026-04-22",
    createdAt: "2026-04-20T10:00:00Z",
    updatedAt: "2026-04-22T09:00:00Z",
    telegramStatus: "sent",
  },
  {
    id: "p6",
    title: "What CFOs Need to Know About AI Budgeting in 2026",
    excerpt:
      "The first wave of enterprise AI spend was exploratory. The second wave is being held to capital allocation standards.",
    type: "article",
    topic: "Market Trends",
    status: "review",
    slug: "cfos-ai-budgeting-2026",
    createdAt: "2026-05-21T10:00:00Z",
    updatedAt: "2026-05-21T10:00:00Z",
  },
  {
    id: "p7",
    title: "The Real Cost of AI Hallucinations in Enterprise Workflows",
    excerpt:
      "When AI models produce confident but incorrect outputs, the cost compounds through decisions made downstream.",
    type: "insight",
    topic: "AI Strategy",
    status: "draft",
    slug: "real-cost-ai-hallucinations-enterprise",
    createdAt: "2026-05-21T11:30:00Z",
    updatedAt: "2026-05-21T11:30:00Z",
  },
]
