'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreditInput } from '@/types/credit';

interface Step1IncomeProps {
  register: UseFormRegister<CreditInput>;
  errors: FieldErrors<CreditInput>;
}

export default function Step1Income({ register, errors }: Step1IncomeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Income & Expenses</h2>
        <p className="text-gray-600 text-sm">Tell us about your financial situation</p>
      </div>

      <div>
        <label htmlFor="mainIncome" className="block text-sm font-medium text-gray-700 mb-1">
          Main Income ($)
        </label>
        <input
          type="text"
          id="mainIncome"
          {...register('mainIncome', { 
            required: 'Main income is required',
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.mainIncome && (
          <p className="mt-1 text-sm text-red-600">{errors.mainIncome.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="additionalIncome" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Income ($)
        </label>
        <input
          type="text"
          id="additionalIncome"
          {...register('additionalIncome', {
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.additionalIncome && (
          <p className="mt-1 text-sm text-red-600">{errors.additionalIncome.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="incomeFrequency" className="block text-sm font-medium text-gray-700 mb-1">
          Income Frequency
        </label>
        <select
          id="incomeFrequency"
          {...register('incomeFrequency', { required: 'Income frequency is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select frequency</option>
          <option value="weekly">Weekly</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        {errors.incomeFrequency && (
          <p className="mt-1 text-sm text-red-600">{errors.incomeFrequency.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="livingCosts" className="block text-sm font-medium text-gray-700 mb-1">
          Living Costs ($/month)
        </label>
        <input
          type="text"
          id="livingCosts"
          {...register('livingCosts', { 
            required: 'Living costs are required',
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.livingCosts && (
          <p className="mt-1 text-sm text-red-600">{errors.livingCosts.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="otherDebts" className="block text-sm font-medium text-gray-700 mb-1">
          Other Debts ($/month)
        </label>
        <input
          type="text"
          id="otherDebts"
          {...register('otherDebts', {
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.otherDebts && (
          <p className="mt-1 text-sm text-red-600">{errors.otherDebts.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Credit cards, personal loans, etc.</p>
      </div>
    </div>
  );
}
