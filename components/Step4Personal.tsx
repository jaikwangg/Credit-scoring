'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreditInput } from '@/types/credit';

interface Step4PersonalProps {
  register: UseFormRegister<CreditInput>;
  errors: FieldErrors<CreditInput>;
}

export default function Step4Personal({ register, errors }: Step4PersonalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Info</h2>
        <p className="text-gray-600 text-sm">Help us personalize your recommendations</p>
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
          Age
        </label>
        <input
          type="text"
          id="age"
          {...register('age', { 
            required: 'Age is required',
            pattern: { value: /^\d+$/, message: 'Please enter a valid age' },
            min: { value: 18, message: 'Must be at least 18' },
            max: { value: 120, message: 'Please enter a valid age' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="25"
        />
        {errors.age && (
          <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
          Education Level
        </label>
        <select
          id="education"
          {...register('education', { required: 'Education level is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select education level</option>
          <option value="high-school">High School</option>
          <option value="associate">Associate Degree</option>
          <option value="bachelor">Bachelor's Degree</option>
          <option value="master">Master's Degree</option>
          <option value="phd">PhD</option>
          <option value="other">Other</option>
        </select>
        {errors.education && (
          <p className="mt-1 text-sm text-red-600">{errors.education.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
          Occupation
        </label>
        <select
          id="occupation"
          {...register('occupation', { required: 'Occupation is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select occupation</option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-Employed</option>
          <option value="business owner">Business Owner</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
          <option value="unemployed">Unemployed</option>
          <option value="other">Other</option>
        </select>
        {errors.occupation && (
          <p className="mt-1 text-sm text-red-600">{errors.occupation.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="coBorrower" className="block text-sm font-medium text-gray-700 mb-1">
          Co-Borrower Available?
        </label>
        <select
          id="coBorrower"
          {...register('coBorrower', { required: 'Co-borrower status is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select option</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        {errors.coBorrower && (
          <p className="mt-1 text-sm text-red-600">{errors.coBorrower.message}</p>
        )}
      </div>
    </div>
  );
}
