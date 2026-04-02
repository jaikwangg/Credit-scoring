'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditInput, CreditScore, Plan, ChecklistItem } from '@/types/credit';
import { generatePlans, generateChecklist } from '@/utils/plans';
import { predictCredit } from '@/utils/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CreditForm from '@/components/CreditForm';
import ResultCard from '@/components/ResultCard';
import PlanCard from '@/components/PlanCard';
import Checklist from '@/components/Checklist';
import AssistantChat from '@/components/AssistantChat';

// Validation schema
const creditSchema = z.object({
  Sex: z.string().min(1, 'Sex is required'),
  Occupation: z.string().min(1, 'Occupation is required'),
  Salary: z.string().min(1, 'Salary is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  Marital_status: z.string().min(1, 'Marital status is required'),
  credit_score: z.string().regex(/^\d*$/, 'Please enter a valid score').optional().or(z.literal('')),
  credit_grade: z.string().optional(),
  outstanding: z.string().min(1, 'Outstanding debt is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  overdue: z.string().min(1, 'Overdue amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  loan_amount: z.string().min(1, 'Loan amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid number'),
  Coapplicant: z.string().min(1, 'Co-applicant status is required'),
  Interest_rate: z.string().min(1, 'Interest rate is required').regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid percentage'),
});

type View = 'form' | 'result' | 'assistant';

export default function Home() {
  const [view, setView] = useState<View>('form');
  const [isCalculating, setIsCalculating] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CreditInput>({
    resolver: zodResolver(creditSchema),
    mode: 'onChange',
    defaultValues: {
      Sex: '',
      Occupation: '',
      Salary: '',
      Marital_status: '',
      credit_score: '',
      credit_grade: '',
      outstanding: '',
      overdue: '',
      loan_amount: '',
      Coapplicant: '',
      Interest_rate: '',
    },
  });

  const onSubmit = async (data: CreditInput) => {
    setIsCalculating(true);
    setView('result');

    try {
      const inputText = JSON.stringify(data);
      const prediction = await predictCredit(inputText, data as unknown as Record<string, any>);

      // Map SHAP values to human-readable factor descriptions (top 3 by absolute value)
      const topShap = Object.entries(prediction.shap_values)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 3)
        .map(([key, value]) => {
          const impact = value >= 0 ? 'positively' : 'negatively';
          return `${key.replace(/_/g, ' ')} impacts your score ${impact}`;
        });

      const score: CreditScore = {
        score: Math.round(prediction.confidence * 1000),
        grade:
          prediction.confidence >= 0.8
            ? 'Excellent'
            : prediction.confidence >= 0.65
            ? 'Good'
            : prediction.confidence >= 0.5
            ? 'Fair'
            : 'Poor',
        factors: topShap.length >= 3 ? topShap : [...topShap, prediction.explanation.split('\n')[0]].slice(0, 3),
      };

      setCreditScore(score);
      setPlans(generatePlans(data));
    } catch (error) {
      console.error('Error calculating credit score:', error);
      alert('Failed to calculate credit score. Please check that the backend is running and try again.');
      setView('form');
    } finally {
      setIsCalculating(false);
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="flex-1 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {view === 'form' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <CreditForm register={register} errors={errors} />
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={!isValid}
                    className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    Calculate Credit Score
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'result' && (
            <div className="max-w-4xl mx-auto">
              {isCalculating ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center" role="status" aria-live="polite">
                  <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
                  <p className="text-lg font-semibold text-gray-700">Calculating your credit score...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                </div>
              ) : creditScore ? (
                <ResultCard score={creditScore} onTalkToAssistant={handleTalkToAssistant} />
              ) : null}
            </div>
          )}

          {view === 'assistant' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Personal Assistant</h2>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
