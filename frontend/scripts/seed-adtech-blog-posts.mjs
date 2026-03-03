#!/usr/bin/env node
/**
 * Seed the blog with 10 adtech topic posts as admin@admin.com.
 * Deletes all existing posts first, then creates 10 new ones (~2 min read each, one image per post).
 * Requires: backend + frontend running, admin user (admin@admin.com / Iddqdeika1).
 * Usage: node scripts/seed-adtech-blog-posts.mjs [BASE_URL]
 * Default BASE_URL: http://localhost:3000
 */

const BASE_URL = process.env.API_BASE_URL || process.argv[2] || "http://localhost:3000";
const EMAIL = "admin@admin.com";
const PASSWORD = "Iddqdeika1";

const IMG = (id, alt) =>
  `<figure><img src="https://images.unsplash.com/${id}?w=800" alt="${alt}" style="max-width:100%;height:auto;" /></figure>`;

const POSTS = [
  {
    slug: "adtech-trends-2026",
    title: "AdTech Trends 2026: 7 Forces Reshaping Digital Advertising",
    seo_title: "AdTech Trends 2026 | Digital Advertising",
    meta_description: "AI, cookieless identity, CTV as performance, and curation. The biggest forces shaping adtech in 2026.",
    imageId: "photo-1551288049-bebda4e38f71",
    body: `<p>Digital advertising in 2026 is being reshaped by seven major forces. <strong>Agentic AI</strong> has moved from experimentation to full workflow automation: systems now make autonomous decisions on campaign setup, bidding, pacing, and media buying. 92% of business leaders use AI-driven personalization to drive ad growth, while the industry emphasizes transparency and human oversight.</p>
<p><strong>Privacy-first identity</strong> is the new norm. Third-party cookies are replaced by first-party data and clean rooms. Contextual advertising is resurging as consumers control their identity data, and data consolidation is essential for both privacy compliance and AI effectiveness.</p>
${IMG("photo-1551288049-bebda4e38f71", "Analytics and data dashboard")}
<p><strong>Connected TV</strong> has evolved into a performance channel: over 90% of CTV ad spend is transacted programmatically, with clean rooms linking exposure to conversions and attention-adjusted CPMs gaining traction. Cross-channel video boundaries are dissolving—CTV, linear, and social video are measured together, with dynamic budget flows driven by AI. Marketers are shifting from "where ads run" to "what they achieve," with curation and incrementality testing at the center.</p>`,
  },
  {
    slug: "ai-programmatic-2026",
    title: "AI in Programmatic Advertising 2026: Agentic AI and Performance",
    seo_title: "AI Programmatic 2026 | Agentic AI",
    meta_description: "Agentic AI handles end-to-end campaign management. Bidding, targeting, creative, and planning in 2026.",
    imageId: "photo-1677442136019-21780ecad995",
    body: `<p>Generative and agentic AI are fundamentally transforming programmatic advertising in 2026. <strong>Autonomous software agents</strong> now handle end-to-end campaign management: they interpret brand briefs, allocate budgets, generate creative variations, and continuously optimize performance with minimal human oversight. Decision-making is shifting from human traders to AI systems.</p>
<p>Machine learning powers core functions: <strong>bidding optimization</strong> predicts optimal bid prices across billions of real-time auctions; <strong>audience targeting</strong> builds micro-audiences that outperform traditional segmentation, with AI-backed identity graphs replacing third-party cookies; <strong>creative optimization</strong> uses GenAI to produce thousands of ad variants that agentic layers test, rotate, and scale by performance. Planning cycles have shortened from weeks to hours.</p>
${IMG("photo-1677442136019-21780ecad995", "AI and digital technology")}
<p>61% of brand and agency marketers already use AI for programmatic. The primary KPI is shifting to Predictive Lifetime Value (pLTV). A media quality crisis has emerged as AI-generated content proliferates—pre-bid protections and contextual intelligence are essential to avoid synthetic or low-value inventory.</p>`,
  },
  {
    slug: "ad-fraud-2026",
    title: "Ad Fraud in 2026: New Threats and How to Fight Back",
    seo_title: "Ad Fraud 2026 | Detection and Prevention",
    meta_description: "AI-powered fraud, CTV bots, and cloaking. Solutions that authenticate humans and protect budgets.",
    imageId: "photo-1563013544-824ae1b704d3",
    body: `<p>Ad fraud has evolved dramatically. <strong>AI-powered fraudsters</strong> deploy large language models to create synthetic users with realistic engagement patterns and AI-generated profiles that can pass facial recognition. Gen-AI bots produce human-like mouse movements, variable scroll speeds, and simulated reading time. CTV is a major frontier: 72% of CTV fraud is bot-based, with operations like ShadowBot generating tens of millions of spoofed devices to drain budgets.</p>
<p>Cloaking and evasion services show benign content to reviewers while serving malicious pages only to real victims. JavaScript-based detection is being bypassed by AI-assisted attacks. Global ad fraud losses exceed $80–120 billion annually; 18–22% of PPC traffic is invalid, with some sectors seeing 30%.</p>
${IMG("photo-1563013544-824ae1b704d3", "Security and protection")}
<p><strong>Solutions</strong> are advancing: Multi-Modal Behavioral Transformers achieve 94.7% accuracy with under 2.3% false positives by analyzing temporal patterns. Dynamic script delivery uses unique instances per execution so attackers cannot reverse-engineer detection. The industry is shifting from "filtering traffic" to "authenticating humans" through proactive behavioral biometrics.</p>`,
  },
  {
    slug: "cookieless-privacy-first-2026",
    title: "Cookieless Advertising 2026: Privacy-First Strategies That Work",
    seo_title: "Cookieless Advertising 2026 | Privacy-First",
    meta_description: "First-party data, server-side tracking, contextual targeting. How to succeed without third-party cookies.",
    imageId: "photo-1563986768609-322da13575f3",
    body: `<p>Third-party cookies are effectively gone. Chrome completed deprecation in 2024; Safari and Firefox had already blocked them. The industry has moved to consent-based controls and privacy-first strategies.</p>
<p><strong>First-party data</strong> is the durable asset: email signups, purchase history, loyalty programs, and on-site behavior. <strong>Server-side tracking</strong> sends events from your server to ad platforms, bypassing browser restrictions and recovering 15–30% of lost conversion signals. <strong>Contextual targeting</strong> delivers performance within 5–8% of cookie-based CTR by matching ads to page content. Deterministic identity signals—device observations, location, CRM matching—create privacy-safe audience connections.</p>
${IMG("photo-1563986768609-322da13575f3", "Privacy and security")}
<p>Privacy is becoming a competitive advantage. Brands that build transparent, consent-based relationships outperform those relying on workarounds. Cookieless retargeting can reach over 90% of U.S. households using privacy-safe signals while improving GDPR and CCPA compliance.</p>`,
  },
  {
    slug: "ctv-programmatic-2026",
    title: "Connected TV Advertising 2026: Performance, Scale, and Programmatic",
    seo_title: "CTV Programmatic 2026 | Connected TV Ads",
    meta_description: "CTV ad spend, programmatic dominance, completion rates, and CPMs. Why CTV is a must-buy in 2026.",
    imageId: "photo-1522869635100-9f4c5e86aa37",
    body: `<p>Connected TV advertising is projected to reach <strong>$38 billion in the U.S. in 2026</strong>, with 14% year-over-year growth. Globally, CTV ad spend will surpass $50 billion. CTV is on track to surpass traditional TV by 2028. 68% of U.S. advertisers consider CTV a "must-buy"; over 50% are increasing CTV budgets.</p>
<p>More than <strong>90% of CTV ad spend</strong> is transacted programmatically. Completion rates for 30-second ads reach 95.92%, far above linear TV's 70–80%. CTV-exposed households convert 45% higher than unexposed ones. 88% of U.S. households have at least one connected TV. CPM bands: premium $35–60, mid-tier $25–40, FAST/long-tail $15–25.</p>
${IMG("photo-1522869635100-9f4c5e86aa37", "Connected TV and streaming")}
<p>Advanced formats like interactive ads drive 2–5x lift in brand consideration. AI-powered personalization is expected to power the majority of CTV ads by 2027. Quality and fraud remain concerns—program-level verification is essential as 25% of open exchange CTV impressions have been exposed to fake or misclassified environments.</p>`,
  },
  {
    slug: "retail-media-commerce-2026",
    title: "Retail Media and Commerce Advertising 2026: Beyond the Shelf",
    seo_title: "Retail Media 2026 | Commerce Advertising",
    meta_description: "Programmatic retail media growth, DSP and CTV expansion, full-funnel and measurement in 2026.",
    imageId: "photo-1607082348824-0a96f2a4b9da",
    body: `<p>U.S. programmatic retail media digital display ad spending jumped 28.6% in 2025 to $20.93 billion, with expectations of $26.57 billion in 2026 and $31.91 billion by 2027. <strong>52% of advertisers</strong> are shifting display budgets from open web DSPs toward retail media DSPs.</p>
<p>Beyond on-site retail ads, three channels are accelerating: <strong>DSP</strong> (net 40% budget increase), <strong>CTV/streaming</strong> (net 47%), and <strong>social commerce</strong> (net 50%). Success requires treating each as a dedicated program with its own strategy. Commerce media networks are embracing programmatic for full-funnel impact—from awareness through conversion—with video and rich media, and moving from managed-service to self-serve platforms.</p>
${IMG("photo-1607082348824-0a96f2a4b9da", "Retail and shopping")}
<p>Only 15% of brands report strong confidence in measurement, driving a shift toward in-flight incrementality and real-time decision-making. GenAI is widely used for campaign management, optimization, and analytics; agentic commerce is expected to mainstream within five years.</p>`,
  },
  {
    slug: "supply-path-optimization-2026",
    title: "Supply Path Optimization 2026: AI, Curation, and Transparency",
    seo_title: "Supply Path Optimization 2026 | SPO",
    meta_description: "40% of budgets lost to supply chain inefficiency. How AI-driven SPO and curation fix it.",
    imageId: "photo-1551288049-bebda4e38f71",
    body: `<p>Global programmatic advertising is projected to reach <strong>$779 billion by 2026</strong>, with programmatic accounting for 84% of digital ad spend. Yet approximately <strong>40% of advertising budgets</strong> are lost to supply chain inefficiencies: opaque intermediaries, hidden fees, and fraudulent traffic.</p>
<p>Publishers often work with 10+ SSPs, creating bid duplication. DSP biases and complex auction mechanics produce inefficient routing. Manual supply path optimization is no longer sufficient at scale. <strong>AI-driven SPO</strong> solutions process vast amounts of bid data in real time, automatically identify optimal routes, redirect spend, and apply exclusions based on performance.</p>
${IMG("photo-1551288049-bebda4e38f71", "Charts and optimization")}
<p>Real implementations show results: one advertiser increased quality spend rate from 88% to 97% in one month; automated solutions deliver +33% conversion rate improvements with cent-level spend transparency. With 55% of organizations increasing AI investment, AI-driven SPO is becoming essential for competitive advantage.</p>`,
  },
  {
    slug: "attribution-incrementality-2026",
    title: "Attribution and Incrementality in 2026: Measuring What Matters",
    seo_title: "Attribution 2026 | Incrementality Testing",
    meta_description: "Traditional attribution overestimates by 20–40%. Why incrementality and MTA matter in 2026.",
    imageId: "photo-1551288049-bebda4e38f71",
    body: `<p>Privacy regulations and cookie deprecation have changed the measurement landscape. <strong>Traditional attribution models</strong> are increasingly unreliable, overestimating channel contribution by 20–40% on average. 73% of marketing leaders now view incrementality testing as essential, up from 41% in 2023.</p>
<p><strong>Incrementality testing</strong> measures true causal impact by dividing audiences into test and control groups. Methods include conversion lift tests, geo-based experiments, budget holdouts, and randomized control groups. Tests should run 2–4 weeks with sufficient budget for significance. Multi-touch attribution (MTA) reveals influence across the journey; incrementality proves causal lift. Meta achieved up to 50% higher ROAS when evaluated through MTA versus last-touch.</p>
${IMG("photo-1551288049-bebda4e38f71", "Analytics and measurement")}
<p>Use attribution for campaign optimization and incrementality for budget allocation. Incrementality works with cohort-level data, making it reliable in the post-cookie era and privacy-compliant.</p>`,
  },
  {
    slug: "media-quality-brand-safety-2026",
    title: "Media Quality and Brand Safety in 2026: Attention Over Impressions",
    seo_title: "Media Quality 2026 | Brand Safety",
    meta_description: "Attention and brand safety as core KPIs. CTV quality, fraud, and AI-generated content verification.",
    imageId: "photo-1558494949-ef010cbdcc31",
    body: `<p>The industry is shifting from impression-based metrics to <strong>attention, contextual quality, and brand safety</strong>. Marketers are measuring whether ads are truly seen, processed, and engaged with—not just delivered.</p>
<p>CTV leads the attention metrics revolution, with an average Attention Unit rating of 58.9 in 2025, higher than linear TV, online video, and display. But quality challenges are real: <strong>25% of open exchange CTV impressions</strong> were exposed to fake CTV content or misclassified non-television environments. Program-level targeting is essential; app-level categorization alone is insufficient. One partner reduced fake CTV from 25% to 2.5% using program-level controls.</p>
${IMG("photo-1558494949-ef010cbdcc31", "Quality and verification")}
<p>83% of media experts see ad fraud and brand suitability as major concerns; 69% cite ad content adjacency as a key challenge. More than one in five ad impressions globally is invalid or unsafe. 84–86% will use third-party verification to identify and classify AI-generated content in social and digital video.</p>`,
  },
  {
    slug: "adtech-new-problems-2026",
    title: "New Problems in AdTech 2026: AI, Fraud, and Quality",
    seo_title: "AdTech New Problems 2026 | Risks",
    meta_description: "AI-generated inventory, CTV fraud, identity, supply waste, and cloaking. The emerging risks and responses.",
    imageId: "photo-1454165804606-c3d57bc86b40",
    body: `<p>Several interconnected problems define the adtech landscape in 2026. <strong>AI-generated inventory</strong> is proliferating: synthetic and low-value content demands pre-bid and contextual controls to protect brand safety and performance.</p>
<p><strong>CTV fraud and quality</strong> remain critical: bot traffic, spoofed devices, and fake CTV environments require program-level verification. <strong>Identity and measurement</strong> are in flux after cookie deprecation and privacy laws—first-party data, server-side tracking, contextual targeting, and incrementality testing are the main responses.</p>
${IMG("photo-1454165804606-c3d57bc86b40", "Strategy and planning")}
<p><strong>Supply chain waste</strong> still consumes roughly 40% of budgets; AI-driven supply path optimization and curation are essential. <strong>Cloaking and evasion</strong> let malicious ads bypass detection; the industry is moving toward dynamic delivery and "authenticating humans" rather than only filtering traffic. Addressing these together—quality, identity, SPO, and fraud—is the 2026 priority.</p>`,
  },
];

function getCookieHeader(setCookie) {
  if (!setCookie) return "";
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionPart = parts.find((p) => p.startsWith("session="));
  if (!sessionPart) return "";
  return sessionPart.split(";")[0].trim();
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    redirect: "manual",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }
  const cookie = getCookieHeader(res.headers.get("set-cookie"));
  if (!cookie) throw new Error("Login succeeded but no session cookie received");
  return cookie;
}

async function listPosts(cookie) {
  const res = await fetch(`${BASE_URL}/api/blog/posts?limit=100`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`List posts failed (${res.status})`);
  const data = await res.json();
  return data.items || [];
}

async function deletePost(cookie, postId) {
  const res = await fetch(`${BASE_URL}/api/blog/posts/${postId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  if (res.status !== 204 && !res.ok) {
    const text = await res.text();
    throw new Error(`Delete post ${postId} failed (${res.status}): ${text}`);
  }
}

async function createPost(cookie, post) {
  const body = {
    title: post.title,
    slug: post.slug,
    body: post.body,
    status: "published",
    seo_title: post.seo_title,
    meta_description: post.meta_description,
  };
  const res = await fetch(`${BASE_URL}/api/blog/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create post "${post.slug}" failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function rebuildIndex(cookie) {
  const res = await fetch(`${BASE_URL}/api/blog/rebuild-index`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rebuild index failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  console.log("Base URL:", BASE_URL);
  console.log("Logging in as", EMAIL, "...");
  const cookie = await login();
  console.log("Logged in.");

  const existing = await listPosts(cookie);
  if (existing.length > 0) {
    console.log("Deleting", existing.length, "existing post(s)...");
    for (const p of existing) {
      await deletePost(cookie, p.id);
      console.log("  Deleted:", p.slug || p.id);
    }
  } else {
    console.log("No existing posts to delete.");
  }

  console.log("Creating", POSTS.length, "new posts...");
  for (const post of POSTS) {
    await createPost(cookie, post);
    console.log("  Created:", post.slug);
  }

  console.log("Rebuilding search index...");
  const indexResult = await rebuildIndex(cookie);
  console.log("Indexed", indexResult.indexed, "documents.");

  console.log("Done. All", POSTS.length, "posts published.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
