/**
 * Every word on /founders comes from the "Nubble positioning" document
 * (https://claude.ai/artifact/Uc92qQuL5XHTB8qfZqMUBA) or from a real, linked source.
 * The example run for pokpok.ai was done by hand on 31 Oct 2026, the way Nubble does it.
 * Nothing here is invented: if you change a fact, change its link too.
 */

export const CONTACT = "ceo@pokpok.ai";

export type Label = "code-red" | "weakened" | "worth-knowing";

export const LABELS: Record<Label, { name: string; meaning: string }> = {
  "code-red": { name: "Code red", meaning: "A rival copied your main claim or shipped your product." },
  weakened: { name: "Weakened", meaning: "One of your claims is now less true." },
  "worth-knowing": { name: "Worth knowing", meaning: "Relevant, nothing to do." },
};

export interface BriefStory {
  label: Label;
  title: string;
  quote: string;
  source: string;
  date: string;
  url: string;
  soWhat: string;
  move?: string;
}

const PEEC_AGENT_URL =
  "https://www.globenewswire.com/news-release/2026/10/22/3386740/0/en/peec-ai-launches-peec-agent-and-expands-actions-so-marketing-teams-can-act-on-what-ai-search-says-about-their-brand.html";

export const BRIEF: BriefStory[] = [
  {
    label: "code-red",
    title: "Peec AI: “Introducing brand perception”",
    quote: "It's how AI describes you that matters.",
    source: "Peec AI blog",
    date: "16 Sep 2026",
    url: "https://peec.ai/blog/introducing-brand-perception",
    soWhat: "A rival now uses your main claim, word for word.",
    move: "Check whether they ask real people or only AI answers. If only AI, say so on your comparison page this week.",
  },
  {
    label: "weakened",
    title: "Peec AI launches Peec Agent and Actions",
    quote: "Ranks the changes worth making by likely impact, shows the evidence behind each one.",
    source: "Peec AI press release",
    date: "22 Oct 2026",
    url: PEEC_AGENT_URL,
    soWhat:
      "Your comparison table says trackers only partly tell a brand what to fix first. Since 22 October, Peec does it, with evidence.",
    move: "Fix that row before a buyer checks it. Lead with the row trackers still mark No: people and AI read on the same 17 markers.",
  },
  {
    label: "worth-knowing",
    title: "Profound raises $180M at a $1.8B valuation",
    quote: "A $180 million Series D at a $1.8 billion valuation, co-led by Sequoia Capital and Kleiner Perkins.",
    source: "Profound newsroom",
    date: "15 Sep 2026",
    url: "https://www.tryprofound.com/newsroom/profound-raises-usd180m-series-d-at-usd1-8b-valuation-to-build-the-ai-platform-for-marketing-teams",
    soWhat:
      "Big money says AI changes how brands get found. That is your “why now” slide, with a date. No change needed.",
  },
];

export interface RunItem {
  date: string;
  title: string;
  url: string;
  kept?: Label;
}

/** The 12 rival posts read for the example run, oldest first. */
export const RUN: RunItem[] = [
  { date: "15 Sep", title: "Profound raises $180M Series D", url: BRIEF[2].url, kept: "worth-knowing" },
  {
    date: "15 Sep",
    title: "Profound and Estée Lauder partnership",
    url: "https://www.tryprofound.com/newsroom/the-estee-lauder-companies-announces-partnership-with-profound-to-expand-ai-visibility-across-its-global-brand-portfolio",
  },
  { date: "16 Sep", title: "Peec: Introducing brand perception", url: BRIEF[0].url, kept: "code-red" },
  {
    date: "23 Sep",
    title: "Peec supports Meta's Muse Spark",
    url: "https://www.globenewswire.com/news-release/2026/09/23/3367739/0/en/peec-ai-adds-coverage-for-meta-s-muse-extending-visibility-monitoring-to-personal-ai-agents.html",
  },
  { date: "29 Sep", title: "Peec: The key to prompt tracking", url: "https://peec.ai/blog/the-key-to-prompt-tracking" },
  { date: "1 Oct", title: "Profound Partner Kickoff", url: "https://www.tryprofound.com/events/partner-kickoff-2026" },
  {
    date: "13 Oct",
    title: "Peec opens a New York office",
    url: "https://www.globenewswire.com/news-release/2026/10/13/3380015/0/en/peec-ai-named-fastest-growing-aeo-vendor-by-ramp-expands-north-american-footprint-with-new-york-office.html",
  },
  {
    date: "14 Oct",
    title: "Peec: Introducing Views dashboards",
    url: "https://peec.ai/blog/introducing-views-a-custom-dashboards-ready-to-share",
  },
  {
    date: "14 Oct",
    title: "Semrush 2026 AI Visibility Index",
    url: "https://martech.org/your-ai-visibility-score-may-be-hiding-a-problem/",
  },
  {
    date: "20 Oct",
    title: "Profound and Bazaarvoice partnership",
    url: "https://www.tryprofound.com/newsroom/bazaarvoice-and-profound-partner-to-help-brands-drive-optimal-ugc-strategies-for-ai-search-visibility-and-measurement",
  },
  { date: "22 Oct", title: "Peec launches Peec Agent and Actions", url: PEEC_AGENT_URL, kept: "weakened" },
  {
    date: "30 Oct",
    title: "Peec completes SOC 2 Type II",
    url: "https://www.globenewswire.com/news-release/2026/10/30/3392635/0/en/peec-ai-completes-soc-2-type-ii-examination-making-its-ai-search-visibility-platform-fully-enterprise-ready.html",
  },
];

/** What Nubble read from pokpok.ai (homepage, 31 Oct 2026). */
export const PROFILE = {
  site: "pokpok.ai",
  rows: [
    {
      k: "Sells",
      v: "Brand Perception Truth (€150), Brand Alignment Truth (€150), Category Perception Truth (from €1,650), AI Visibility Truth (from €50 a month)",
    },
    { k: "Who buys", v: "DTC founders and e-commerce teams, enterprise brand teams, agencies" },
    { k: "Market", v: "“The Brand Perception OS”" },
    { k: "Main claim", v: "“Every brand is now read twice. By people and by AI.”" },
  ],
  competitors: [
    { name: "Peec AI", foundAt: "zapier.com", url: "https://zapier.com/blog/best-ai-visibility-tool/" },
    { name: "Profound", foundAt: "brainlabsdigital.com", url: "https://www.brainlabsdigital.com/the-10-best-tools-for-tracking-ai-visibility/" },
    { name: "Otterly.AI", foundAt: "zapier.com", url: "https://zapier.com/blog/best-ai-visibility-tool/" },
    { name: "Scrunch AI", foundAt: "brainlabsdigital.com", url: "https://www.brainlabsdigital.com/the-10-best-tools-for-tracking-ai-visibility/" },
    { name: "Ahrefs Brand Radar", foundAt: "visible.seranking.com", url: "https://visible.seranking.com/blog/best-ai-visibility-tools/" },
    { name: "Semrush AI Visibility Toolkit", foundAt: "visible.seranking.com", url: "https://visible.seranking.com/blog/best-ai-visibility-tools/" },
  ],
};

export const PAINS = [
  {
    group: "Investor question",
    head: "An investor asks: how are you protected from competitors?",
    body: "You answer from memory. Who moved, who copied what, what is still only yours. You have an opinion. You have no dates and no links. The investor hears a story.",
  },
  {
    group: "Investor question",
    head: "An investor asks: what is your moat?",
    body: "Your moat is the thing rivals cannot copy, the reason customers stay with you. The only proof of a moat is a list of rivals who tried and failed. Nobody kept that list, so the slide is a guess.",
  },
  {
    group: "Investor question",
    head: "An investor asks: where is this industry going?",
    body: "They want the timeline of your market with dates: who launched what, who raised, who changed prices. Every fundraising deck has a slide that says why this is the moment. Most of them are written from memory the night before.",
  },
  {
    label: "code-red" as Label,
    head: "A rival copies your main claim and nobody tells you.",
    body: "Peec added “brand perception” to its page. That was POKPOK's main difference. Overnight it was two companies saying the same sentence. You do not read competitor websites every day. Buyers do, and they compare side by side. You find out when a deal goes quiet.",
    proof: { text: "Peec's post, 16 Sep 2026", url: "https://peec.ai/blog/introducing-brand-perception" },
  },
  {
    head: "Your story goes stale while you are busy.",
    body: "A year ago your homepage said something only you said. Today three rivals say it too, and you are still pitching the old line, because nobody told you it stopped being yours. You need to know the day it happens, and what to say instead. Nubble reads what every rival promises, so it can also show you the promise none of them make. That is where your niche is.",
  },
  {
    head: "A lab ships your paid feature for free.",
    body: "It happens in one afternoon. This spring DeepSeek's cheap open models wiped out the margins of startups that resold OpenAI's model with a chat window on top. If you learn it three days later on X, you spent three days building on a dead plan. You need to know the same day, and you need to know what their release does not do, because that is where your business now lives.",
    proof: { text: "Nubble AI News, 11 May 2026: “Open-Weight Price Wars Destroy Thin AI Wrapper Startups”", url: "#reader" },
  },
];

export const SOURCES = [
  { name: "The labs", body: "Release notes from OpenAI, Anthropic, Google, Meta, Mistral and DeepSeek." },
  { name: "Rivals' sites", body: "Your competitors' websites and pricing pages, read again every day, so a changed sentence counts as news." },
  { name: "Rivals' voices", body: "Their blogs, their posts on X, and their founders' posts on LinkedIn." },
  { name: "Launches and money", body: "Launch posts and press releases. Funding rounds and price changes." },
];

/** The three sizes, shown on one real story. */
export const SIZES = {
  title: "Peec AI launches Peec Agent and Actions",
  date: "22 Oct 2026",
  url: PEEC_AGENT_URL,
  soWhat:
    "Your comparison table says trackers only partly tell a brand what to fix first. Since 22 October, Peec does it, with evidence. Fix that row before a buyer checks it. Lead with the row trackers still mark No: people and AI read on the same 17 markers.",
  summary:
    "Peec launched Actions, which ranks the changes worth making by likely impact, with evidence. Its new agent turns a finding into a content brief, a page edit or a task.",
  original: [
    "Peec AI, the AI search platform used by more than 3,500 companies, today announced the launch of Peec Agent and a significant expansion of actions. The release helps marketing teams understand and improve how their brands are discovered, represented, and recommended in AI search, with the evidence behind each recommendation and a way to act on it.",
    "As people turn to platforms such as ChatGPT, Gemini, and Perplexity to research products and evaluate brands, marketing teams face a new challenge: understanding what influences AI-generated answers and deciding which improvements are worth pursuing. Tracking visibility is an important starting point, but turning those insights into action requires further investigation and coordination.",
    "Introducing Peec Agent and expanded actions",
    "Actions: Ranks the changes worth making by likely impact, shows the evidence behind each one, and covers technical issues, owned content, third-party mentions, and inaccurate claims in AI answers.",
    "Peec Agent: Answers questions about any chart or result, runs the specialist analyses a GEO expert would run, and takes a finding through to a content brief, an improvement to an existing page, or a task in the team’s own tools.",
    "“Understanding how your brand shows up in AI search is just the start. The harder part is knowing which changes will make a difference and getting the right people to act on them,” said Marius Meiners, CEO and co-founder of Peec AI. “A lot of companies in our space are selling the idea that AI can do the marketing. We see it differently. The decisions about how your brand is described should stay with your team. Actions shows teams what's worth doing and the evidence behind it, and Peec Agent takes on the research and hand-offs so they can spend their time on the work that needs their judgment.”",
    "Evidence-backed recommendations for improving AI visibility",
    "Peec AI’s expanded actions help teams identify opportunities across technical fixes, content improvements, and third-party coverage. Each recommendation comes with a five-level relative impact rating and supporting evidence from AI-generated answers, cited sources, or website analysis, helping marketers understand why a change matters and where to focus their efforts.",
    "Recommendations cover four types of work:",
    "Technical fixes: Issues that may prevent AI crawlers from accessing or understanding a website, such as a blocked crawler, an invalid sitemap, or a page that cannot be read in full.",
    "Owned content: Improvements to existing pages, such as a missing summary or a claim with no supporting source, and briefs for topics the brand has not covered.",
    "Third-party mentions: Opportunities in publications, reviews, and communities cited by AI answers, such as a roundup the brand is absent from or a review profile that needs attention.",
    "Inaccurate claims: Statements about a brand that teams can investigate and work to correct, traced back to the pages that contributed to them.",
    "Teams can filter actions by AI model, topic, country, and type, and add their own actions alongside Peec's recommendations.",
    "For content-related recommendations, Peec can prepare briefs or suggest edits to eligible existing pages in its content editor. Teams review the changes and decide what to publish.",
    "From AI search insights to action with Peec Agent",
    "Peec Agent can be used on its own or alongside a recommended action.",
    "Users can trace a drop in visibility, compare competitors, examine cited sources, and explore how their brand is described in AI answers without manually assembling every analysis. Almost anything on the page can be handed to the agent directly, so a single chart, prompt, or source becomes the subject of the question.",
    "A question can be as short as \"why did this drop?\" The agent already has the brand, the chart, the date range, and the filters in front of it, so nothing has to be set up or explained first. It also draws on context about the user, their project, and their company, helping make its responses more relevant without requiring the same background to be explained each time.",
    "Peec Agent includes a library of 30 skills covering the work that comes up most, from diagnosing a change in visibility to setting up a project and prompts for a new market. Teams can also write their own, turning the way they approach a recurring question into something the rest of the team can run.",
    "Peec Agent works with more than 25 connectors, covering the tools marketing teams already use: Webflow, Contentful, Sanity, Wix, Mintlify, Lovable, HubSpot, Klaviyo, Customer.io, Resend, Loops, beehiiv, lemlist, Clay, Notion, Linear, Atlassian, Granola, DataForSEO, Moz, SISTRIX, Exa, Cloudflare, PostHog, Apify.",
    "Teams can diagnose a technical issue affecting AI visibility and prepare a task for their engineering team, or identify a content gap and develop a brief for their editorial team. Each connection uses an individual's own login and reaches only the projects and tools they allow.",
    "Users remain in control. Peec Agent requests approval before making changes by default, with optional approval settings.",
    "Connecting marketing, content, and technical teams",
    "Improving how a brand is discovered, represented, and recommended in AI search involves more than traditional SEO.",
    "AI-generated answers draw on a wide range of information, including company websites, editorial publications, customer reviews, and online discussions. Opportunities to improve a brand's presence in AI search therefore often involve marketing, communications, content, and engineering teams.",
    "With the evidence, the investigation, and the handoff in one place, a team can agree on what needs attention and split the work between the people who will do it.",
    "Teams can work directly from recommendations, use Peec Agent where helpful, or take the next step in their existing tools.",
    "Availability",
    "Actions and Peec Agent are available to Peec AI customers across all plans. Peec Agent includes a monthly credit allowance shared across the company, with the amount determined by the customer’s subscription plan. Credit usage varies by task, and companies that need more can purchase additional monthly credit packs.",
  ],
};

export const INVESTOR_ANSWERS = [
  { who: "The investor asking about competitors", what: "Who moved, who copied what, what is still only yours. With dates and links." },
  { who: "The investor asking about your moat", what: "The claims nobody else makes after months of rivals shipping, and the rivals who tried." },
  {
    who: "The investor asking where the industry is going",
    what: "The timeline of your market with dates: launches, rounds, pivots, price changes. The “why now” slide with proof.",
  },
];

export const OTHER_ANSWERS = [
  {
    who: "A rival just launched",
    what: "The same-day answer: what they did, what it does to your claims, and the line that makes you different, ready to post or to send to a customer who asks.",
  },
  { who: "Your homepage", what: "The claim that is still only yours this month, the one to drop, and the promise no rival makes yet." },
  { who: "Your investors, every month", what: "This month's investor update paragraph." },
  { who: "Your deck", what: "A slide built from what happened, not from what you remember." },
  { who: "Your audience", what: "A newsletter piece or a LinkedIn post in your voice, with the rival's own words as proof." },
  {
    who: "Your sales call",
    what: "The answer to “isn't this just a thin layer on top of ChatGPT?”: their sentence, your sentence, the exact difference.",
  },
];

export const PLACES = [
  { name: "Slack", live: false, body: "The brief in the channel you already argue in. Ask it questions in the thread." },
  { name: "Telegram", live: false, body: "The same brief and the same agent, on your phone." },
  {
    name: "Inside Claude and ChatGPT",
    live: false,
    body: "Connect Nubble as a tool (this is what MCP means) and ask “what changed for us this week?” from the window you already have open.",
  },
  {
    name: "The reader (nubble.me)",
    live: true,
    body: "For the day you want to go deep on one story and swipe between the three sizes. Live today.",
  },
];
