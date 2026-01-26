# Credit Scoring Web App

A responsive, mobile-first credit scoring application built with Next.js (App Router), TypeScript, Tailwind CSS, and Bun. This app collects user financial information, calculates a credit score, and provides personalized AI-powered recommendations with three different plans.

## Features

- **Single Form Input**: Comprehensive form collecting all required financial information
- **Credit Score Calculation**: Deterministic scoring algorithm based on financial inputs
- **Results Display**: Visual score representation with grade and key contributing factors
- **AI Personal Assistant**: Chat interface with contextual responses
- **Three Personalized Plans**: 
  - Plan A (Conservative): Low risk, gradual improvement
  - Plan B (Balanced): Moderate risk and effort
  - Plan C (Aggressive): Fastest improvement with risk warnings
- **Weekly Checklist**: Task tracking for selected plan
- **Fully Responsive**: Mobile-first design that works on all screen sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Bun
- **Form Management**: React Hook Form + Zod
- **Validation**: Zod schema validation

## Prerequisites

- [Bun](https://bun.sh/) installed on your system

## Installation

1. Install dependencies:
```bash
bun install
```

## Development

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Project Structure

```
Credit-scoring/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page component
├── components/
│   ├── Header.tsx            # App header
│   ├── Footer.tsx            # App footer
│   ├── CreditForm.tsx       # Input form component
│   ├── ResultCard.tsx        # Score display
│   ├── PlanCard.tsx          # Plan display card
│   ├── Checklist.tsx         # Weekly checklist
│   └── AssistantChat.tsx     # AI chat interface
├── types/
│   └── credit.ts             # TypeScript type definitions
├── utils/
│   ├── scoring.ts            # Credit scoring algorithm
│   ├── plans.ts              # Plan generation logic
│   └── assistant.ts          # AI assistant responses
└── package.json
```

## Data Model

The app uses a `CreditInput` interface with the following exact fields:

- `Sex`: string
- `Occupation`: string
- `Salary`: string
- `Marital_status`: string
- `credit_score`: string (optional)
- `credit_grade`: string (optional)
- `outstanding`: string
- `overdue`: string
- `loan_amount`: string
- `Coapplicant`: string
- `Interest_rate`: string

All values are stored as strings and parsed only when calculating results.

## User Flow

1. **Input Form Screen**
   - User fills in all required fields
   - Inline validation ensures data quality
   - Submit button disabled until form is valid

2. **Credit Result Screen**
   - Loading state (1-2 seconds) simulating calculation
   - Displays credit score (0-1000) and grade
   - Shows 3 key contributing factors
   - Visual progress bar indicator
   - CTA to talk to AI Assistant

3. **AI Personal Assistant Screen**
   - Summary recommendation at top
   - Three personalized plans (A/B/C) displayed as cards
   - User can select a plan
   - Weekly checklist appears after plan selection
   - Chat interface for follow-up questions

## Scoring Algorithm

The credit score (0-1000) is calculated using heuristics based on:
- Salary vs outstanding + overdue debt ratio
- Presence and amount of overdue payments
- Loan amount relative to salary
- Interest rate level
- Existing credit score and grade (if provided)
- Co-applicant presence
- Occupation stability (light influence)
- Marital status (light influence)

## Plans

### Plan A: Conservative
- **Objective**: Gradual credit improvement with low risk
- **Timeframe**: 12-18 months
- **Difficulty**: Conservative
- **Focus**: Stable repayment behavior, gradual debt reduction

### Plan B: Balanced
- **Objective**: Optimized debt and payment structure
- **Timeframe**: 6-12 months
- **Difficulty**: Balanced
- **Focus**: Faster improvement with moderate effort

### Plan C: Aggressive
- **Objective**: Maximum credit improvement in shortest timeframe
- **Timeframe**: 3-6 months
- **Difficulty**: Aggressive
- **Focus**: Fastest improvement with significant lifestyle changes
- **Warning**: Requires exceptional discipline

## Privacy

All financial inputs are processed locally in the browser. No data is sent to external servers.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will auto-detect Next.js and Bun
4. Deploy!

## License

MIT
