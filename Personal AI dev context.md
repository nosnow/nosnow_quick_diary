Below is a **clean version of your current AI development context** based on everything you've described in this conversation.  
This is the kind of file you should store in your **`ai-dev-context` repo** and paste to AI whenever starting a new project.

---

# AI Development Context

## Purpose

This document describes my **standard environment and workflow for building small personal web applications using AI coding tools**.

The AI should follow these conventions unless explicitly instructed otherwise.

---

# Preferred tech stack

Frontend

```id="5r8dgi"
Next.js (App Router)
React
TailwindCSS
```

UI components

```id="hupaq4"
shadcn/ui
```

Deployment

```id="n0ne95"
Netlify
```

Database

```id="tqyl1o"
Upstash Redis
```

---

# Redis configuration

Redis is hosted on **Upstash**.

Environment variables

```id="ccp5k2"
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Redis is accessed only on the **server side**.

Never expose Redis credentials to the frontend.

---

# Redis key design

All applications share **one Redis database**.

Keys must use prefixes to separate applications.

Example pattern

```id="v1qt91"
app:entity:id
```

Examples

```id="1twq2n"
journal:2026-03-07
journal:index

aitips:tip:1
aitips:index
```

Each project must use a unique prefix.

---

# Application type

Projects are usually **small personal tools**, not production SaaS apps.

Typical properties

```id="ag41d6"
single user
low traffic
minimal UI
fast interaction
```

Do not add unnecessary complexity.

---

# Authentication philosophy

Do NOT implement a full authentication system.

Preferred security approach

```id="ht9qfa"
secret key for write operations
private URL
```

Environment variable

```id="gvivds"
WRITE_SECRET
```

POST APIs must check the secret.

---

# Deployment workflow

Standard workflow

```id="o5swmx"
1 AI generates project
2 push code to GitHub
3 connect repository to Netlify
4 set environment variables
5 deploy
```

After initial setup

```id="q2tiv9"
git push → automatic deploy
```

---

# AI coding workflow

When generating projects, AI should proceed step by step.

Recommended sequence

```id="9hh9vk"
1 project structure
2 Redis layer
3 API routes
4 UI components
5 deployment instructions
```

Avoid generating the entire project in one step.

---

# UI design principles

Projects should follow these design rules

```id="tiy4ur"
minimal
fast interaction
mobile friendly
large click targets
low friction input
```

Avoid heavy dashboards.

---

# Data export philosophy

All personal tools must support exporting data.

Supported formats

```id="v1qpx5"
JSON
CSV
```

Exports should allow filtering

```id="vtdb3x"
month
year
last N days
all data
```

---

# Frontend style system

When generating UI, select a style.

Available styles

```id="h3v2tt"
Minimal SaaS
Developer tool
Content / blog
Playful AI tool
Dashboard
```

If the style is not specified, ask the user.

Custom styles are allowed.

---

# Privacy preference

Personal projects may store private data.

Rules

```id="2qv2t3"
do not expose credentials
do not expose Redis tokens
keep sensitive logic server-side
```

---

# Code organization

Typical project structure

```id="0a5dng"
/app
  page.tsx
  /api

/components
/lib
```

Server utilities go in

```id="yup55k"
/lib
```

---

# Key development principle

Always prioritize

```id="0j7iho"
simplicity
maintainability
fast iteration
```

Avoid over-engineering.

---
