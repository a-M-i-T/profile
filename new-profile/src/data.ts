const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`

export const profile = {
  name: "Amit Arya",
  role: "Senior PHP Full Stack Engineer",
  location: "Kathmandu, Nepal",
  email: "mailtoamit44@gmail.com",
  phone: "+977 9808957627",
  linkedin: "https://www.linkedin.com/in/arya-amit/",
  github: "https://github.com/a-M-i-T",
  resume: asset("amit-resume-v3.pdf"),
  photo: asset("images/aa.png"),
  tagline: "I ship production PHP platforms — billing, APIs, and secure full-stack features.",
  about:
    "10+ years building production web platforms in PHP and MySQL. Most recently I owned billing and admin work on TestRail’s GBS — subscriptions, Stripe, HubSpot, and Zendesk. I design schema and API contracts before writing code, and I treat security (SQLi, XSS, CSRF, sessions) as part of the feature, not a later pass.",
  highlights: [
    "Senior PHP full-stack — 10+ years shipping production platforms",
    "Billing and CRM: Stripe subscriptions, HubSpot, Zendesk, webhooks",
    "PHP 8.x, MySQL schema/indexing, REST APIs, application security",
    "Part-time studio (Arya IT, 2017–2024) ran alongside full-time roles — client CMS, ecommerce, and custom PHP",
  ],
}

export const skills = {
  billing: [
    "Stripe — subscriptions, trials, webhooks",
    "HubSpot and Zendesk CRM sync",
    "License, order, and entitlement workflows",
    "Production debugging on billing/CRM paths",
  ],
  backend: [
    "PHP 8.x — OOP, namespaces, traits, interfaces",
    "Raw PHP — request lifecycle, sessions, PDO",
    "REST API design, Composer, PHPUnit",
    "Laravel, Yii, CodeIgniter when the codebase requires them",
  ],
  database: [
    "MySQL — schema design, indexing, query optimisation",
    "PostgreSQL",
    "Redis (caching / sessions)",
    "MongoDB",
  ],
  frontend: [
    "JavaScript, Vue",
    "jQuery / AJAX (Fetch & XHR) on production PHP UIs",
    "Bootstrap 5, HTML5 / CSS3",
    "Progressive enhancement",
  ],
  security: [
    "SQLi / XSS / CSRF prevention",
    "Session handling and input sanitisation",
    "Docker, Linux / Bash, Nginx / Apache",
    "AWS (EC2, RDS, S3, IAM — working knowledge)",
  ],
  workflow: [
    "Git, GitHub Actions, Composer",
    "Cursor — used with review gates, not as a substitute for design",
    "PhpStorm, VS Code",
    "Teams, ClickUp, Phabricator",
  ],
}

export const experience = [
  {
    company: "TestRail (GBS)",
    role: "PHP Full Stack Engineer",
    period: "Feb 2025 – Apr 2026",
    note: "Contract · Remote",
    logo: asset("images/gurock-logo.jpg"),
    summary:
      "Billing and admin platform behind TestRail’s Customer Portal and Admin Panel — subscriptions, orders, licensing, and internal workflows in PHP (CodeIgniter) and MySQL.",
    points: [
      "Owned subscription, order, and license flows end-to-end on the PHP/MySQL billing stack",
      "Shipped Stripe payments and AI credits on the same subscription and trial path",
      "Integrated HubSpot and Zendesk; fixed production HubSpot sync and CRM email delivery",
    ],
  },
  {
    company: "Empire Intl / Sports",
    role: "PHP Full Stack Engineer (Laravel) / Team Lead",
    period: "Feb 2024 – Jan 2025",
    note: "Contract · Kathmandu · On-site",
    logo: null,
    summary:
      "Australia/Nepal education consultancy. The group also owns Sudurpaschim Royals in the Nepal Premier League — I built the club website, I did not own the franchise.",
    points: [
      "Delivered the Sudurpaschim Royals club site end-to-end in Laravel",
      "Led Laravel/Vue delivery so projects moved from design through launch",
      "Started a real estate web app, then handed it to partner developers",
    ],
  },
  {
    company: "Subhu Tech",
    role: "Web Developer",
    period: "Aug 2022 – Feb 2024",
    note: "Full-time · Kathmandu",
    logo: asset("images/shubhu.jpeg"),
    summary: "Full-stack Laravel work: split products into services and extract shared packages.",
    points: [
      "Broke applications into API-connected microservices so pieces could scale and deploy independently",
      "Built reusable Laravel packages for auth, utilities, and third-party APIs",
    ],
  },
  {
    company: "Arya IT & Media Pvt. Ltd.",
    role: "Senior Web Developer",
    period: "Mar 2017 – Jan 2024",
    note: "Part-time · alongside other roles",
    logo: null,
    summary:
      "Own studio, part-time on purpose — CMS, ecommerce, and custom PHP for clients while I held full-time jobs.",
    points: [
      "Delivered client websites and custom PHP apps over nearly seven years without pausing the day job",
    ],
  },
  {
    company: "daVariable Innovations",
    role: "Co-Founder",
    period: "Dec 2019 – Jun 2022",
    note: "Part-time · Kathmandu",
    logo: asset("images/dvi.png"),
    summary: "Co-founded during COVID to ship ecommerce, POS, and custom PHP products.",
    points: [
      "Set product direction and kept shipping through pandemic demand shifts",
      "Built PHP/MySQL apps with Bootstrap and jQuery/AJAX UIs",
    ],
  },
  {
    company: "Miracle Interface",
    role: "Senior Programmer",
    period: "Oct 2014 – Sep 2019",
    note: "Full-time · Lalitpur",
    logo: asset("images/miracle.png"),
    summary:
      "Japan-headquartered company, Kathmandu branch. Production web apps originating from Japan.",
    points: [
      "Shipped apps in PHP, Yii, CodeIgniter, Laravel, Node.js, and MySQL/PostgreSQL",
      "Mentored juniors; WordPress themes/plugins and secure production practices",
    ],
  },
]

export type ProjectType = "all" | "apps" | "cms" | "ec" | "plugins"

export type Project = {
  title: string
  blurb: string
  stack: string[]
  type: Exclude<ProjectType, "all">
  image: string | null
  href: string | null
  accent: "lime" | "coral"
}

export const projects: Project[] = [
  {
    title: "Sajilo Restro",
    blurb:
      "QR menu and contactless ordering for restaurants — Laravel API with a Vue storefront. Personal product.",
    stack: ["Laravel", "Vue"],
    type: "apps",
    image: asset("images/sajilorestro.png"),
    href: null,
    accent: "lime" as const,
  },
  {
    title: "Clinic OS (Lighthouse)",
    blurb:
      "Operations system for therapy clinics: protocols, bed/queue, NFC check-in. React, Node, Postgres. Personal product.",
    stack: ["React", "Node", "Postgres"],
    type: "apps",
    image: asset("images/clinic-os.png"),
    href: null,
    accent: "coral" as const,
  },
  {
    title: "Sudurpaschim Royals",
    blurb: "Nepal Premier League club site — delivered end-to-end in Laravel for Empire Intl / Sports.",
    stack: ["Laravel", "Vue"],
    type: "apps",
    image: asset("images/sudurpaschimroyals.png"),
    href: "https://sudurpaschimroyals.com/",
    accent: "lime" as const,
  },
  {
    title: "Tiun Tarkari — Ecommerce",
    blurb: "Online grocery storefront in PHP — catalogue, cart, and checkout for a local retailer.",
    stack: ["Ecommerce", "PHP"],
    type: "ec",
    image: asset("images/tiuntarkari_ec.png"),
    href: null,
    accent: "coral" as const,
  },
  {
    title: "Tiun Tarkari — POS",
    blurb: "In-store point of sale in Laravel, paired with the grocery ecommerce stack.",
    stack: ["Laravel", "POS"],
    type: "apps",
    image: asset("images/tiuntarkari_pos_site.png"),
    href: null,
    accent: "lime" as const,
  },
  {
    title: "Ledger Flow",
    blurb: "Bookkeeping-firm OS (BFMS) — practice operations for accountants. Personal product.",
    stack: ["PHP", "MySQL"],
    type: "apps",
    image: asset("images/ledger-flow.png"),
    href: null,
    accent: "coral" as const,
  },
  {
    title: "Bighnaharta Nepal",
    blurb: "Public site for a non-profit — CMS in PHP.",
    stack: ["CMS", "PHP"],
    type: "cms",
    image: asset("images/bighnaharta_site.png"),
    href: null,
    accent: "lime" as const,
  },
  {
    title: "GetGo Adventures",
    blurb: "Travel and tours marketing site — itineraries and enquiries in PHP CMS.",
    stack: ["CMS", "PHP"],
    type: "cms",
    image: asset("images/getgo_site.png"),
    href: null,
    accent: "coral" as const,
  },
  {
    title: "Piubella",
    blurb: "Product site for Italian olive oil distributors.",
    stack: ["CMS", "PHP"],
    type: "cms",
    image: asset("images/piubella_site.png"),
    href: null,
    accent: "lime" as const,
  },
  {
    title: "Sahakari Jal",
    blurb: "Public site for a drinking-water supplier.",
    stack: ["CMS", "PHP"],
    type: "cms",
    image: asset("images/sahakarijal_site.png"),
    href: null,
    accent: "coral" as const,
  },
  {
    title: "Interactive JS Map of Nepal",
    blurb: "Embeddable JavaScript map plugin for district-level interaction on client sites.",
    stack: ["JavaScript", "Plugin"],
    type: "plugins",
    image: asset("images/interactive-js-map.gif"),
    href: null,
    accent: "lime" as const,
  },
  {
    title: "Interactive JS World Map",
    blurb: "Same plugin pattern for a world map — drop-in for marketing sites.",
    stack: ["JavaScript", "Plugin"],
    type: "plugins",
    image: asset("images/interactive-js-world-map.gif"),
    href: null,
    accent: "coral" as const,
  },
]
