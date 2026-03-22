import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { BRAND } from "@/config/brand"
import ContentHeader from "@/components/content/ContentHeader"
import InterviewBody from "@/components/content/InterviewBody"
import type { Interview } from "@/types"

// ─── Mock data ────────────────────────────────────────────────────────────────

const interviews: Interview[] = [
  {
    slug: "sarah-chen-meridian-group-embedding-ai-in-operations",
    title: "Embedding AI Into Operations Without Disrupting Culture",
    excerpt:
      "Meridian Group's COO on why the biggest risk in AI transformation is not the technology — it is the people you do not bring along.",
    topic: "Leadership",
    publishedAt: "2026-04-15",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    guest: {
      name: "Sarah Chen",
      role: "Chief Operating Officer",
      company: "Meridian Group",
      bio: "Sarah Chen oversees global operations at Meridian Group, where she led the company's AI integration programme across 12 markets over three years. Before joining Meridian, she held senior operations roles at two Fortune 500 logistics companies.",
    },
    qa: [
      {
        question:
          "Meridian has been through a significant AI integration over the last three years. What was the hardest thing to get right?",
        answer:
          "Honestly, it was not the technology. We spent months agonising over which platforms to choose, which vendors to partner with, and how to sequence the technical work. That was all manageable. The hard part was the people — and specifically, the middle layer of the organisation. Senior leadership was enthusiastic. Frontline teams were curious. It was the managers in the middle who were most uncertain, and they are the ones who either enable or undermine every change you try to make. We did not invest nearly enough in that group early on.",
      },
      {
        question:
          "How did you eventually approach winning over that middle layer?",
        answer:
          "We stopped framing it as an AI programme and started framing it as an operations improvement programme that uses AI. That sounds like a semantic distinction, but it changed the conversation entirely. Managers do not wake up wanting to be part of an AI transformation — they wake up wanting to hit their targets and keep their teams performing. When we showed them specifically how AI tools would help them do that — fewer manual reconciliations, faster exception reporting, more time for the judgment calls they actually find interesting — the resistance dropped significantly. We also made a point of naming the early adopters publicly and letting them tell the story in their own words.",
      },
      {
        question:
          "Were there areas where AI adoption created genuine friction that you had to work through?",
        answer:
          "Yes. One area was anywhere the AI was making recommendations that affected how individual performance was being assessed. Even when the AI was just surfacing information that was already available, people worried it was being used to evaluate them. We had to be very explicit about what the AI data was and was not used for in performance conversations. The other area was quality control. Some teams had built their professional identity around being the people who caught the errors. When an AI started catching those errors faster than they did, it created a real sense of displacement that took time and careful management to work through.",
      },
      {
        question:
          "Looking back, what would you do differently?",
        answer:
          "I would start the change management six months before the technology deployment. We ran them in parallel, which meant the organisational readiness work was always playing catch-up to the technical implementation. By the time we had a working system, we still had teams that were not ready to use it effectively. The other thing I would do differently is be more honest about the fact that the transition period is genuinely harder before it gets easier. We over-communicated the long-term benefits and under-communicated the realistic short-term disruption. That cost us trust when things got difficult.",
      },
      {
        question:
          "What does AI-enabled operations actually look like at Meridian today, three years in?",
        answer:
          "It is less dramatic than the announcements suggested it would be. The operations team is smaller in some areas and larger in others. The work that remains is genuinely more interesting — more judgment-intensive, more strategic, more cross-functional. Our close cycle has shortened significantly, our exception rate is down, and our planning accuracy has improved meaningfully. But the biggest change is less visible: the quality of the conversations we have in leadership meetings is better, because we have better information faster and we spend less time debating what the data says and more time deciding what to do about it.",
      },
    ],
  },
  {
    slug: "michael-torres-vantagepoint-analytics-ai-roi-year-one",
    title: "The Honest Truth About AI ROI in Year One",
    excerpt:
      "VantagePoint's CEO on the metrics that matter, the ones that mislead, and what leaders should realistically expect in the first twelve months of AI adoption.",
    topic: "AI Strategy",
    publishedAt: "2026-05-02",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    guest: {
      name: "Michael Torres",
      role: "Chief Executive Officer",
      company: "VantagePoint Analytics",
      bio: "Michael Torres founded VantagePoint Analytics in 2019. The firm advises mid-market companies on data strategy and AI implementation across financial services, professional services, and logistics.",
    },
    qa: [
      {
        question:
          "You spend a lot of time with companies evaluating their first year of AI investment. What is the most common mistake you see in how they measure ROI?",
        answer:
          "Measuring activity instead of outcomes. Companies count the number of AI tools deployed, the number of employees trained, the number of use cases piloted. Those are all activity metrics. They tell you how much you did, not whether it worked. The organisations that get disappointed by their year-one ROI are almost always the ones that set activity targets rather than outcome targets. What changed in the business because of this? What decisions are better? What costs are lower? What revenue is higher? Start with those questions.",
      },
      {
        question:
          "What does a realistic year-one ROI case look like for a mid-market company?",
        answer:
          "It is almost never transformational in year one. The realistic expectation is that you identify two or three high-confidence use cases, deploy them properly, and generate returns that justify the cost of the programme while building the capability to do more. That might mean a 15-20% reduction in time spent on a specific process, or a measurable improvement in a data quality metric, or a faster cycle time on something that was previously a bottleneck. Those are not headline numbers. But they are real, they compound, and they build the organisational confidence that enables the next phase.",
      },
      {
        question:
          "Which metrics do companies over-rely on when evaluating AI performance?",
        answer:
          "Model accuracy is the big one. Companies see a 94% accuracy rate and conclude the AI is performing well. But accuracy in isolation is almost meaningless without context. Accurate compared to what baseline? Accurate on what distribution of inputs? What does the 6% error look like, and what is the cost of those errors? I have seen AI systems with 94% accuracy that were creating more problems than they solved, because the 6% errors were concentrated in exactly the high-stakes decisions where accuracy mattered most. Accuracy is a starting point for the conversation, not the answer.",
      },
      {
        question:
          "How should companies be thinking about the relationship between AI investment and headcount?",
        answer:
          "This is where I see the most dishonest conversations happening. The implicit ROI case for a lot of AI programmes is headcount reduction — companies just do not say it out loud. That creates a situation where the people who are supposed to adopt the AI are also the people who understand that the ROI case depends on reducing their roles. It is a poisonous dynamic and it destroys adoption. The companies that generate real returns from AI are the ones that make explicit commitments about what the efficiency gains will be used for. If the AI frees up capacity, what will that capacity do? If you cannot answer that question before deployment, you have not finished designing the programme.",
      },
      {
        question:
          "What is the single thing you would tell a CEO who is about to kick off their first enterprise AI initiative?",
        answer:
          "Decide in advance what success looks like in twelve months, and make it specific enough that you will actually know whether you achieved it. Not 'we want to be an AI-enabled organisation' — that is not a measurement. Something like: we want to reduce time-to-close in our finance function by 20%, or we want our customer service team to handle 30% more volume with the same headcount. Specific, measurable, time-bound. Then resource the programme accordingly. The number of companies that invest significantly in AI without defining specific success criteria — and then cannot evaluate whether it worked — is striking.",
      },
    ],
  },
  {
    slug: "priya-kapoor-terrascale-logistics-predictive-operations",
    title: "How Predictive AI Is Reshaping Supply Chain Decisions",
    excerpt:
      "TerraScale Logistics' COO on moving from reactive reporting to proactive decision-making — and why most operations leaders underestimate the culture shift involved.",
    topic: "Operations",
    publishedAt: "2026-04-08",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    guest: {
      name: "Priya Kapoor",
      role: "Chief Operating Officer",
      company: "TerraScale Logistics",
      bio: "Priya Kapoor leads operations and supply chain strategy at TerraScale Logistics, overseeing a network spanning 40 distribution centres across Europe and Asia. She previously held supply chain leadership roles at two major retail groups.",
    },
    qa: [
      {
        question:
          "TerraScale has made predictive AI central to its planning function. What problem were you trying to solve when you started?",
        answer:
          "We were fundamentally reactive. Our planning cycles were built around historical data that was always at least three days old by the time it reached the people who needed to act on it. By then, the situation had changed. Our operations teams were constantly in firefighting mode — responding to conditions that the data had not yet confirmed. We wanted to get ahead of that. The goal was not to predict the future perfectly; it was to give our planning teams information that was accurate enough and timely enough that they could make proactive decisions rather than reactive ones.",
      },
      {
        question:
          "How did you approach the build versus buy decision?",
        answer:
          "We built the core forecasting capability internally, partnering with a specialist ML team for the first eighteen months. The reason we did not simply buy a solution was that our network is unusual — the combination of routes, customer profiles, and product categories we handle does not map well onto any off-the-shelf demand forecasting product. The generalised models were systematically miscalibrated for our specific context. That said, I want to be honest: building internally is expensive and slow. For a company without our scale and data volume, I would probably recommend finding the best available external solution and customising it rather than building from scratch.",
      },
      {
        question:
          "What was the culture shift that surprised you most?",
        answer:
          "The hardest shift was getting experienced planners to trust the model on the days when it disagreed with their intuition — especially on decisions they had been making successfully for years. These are professionals who have built deep expertise in our network. When the model said something different from what their experience suggested, the natural response was to override it. In the first six months, override rates were very high, which undermined the value of the system. We had to develop a completely new process for when and how overrides were documented, reviewed, and fed back into model improvement. That process is now one of our most valuable sources of model refinement.",
      },
      {
        question:
          "How do you evaluate whether the predictive system is actually working?",
        answer:
          "We track three things primarily. Forecast accuracy at the SKU-location level, compared to our pre-AI baseline. Reaction time — how much earlier in the exception lifecycle are we identifying and addressing problems. And decision confidence, which we measure through a combination of override rates and post-decision reviews. The last one is the hardest to measure but in some ways the most important. If our planners are making decisions faster and with higher confidence, and the outcomes of those decisions are improving, the system is working. If accuracy is high but planners still do not trust it, we have a different kind of problem.",
      },
    ],
  },
  {
    slug: "david-stein-novus-capital-ai-automation-finance",
    title: "Automating the Analyst: AI's Role in Modern Finance Teams",
    excerpt:
      "Novus Capital's Head of AI on which finance workflows are ready to automate now, and how to avoid the common mistake of automating the wrong things first.",
    topic: "Automation",
    publishedAt: "2026-04-29",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    guest: {
      name: "David Stein",
      role: "Head of AI",
      company: "Novus Capital",
      bio: "David Stein leads AI strategy and implementation at Novus Capital, where he has overseen the automation of core research and reporting functions. He previously led data science teams at two asset management firms.",
    },
    qa: [
      {
        question:
          "Finance is often cited as one of the functions most exposed to AI automation. Do you think that framing is accurate?",
        answer:
          "Partially. There are categories of finance work that are highly automatable today — document processing, data extraction, standardised report generation, reconciliation of structured datasets. Those are real and the automation is happening. But the framing 'finance is exposed to AI automation' conflates several very different kinds of work. The analytical judgment that experienced finance professionals apply — contextualising data, identifying anomalies that matter versus ones that do not, understanding what a number means in the context of a business — that is not automatable in any near-term sense. What is automatable is the time those professionals currently spend doing work that should never have required their judgment in the first place.",
      },
      {
        question:
          "Walk me through how you approach prioritising which workflows to automate.",
        answer:
          "We use two dimensions: frequency and consequence of error. High-frequency, low-consequence-of-error tasks go first. These are the places where automation generates the most volume reduction with the least risk. As you move toward lower frequency and higher consequence, the bar for automation readiness gets higher — you need more validation, more human oversight, more robust exception handling. The mistake I see most often is organisations starting with a high-consequence workflow because it has the most visible cost. That creates a high-stakes test of a capability that is not yet proven in your context. Start where failure is recoverable. Build confidence. Then move up the stack.",
      },
      {
        question:
          "What does a well-designed human-in-the-loop process look like for finance automation?",
        answer:
          "The key design principle is that humans should be reviewing outputs, not inputs. If your automation process requires a human to check every document before the AI processes it, you have not really automated anything — you have just added a step. The human review should happen after the AI has done its work, on the subset of outputs that require judgment. That means the AI needs to be good at identifying which of its own outputs are high-confidence versus uncertain, and routing uncertain cases to human review automatically. Getting that uncertainty quantification right is often the hardest technical problem in finance automation.",
      },
      {
        question:
          "How has the role of analysts at Novus changed since you began automating research and reporting functions?",
        answer:
          "The work is more interesting, which sounds like a platitude but is actually the most important thing that has happened. Our analysts are spending less time extracting and formatting data and more time interpreting it, challenging it, and building the narratives that help our investment professionals make better decisions. The volume of work they can cover has increased substantially. The quality of the analysis has also improved, because they are not cognitively depleted from repetitive data work by the time they get to the part that actually requires their brains. Analyst satisfaction scores have gone up consistently since we made these changes, which was not something I predicted with confidence at the outset.",
      },
    ],
  },
  {
    slug: "amara-osei-brightfield-group-ai-strategy-execution",
    title: "Turning AI Strategy Into Execution: What Separates Leaders From Laggards",
    excerpt:
      "Brightfield Group's CEO on the organisational signals that predict whether an AI strategy will move from slide deck to shipped product.",
    topic: "AI Strategy",
    publishedAt: "2026-05-08",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    guest: {
      name: "Amara Osei",
      role: "Chief Executive Officer",
      company: "Brightfield Group",
      bio: "Amara Osei co-founded Brightfield Group in 2017 and has since grown it into a 200-person management consultancy specialising in digital and AI transformation. The firm works primarily with mid-market and enterprise clients across financial services, retail, and professional services.",
    },
    qa: [
      {
        question:
          "You advise companies at every stage of AI strategy. What is the most reliable predictor of whether a company's AI strategy actually gets executed?",
        answer:
          "Ownership at the operational level. Not executive sponsorship — that is necessary but not sufficient. The companies that execute are the ones where someone in the business — not in IT, not in a central transformation office — is accountable for the specific outcome the AI initiative is supposed to produce. When I see an AI strategy that is owned by a chief digital officer or a technology function without a clear operational counterpart who is accountable for the business result, I can predict with reasonable confidence that the initiative will produce a lot of activity and limited business impact.",
      },
      {
        question:
          "What organisational signals do you look for when assessing a client's readiness to execute on AI?",
        answer:
          "Three things. First, does the leadership team have a shared, specific definition of what success looks like — not 'we want to be an AI company' but 'we want to reduce decision cycle time in underwriting by 40% within eighteen months.' Second, do the people who will use the AI system understand why it is being implemented and what it will change about their work. Third, does the organisation have a track record of completing technology initiatives — any technology initiatives — on time and on scope. Companies that have not learned to execute conventional technology programmes do not suddenly learn to execute AI programmes. The underlying capability requirements are the same.",
      },
      {
        question:
          "Where do you see AI strategies stalling most often between design and delivery?",
        answer:
          "At the data layer, consistently. Companies design ambitious AI strategies and then discover that the data their AI initiative requires does not exist in usable form, is distributed across systems that do not talk to each other, or is of a quality that would make any model built on it unreliable. This is almost always a surprise, which tells you that the strategy design process did not include a rigorous data assessment. Every AI strategy should start with a data audit. Not a high-level inventory — an actual assessment of whether the data you need exists, where it lives, what its quality is, and what it would take to make it usable.",
      },
      {
        question:
          "Is there a meaningful difference in how AI-forward companies are structured versus their peers?",
        answer:
          "Yes, and it is less about org chart structure and more about decision rights. The companies that execute on AI fastest have made explicit decisions about who can approve what kinds of AI deployment, at what risk level, with what oversight. That clarity eliminates a huge amount of the friction that slows execution in organisations where every AI initiative requires bespoke approval processes. The second structural difference is that the leading companies have integrated AI capability into existing teams rather than building separate AI centres of excellence. The CoE model made sense in 2022 when AI expertise was scarce. In 2026, it is more often a bottleneck than an accelerant.",
      },
      {
        question:
          "What advice would you give to a business leader who feels like their AI strategy is stuck?",
        answer:
          "Diagnose before you prescribe. Most stuck AI strategies are stuck for one of three reasons: a data problem, an ownership problem, or a capability problem. The intervention looks completely different depending on which one you have. If it is a data problem, no amount of leadership alignment will fix it — you need to invest in data infrastructure. If it is an ownership problem, reorganising around it is more useful than hiring. If it is a capability problem, you are probably trying to build something before your team knows how to build it. Take the time to accurately diagnose the constraint, because the most common mistake is applying the wrong solution with great energy.",
      },
    ],
  },
]

const interviewsBySlug = Object.fromEntries(interviews.map((i) => [i.slug, i]))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const interview = interviewsBySlug[slug]
  if (!interview) return { title: `Not Found — ${BRAND.name}` }
  return {
    title: `${interview.title} — ${BRAND.name}`,
    description: interview.excerpt,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const interview = interviewsBySlug[slug]

  if (!interview) notFound()

  const { guest } = interview

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">

        {/* Back link */}
        <Link
          href="/interviews"
          className="mb-10 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <span aria-hidden="true">←</span>
          All Interviews
        </Link>

        {/* Header: topic, title, date */}
        <ContentHeader
          topic={interview.topic}
          title={interview.title}
          publishedAt={interview.publishedAt}
        />

        {/* Guest block */}
        <div className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
            In this interview
          </p>
          <div className="flex items-start gap-4">
            {/* Initials avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold tracking-wide text-zinc-300">
              {getInitials(guest.name)}
            </div>

            <div className="min-w-0">
              <p className="text-base font-semibold text-white">{guest.name}</p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {guest.role}
                <span aria-hidden="true" className="mx-2 text-zinc-700">·</span>
                {guest.company}
              </p>
              {guest.bio && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {guest.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-10 border-t border-zinc-800/60" />

        {/* Q&A body */}
        <InterviewBody qa={interview.qa} />

      </div>
    </div>
  )
}
