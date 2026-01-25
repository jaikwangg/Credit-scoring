'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreditInput } from '@/types/credit';

interface Step2DebtProps {
  register: UseFormRegister<CreditInput>;
  errors: FieldErrors<CreditInput>;
}

export default function Step2Debt({ register, errors }: Step2DebtProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Debt Burden</h2>
        <p className="text-gray-600 text-sm">Help us understand your current debt situation</p>
      </div>

      <div>
        <label htmlFor="existingLoans" className="block text-sm font-medium text-gray-700 mb-1">
          Existing Loans ($)
        </label>
        <input
          type="text"
          id="existingLoans"
          {...register('existingLoans', {
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.existingLoans && (
          <p className="mt-1 text-sm text-red-600">{errors.existingLoans.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Total outstanding loan amount</p>
      </div>

      <div>
        <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">
          New Loan Amount ($)
        </label>
        <input
          type="text"
          id="loanAmount"
          {...register('loanAmount', { 
            required: 'Loan amount is required',
            pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.loanAmount && (
          <p className="mt-1 text-sm text-red-600">{errors.loanAmount.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">The loan amount you're seeking</p>
      </div>
    </div>
  );
}
