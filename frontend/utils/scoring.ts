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

  const salary = parseNumber(input.Salary);
  const outstanding = parseNumber(input.outstanding);
  const overdue = parseNumber(input.overdue);
  const loanAmount = parseNumber(input.loan_amount);
  const interestRate = parseNumber(input.Interest_rate);
  const existingCreditScore = parseNumber(input.credit_score);

  // Salary vs outstanding + overdue ratio
  const totalDebt = outstanding + overdue;
  const debtToSalaryRatio = salary > 0 ? totalDebt / salary : 0;
  
  if (debtToSalaryRatio < 0.3) {
    score += 150;
    factors.push('Low debt-to-salary ratio indicates strong financial position');
  } else if (debtToSalaryRatio < 0.5) {
    score += 75;
    factors.push('Moderate debt burden relative to income');
  } else if (debtToSalaryRatio < 0.8) {
    score += 25;
    factors.push('High debt-to-salary ratio requires attention');
  } else {
    score -= 100;
    factors.push('Very high debt burden relative to income - high risk');
  }

  // Overdue payments impact
  if (overdue === 0) {
    score += 120;
    factors.push('No overdue payments - excellent payment history');
  } else if (overdue < outstanding * 0.1) {
    score += 50;
    factors.push('Minimal overdue payments');
  } else {
    score -= 80;
    factors.push('Significant overdue payments negatively impact creditworthiness');
  }

  // Loan amount relative to salary
  const loanToSalaryRatio = salary > 0 ? loanAmount / salary : 0;
  
  if (loanToSalaryRatio < 2) {
    score += 100;
    factors.push('Loan amount is reasonable relative to income');
  } else if (loanToSalaryRatio < 4) {
    score += 40;
    factors.push('Loan amount is moderate relative to income');
  } else {
    score -= 60;
    factors.push('Loan amount is high relative to income - increased risk');
  }

  // Interest rate assessment
  if (interestRate > 0 && interestRate < 5) {
    score += 60;
    factors.push('Low interest rate indicates good credit terms');
  } else if (interestRate >= 5 && interestRate < 10) {
    score += 20;
    factors.push('Moderate interest rate');
  } else if (interestRate >= 10) {
    score -= 40;
    factors.push('High interest rate suggests credit risk');
  }

  // Existing credit score influence (if provided)
  if (existingCreditScore > 0) {
    const scoreAdjustment = (existingCreditScore - 500) * 0.3; // 30% weight
    score += scoreAdjustment;
    if (existingCreditScore >= 700) {
      factors.push('Strong existing credit score foundation');
    } else if (existingCreditScore < 500) {
      factors.push('Existing credit score needs improvement');
    }
  }

  // Credit grade influence
  const inputGrade = input.credit_grade?.toLowerCase() || '';
  if (inputGrade === 'excellent' || inputGrade === 'a') {
    score += 50;
  } else if (inputGrade === 'good' || inputGrade === 'b') {
    score += 25;
  } else if (inputGrade === 'fair' || inputGrade === 'c') {
    score += 10;
  } else if (inputGrade === 'poor' || inputGrade === 'd' || inputGrade === 'f') {
    score -= 30;
  }

  // Coapplicant presence
  if (input.Coapplicant?.toLowerCase() === 'yes') {
    score += 40;
    factors.push('Co-applicant available reduces lending risk');
  }

  // Occupation stability (light influence)
  const stableOccupations = ['employed', 'self-employed', 'business owner', 'professional'];
  if (stableOccupations.some(occ => input.Occupation?.toLowerCase().includes(occ))) {
    score += 15;
  }

  // Marital status (light influence, avoid bias)
  if (input.Marital_status?.toLowerCase() === 'married') {
    score += 10; // Slight positive for stability
  }

  // Clamp score between 0 and 1000
  score = Math.max(0, Math.min(1000, Math.round(score)));

  // Determine grade
  let grade: string;
  if (score >= 800) {
    grade = 'Excellent';
  } else if (score >= 650) {
    grade = 'Good';
  } else if (score >= 500) {
    grade = 'Fair';
  } else {
    grade = 'Poor';
  }

  // Ensure we have at least 3 factors
  while (factors.length < 3) {
    factors.push('Standard credit assessment factors considered');
  }

  // Return top 3 factors
  return {
    score,
    grade,
    factors: factors.slice(0, 3),
  };
}
