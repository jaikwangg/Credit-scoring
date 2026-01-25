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
    return `Your current credit score is ${score.score} (${score.label}). The main factors affecting your score are: ${score.factors.join(', ')}. Would you like to know more about improving specific areas?`;
  }

  if (lowerMessage.includes('income') || lowerMessage.includes('earn')) {
    const totalIncome = parseNumber(input.mainIncome) + parseNumber(input.additionalIncome);
    return `Based on your income of $${totalIncome.toLocaleString()}, I recommend focusing on maintaining a savings rate of at least 20% of your income. This will help improve your creditworthiness over time.`;
  }

  if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
    const totalDebt = parseNumber(input.existingLoans) + parseNumber(input.loanAmount) + parseNumber(input.otherDebts);
    return `Your total debt is $${totalDebt.toLocaleString()}. I suggest prioritizing high-interest debts first and making consistent payments. Consider debt consolidation if you have multiple high-interest loans.`;
  }

  if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    return `Building a consistent saving habit is crucial. Based on your ${input.savingFrequency} saving pattern, try to automate your savings and treat it like a non-negotiable expense. Even small amounts add up over time.`;
  }

  if (lowerMessage.includes('plan') && selectedPlan) {
    return `You've selected Plan ${selectedPlan.id}. This plan focuses on ${selectedPlan.difficulty.toLowerCase()} strategies. Key actions include: ${selectedPlan.keyActions.slice(0, 3).join(', ')}. Would you like more details on any specific action?`;
  }

  if (lowerMessage.includes('time') || lowerMessage.includes('how long')) {
    return `Based on your financial profile, significant credit improvement typically takes 6-12 months with consistent effort. Your selected plan's timeframe is realistic if you stick to the weekly checklist.`;
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('advice')) {
    return `I'm here to help! I can answer questions about your credit score, debt management, saving strategies, or your selected plan. What would you like to know more about?`;
  }

  // Default contextual response
  return `Based on your financial profile, I recommend focusing on consistent saving habits and debt reduction. Your current score of ${score.score} (${score.label}) has room for improvement. Would you like specific advice on any area?`;
}
