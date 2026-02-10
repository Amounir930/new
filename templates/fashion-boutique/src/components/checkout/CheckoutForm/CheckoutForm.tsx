/**
 * CheckoutForm Component
 *
 * Multi-step checkout form with shipping and payment.
 *
 * @module components/checkout/CheckoutForm
 */

'use client';

import { useState } from 'react';

export function CheckoutForm() {
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div
          className={`flex items-center gap-2 ${
            step === 'shipping' ? 'text-primary font-bold' : 'text-gray-400'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'shipping'
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300'
            }`}
          >
            1
          </div>
          <span>Shipping</span>
        </div>

        <div className="h-px w-16 bg-gray-300" />

        <div
          className={`flex items-center gap-2 ${
            step === 'payment' ? 'text-primary font-bold' : 'text-gray-400'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'payment'
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300'
            }`}
          >
            2
          </div>
          <span>Payment</span>
        </div>
      </div>

      {/* Shipping Form */}
      {step === 'shipping' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Shipping Address</h2>

          <form className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
                <label className="block text-sm font-medium mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
                <label className="block text-sm font-medium mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
              <label className="block text-sm font-medium mb-1">
                Address *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
                <label className="block text-sm font-medium mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
                <label className="block text-sm font-medium mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: template form */}
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={() => setStep('payment')}
              className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary-600 transition-colors"
            >
              Continue to Payment
            </button>
          </form>
        </div>
      )}

      {/* Payment Form */}
      {step === 'payment' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Payment Method</h2>

          <div className="space-y-4">
            {/* Payment Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  defaultChecked
                />
                <span className="font-medium">Credit / Debit Card</span>
              </label>

              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="cod" />
                <span className="font-medium">Cash on Delivery</span>
              </label>
            </div>

            {/* TODO: Stripe Elements Integration */}
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Stripe payment integration will be added here
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary-600 transition-colors"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
