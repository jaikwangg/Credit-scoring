import { CreditInput, Plan } from '@/types/credit';
import { scoreCredit } from './scoring';

/**
 * Mock AI assistant responses based on user input and context
 */
export function generateAssistantResponse(
  message: string,
  input: CreditInput,
  selectedPlan?: Plan
): string {
  const lowerMessage = message.toLowerCase();
  const score = scoreCredit(input);
  const parseNumber = (val: string): number => parseFloat(val) || 0;

  // Context-aware responses
  if (lowerMessage.includes('score') || lowerMessage.includes('credit')) {
    return `Your current credit score is ${score.score} (${score.grade}). The main factors affecting your score are: ${score.factors.join(', ')}. Would you like to know more about improving specific areas?`;
  }

  if (lowerMessage.includes('salary') || lowerMessage.includes('income')) {
    const salary = parseNumber(input.Salary);
    return `Based on your salary of $${salary.toLocaleString()}, I recommend focusing on maintaining a debt-to-income ratio below 30%. This will help improve your creditworthiness over time.`;
  }

  if (lowerMessage.includes('debt') || lowerMessage.includes('outstanding') || lowerMessage.includes('overdue')) {
    const outstanding = parseNumber(input.outstanding);
    const overdue = parseNumber(input.overdue);
    const totalDebt = outstanding + overdue;
    return `Your total debt is $${totalDebt.toLocaleString()} ($${outstanding.toLocaleString()} outstanding, $${overdue.toLocaleString()} overdue). I suggest prioritizing overdue payments first, then focusing on reducing outstanding balances. Consider debt consolidation if you have multiple high-interest loans.`;
  }

  if (lowerMessage.includes('loan') || lowerMessage.includes('amount')) {
    const loanAmount = parseNumber(input.loan_amount);
    const salary = parseNumber(input.Salary);
    const ratio = salary > 0 ? (loanAmount / salary).toFixed(1) : 'N/A';
    return `Your loan amount of $${loanAmount.toLocaleString()} represents ${ratio}x your annual salary. A ratio below 2x is ideal. Would you like strategies to manage this loan more effectively?`;
  }

  if (lowerMessage.includes('interest') || lowerMessage.includes('rate')) {
    const interestRate = parseNumber(input.Interest_rate);
    return `Your interest rate of ${interestRate}% ${interestRate >= 10 ? 'is quite high and suggests room for improvement. Consider refinancing or negotiating lower rates.' : 'is reasonable. Focus on making consistent payments to maintain or improve your rate.'}`;
  }

  if (lowerMessage.includes('plan') && selectedPlan) {
    return `You've selected Plan ${selectedPlan.id} (${selectedPlan.difficulty}). This plan focuses on ${selectedPlan.objective.toLowerCase()}. Key actions include: ${selectedPlan.keyActions.slice(0, 3).join(', ')}. Would you like more details on any specific action?`;
  }

  if (lowerMessage.includes('time') || lowerMessage.includes('how long') || lowerMessage.includes('when')) {
    return `Based on your financial profile, significant credit improvement typically takes 6-12 months with consistent effort. Your selected plan's timeframe is realistic if you stick to the weekly checklist and maintain discipline.`;
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('what should')) {
    return `I'm here to help! I can answer questions about your credit score, debt management, payment strategies, or your selected plan. Based on your profile, I'd recommend focusing on ${parseNumber(input.overdue) > 0 ? 'eliminating overdue payments first' : 'reducing outstanding debt'}. What would you like to know more about?`;
  }

  if (lowerMessage.includes('checklist') || lowerMessage.includes('weekly')) {
    return `The weekly checklist helps you stay on track with your selected plan. Focus on completing all items each week, especially making payments on time and tracking your progress. Consistency is key to credit improvement.`;
  }

  // Default contextual response
  return `Based on your financial profile, I recommend focusing on ${parseNumber(input.overdue) > 0 ? 'eliminating overdue payments' : 'reducing outstanding debt'}. Your current score of ${score.score} (${score.grade}) has room for improvement. Would you like specific advice on any area?`;
}

/**
 * Generate summary recommendation
 */
export function generateSummary(input: CreditInput): string {
  const score = scoreCredit(input);
  const parseNumber = (val: string): number => parseFloat(val) || 0;
  
  const overdue = parseNumber(input.overdue);
  const outstanding = parseNumber(input.outstanding);
  const salary = parseNumber(input.Salary);
  
  let summary = `Based on your financial profile, your credit score is ${score.score} (${score.grade}). `;
  
  if (overdue > 0) {
    summary += `Priority #1: Eliminate your $${overdue.toLocaleString()} in overdue payments immediately, as this significantly impacts your creditworthiness. `;
  }
  
  if (outstanding > 0) {
    const debtRatio = salary > 0 ? (outstanding / salary).toFixed(1) : 'N/A';
    summary += `Your outstanding debt of $${outstanding.toLocaleString()} represents ${debtRatio}x your salary. `;
  }
  
  summary += `I've prepared three personalized plans to help you improve your credit score. Each plan offers different strategies based on your risk tolerance and financial capacity.`;
  
  return summary;
}
