'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreditInput } from '@/types/credit';

interface Step5GoalProps {
  register: UseFormRegister<CreditInput>;
  errors: FieldErrors<CreditInput>;
}

export default function Step5Goal({ register, errors }: Step5GoalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loan Goal</h2>
        <p className="text-gray-600 text-sm">Tell us about your loan objectives</p>
      </div>

      <div>
        <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
          Target Loan Amount ($)
        </label>
        <input
          type="text"
          id="targetAmount"
          {...register('targetAmount', { 
            required: 'Target amount is required',
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.targetAmount && (
          <p className="mt-1 text-sm text-red-600">{errors.targetAmount.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="loanPeriod" className="block text-sm font-medium text-gray-700 mb-1">
          Loan Period (months)
        </label>
        <input
          type="text"
          id="loanPeriod"
          {...register('loanPeriod', { 
            required: 'Loan period is required',
            pattern: { value: /^\d+$/, message: 'Please enter a whole number' },
            min: { value: 1, message: 'Must be at least 1 month' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="12"
        />
        {errors.loanPeriod && (
          <p className="mt-1 text-sm text-red-600">{errors.loanPeriod.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1">
          Expected Interest Rate (%)
        </label>
        <input
          type="text"
          id="interest"
          {...register('interest', { 
            required: 'Interest rate is required',
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="5.00"
        />
        {errors.interest && (
          <p className="mt-1 text-sm text-red-600">{errors.interest.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          {...register('location', { required: 'Location is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="City, State"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>
    </div>
  );
}
