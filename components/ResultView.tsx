'use client';

import { CreditScore } from '@/types/credit';

interface ResultViewProps {
  score: CreditScore;
  onTalkToAssistant: () => void;
}

export default function ResultView({ score, onTalkToAssistant }: ResultViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 650) return 'text-blue-600';
    if (score >= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 800) return 'bg-green-100';
    if (score >= 650) return 'bg-blue-100';
    if (score >= 500) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getProgressColor = (score: number) => {
    if (score >= 800) return 'bg-green-500';
    if (score >= 650) return 'bg-blue-500';
    if (score >= 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Credit Score</h1>
          
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(score.score)} mb-4`}>
            <span className={`text-4xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}
            </span>
          </div>
          
          <div className={`text-2xl font-semibold ${getScoreColor(score.score)} mb-6`}>
            {score.label}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ${getProgressColor(score.score)}`}
              style={{ width: `${(score.score / 1000) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Factors</h2>
          <div className="space-y-3">
            {score.factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-primary-600 font-semibold mr-3">{index + 1}.</span>
                <p className="text-gray-700 flex-1">{factor}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={onTalkToAssistant}
            className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            Talk to AI Assistant
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          We process your financial inputs locally in your browser for demo purposes.
        </p>
      </div>
    </div>
  );
}
