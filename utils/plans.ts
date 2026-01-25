import { CreditInput, Plan, ChecklistItem } from '@/types/credit';
import { scoreCredit } from './scoring';

/**
 * Generate personalized plans based on credit input and score
 */
export function generatePlans(input: CreditInput): Plan[] {
  const score = scoreCredit(input);
  const parseNumber = (val: string): number => parseFloat(val) || 0;
  
  const mainIncome = parseNumber(input.mainIncome);
  const additionalIncome = parseNumber(input.additionalIncome);
  const totalIncome = mainIncome + additionalIncome;
  const livingCosts = parseNumber(input.livingCosts);
  const targetAmount = parseNumber(input.targetAmount);
  const loanPeriod = parseNumber(input.loanPeriod);

  const disposableIncome = totalIncome - livingCosts;
  const monthlyTarget = loanPeriod > 0 ? targetAmount / loanPeriod : targetAmount / 12;

  // Plan A: Conservative approach (best for high scores)
  const planA: Plan = {
    id: 'A',
    goal: `Achieve ${score.label} credit score and secure loan of $${targetAmount.toLocaleString()}`,
    timeframe: `${Math.max(6, Math.ceil(loanPeriod / 2))} months`,
    keyActions: [
      'Maintain current saving habits',
      'Reduce discretionary spending by 10%',
      'Build emergency fund (3 months expenses)',
      'Pay down existing debts systematically',
      'Monitor credit utilization monthly',
    ],
    difficulty: 'Easy',
    estimatedScoreImpact: '+50 to +100 points',
  };

  // Plan B: Moderate approach (balanced)
  const planB: Plan = {
    id: 'B',
    goal: `Improve creditworthiness and qualify for better loan terms`,
    timeframe: `${Math.max(12, Math.ceil(loanPeriod * 0.75))} months`,
    keyActions: [
      'Increase savings rate by 15-20%',
      'Create detailed monthly budget',
      'Negotiate lower interest rates on existing debts',
      'Consider debt consolidation if applicable',
      'Build credit history with small secured loans',
      'Reduce non-essential expenses',
    ],
    difficulty: 'Moderate',
    estimatedScoreImpact: '+100 to +200 points',
  };

  // Plan C: Aggressive approach (high risk, high reward)
  const planC: Plan = {
    id: 'C',
    goal: `Rapid credit improvement to reach target loan amount quickly`,
    timeframe: `${Math.max(3, Math.ceil(loanPeriod / 3))} months`,
    keyActions: [
      'Aggressively cut expenses by 30-40%',
      'Increase income through side work or additional job',
      'Sell non-essential assets to pay down debt',
      'Use all disposable income for debt reduction',
      'Consider credit counseling or debt management program',
      'Apply for secured credit cards to build history',
    ],
    difficulty: 'Challenging',
    estimatedScoreImpact: '+150 to +300 points',
    warnings: '⚠️ This plan requires significant discipline and lifestyle changes. High risk of burnout. Only recommended if you have strong financial discipline and support system.',
  };

  return [planA, planB, planC];
}

/**
 * Generate weekly checklist for selected plan
 */
export function generateChecklist(planId: 'A' | 'B' | 'C', input: CreditInput): ChecklistItem[] {
  const baseChecklist: ChecklistItem[] = [
    { id: '1', task: 'Review monthly budget and track expenses', completed: false },
    { id: '2', task: 'Make minimum payments on all debts', completed: false },
    { id: '3', task: 'Transfer savings to dedicated account', completed: false },
    { id: '4', task: 'Monitor credit score and report', completed: false },
  ];

  if (planId === 'A') {
    return [
      ...baseChecklist,
      { id: '5', task: 'Review and optimize one expense category', completed: false },
      { id: '6', task: 'Check for any unnecessary subscriptions', completed: false },
    ];
  } else if (planId === 'B') {
    return [
      ...baseChecklist,
      { id: '5', task: 'Research debt consolidation options', completed: false },
      { id: '6', task: 'Contact creditors to negotiate rates', completed: false },
      { id: '7', task: 'Set up automatic savings transfers', completed: false },
      { id: '8', task: 'Review and adjust budget categories', completed: false },
    ];
  } else {
    // Plan C
    return [
      ...baseChecklist,
      { id: '5', task: 'Identify and eliminate 3 non-essential expenses', completed: false },
      { id: '6', task: 'Explore additional income opportunities', completed: false },
      { id: '7', task: 'Create aggressive debt payoff schedule', completed: false },
      { id: '8', task: 'Research credit counseling resources', completed: false },
      { id: '9', task: 'Document all financial transactions', completed: false },
    ];
  }
}
