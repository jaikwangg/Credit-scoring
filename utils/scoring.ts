import { CreditInput, CreditScore } from '@/types/credit';

/**
 * Mock credit scoring function using deterministic heuristics
 */
export function scoreCredit(input: CreditInput): CreditScore {
  let score = 500; // Base score
  const factors: string[] = [];

  // Parse numeric values (handle empty strings)
  const parseNumber = (val: string): number => {
    const num = parseFloat(val) || 0;
    return isNaN(num) ? 0 : num;
  };

  const mainIncome = parseNumber(input.mainIncome);
  const additionalIncome = parseNumber(input.additionalIncome);
  const totalIncome = mainIncome + additionalIncome;
  const livingCosts = parseNumber(input.livingCosts);
  const otherDebts = parseNumber(input.otherDebts);
  const existingLoans = parseNumber(input.existingLoans);
  const loanAmount = parseNumber(input.loanAmount);
  const targetAmount = parseNumber(input.targetAmount);
  const loanPeriod = parseNumber(input.loanPeriod);
  const age = parseNumber(input.age);

  // Income vs Expenses ratio
  const disposableIncome = totalIncome - livingCosts - otherDebts;
  const incomeRatio = totalIncome > 0 ? disposableIncome / totalIncome : 0;
  
  if (incomeRatio > 0.4) {
    score += 150;
    factors.push('Strong disposable income relative to expenses');
  } else if (incomeRatio > 0.2) {
    score += 75;
    factors.push('Moderate disposable income');
  } else if (incomeRatio > 0) {
    score += 25;
    factors.push('Limited disposable income');
  } else {
    score -= 100;
    factors.push('Expenses exceed income - high risk');
  }

  // Debt burden assessment
  const totalDebt = existingLoans + loanAmount + otherDebts;
  const debtToIncomeRatio = totalIncome > 0 ? totalDebt / totalIncome : 0;
  
  if (debtToIncomeRatio < 0.3) {
    score += 120;
    factors.push('Low debt-to-income ratio');
  } else if (debtToIncomeRatio < 0.5) {
    score += 50;
    factors.push('Moderate debt burden');
  } else {
    score -= 80;
    factors.push('High debt-to-income ratio');
  }

  // Saving behavior
  let monthlySavings = 0;
  if (input.savingFrequency === 'daily' && input.dailySavingAmount) {
    const daily = parseNumber(input.dailySavingAmount);
    const timesPerDay = parseNumber(input.timesPerDay || '1');
    monthlySavings = daily * timesPerDay * 30;
  } else if (input.savingFrequency === 'weekly' && input.weeklySavingAmount) {
    const weekly = parseNumber(input.weeklySavingAmount);
    const timesPerWeek = parseNumber(input.timesPerWeek || '1');
    monthlySavings = weekly * timesPerWeek * 4.33;
  } else if (input.savingFrequency === 'monthly' && input.monthlySavingAmount) {
    monthlySavings = parseNumber(input.monthlySavingAmount);
  } else if (input.savingFrequency === 'multiple/irregular' && input.multiSavingAmount) {
    const multiAmount = parseNumber(input.multiSavingAmount);
    // Use frequency fields if provided, otherwise estimate based on irregular pattern
    const timesPerDay = parseNumber(input.timesPerDay || '0');
    const timesPerWeek = parseNumber(input.timesPerWeek || '0');
    const timesPerMonth = parseNumber(input.timesPerMonth || '0');
    
    if (timesPerDay > 0) {
      monthlySavings = multiAmount * timesPerDay * 30;
    } else if (timesPerWeek > 0) {
      monthlySavings = multiAmount * timesPerWeek * 4.33;
    } else if (timesPerMonth > 0) {
      monthlySavings = multiAmount * timesPerMonth;
    } else {
      // Default to monthly if no frequency specified
      monthlySavings = multiAmount;
    }
  }

  const savingRate = totalIncome > 0 ? monthlySavings / totalIncome : 0;
  
  if (savingRate > 0.2) {
    score += 130;
    factors.push('Excellent saving habits');
  } else if (savingRate > 0.1) {
    score += 70;
    factors.push('Good saving discipline');
  } else if (savingRate > 0) {
    score += 30;
    factors.push('Some saving activity');
  } else {
    score -= 50;
    factors.push('No regular savings pattern');
  }

  // Goal feasibility
  const monthlyPayment = loanAmount > 0 && loanPeriod > 0 
    ? loanAmount / loanPeriod 
    : 0;
  const paymentToIncomeRatio = totalIncome > 0 ? monthlyPayment / totalIncome : 0;
  
  if (paymentToIncomeRatio < 0.3 && loanPeriod >= 12) {
    score += 80;
    factors.push('Realistic loan goal with manageable payments');
  } else if (paymentToIncomeRatio < 0.5) {
    score += 40;
    factors.push('Moderate loan goal feasibility');
  } else {
    score -= 60;
    factors.push('Challenging loan goal - payment burden may be high');
  }

  // Age factor (light influence)
  if (age >= 25 && age <= 55) {
    score += 20;
  } else if (age >= 18 && age < 25) {
    score += 10;
  }

  // Education and occupation (light influence)
  const hasHigherEducation = ['bachelor', 'master', 'phd'].includes(input.education.toLowerCase());
  if (hasHigherEducation) {
    score += 15;
  }

  const stableOccupation = ['employed', 'self-employed', 'business owner'].includes(input.occupation.toLowerCase());
  if (stableOccupation) {
    score += 15;
  }

  // Co-borrower
  if (input.coBorrower.toLowerCase() === 'yes') {
    score += 30;
    factors.push('Co-borrower available - reduced risk');
  }

  // Clamp score between 0 and 1000
  score = Math.max(0, Math.min(1000, Math.round(score)));

  // Determine label
  let label: string;
  if (score >= 800) {
    label = 'Excellent';
  } else if (score >= 650) {
    label = 'Good';
  } else if (score >= 500) {
    label = 'Fair';
  } else {
    label = 'Poor';
  }

  // Ensure we have at least 3 factors
  while (factors.length < 3) {
    factors.push('Standard credit assessment factors');
  }

  // Return top 3 factors
  return {
    score,
    label,
    factors: factors.slice(0, 3),
  };
}
