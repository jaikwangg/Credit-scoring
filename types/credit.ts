// CreditInput type definition - MUST MATCH EXACTLY
export interface CreditInput {
  // Step 1: Income & Expenses
  mainIncome: string;
  additionalIncome: string;
  incomeFrequency: string;
  livingCosts: string;
  otherDebts: string;

  // Step 2: Debt Burden
  existingLoans: string;
  loanAmount: string;

  // Step 3: Saving Behavior
  savingFrequency: string;
  dailySavingAmount?: string;
  weeklySavingAmount?: string;
  monthlySavingAmount?: string;
  multiSavingAmount?: string;
  timesPerMonth?: string;
  timesPerWeek?: string;
  timesPerDay?: string;
  savingAccount: string;
  numberOfAccounts: string;

  // Step 4: Personal Info
  age: string;
  education: string;
  occupation: string;
  coBorrower: string;

  // Step 5: Goal
  targetAmount: string;
  loanPeriod: string;
  interest: string;
  location: string;
}

export interface CreditScore {
  score: number;
  label: string;
  factors: string[];
}

export interface Plan {
  id: 'A' | 'B' | 'C';
  goal: string;
  timeframe: string;
  keyActions: string[];
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  estimatedScoreImpact: string;
  warnings?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}
