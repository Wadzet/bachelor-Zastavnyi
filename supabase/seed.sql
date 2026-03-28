-- =============================================================================
-- supabase/seed.sql
-- BizInsight — Initial Seed Data
-- =============================================================================
--
-- Run AFTER applying 001_initial_schema.sql in the Supabase SQL Editor.
-- Safe to re-run: every INSERT uses ON CONFLICT … DO NOTHING.
--
-- UUID prefix map (stable, human-readable):
--   Authors        11111111-1111-1111-1111-0000000000xx  (01–03)
--   Sources        22222222-2222-2222-2222-0000000000xx  (01–06)
--   Drafts         33333333-3333-3333-3333-0000000000xx  (01–05)
--   Posts          44444444-4444-4444-4444-0000000000xx  (01–15)
--   AI Generations 55555555-5555-5555-5555-0000000000xx  (01–03)
--   Dist. Jobs     66666666-6666-6666-6666-0000000000xx  (01–07)
--   Inquiries      77777777-7777-7777-7777-0000000000xx  (01–02)
--
-- Public UI coverage (once data layer is wired in Step 13+):
--   /                  → posts 01–03 (featured insights), 09–10 (featured interviews)
--   /insights          → posts 01–08 (all insight / article / news)
--   /insights/[slug]   → posts 01–08 (full body_markdown)
--   /interviews        → posts 09–13 (all interviews)
--   /interviews/[slug] → posts 09–13 (guest_data + qa_data JSONB)
--   /admin (later)     → posts 14–15, drafts 01–05, dist. jobs 01–07
--
-- Sections:
--   1. authors
--   2. sources
--   3. drafts
--   4. ai_generations
--   5. posts — insights / articles / news (8 published)
--   6. posts — interviews (5 published)
--   7. posts — admin testing (draft / review)
--   8. distribution_jobs
--   9. inquiries
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. authors
-- ---------------------------------------------------------------------------
-- Seeded manually for MVP. No admin UI in this phase.
-- ---------------------------------------------------------------------------

INSERT INTO authors (id, name, role, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-000000000001',
    'Elena Marsh',
    'Senior Editor',
    '2026-01-15T09:00:00Z',
    '2026-01-15T09:00:00Z'
  ),
  (
    '11111111-1111-1111-1111-000000000002',
    'James Corfield',
    'Contributing Analyst',
    '2026-01-15T09:00:00Z',
    '2026-01-15T09:00:00Z'
  ),
  (
    '11111111-1111-1111-1111-000000000003',
    'Sofia Andersen',
    'Contributing Writer',
    '2026-02-01T09:00:00Z',
    '2026-02-01T09:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 2. sources
-- ---------------------------------------------------------------------------
-- Trusted publications the future AI agent will monitor.
-- s6 (CB Insights) is in 'error' state to exercise that UI path.
-- ---------------------------------------------------------------------------

INSERT INTO sources (id, name, url, type, status, description, last_checked_at, created_at, updated_at)
VALUES
  (
    '22222222-2222-2222-2222-000000000001',
    'MIT Technology Review',
    'https://technologyreview.com',
    'blog',
    'active',
    'AI, computing, and technology coverage from MIT.',
    '2026-05-21T09:00:00Z',
    '2026-01-15T09:00:00Z',
    '2026-05-21T09:00:00Z'
  ),
  (
    '22222222-2222-2222-2222-000000000002',
    'McKinsey & Company Insights',
    'https://mckinsey.com/insights',
    'newsletter',
    'active',
    'Strategy, operations, and management research.',
    '2026-05-21T08:30:00Z',
    '2026-01-15T09:00:00Z',
    '2026-05-21T08:30:00Z'
  ),
  (
    '22222222-2222-2222-2222-000000000003',
    'Harvard Business Review',
    'https://hbr.org',
    'blog',
    'active',
    'Leadership, management, and business strategy.',
    '2026-05-21T07:45:00Z',
    '2026-01-15T09:00:00Z',
    '2026-05-21T07:45:00Z'
  ),
  (
    '22222222-2222-2222-2222-000000000004',
    'Stratechery',
    'https://stratechery.com',
    'newsletter',
    'active',
    'Business and technology strategy analysis by Ben Thompson.',
    '2026-05-21T10:00:00Z',
    '2026-01-15T09:00:00Z',
    '2026-05-21T10:00:00Z'
  ),
  (
    '22222222-2222-2222-2222-000000000005',
    'The Batch — DeepLearning.AI',
    'https://deeplearning.ai/the-batch',
    'newsletter',
    'active',
    'Curated AI research and applied ML news from Andrew Ng.',
    '2026-05-21T06:00:00Z',
    '2026-01-15T09:00:00Z',
    '2026-05-21T06:00:00Z'
  ),
  (
    '22222222-2222-2222-2222-000000000006',
    'CB Insights Research',
    'https://cbinsights.com/research',
    'research',
    'error',
    'Market intelligence and business analytics.',
    '2026-05-19T14:00:00Z',
    '2026-01-15T09:00:00Z',
    '2026-05-19T14:00:00Z'
  )
ON CONFLICT (url) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. drafts
-- ---------------------------------------------------------------------------
--
-- d1 (review)   — AI Hallucinations; source: MIT Tech Review → linked to post p15
-- d2 (pending)  — Resilient Operations; no source; body not yet generated
-- d3 (approved) — CFO Budgeting; source: McKinsey → promoted to post p14
-- d4 (review)   — Governance Paradox; source: HBR
-- d5 (rejected) — Predictive Maintenance case study (Larson Industries)
-- ---------------------------------------------------------------------------

-- d1
INSERT INTO drafts (
  id, title, excerpt, body_markdown, content_type, topic, status,
  source_id, source_url, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-000000000001',
  'The Real Cost of AI Hallucinations in Enterprise Workflows',
  'When AI models produce confident but incorrect outputs in business-critical processes, the cost is rarely just a corrected document — it compounds through decisions made downstream.',
  $md$## The Hidden Multiplier

When an AI model outputs a hallucinated figure in a financial report, the cost is not just one corrected cell. It is the hours spent auditing the broader analysis, the meetings triggered by the error, and the erosion of trust in the tool itself. In enterprise workflows, hallucinations compound.

## Why Enterprise Exposure Is Different

Consumer-facing hallucinations are embarrassing. Enterprise hallucinations are consequential. When AI is embedded into compliance workflows, supply chain decisions, or client-facing documents, a confident but wrong output does not stay contained — it propagates downstream before anyone catches it.

## What High-Reliability Organisations Are Doing

The teams deploying AI successfully in high-stakes contexts treat AI outputs as inputs to human judgment, not replacements for it. They build review checkpoints into workflows specifically designed to catch errors before they propagate.$md$,
  'insight',
  'AI Strategy',
  'review',
  '22222222-2222-2222-2222-000000000001',
  'https://technologyreview.com/2026/05/ai-hallucinations-enterprise',
  '2026-05-21T11:00:00Z',
  '2026-05-21T11:45:00Z'
) ON CONFLICT (id) DO NOTHING;

-- d2
INSERT INTO drafts (
  id, title, excerpt, body_markdown, content_type, topic, status,
  created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-000000000002',
  'Building Resilient Operations in an Age of Automation',
  'Automation reduces routine failure modes but introduces new classes of systemic risk. The operations leaders getting this right are designing for resilience, not just efficiency.',
  '',
  'insight',
  'Automation',
  'pending',
  '2026-05-21T10:00:00Z',
  '2026-05-21T10:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- d3
INSERT INTO drafts (
  id, title, excerpt, body_markdown, content_type, topic, status,
  source_id, source_url, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-000000000003',
  'What CFOs Need to Know About AI Budgeting in 2026',
  'The first wave of enterprise AI spend was exploratory. The second wave is being held to the same standards as any other capital allocation — and many AI programmes are not ready for that scrutiny.',
  $md$## The Shift from Exploration to Accountability

The first wave of enterprise AI investment operated under different rules. Boards tolerated exploratory spend because AI was novel and the competitive stakes felt high. That era is over.

## What Scrutiny Looks Like Now

CFOs are now asking the same questions of AI programmes they ask of any other capital deployment: What is the payback period? What assumptions underpin the projected ROI? What happens if adoption stalls at 40% of the workforce? Most AI vendors and internal champions are not ready for these questions.

## How to Get AI Investment Ready for Finance Review

The AI programmes most likely to survive budget review have separated infrastructure spend from programme spend, built clear adoption metrics, and tied financial outcomes to workflow changes rather than tool usage.$md$,
  'article',
  'Market Trends',
  'approved',
  '22222222-2222-2222-2222-000000000002',
  'https://mckinsey.com/insights/2026/05/cfo-ai-budgeting',
  '2026-05-20T15:00:00Z',
  '2026-05-21T09:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- d4
INSERT INTO drafts (
  id, title, excerpt, body_markdown, content_type, topic, status,
  source_id, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-000000000004',
  'The Governance Paradox: Moving Fast Without Breaking Trust',
  'The companies that have moved fastest on AI adoption are also the ones with the most deliberate governance frameworks. This is not a coincidence.',
  $md$## The Speed Paradox

Conventional wisdom holds that governance slows AI adoption. The data suggests otherwise. The organisations that moved fastest to enterprise-wide AI deployment also invested earliest in governance infrastructure — not because governance enables speed, but because ungoverned AI creates the kind of incidents that stop programmes entirely.

## What Governance Actually Looks Like in Practice

Effective AI governance is not a review committee. It is a set of operational constraints embedded into the deployment process itself: model selection criteria, output review requirements, audit logging, and clear lines of accountability when something goes wrong.

## The Trust Dividend

Organisations with mature governance frameworks report a consistent secondary benefit: higher internal adoption. Employees are more willing to incorporate AI tools into their workflows when they trust that errors will be caught and accountability is clear.$md$,
  'insight',
  'Leadership',
  'review',
  '22222222-2222-2222-2222-000000000003',
  '2026-05-20T12:00:00Z',
  '2026-05-20T14:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- d5
INSERT INTO drafts (
  id, title, excerpt, body_markdown, content_type, topic, status,
  created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-000000000005',
  'Case Study Draft: Predictive Maintenance ROI at Larson Industries',
  'A twelve-month retrospective on Larson Industries'' predictive maintenance pilot — what the model got right, where it failed, and whether the investment paid off.',
  '',
  'article',
  'Case Study',
  'rejected',
  '2026-05-18T09:00:00Z',
  '2026-05-18T16:00:00Z'
) ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 4. ai_generations
-- ---------------------------------------------------------------------------
--
-- g1 (completed) — generated d1 (AI Hallucinations); linked to MIT Tech Review
-- g2 (completed) — generated d3 (CFO Budgeting); linked to McKinsey
-- g3 (failed)    — attempted d2 (Resilient Operations); rate-limited
-- ---------------------------------------------------------------------------

-- g1
INSERT INTO ai_generations (
  id, draft_id, source_url, model,
  prompt_tokens, completion_tokens, status,
  generated_title, generated_excerpt, generated_body,
  created_at, completed_at
) VALUES (
  '55555555-5555-5555-5555-000000000001',
  '33333333-3333-3333-3333-000000000001',
  'https://technologyreview.com/2026/05/ai-hallucinations-enterprise',
  'gpt-4o',
  1240,
  820,
  'completed',
  'The Real Cost of AI Hallucinations in Enterprise Workflows',
  'When AI models produce confident but incorrect outputs in business-critical processes, the cost compounds through decisions made downstream.',
  $md$## The Hidden Multiplier

When an AI model outputs a hallucinated figure in a financial report, the cost is not just one corrected cell — it is the hours spent auditing the broader analysis, the meetings triggered by the error, and the erosion of trust in the tool.

## Why Enterprise Exposure Is Different

Consumer-facing hallucinations are embarrassing. Enterprise hallucinations are consequential. When AI is embedded into compliance or supply chain workflows, an incorrect output propagates downstream before anyone catches it.

## What High-Reliability Organisations Are Doing

The teams deploying AI successfully in high-stakes contexts treat AI outputs as inputs to human judgment, not replacements for it. They build review checkpoints specifically designed to catch errors before they propagate.$md$,
  '2026-05-21T11:00:00Z',
  '2026-05-21T11:05:00Z'
) ON CONFLICT (id) DO NOTHING;

-- g2
INSERT INTO ai_generations (
  id, draft_id, source_url, model,
  prompt_tokens, completion_tokens, status,
  generated_title, generated_excerpt, generated_body,
  created_at, completed_at
) VALUES (
  '55555555-5555-5555-5555-000000000002',
  '33333333-3333-3333-3333-000000000003',
  'https://mckinsey.com/insights/2026/05/cfo-ai-budgeting',
  'gpt-4o',
  1580,
  1020,
  'completed',
  'What CFOs Need to Know About AI Budgeting in 2026',
  'The first wave of enterprise AI spend was exploratory. The second wave is being held to capital allocation standards that most AI programmes are not ready for.',
  $md$## From Exploration to Accountability

The era of exploratory AI spend is over. Boards that once tolerated uncertain ROI are now asking the same questions of AI programmes they ask of any capital deployment.

## What Finance Review Actually Looks Like

CFOs want payback periods, adoption assumptions, and workflow change metrics — not capability demonstrations. Most AI programme owners are not ready for these conversations.

## How to Get Ready

Separate infrastructure spend from programme spend. Build adoption metrics. Tie outcomes to workflow changes, not tool usage.$md$,
  '2026-05-20T15:00:00Z',
  '2026-05-20T15:08:00Z'
) ON CONFLICT (id) DO NOTHING;

-- g3 (failed)
INSERT INTO ai_generations (
  id, draft_id, model, status, error_message,
  created_at, completed_at
) VALUES (
  '55555555-5555-5555-5555-000000000003',
  '33333333-3333-3333-3333-000000000002',
  'gpt-4o',
  'failed',
  'Rate limit exceeded. Please retry after 60 seconds.',
  '2026-05-21T10:01:00Z',
  '2026-05-21T10:01:12Z'
) ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 5. posts — insights / articles / news (8 published)
-- ---------------------------------------------------------------------------
--
-- p01 featured AI Strategy  — Elena Marsh   — telegram: sent
-- p02 featured Automation   — James Corfield — telegram: sent
-- p03 featured Market Trends — Elena Marsh   — telegram: ready
-- p04         Leadership    — Elena Marsh   — telegram: sent
-- p05         Case Study    — James Corfield — telegram: sent
-- p06         Operations    — James Corfield
-- p07         Leadership    — Elena Marsh
-- p08         Market Trends — James Corfield
-- ---------------------------------------------------------------------------

-- p01
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000001',
  'Why AI Strategy Fails Without Operational Readiness',
  'Most AI initiatives stall not because of poor technology, but because the organisation was not ready to absorb the change.',
  $md$Most organisations that invest in AI strategy do so with a clear intention: they want to move faster, operate more efficiently, and make better decisions. The ambition is rarely the problem. What kills most AI initiatives is something far more mundane — the organisation simply was not ready to absorb the change.

Readiness is not about having the right tech stack or the most sophisticated data infrastructure. It is about having the human, procedural, and cultural conditions that allow a new capability to be adopted, adapted, and eventually trusted. Without that foundation, even the best AI implementation will stall.

## What operational readiness actually means

Operational readiness starts with clarity of ownership. When an AI system makes a recommendation — or takes an action — someone needs to be accountable for the outcome. In many organisations, that accountability is not yet defined. No one owns the model's decisions. No one has clear authority to override them. This ambiguity alone is enough to stall deployment before it reaches scale.

The second dimension is process integration. AI systems do not replace processes wholesale; they slot into them. If your existing processes are poorly documented, inconsistently followed, or not understood by the people running them, an AI layer will make things worse, not better. Garbage in, chaos out.

## The people problem no one wants to talk about

Technology adoption fails when the people who are supposed to use it are not equipped or motivated to do so. This is well-understood in theory and routinely ignored in practice.

Managers often frame AI rollouts as IT projects. When that happens, the people who need to change their behaviour — the frontline workers, the middle managers, the analysts — are told about the change rather than brought into it. The result is passive resistance: people find workarounds, revert to manual processes, or simply do not engage with the new system meaningfully.

## A different starting point

The organisations that see real returns from AI investment tend to start not with the technology but with a clear-eyed assessment of where their processes, people, and data are actually reliable. They identify the smallest possible pilot — a single workflow, a single team — and they invest heavily in change management alongside the technical work.

This is unglamorous. It is slower than buying a platform licence and announcing a transformation. But it is the approach that actually produces a return. The AI strategy conversation in most boardrooms is still too focused on capability — what the technology can do — and not focused enough on readiness: what the organisation needs to do before the technology can do anything useful at all.$md$,
  'insight',
  'AI Strategy',
  'published',
  'ai-strategy-fails-without-operational-readiness',
  '11111111-1111-1111-1111-000000000001',
  true,
  '2026-04-28T09:00:00Z',
  '2026-04-25T10:00:00Z',
  '2026-04-28T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p02
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000002',
  'Automating the Middle: Where AI Delivers Real ROI in Operations',
  'The biggest efficiency gains from AI are not at the edges of your business — they are in the middle-office workflows most leaders never examine closely.',
  $md$When business leaders talk about AI automation, the conversation gravitates toward two extremes: fully autonomous systems that replace entire job functions, or narrow point solutions that save a few clicks on a specific task. Both framings miss where the real return is. The highest-value automation opportunity in most organisations sits in neither place — it sits in the middle office.

Middle-office work is the category of tasks that are too complex to be replaced by simple rules-based automation but too routine to benefit from expert human judgment at every step. Document review. Invoice reconciliation. Compliance checklists. Internal reporting. Procurement approvals. These workflows consume an enormous share of organisational bandwidth, and they are exactly where modern AI models — capable of reading, reasoning, and drafting — generate durable efficiency gains.

## Why middle-office automation is different

Edge automation — replacing a factory process or a customer service chatbot — is visible. The ROI case is straightforward and the measurement is clean. Middle-office automation is harder to see because it operates inside processes that were never designed to be measured.

The first step in any serious middle-office automation effort is making the invisible work visible. That means process mapping: identifying the actual steps in a workflow, who performs them, how long each step takes, where errors occur, and where decisions happen that require judgment. Without this map, you are automating in the dark.

## Sequencing the automation

Not all middle-office work is equally automatable. A useful framework is to sequence by two dimensions: frequency and judgment intensity. High-frequency, low-judgment tasks — formatting, routing, summarising, tagging — are ready to automate today with current AI capabilities. Lower-frequency tasks that require more contextual judgment can follow once the simpler automations are validated and trusted.

The mistake most organisations make is trying to automate the most complex, high-stakes workflow first, because that is where the most time is being spent. The right starting point is the workflow where a mistake is recoverable — where you can build confidence in the system before extending it to higher-stakes territory.

## Measuring the return

Middle-office automation ROI is best measured not in headcount reduction but in throughput and error rate. How many more documents can the team process per day? How many reconciliation exceptions are caught before they become write-offs? How much faster do approvals move through the pipeline?

These metrics compound. Faster approvals mean faster cash conversion. Fewer reconciliation errors mean fewer audit findings. More consistent compliance checklists mean lower regulatory risk. The ROI of middle-office automation is often diffuse, but it is real — and it accumulates over time in ways that edge automation rarely does.$md$,
  'insight',
  'Automation',
  'published',
  'automating-the-middle-where-ai-delivers-real-roi',
  '11111111-1111-1111-1111-000000000002',
  true,
  '2026-05-05T09:00:00Z',
  '2026-05-02T10:00:00Z',
  '2026-05-05T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p03
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000003',
  'What Market Leaders Understand About AI Governance That Others Don''t',
  'Governance is not a constraint on AI adoption — it is the foundation that makes scale possible.',
  $md$A common assumption in the AI adoption conversation is that governance and speed are in tension. Move fast, and governance becomes an obstacle. Move carefully, and competitors outpace you. The organisations that are actually leading on AI adoption have figured out that this framing is wrong. Governance, done properly, is what makes speed sustainable.

The companies moving fastest on AI are not the ones ignoring governance. They are the ones that built governance frameworks early and used them to accelerate decision-making — not slow it down.

## What governance actually means in practice

AI governance is not a compliance checkbox. It is the set of policies, processes, and accountabilities that determine how AI systems are developed, deployed, monitored, and retired. The organisations that treat it as a compliance requirement tend to build governance that is bureaucratic and reactive. The ones that treat it as a strategic capability build governance that is lightweight, enabling, and continuously improved.

The practical difference is in how decisions get made. A bureaucratic governance model requires every AI deployment to go through a long approval process involving multiple committees. A strategic governance model defines clear criteria for what kinds of AI deployments require what kinds of oversight — and lets most low-risk deployments move forward quickly with minimal friction.

## The trust problem

The deeper reason governance matters is trust. AI systems that lack clear governance tend to erode trust over time — with employees who do not understand why the system made a particular recommendation, with customers who cannot get a coherent explanation for a decision that affected them, and with regulators who see an organisation that cannot demonstrate control.

Rebuilding trust after it is lost is far more expensive than building it correctly from the start. The organisations that are furthest ahead on AI adoption are also the ones that have invested in transparency — explaining to stakeholders how their AI systems work, what data they use, and what safeguards are in place.

## What to build first

For organisations just beginning to formalise AI governance, the highest-leverage starting point is an AI inventory: a simple register of every AI system in use, what it does, who owns it, and what data it processes. Most organisations are surprised by how many AI systems are already in use — often brought in by individual teams without central visibility.

From the inventory, the next step is a tiering framework: categorising systems by risk level, and defining what oversight is required at each tier. This does not need to be complex. Three tiers — low, medium, high risk — with clear criteria and corresponding review requirements is enough to create meaningful structure without creating bottlenecks.$md$,
  'insight',
  'Market Trends',
  'published',
  'what-market-leaders-understand-about-ai-governance',
  '11111111-1111-1111-1111-000000000001',
  true,
  '2026-05-09T09:00:00Z',
  '2026-05-07T10:00:00Z',
  '2026-05-09T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p04
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000004',
  'The Manager''s Guide to Running an AI-Augmented Team',
  'When your team works alongside AI tools every day, the job of management changes.',
  $md$The manager's job has always been to get results through people. AI-augmented teams do not change that objective, but they do change the conditions under which it is pursued. The teams that are integrating AI tools most effectively are doing so under managers who have updated their mental models of what the job actually involves.

The most important shift is from managing output to managing judgment. When AI tools are handling the routine — drafting, summarising, categorising, routing — the work that is left for human team members is disproportionately about judgment calls. Is this recommendation appropriate for this context? Is the AI's assessment of this document accurate? What does this data actually mean for our situation? Managing a team that spends most of its time on judgment-intensive work is a different discipline than managing a team that executes well-defined processes.

## Redefining accountability

The accountability structures most organisations use were designed for a world where humans did all the work. When AI systems are involved in producing an output, accountability becomes more complex. Who is responsible when an AI-assisted report contains an error? Who owns a decision that was made on the basis of an AI recommendation?

Effective managers of AI-augmented teams are explicit about this. They define clear accountability rules: the human who uses an AI output is accountable for its accuracy and appropriateness. The AI is a tool, not a decision-maker. This sounds simple, but it requires active reinforcement — particularly in the early stages of AI adoption, when team members may be tempted to defer to AI outputs rather than exercise critical judgment.

## Building AI judgment in your team

The capability that most differentiates high-performing AI-augmented teams is not proficiency with the tools themselves. It is the ability to evaluate AI outputs critically — to know when the AI is right, when it is wrong, and when it is confidently wrong.

This is a learnable skill, but it requires deliberate practice. Effective managers create space for that practice by reviewing AI outputs together with their teams, discussing where the AI's reasoning went wrong, and building shared mental models of where the tools are reliable and where they are not. Over time, this collective knowledge becomes one of the most valuable capabilities a team can have.

## What good management looks like now

In practical terms, managing an AI-augmented team means spending more time on goal-setting and less time on task-assignment. It means designing workflows that keep humans in the loop at the judgment points and remove them from the purely mechanical steps. It means investing in your team's ability to ask better questions of AI systems — and to evaluate the answers they get.

The managers who are struggling with AI-augmented teams are usually the ones who are trying to manage the AI rather than managing the people who use it. The technology is a variable in the system, not a member of it.$md$,
  'insight',
  'Leadership',
  'published',
  'managers-guide-to-running-ai-augmented-teams',
  '11111111-1111-1111-1111-000000000001',
  false,
  '2026-05-01T09:00:00Z',
  '2026-04-29T10:00:00Z',
  '2026-05-01T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p05
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000005',
  'Inside the AI Pilot: A Case Study from Meridian Group''s Finance Team',
  'What actually happens when a mid-size company runs its first AI pilot in a finance function?',
  $md$In late 2025, Meridian Group ran a twelve-week AI pilot across its finance function. The goal was straightforward: assess whether AI-assisted document review could reduce the time their team spent on month-end close without increasing the error rate. What they found was more complicated — and more instructive — than the headline number suggests.

Meridian is a mid-size professional services firm with around 800 employees across five markets. Their finance team of eighteen handles everything from management accounts to client billing reconciliation. Like most finance teams of this size, they were running on a combination of ERP exports, Excel, and a lot of institutional knowledge held by a handful of senior analysts.

## What they actually tested

The pilot focused on a single workflow: the reconciliation of client disbursements against billing records. This is a task that the team described as "high-volume, low-ambiguity most of the time, but occasionally very ambiguous in ways that matter." Each month, the team processed roughly 2,400 line items, of which around 4–6% typically required manual investigation.

They implemented an AI model that reviewed each line item, flagged anomalies, categorised likely exception types, and drafted a summary of its reasoning for the items it flagged. The human analysts then reviewed the AI's flags and made the final call on every item.

## The numbers

Over the twelve-week pilot, the AI correctly flagged 94% of items that required manual investigation. It also generated false positives — items flagged for human review that turned out to be clean — at a rate of around 8%. Net effect: the team spent slightly more time on false positive review in weeks one through four, then progressively less as they calibrated their confidence in which exception categories the model handled well.

By week twelve, average time-to-close for the reconciliation process had fallen by 31%. The error rate — items that reached final sign-off with an error that was later identified — did not change significantly, which the team considered a success given the reduction in human review time.

## What they would do differently

Speaking with the team after the pilot concluded, three lessons emerged consistently. First, they underestimated the time required to configure the AI's anomaly detection parameters for their specific context. The model required two weeks of guided calibration before its output was reliable enough to trust.

Second, they did not invest enough in communicating the pilot's purpose to the team before it started. Two of the analysts spent the first few weeks looking for evidence that the AI was making mistakes, rather than working with it. A clearer framing of the goal — augmenting the team's capacity, not replacing their judgment — would have accelerated the adoption curve.

Third, the 31% time reduction was real, but not all of it translated into capacity for other work. Some of it was absorbed by the overhead of working with a new tool. Realistic planning should account for a ramp period of six to eight weeks before the efficiency gains materialise fully.$md$,
  'insight',
  'Case Study',
  'published',
  'inside-ai-pilot-meridian-group-finance-case-study',
  '11111111-1111-1111-1111-000000000002',
  false,
  '2026-04-22T09:00:00Z',
  '2026-04-20T10:00:00Z',
  '2026-04-22T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p06
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000006',
  'Rethinking Operations in the Age of Predictive AI',
  'Predictive models are changing how operations teams plan, allocate, and respond.',
  $md$Operations management has always been about anticipation: trying to have the right resources in the right place at the right time. For most of the history of business, anticipation meant experience — pattern recognition accumulated over years of managing similar situations. Predictive AI changes the inputs to that problem without changing the fundamental challenge.

The shift is not that machines now do the anticipating. It is that the quality of the inputs to human anticipation has improved dramatically. Operations leaders who understand this distinction — AI as a better information environment rather than a replacement for operational judgment — are getting real value from predictive systems. Those who expect the AI to make the decisions are often disappointed.

## Where prediction adds value

Predictive AI is most valuable in operations when three conditions are present: the underlying data is clean and complete, the patterns being predicted are genuinely recurrent, and the cost of a wrong prediction is manageable.

Demand forecasting in logistics, for example, meets all three criteria. The data — shipment history, seasonality, customer order patterns — is typically well-structured. The patterns are real and recurrent. And an error in the forecast leads to a stock-out or excess inventory, which is costly but recoverable. Predictive models in this context consistently outperform rule-based forecasting and human intuition, particularly in high-SKU environments where no individual can hold the full picture in their head.

## The integration problem

The most common obstacle to realising the value of predictive AI in operations is not the model — it is the integration. Predictive outputs need to reach decision-makers in a form they can act on, at the time they need to act. This sounds obvious, but it is frequently underengineered.

A demand forecast that is accurate to within 5% but delivered four days after the planning window has passed is worthless. A real-time anomaly alert that fires too frequently to be actionable trains the operations team to ignore it. The technical implementation of predictive AI is the easier part of the problem. The harder part is designing the information flow so that the right person sees the right signal at the right moment.

## Building the capability

Organisations that are building durable predictive operations capabilities tend to share a common approach: they start with one decision — not one department, not one process category, but one specific recurrent decision — and build the data infrastructure, model, and integration around that decision before expanding.

This constraint forces precision. It requires the operations team to articulate exactly what they are deciding, what information they currently use to make that decision, and what a better decision would look like. The AI model is built to address a specific, well-understood problem. That clarity makes the model easier to evaluate, easier to trust, and easier to improve.$md$,
  'insight',
  'Operations',
  'published',
  'rethinking-operations-predictive-ai',
  '11111111-1111-1111-1111-000000000002',
  false,
  '2026-04-15T09:00:00Z',
  '2026-04-13T10:00:00Z',
  '2026-04-15T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p07
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000007',
  'Building AI Literacy Across Non-Technical Teams',
  'The gap between what AI can do and what most employees understand is a strategic liability.',
  $md$There is a growing gap in most organisations between the pace at which AI tools are being adopted and the pace at which the people using them develop a meaningful understanding of what those tools can and cannot do. This gap is not an education problem. It is a leadership problem — and it has real strategic consequences.

When employees use AI tools without understanding their limitations, they tend to make one of two errors. They over-trust: they accept AI outputs without appropriate scrutiny, and errors propagate. Or they under-trust: they dismiss AI capabilities out of unfamiliarity, and the organisation fails to realise the value of tools it has already invested in. Both errors are expensive. Both are avoidable.

## What AI literacy actually requires

AI literacy is not about teaching non-technical employees to build models. It is about giving them three things: a working mental model of how AI systems generate outputs, a practical understanding of the categories of task where AI is reliable and unreliable, and the judgment to know when to verify, when to trust, and when to escalate.

The mental model piece is often underestimated. Employees who understand that a language model predicts the most probable next token — that it is, in a meaningful sense, generating plausible-sounding text rather than retrieving verified facts — are far better positioned to spot hallucinations and unsupported claims than employees who think of AI as an oracle.

## Building literacy without an IT budget

The most effective AI literacy programmes are not formal training courses. They are structured exposure: regular opportunities for teams to work with AI tools in supervised contexts, discuss what they observed, and build shared intuitions about the tools' behaviour.

A weekly thirty-minute review — where a manager and team look at three examples of AI-assisted work, discuss what the AI got right and wrong, and update their shared understanding — compounds rapidly. Over six months, this kind of deliberate practice produces a team with genuinely sophisticated AI judgment, without a single day of formal training.

## The leadership imperative

AI literacy is ultimately a leadership question because leaders control the norms around AI use in their organisations. If a leader treats AI outputs as authoritative — citing them in meetings without attribution, making decisions on the basis of them without visible scrutiny — the team will do the same. If a leader models critical engagement with AI outputs, the team learns that verification is expected, not exceptional.

The organisations that are building the most durable AI capabilities are the ones whose leaders are the most visible AI practitioners — not because they are technical, but because they are demonstrably thoughtful about when and how to use AI tools.$md$,
  'insight',
  'Leadership',
  'published',
  'building-ai-literacy-across-non-technical-teams',
  '11111111-1111-1111-1111-000000000001',
  false,
  '2026-05-12T09:00:00Z',
  '2026-05-10T10:00:00Z',
  '2026-05-12T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p08
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  author_id, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000008',
  'The Market Forces Reshaping Enterprise AI Spend in 2026',
  'Budget cycles are tightening, vendor consolidation is accelerating, and decision criteria have shifted from capability to proven ROI.',
  $md$Enterprise AI spend is undergoing a structural shift. The experimental phase — characterised by broad pilots, generous evaluation budgets, and tolerance for uncertain ROI — is giving way to something more demanding. Procurement teams, CFOs, and boards are asking harder questions. The market is responding.

Three forces are driving this shift simultaneously: budget discipline returning to enterprise technology after two years of post-pandemic excess, a wave of AI vendor consolidation that is reducing the number of credible options in most categories, and a change in how enterprise buyers evaluate AI products — from capability demonstrations to evidence of measurable business impact.

## The ROI accountability shift

Until recently, AI vendors could successfully sell on the basis of what their technology could do in a demo. The pitch was capability: look what this model can accomplish. Buyers — aware that AI was strategically important but uncertain how to evaluate it — were willing to pay for optionality.

That tolerance is narrowing. Enterprise buyers in 2026 are asking for case studies with specific numbers, references they can actually call, and contractual commitments to performance baselines. Vendors that built their sales motion around possibility are scrambling to retrofit it around proof.

This shift is good for buyers. It is forcing a more honest conversation about what AI systems actually deliver in production environments, as opposed to what they achieve under ideal demo conditions. It is also separating vendors with real customer depth from those that were riding the wave of early-adopter enthusiasm.

## Vendor consolidation dynamics

The AI vendor landscape of 2024 — characterised by hundreds of point solutions across every business function — is consolidating. The consolidation is happening along two axes: platform players are acquiring or displacing category specialists, and enterprise buyers are rationalising their vendor portfolios to reduce integration complexity.

For most enterprise buyers, the implication is that the vendor evaluation landscape will look meaningfully different in eighteen months. Some of the vendors currently offering compelling point solutions will not exist independently. Others will be absorbed into larger platforms where their functionality is one feature among many, with uncertain levels of continued investment.

## What buyers should do now

The organisations navigating this environment most effectively are taking a portfolio approach to AI spend: maintaining a core set of committed investments in vendors with demonstrated durability, while keeping a smaller portion of budget for emerging solutions that have not yet proven their staying power.

The key discipline is not chasing the most capable technology — it is investing in the technology that will still be supported, integrated, and improving in three years. That calculation increasingly favours established vendors with strong enterprise customer bases over newer entrants with superior demos and uncertain commercial trajectories.$md$,
  'article',
  'Market Trends',
  'published',
  'market-forces-reshaping-enterprise-ai-spend',
  '11111111-1111-1111-1111-000000000002',
  false,
  '2026-05-14T09:00:00Z',
  '2026-05-12T10:00:00Z',
  '2026-05-14T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 6. posts — interviews (5 published)
-- ---------------------------------------------------------------------------
--
-- App-layer validation (enforced in server actions, not SQL):
--   content_type = 'interview' → body_markdown NULL, guest_data non-null, qa_data non-null
--
-- p09 featured Leadership   — James Corfield — telegram: pending
-- p10 featured AI Strategy  — Elena Marsh    — telegram: pending
-- p11         Operations    — James Corfield
-- p12         Automation    — Sofia Andersen
-- p13         AI Strategy   — James Corfield
-- ---------------------------------------------------------------------------

-- p09
INSERT INTO posts (
  id, title, excerpt, content_type, topic, status, slug,
  author_id, guest_data, qa_data, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000009',
  'Embedding AI Into Operations Without Disrupting Culture',
  'Meridian Group''s COO on why the biggest risk in AI transformation is not the technology — it is the people you do not bring along.',
  'interview',
  'Leadership',
  'published',
  'sarah-chen-meridian-group-embedding-ai-in-operations',
  '11111111-1111-1111-1111-000000000002',
  $guest${"name": "Sarah Chen", "role": "Chief Operating Officer", "company": "Meridian Group", "bio": "Sarah Chen oversees global operations at Meridian Group, where she led the company's AI integration programme across 12 markets over three years. Before joining Meridian, she held senior operations roles at two Fortune 500 logistics companies."}$guest$::jsonb,
  $qa$[
    {
      "question": "Meridian has been through a significant AI integration over the last three years. What was the hardest thing to get right?",
      "answer": "Honestly, it was not the technology. We spent months agonising over which platforms to choose, which vendors to partner with, and how to sequence the technical work. That was all manageable. The hard part was the people — and specifically, the middle layer of the organisation. Senior leadership was enthusiastic. Frontline teams were curious. It was the managers in the middle who were most uncertain, and they are the ones who either enable or undermine every change you try to make. We did not invest nearly enough in that group early on."
    },
    {
      "question": "How did you eventually approach winning over that middle layer?",
      "answer": "We stopped framing it as an AI programme and started framing it as an operations improvement programme that uses AI. That sounds like a semantic distinction, but it changed the conversation entirely. Managers do not wake up wanting to be part of an AI transformation — they wake up wanting to hit their targets and keep their teams performing. When we showed them specifically how AI tools would help them do that — fewer manual reconciliations, faster exception reporting, more time for the judgment calls they actually find interesting — the resistance dropped significantly. We also made a point of naming the early adopters publicly and letting them tell the story in their own words."
    },
    {
      "question": "Were there areas where AI adoption created genuine friction that you had to work through?",
      "answer": "Yes. One area was anywhere the AI was making recommendations that affected how individual performance was being assessed. Even when the AI was just surfacing information that was already available, people worried it was being used to evaluate them. We had to be very explicit about what the AI data was and was not used for in performance conversations. The other area was quality control. Some teams had built their professional identity around being the people who caught the errors. When an AI started catching those errors faster than they did, it created a real sense of displacement that took time and careful management to work through."
    },
    {
      "question": "Looking back, what would you do differently?",
      "answer": "I would start the change management six months before the technology deployment. We ran them in parallel, which meant the organisational readiness work was always playing catch-up to the technical implementation. By the time we had a working system, we still had teams that were not ready to use it effectively. The other thing I would do differently is be more honest about the fact that the transition period is genuinely harder before it gets easier. We over-communicated the long-term benefits and under-communicated the realistic short-term disruption. That cost us trust when things got difficult."
    },
    {
      "question": "What does AI-enabled operations actually look like at Meridian today, three years in?",
      "answer": "It is less dramatic than the announcements suggested it would be. The operations team is smaller in some areas and larger in others. The work that remains is genuinely more interesting — more judgment-intensive, more strategic, more cross-functional. Our close cycle has shortened significantly, our exception rate is down, and our planning accuracy has improved meaningfully. But the biggest change is less visible: the quality of the conversations we have in leadership meetings is better, because we have better information faster and we spend less time debating what the data says and more time deciding what to do about it."
    }
  ]$qa$::jsonb,
  true,
  '2026-04-15T09:00:00Z',
  '2026-04-12T10:00:00Z',
  '2026-04-15T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p10
INSERT INTO posts (
  id, title, excerpt, content_type, topic, status, slug,
  author_id, guest_data, qa_data, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000010',
  'The Honest Truth About AI ROI in Year One',
  'VantagePoint''s CEO on the metrics that matter, the ones that mislead, and what business leaders should realistically expect in the first twelve months of AI adoption.',
  'interview',
  'AI Strategy',
  'published',
  'michael-torres-vantagepoint-analytics-ai-roi-year-one',
  '11111111-1111-1111-1111-000000000001',
  $guest${"name": "Michael Torres", "role": "Chief Executive Officer", "company": "VantagePoint Analytics", "bio": "Michael Torres founded VantagePoint Analytics in 2019. The firm advises mid-market companies on data strategy and AI implementation across financial services, professional services, and logistics."}$guest$::jsonb,
  $qa$[
    {
      "question": "You spend a lot of time with companies evaluating their first year of AI investment. What is the most common mistake you see in how they measure ROI?",
      "answer": "Measuring activity instead of outcomes. Companies count the number of AI tools deployed, the number of employees trained, the number of use cases piloted. Those are all activity metrics. They tell you how much you did, not whether it worked. The organisations that get disappointed by their year-one ROI are almost always the ones that set activity targets rather than outcome targets. What changed in the business because of this? What decisions are better? What costs are lower? What revenue is higher? Start with those questions."
    },
    {
      "question": "What does a realistic year-one ROI case look like for a mid-market company?",
      "answer": "It is almost never transformational in year one. The realistic expectation is that you identify two or three high-confidence use cases, deploy them properly, and generate returns that justify the cost of the programme while building the capability to do more. That might mean a 15–20% reduction in time spent on a specific process, or a measurable improvement in a data quality metric, or a faster cycle time on something that was previously a bottleneck. Those are not headline numbers. But they are real, they compound, and they build the organisational confidence that enables the next phase."
    },
    {
      "question": "Which metrics do companies over-rely on when evaluating AI performance?",
      "answer": "Model accuracy is the big one. Companies see a 94% accuracy rate and conclude the AI is performing well. But accuracy in isolation is almost meaningless without context. Accurate compared to what baseline? Accurate on what distribution of inputs? What does the 6% error look like, and what is the cost of those errors? I have seen AI systems with 94% accuracy that were creating more problems than they solved, because the 6% errors were concentrated in exactly the high-stakes decisions where accuracy mattered most. Accuracy is a starting point for the conversation, not the answer."
    },
    {
      "question": "How should companies be thinking about the relationship between AI investment and headcount?",
      "answer": "This is where I see the most dishonest conversations happening. The implicit ROI case for a lot of AI programmes is headcount reduction — companies just do not say it out loud. That creates a situation where the people who are supposed to adopt the AI are also the people who understand that the ROI case depends on reducing their roles. It is a poisonous dynamic and it destroys adoption. The companies that generate real returns from AI are the ones that make explicit commitments about what the efficiency gains will be used for. If the AI frees up capacity, what will that capacity do? If you cannot answer that question before deployment, you have not finished designing the programme."
    },
    {
      "question": "What is the single thing you would tell a CEO who is about to kick off their first enterprise AI initiative?",
      "answer": "Decide in advance what success looks like in twelve months, and make it specific enough that you will actually know whether you achieved it. Not 'we want to be an AI-enabled organisation' — that is not a measurement. Something like: we want to reduce time-to-close in our finance function by 20%, or we want our customer service team to handle 30% more volume with the same headcount. Specific, measurable, time-bound. Then resource the programme accordingly. The number of companies that invest significantly in AI without defining specific success criteria — and then cannot evaluate whether it worked — is striking."
    }
  ]$qa$::jsonb,
  true,
  '2026-05-02T09:00:00Z',
  '2026-04-30T10:00:00Z',
  '2026-05-02T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p11
INSERT INTO posts (
  id, title, excerpt, content_type, topic, status, slug,
  author_id, guest_data, qa_data, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000011',
  'How Predictive AI Is Reshaping Supply Chain Decisions',
  'TerraScale Logistics'' COO on moving from reactive reporting to proactive decision-making — and why most operations leaders underestimate the culture shift involved.',
  'interview',
  'Operations',
  'published',
  'priya-kapoor-terrascale-logistics-predictive-operations',
  '11111111-1111-1111-1111-000000000002',
  $guest${"name": "Priya Kapoor", "role": "Chief Operating Officer", "company": "TerraScale Logistics", "bio": "Priya Kapoor leads operations and supply chain strategy at TerraScale Logistics, overseeing a network spanning 40 distribution centres across Europe and Asia. She previously held supply chain leadership roles at two major retail groups."}$guest$::jsonb,
  $qa$[
    {
      "question": "TerraScale has made predictive AI central to its planning function. What problem were you trying to solve when you started?",
      "answer": "We were fundamentally reactive. Our planning cycles were built around historical data that was always at least three days old by the time it reached the people who needed to act on it. By then, the situation had changed. Our operations teams were constantly in firefighting mode — responding to conditions that the data had not yet confirmed. We wanted to get ahead of that. The goal was not to predict the future perfectly; it was to give our planning teams information that was accurate enough and timely enough that they could make proactive decisions rather than reactive ones."
    },
    {
      "question": "How did you approach the build versus buy decision?",
      "answer": "We built the core forecasting capability internally, partnering with a specialist ML team for the first eighteen months. The reason we did not simply buy a solution was that our network is unusual — the combination of routes, customer profiles, and product categories we handle does not map well onto any off-the-shelf demand forecasting product. The generalised models were systematically miscalibrated for our specific context. That said, I want to be honest: building internally is expensive and slow. For a company without our scale and data volume, I would probably recommend finding the best available external solution and customising it rather than building from scratch."
    },
    {
      "question": "What was the culture shift that surprised you most?",
      "answer": "The hardest shift was getting experienced planners to trust the model on the days when it disagreed with their intuition — especially on decisions they had been making successfully for years. These are professionals who have built deep expertise in our network. When the model said something different from what their experience suggested, the natural response was to override it. In the first six months, override rates were very high, which undermined the value of the system. We had to develop a completely new process for when and how overrides were documented, reviewed, and fed back into model improvement. That process is now one of our most valuable sources of model refinement."
    },
    {
      "question": "How do you evaluate whether the predictive system is actually working?",
      "answer": "We track three things primarily. Forecast accuracy at the SKU-location level, compared to our pre-AI baseline. Reaction time — how much earlier in the exception lifecycle are we identifying and addressing problems. And decision confidence, which we measure through a combination of override rates and post-decision reviews. The last one is the hardest to measure but in some ways the most important. If our planners are making decisions faster and with higher confidence, and the outcomes of those decisions are improving, the system is working. If accuracy is high but planners still do not trust it, we have a different kind of problem."
    }
  ]$qa$::jsonb,
  false,
  '2026-04-08T09:00:00Z',
  '2026-04-05T10:00:00Z',
  '2026-04-08T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p12
INSERT INTO posts (
  id, title, excerpt, content_type, topic, status, slug,
  author_id, guest_data, qa_data, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000012',
  'Automating the Analyst: AI''s Role in Modern Finance Teams',
  'Novus Capital''s Head of AI on which finance workflows are ready to automate now, and how to avoid the common mistake of automating the wrong things first.',
  'interview',
  'Automation',
  'published',
  'david-stein-novus-capital-ai-automation-finance',
  '11111111-1111-1111-1111-000000000003',
  $guest${"name": "David Stein", "role": "Head of AI", "company": "Novus Capital", "bio": "David Stein leads AI strategy and implementation at Novus Capital, where he has overseen the automation of core research and reporting functions. He previously led data science teams at two asset management firms."}$guest$::jsonb,
  $qa$[
    {
      "question": "Finance is often cited as one of the functions most exposed to AI automation. Do you think that framing is accurate?",
      "answer": "Partially. There are categories of finance work that are highly automatable today — document processing, data extraction, standardised report generation, reconciliation of structured datasets. Those are real and the automation is happening. But the framing 'finance is exposed to AI automation' conflates several very different kinds of work. The analytical judgment that experienced finance professionals apply — contextualising data, identifying anomalies that matter versus ones that do not, understanding what a number means in the context of a business — that is not automatable in any near-term sense. What is automatable is the time those professionals currently spend doing work that should never have required their judgment in the first place."
    },
    {
      "question": "Walk me through how you approach prioritising which workflows to automate.",
      "answer": "We use two dimensions: frequency and consequence of error. High-frequency, low-consequence-of-error tasks go first. These are the places where automation generates the most volume reduction with the least risk. As you move toward lower frequency and higher consequence, the bar for automation readiness gets higher — you need more validation, more human oversight, more robust exception handling. The mistake I see most often is organisations starting with a high-consequence workflow because it has the most visible cost. That creates a high-stakes test of a capability that is not yet proven in your context. Start where failure is recoverable. Build confidence. Then move up the stack."
    },
    {
      "question": "What does a well-designed human-in-the-loop process look like for finance automation?",
      "answer": "The key design principle is that humans should be reviewing outputs, not inputs. If your automation process requires a human to check every document before the AI processes it, you have not really automated anything — you have just added a step. The human review should happen after the AI has done its work, on the subset of outputs that require judgment. That means the AI needs to be good at identifying which of its own outputs are high-confidence versus uncertain, and routing uncertain cases to human review automatically. Getting that uncertainty quantification right is often the hardest technical problem in finance automation."
    },
    {
      "question": "How has the role of analysts at Novus changed since you began automating research and reporting functions?",
      "answer": "The work is more interesting, which sounds like a platitude but is actually the most important thing that has happened. Our analysts are spending less time extracting and formatting data and more time interpreting it, challenging it, and building the narratives that help our investment professionals make better decisions. The volume of work they can cover has increased substantially. The quality of the analysis has also improved, because they are not cognitively depleted from repetitive data work by the time they get to the part that actually requires their brains. Analyst satisfaction scores have gone up consistently since we made these changes, which was not something I predicted with confidence at the outset."
    }
  ]$qa$::jsonb,
  false,
  '2026-04-29T09:00:00Z',
  '2026-04-27T10:00:00Z',
  '2026-04-29T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p13
INSERT INTO posts (
  id, title, excerpt, content_type, topic, status, slug,
  author_id, guest_data, qa_data, featured, published_at, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000013',
  'Turning AI Strategy Into Execution: What Separates Leaders From Laggards',
  'Brightfield Group''s CEO on the organisational signals that predict whether an AI strategy will move from slide deck to shipped product.',
  'interview',
  'AI Strategy',
  'published',
  'amara-osei-brightfield-group-ai-strategy-execution',
  '11111111-1111-1111-1111-000000000002',
  $guest${"name": "Amara Osei", "role": "Chief Executive Officer", "company": "Brightfield Group", "bio": "Amara Osei co-founded Brightfield Group in 2017 and has since grown it into a 200-person management consultancy specialising in digital and AI transformation. The firm works primarily with mid-market and enterprise clients across financial services, retail, and professional services."}$guest$::jsonb,
  $qa$[
    {
      "question": "You advise companies at every stage of AI strategy. What is the most reliable predictor of whether a company's AI strategy actually gets executed?",
      "answer": "Ownership at the operational level. Not executive sponsorship — that is necessary but not sufficient. The companies that execute are the ones where someone in the business — not in IT, not in a central transformation office — is accountable for the specific outcome the AI initiative is supposed to produce. When I see an AI strategy that is owned by a chief digital officer or a technology function without a clear operational counterpart who is accountable for the business result, I can predict with reasonable confidence that the initiative will produce a lot of activity and limited business impact."
    },
    {
      "question": "What organisational signals do you look for when assessing a client's readiness to execute on AI?",
      "answer": "Three things. First, does the leadership team have a shared, specific definition of what success looks like — not 'we want to be an AI company' but 'we want to reduce decision cycle time in underwriting by 40% within eighteen months.' Second, do the people who will use the AI system understand why it is being implemented and what it will change about their work. Third, does the organisation have a track record of completing technology initiatives — any technology initiatives — on time and on scope. Companies that have not learned to execute conventional technology programmes do not suddenly learn to execute AI programmes. The underlying capability requirements are the same."
    },
    {
      "question": "Where do you see AI strategies stalling most often between design and delivery?",
      "answer": "At the data layer, consistently. Companies design ambitious AI strategies and then discover that the data their AI initiative requires does not exist in usable form, is distributed across systems that do not talk to each other, or is of a quality that would make any model built on it unreliable. This is almost always a surprise, which tells you that the strategy design process did not include a rigorous data assessment. Every AI strategy should start with a data audit. Not a high-level inventory — an actual assessment of whether the data you need exists, where it lives, what its quality is, and what it would take to make it usable."
    },
    {
      "question": "Is there a meaningful difference in how AI-forward companies are structured versus their peers?",
      "answer": "Yes, and it is less about org chart structure and more about decision rights. The companies that execute on AI fastest have made explicit decisions about who can approve what kinds of AI deployment, at what risk level, with what oversight. That clarity eliminates a huge amount of the friction that slows execution in organisations where every AI initiative requires bespoke approval processes. The second structural difference is that the leading companies have integrated AI capability into existing teams rather than building separate AI centres of excellence. The CoE model made sense in 2022 when AI expertise was scarce. In 2026, it is more often a bottleneck than an accelerant."
    },
    {
      "question": "What advice would you give to a business leader who feels like their AI strategy is stuck?",
      "answer": "Diagnose before you prescribe. Most stuck AI strategies are stuck for one of three reasons: a data problem, an ownership problem, or a capability problem. The intervention looks completely different depending on which one you have. If it is a data problem, no amount of leadership alignment will fix it — you need to invest in data infrastructure. If it is an ownership problem, reorganising around it is more useful than hiring. If it is a capability problem, you are probably trying to build something before your team knows how to build it. Take the time to accurately diagnose the constraint, because the most common mistake is applying the wrong solution with great energy."
    }
  ]$qa$::jsonb,
  false,
  '2026-05-08T09:00:00Z',
  '2026-05-06T10:00:00Z',
  '2026-05-08T09:00:00Z'
) ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 7. posts — admin testing (draft / review)
-- ---------------------------------------------------------------------------
--
-- p14 (review) — CFO AI Budgeting; promoted from approved draft d3
-- p15 (draft)  — AI Hallucinations; created from review draft d1
-- No published_at: neither is live yet.
-- author_id NULL: not yet assigned to an editor.
-- ---------------------------------------------------------------------------

-- p14
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  draft_id, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000014',
  'What CFOs Need to Know About AI Budgeting in 2026',
  'The first wave of enterprise AI spend was exploratory. The second wave is being held to capital allocation standards.',
  $md$## The Shift from Exploration to Accountability

The first wave of enterprise AI investment operated under different rules. Boards tolerated exploratory spend because AI was novel and the competitive stakes felt high. That era is over.

## What Scrutiny Looks Like Now

CFOs are now asking the same questions of AI programmes they ask of any other capital deployment: What is the payback period? What assumptions underpin the projected ROI? What happens if adoption stalls at 40% of the workforce? Most AI vendors and internal champions are not ready for these questions.

## How to Get AI Investment Ready for Finance Review

The AI programmes most likely to survive budget review have separated infrastructure spend from programme spend, built clear adoption metrics, and tied financial outcomes to workflow changes rather than tool usage.$md$,
  'article',
  'Market Trends',
  'review',
  'cfos-ai-budgeting-2026',
  '33333333-3333-3333-3333-000000000003',
  '2026-05-21T10:00:00Z',
  '2026-05-21T10:00:00Z'
) ON CONFLICT (slug) DO NOTHING;

-- p15
INSERT INTO posts (
  id, title, excerpt, body_markdown, content_type, topic, status, slug,
  draft_id, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-000000000015',
  'The Real Cost of AI Hallucinations in Enterprise Workflows',
  'When AI models produce confident but incorrect outputs, the cost compounds through decisions made downstream.',
  $md$## The Hidden Multiplier

When an AI model outputs a hallucinated figure in a financial report, the cost is not just one corrected cell. It is the hours spent auditing the broader analysis, the meetings triggered by the error, and the erosion of trust in the tool itself. In enterprise workflows, hallucinations compound.

## Why Enterprise Exposure Is Different

Consumer-facing hallucinations are embarrassing. Enterprise hallucinations are consequential. When AI is embedded into compliance workflows, supply chain decisions, or client-facing documents, a confident but wrong output does not stay contained — it propagates downstream before anyone catches it.

## What High-Reliability Organisations Are Doing

The teams deploying AI successfully in high-stakes contexts treat AI outputs as inputs to human judgment, not replacements for it. They build review checkpoints into workflows specifically designed to catch errors before they propagate.$md$,
  'insight',
  'AI Strategy',
  'draft',
  'real-cost-ai-hallucinations-enterprise',
  '33333333-3333-3333-3333-000000000001',
  '2026-05-21T11:30:00Z',
  '2026-05-21T11:30:00Z'
) ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 8. distribution_jobs
-- ---------------------------------------------------------------------------
--
-- One row per channel per post. Telegram only for now.
-- sent_at matches the post's published_at for sent jobs.
-- metadata stores the fictional Telegram message ID.
--
-- dj01 — p01 (ai-strategy-fails)           telegram  sent
-- dj02 — p02 (automating-the-middle)        telegram  sent
-- dj03 — p03 (what-market-leaders)          telegram  ready
-- dj04 — p04 (managers-guide)               telegram  sent
-- dj05 — p05 (inside-ai-pilot)              telegram  sent
-- dj06 — p09 (sarah-chen interview)         telegram  pending
-- dj07 — p10 (michael-torres interview)     telegram  pending
-- ---------------------------------------------------------------------------

INSERT INTO distribution_jobs (
  id, post_id, channel, status, sent_at, metadata, created_at, updated_at
)
VALUES
  (
    '66666666-6666-6666-6666-000000000001',
    '44444444-4444-4444-4444-000000000001',
    'telegram',
    'sent',
    '2026-04-28T09:30:00Z',
    '{"telegram_message_id": 10001}'::jsonb,
    '2026-04-28T09:00:00Z',
    '2026-04-28T09:30:00Z'
  ),
  (
    '66666666-6666-6666-6666-000000000002',
    '44444444-4444-4444-4444-000000000002',
    'telegram',
    'sent',
    '2026-05-05T09:30:00Z',
    '{"telegram_message_id": 10002}'::jsonb,
    '2026-05-05T09:00:00Z',
    '2026-05-05T09:30:00Z'
  ),
  (
    '66666666-6666-6666-6666-000000000003',
    '44444444-4444-4444-4444-000000000003',
    'telegram',
    'ready',
    NULL,
    NULL,
    '2026-05-09T09:00:00Z',
    '2026-05-09T09:00:00Z'
  ),
  (
    '66666666-6666-6666-6666-000000000004',
    '44444444-4444-4444-4444-000000000004',
    'telegram',
    'sent',
    '2026-05-01T09:30:00Z',
    '{"telegram_message_id": 10004}'::jsonb,
    '2026-05-01T09:00:00Z',
    '2026-05-01T09:30:00Z'
  ),
  (
    '66666666-6666-6666-6666-000000000005',
    '44444444-4444-4444-4444-000000000005',
    'telegram',
    'sent',
    '2026-04-22T09:30:00Z',
    '{"telegram_message_id": 10005}'::jsonb,
    '2026-04-22T09:00:00Z',
    '2026-04-22T09:30:00Z'
  ),
  (
    '66666666-6666-6666-6666-000000000006',
    '44444444-4444-4444-4444-000000000009',
    'telegram',
    'pending',
    NULL,
    NULL,
    '2026-04-15T09:00:00Z',
    '2026-04-15T09:00:00Z'
  ),
  (
    '66666666-6666-6666-6666-000000000007',
    '44444444-4444-4444-4444-000000000010',
    'telegram',
    'pending',
    NULL,
    NULL,
    '2026-05-02T09:00:00Z',
    '2026-05-02T09:00:00Z'
  )
ON CONFLICT (post_id, channel) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 9. inquiries
-- ---------------------------------------------------------------------------
-- Fictional consultation requests — no real personal data.
-- ---------------------------------------------------------------------------

INSERT INTO inquiries (id, full_name, email, company, role, message, status, created_at)
VALUES
  (
    '77777777-7777-7777-7777-000000000001',
    'Daniel Park',
    'daniel.park@nexuspartners.com',
    'Nexus Partners',
    'Finance Director',
    'We are a 400-person professional services firm planning our first enterprise AI initiative in the finance function. We have read your case study on Meridian Group and it resonates closely with our situation. We would like to discuss whether BizInsight could advise on our programme design and change management approach.',
    'new',
    '2026-05-20T14:22:00Z'
  ),
  (
    '77777777-7777-7777-7777-000000000002',
    'Rachel Okafor',
    'r.okafor@verraconsulting.co',
    'Verra Consulting',
    'Chief Operating Officer',
    'We are evaluating AI automation options for our operations team and struggling with the sequencing question — which workflows to start with and how to build internal confidence before expanding. Your piece on middle-office automation was exactly the framing we needed. I would like to explore whether your team could support our assessment.',
    'read',
    '2026-05-21T08:45:00Z'
  )
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- End of seed.sql
-- =============================================================================
