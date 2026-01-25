'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { CreditInput } from '@/types/credit';

interface Step3SavingProps {
  register: UseFormRegister<CreditInput>;
  errors: FieldErrors<CreditInput>;
  watch: UseFormWatch<CreditInput>;
}

export default function Step3Saving({ register, errors, watch }: Step3SavingProps) {
  const savingFrequency = watch('savingFrequency');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Saving Behavior</h2>
        <p className="text-gray-600 text-sm">Tell us about your saving habits</p>
      </div>

      <div>
        <label htmlFor="savingFrequency" className="block text-sm font-medium text-gray-700 mb-1">
          Saving Frequency
        </label>
        <select
          id="savingFrequency"
          {...register('savingFrequency', { required: 'Saving frequency is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select frequency</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="multiple/irregular">Multiple/Irregular</option>
        </select>
        {errors.savingFrequency && (
          <p className="mt-1 text-sm text-red-600">{errors.savingFrequency.message}</p>
        )}
      </div>

      {/* Conditional fields based on savingFrequency */}
      {savingFrequency === 'daily' && (
        <>
          <div>
            <label htmlFor="dailySavingAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Saving Amount ($)
            </label>
            <input
              type="text"
              id="dailySavingAmount"
              {...register('dailySavingAmount', {
                pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.dailySavingAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.dailySavingAmount.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="timesPerDay" className="block text-sm font-medium text-gray-700 mb-1">
              Times Per Day (optional)
            </label>
            <input
              type="text"
              id="timesPerDay"
              {...register('timesPerDay', {
                pattern: { value: /^\d+$/, message: 'Please enter a whole number' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
        </>
      )}

      {savingFrequency === 'weekly' && (
        <>
          <div>
            <label htmlFor="weeklySavingAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Saving Amount ($)
            </label>
            <input
              type="text"
              id="weeklySavingAmount"
              {...register('weeklySavingAmount', {
                pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.weeklySavingAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.weeklySavingAmount.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="timesPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
              Times Per Week (optional)
            </label>
            <input
              type="text"
              id="timesPerWeek"
              {...register('timesPerWeek', {
                pattern: { value: /^\d+$/, message: 'Please enter a whole number' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
        </>
      )}

      {savingFrequency === 'monthly' && (
        <div>
          <label htmlFor="monthlySavingAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Saving Amount ($)
          </label>
          <input
            type="text"
            id="monthlySavingAmount"
            {...register('monthlySavingAmount', {
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
          />
          {errors.monthlySavingAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlySavingAmount.message}</p>
          )}
        </div>
      )}

      {savingFrequency === 'multiple/irregular' && (
        <>
          <div>
            <label htmlFor="multiSavingAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Saving Amount ($)
            </label>
            <input
              type="text"
              id="multiSavingAmount"
              {...register('multiSavingAmount', {
                pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid number' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.multiSavingAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.multiSavingAmount.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Amount saved per transaction</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="timesPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                Times Per Day (optional)
              </label>
              <input
                type="text"
                id="timesPerDay"
                {...register('timesPerDay', {
                  pattern: { value: /^\d+$/, message: 'Please enter a whole number' }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="timesPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Times Per Week (optional)
              </label>
              <input
                type="text"
                id="timesPerWeek"
                {...register('timesPerWeek', {
                  pattern: { value: /^\d+$/, message: 'Please enter a whole number' }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="timesPerMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Times Per Month (optional)
              </label>
              <input
                type="text"
                id="timesPerMonth"
                {...register('timesPerMonth', {
                  pattern: { value: /^\d+$/, message: 'Please enter a whole number' }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">Fill in one of the frequency fields above if applicable</p>
        </>
      )}

      <div>
        <label htmlFor="savingAccount" className="block text-sm font-medium text-gray-700 mb-1">
          Saving Account Type
        </label>
        <select
          id="savingAccount"
          {...register('savingAccount', { required: 'Saving account type is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select account type</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="investment">Investment</option>
          <option value="multiple">Multiple Accounts</option>
        </select>
        {errors.savingAccount && (
          <p className="mt-1 text-sm text-red-600">{errors.savingAccount.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="numberOfAccounts" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Accounts
        </label>
        <input
          type="text"
          id="numberOfAccounts"
          {...register('numberOfAccounts', { 
            required: 'Number of accounts is required',
            pattern: { value: /^\d+$/, message: 'Please enter a whole number' }
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="1"
        />
        {errors.numberOfAccounts && (
          <p className="mt-1 text-sm text-red-600">{errors.numberOfAccounts.message}</p>
        )}
      </div>
    </div>
  );
}
