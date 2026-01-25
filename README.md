# Credit Scoring Web App

A responsive, mobile-first credit scoring application built with Next.js (App Router), TypeScript, Tailwind CSS, and Bun. This app provides a multi-step form to collect financial information, calculates a credit score, and offers personalized AI-powered recommendations with three different plans.

## Features

- **Multi-Step Form**: 5-step form with progress indicator
  - Step 1: Income & Expenses
  - Step 2: Debt Burden
  - Step 3: Saving Behavior (with conditional fields)
  - Step 4: Personal Info
  - Step 5: Loan Goal

- **Credit Score Calculation**: Deterministic scoring algorithm based on financial inputs
- **Results Display**: Visual score representation with key factors
- **AI Personal Assistant**: Chat interface with contextual responses
- **Three Personalized Plans**: Plan A (Easy), Plan B (Moderate), Plan C (Challenging)
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
│   ├── Stepper.tsx           # Progress indicator
│   ├── Step1Income.tsx       # Step 1 form
│   ├── Step2Debt.tsx         # Step 2 form
│   ├── Step3Saving.tsx       # Step 3 form (conditional fields)
│   ├── Step4Personal.tsx     # Step 4 form
│   ├── Step5Goal.tsx         # Step 5 form
│   ├── ResultView.tsx        # Score display
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

The app uses a `CreditInput` interface with the following fields:

- **Step 1**: `mainIncome`, `additionalIncome`, `incomeFrequency`, `livingCosts`, `otherDebts`
- **Step 2**: `existingLoans`, `loanAmount`
- **Step 3**: `savingFrequency`, conditional saving amounts, `savingAccount`, `numberOfAccounts`
- **Step 4**: `age`, `education`, `occupation`, `coBorrower`
- **Step 5**: `targetAmount`, `loanPeriod`, `interest`, `location`

## Scoring Algorithm

The credit score (0-1000) is calculated using heuristics based on:
- Income vs expenses ratio
- Debt-to-income ratio
- Saving behavior and frequency
- Goal feasibility
- Personal factors (age, education, occupation)
- Co-borrower availability

## Deployment

### Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications:

1. **Push your code to GitHub**
2. **Import your repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and Bun
3. **Configure environment variables** (if needed)
4. **Deploy!** Vercel will automatically deploy on every push to main/master

**Using GitHub Actions:**
- Add these secrets to your GitHub repository:
  - `VERCEL_TOKEN`: Get from [Vercel Settings > Tokens](https://vercel.com/account/tokens)
  - `VERCEL_ORG_ID`: Found in Vercel project settings
  - `VERCEL_PROJECT_ID`: Found in Vercel project settings
- The workflow in `.github/workflows/deploy.yml` will automatically deploy on push

### Option 2: Deploy to GitHub Pages

For static deployment to GitHub Pages:

1. Enable GitHub Pages in your repository settings
2. The workflow in `.github/workflows/deploy-static.yml` will automatically build and deploy
3. Note: This requires modifying `next.config.js` to use static export (handled by the workflow)

### Option 3: Manual Deployment

Build the production version:

```bash
bun run build
bun run start
```

For static export (if needed):

```bash
# Update next.config.js to include: output: 'export'
bun run build
# Output will be in the 'out' directory
```

## CI/CD

GitHub Actions workflows are included:
- **CI** (`.github/workflows/ci.yml`): Runs on every push/PR to test and build
- **Deploy to Vercel** (`.github/workflows/deploy.yml`): Auto-deploys to Vercel
- **Deploy to GitHub Pages** (`.github/workflows/deploy-static.yml`): Static site deployment

## Privacy

All financial inputs are processed locally in the browser. No data is sent to external servers.

## License

MIT
