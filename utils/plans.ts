import { CreditInput, Plan, ChecklistItem } from '@/types/credit';
import { scoreCredit } from './scoring';

/**
 * Generate personalized plans based on credit input and score
 */
export function generatePlans(input: CreditInput): Plan[] {
  const score = scoreCredit(input);
  const parseNumber = (val: string): number => parseFloat(val) || 0;
  
  const salary = parseNumber(input.Salary);
  const outstanding = parseNumber(input.outstanding);
  const overdue = parseNumber(input.overdue);
  const loanAmount = parseNumber(input.loan_amount);
  const interestRate = parseNumber(input.Interest_rate);
  const totalDebt = outstanding + overdue;

  const debtToSalaryRatio = salary > 0 ? totalDebt / salary : 0;
  const hasOverdue = overdue > 0;

  // Plan A: Conservative (Low risk, gradual improvement)
  const planA: Plan = {
    id: 'A',
    objective: 'Gradual credit improvement with low risk and stable repayment behavior',
    timeframe: '12-18 months',
    keyActions: [
      'Maintain consistent on-time payments for all debts',
      'Pay down outstanding balance by 10-15% monthly',
      'Avoid taking on new debt during improvement period',
      'Build emergency fund equivalent to 2-3 months expenses',
      'Monitor credit report monthly for accuracy',
      'Negotiate lower interest rates where possible',
    ],
    difficulty: 'Conservative',
    estimatedScoreImpact: '+50 to +150 points',
  };

  // Plan B: Balanced (Moderate risk and effort)
  const planB: Plan = {
    id: 'B',
    objective: 'Optimized debt and payment structure for faster improvement',
    timeframe: '6-12 months',
    keyActions: [
      'Aggressively pay down overdue amounts first',
      'Implement debt consolidation if interest rates are high',
      'Increase monthly payments by 20-30% where possible',
      'Refinance existing loans at lower interest rates',
      'Create detailed monthly budget and stick to it',
      'Consider balance transfer for high-interest debts',
      'Reduce discretionary spending by 15-20%',
    ],
    difficulty: 'Balanced',
    estimatedScoreImpact: '+100 to +250 points',
  };

  // Plan C: Aggressive (Fastest potential improvement)
  const planC: Plan = {
    id: 'C',
    objective: 'Maximum credit improvement in shortest timeframe',
    timeframe: '3-6 months',
    keyActions: [
      'Eliminate all overdue payments immediately',
      'Pay down 30-40% of outstanding debt within first 3 months',
      'Consider debt settlement or negotiation for high balances',
      'Cut all non-essential expenses by 40-50%',
      'Explore additional income sources (side work, asset sales)',
      'Use all available disposable income for debt reduction',
      'Consider credit counseling or debt management program',
      'Apply for secured credit cards to rebuild credit history',
    ],
    difficulty: 'Aggressive',
    estimatedScoreImpact: '+150 to +300 points',
    warnings: '⚠️ WARNING: This plan requires exceptional financial discipline and may significantly impact your lifestyle. Only recommended if you have strong commitment and support system. High risk of burnout if not managed carefully.',
  };

  return [planA, planB, planC];
}

/**
 * Generate weekly checklist for selected plan
 */
export function generateChecklist(planId: 'A' | 'B' | 'C', input: CreditInput): ChecklistItem[] {
  const baseChecklist: ChecklistItem[] = [
    { id: '1', task: 'Review all outstanding debts and payment due dates', completed: false },
    { id: '2', task: 'Make minimum payments on all accounts', completed: false },
    { id: '3', task: 'Update budget tracker with this week\'s expenses', completed: false },
    { id: '4', task: 'Check credit report for any errors or discrepancies', completed: false },
  ];

  if (planId === 'A') {
    return [
      ...baseChecklist,
      { id: '5', task: 'Make scheduled payment toward outstanding balance', completed: false },
      { id: '6', task: 'Review and optimize one expense category', completed: false },
      { id: '7', task: 'Set aside emergency fund contribution', completed: false },
    ];
  } else if (planId === 'B') {
    return [
      ...baseChecklist,
      { id: '5', task: 'Make extra payment toward highest interest debt', completed: false },
      { id: '6', task: 'Research debt consolidation or refinancing options', completed: false },
      { id: '7', task: 'Contact creditors to negotiate lower rates', completed: false },
      { id: '8', task: 'Review and cut one non-essential expense', completed: false },
    ];
  } else {
    // Plan C
    return [
      ...baseChecklist,
      { id: '5', task: 'Make aggressive payment toward overdue amounts', completed: false },
      { id: '6', task: 'Identify and eliminate 2-3 non-essential expenses', completed: false },
      { id: '7', task: 'Explore additional income opportunities', completed: false },
      { id: '8', task: 'Contact creditors for debt settlement options', completed: false },
      { id: '9', task: 'Document all financial transactions and payments', completed: false },
      { id: '10', task: 'Review progress and adjust strategy if needed', completed: false },
    ];
  }
}
