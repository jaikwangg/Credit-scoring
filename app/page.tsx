'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditInput, CreditScore, Plan, ChecklistItem } from '@/types/credit';
import { scoreCredit } from '@/utils/scoring';
import { generatePlans, generateChecklist } from '@/utils/plans';
import Stepper from '@/components/Stepper';
import Step1Income from '@/components/Step1Income';
import Step2Debt from '@/components/Step2Debt';
import Step3Saving from '@/components/Step3Saving';
import Step4Personal from '@/components/Step4Personal';
import Step5Goal from '@/components/Step5Goal';
import ResultView from '@/components/ResultView';
import PlanCard from '@/components/PlanCard';
import Checklist from '@/components/Checklist';
import AssistantChat from '@/components/AssistantChat';

// Validation schema
const creditSchema = z.object({
  mainIncome: z.string().min(1, 'Main income is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  additionalIncome: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number').optional().or(z.literal('')),
  incomeFrequency: z.string().min(1, 'Income frequency is required'),
  livingCosts: z.string().min(1, 'Living costs are required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  otherDebts: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number').optional().or(z.literal('')),
  existingLoans: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number').optional().or(z.literal('')),
  loanAmount: z.string().min(1, 'Loan amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  savingFrequency: z.string().min(1, 'Saving frequency is required'),
  dailySavingAmount: z.string().optional(),
  weeklySavingAmount: z.string().optional(),
  monthlySavingAmount: z.string().optional(),
  multiSavingAmount: z.string().optional(),
  timesPerMonth: z.string().optional(),
  timesPerWeek: z.string().optional(),
  timesPerDay: z.string().optional(),
  savingAccount: z.string().min(1, 'Saving account type is required'),
  numberOfAccounts: z.string().min(1, 'Number of accounts is required').regex(/^\d+$/, 'Please enter a whole number'),
  age: z.string().min(1, 'Age is required').regex(/^\d+$/, 'Please enter a valid age').refine((val) => {
    const age = parseInt(val);
    return age >= 18 && age <= 120;
  }, 'Must be between 18 and 120'),
  education: z.string().min(1, 'Education level is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  coBorrower: z.string().min(1, 'Co-borrower status is required'),
  targetAmount: z.string().min(1, 'Target amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  loanPeriod: z.string().min(1, 'Loan period is required').regex(/^\d+$/, 'Please enter a whole number').refine((val) => {
    const period = parseInt(val);
    return period >= 1;
  }, 'Must be at least 1 month'),
  interest: z.string().min(1, 'Interest rate is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  location: z.string().min(1, 'Location is required'),
});

type View = 'form' | 'result' | 'assistant';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [view, setView] = useState<View>('form');
  const [isCalculating, setIsCalculating] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CreditInput>({
    resolver: zodResolver(creditSchema),
    mode: 'onChange',
    defaultValues: {
      mainIncome: '',
      additionalIncome: '',
      incomeFrequency: '',
      livingCosts: '',
      otherDebts: '',
      existingLoans: '',
      loanAmount: '',
      savingFrequency: '',
      savingAccount: '',
      numberOfAccounts: '',
      age: '',
      education: '',
      occupation: '',
      coBorrower: '',
      targetAmount: '',
      loanPeriod: '',
      interest: '',
      location: '',
    },
  });

  const totalSteps = 5;

  const handleNext = async () => {
    // Validate current step fields
    let fieldsToValidate: (keyof CreditInput)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['mainIncome', 'incomeFrequency', 'livingCosts'];
        break;
      case 2:
        fieldsToValidate = ['loanAmount'];
        break;
      case 3:
        fieldsToValidate = ['savingFrequency', 'savingAccount', 'numberOfAccounts'];
        break;
      case 4:
        fieldsToValidate = ['age', 'education', 'occupation', 'coBorrower'];
        break;
      case 5:
        fieldsToValidate = ['targetAmount', 'loanPeriod', 'interest', 'location'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CreditInput) => {
    setIsCalculating(true);
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const score = scoreCredit(data);
    const generatedPlans = generatePlans(data);
    
    setCreditScore(score);
    setPlans(generatedPlans);
    setIsCalculating(false);
    setView('result');
  };

  const handleTalkToAssistant = () => {
    setView('assistant');
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    const checklistItems = generateChecklist(plan.id, watch() as CreditInput);
    setChecklist(checklistItems);
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getSummary = (): string => {
    if (!creditScore) return '';
    return `Based on your financial profile, your credit score is ${creditScore.score} (${creditScore.label}). I've prepared three personalized plans to help you achieve your loan goal. Each plan offers different strategies based on your current situation.`;
  };

  if (view === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        {isCalculating ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">Calculating your credit score...</p>
            </div>
          </div>
        ) : creditScore ? (
          <ResultView score={creditScore} onTalkToAssistant={handleTalkToAssistant} />
        ) : null}
      </div>
    );
  }

  if (view === 'assistant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Personal Assistant</h1>
            <p className="text-gray-600">Get personalized recommendations for your credit journey</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </div>

          {selectedPlan && checklist.length > 0 && (
            <div className="mb-6">
              <Checklist items={checklist} onToggle={handleToggleChecklist} />
            </div>
          )}

          <div className="mb-6">
            <AssistantChat
              input={watch() as CreditInput}
              selectedPlan={selectedPlan || undefined}
              summary={getSummary()}
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => setView('form')}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Credit Scoring Assessment
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Complete the form to get your personalized credit score and recommendations
          </p>
        </div>

        <Stepper currentStep={currentStep} totalSteps={totalSteps} />

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          {currentStep === 1 && <Step1Income register={register} errors={errors} />}
          {currentStep === 2 && <Step2Debt register={register} errors={errors} />}
          {currentStep === 3 && <Step3Saving register={register} errors={errors} watch={watch} />}
          {currentStep === 4 && <Step4Personal register={register} errors={errors} />}
          {currentStep === 5 && <Step5Goal register={register} errors={errors} />}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Submit & Calculate Score
              </button>
            )}
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center">
          We process your financial inputs locally in your browser for demo purposes.
        </p>
      </div>
    </div>
  );
}
