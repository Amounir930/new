'use client';

import { useState } from 'react';
import { z } from 'zod';
import { CheckoutAddressSchema } from '@apex/validation';
import type { AddressInput } from '@/lib/api';

const AddressFormSchema = CheckoutAddressSchema.extend({
  name: z.string().min(1, 'Recipient name is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().length(2, 'Country code must be 2 characters').toUpperCase(),
});

type AddressFormData = z.infer<typeof AddressFormSchema>;

const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'QA', name: 'Qatar' },
  { code: 'OM', name: 'Oman' },
  { code: 'EG', name: 'Egypt' },
  { code: 'JO', name: 'Jordan' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
];

export function AddressStep({
  onComplete,
}: {
  onComplete: (
    address: AddressInput,
    sameAsShipping: boolean,
    billingAddress?: AddressInput
  ) => void;
}) {
  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    line1: '',
    line2: null,
    city: '',
    state: null,
    postalCode: '',
    country: 'SA',
    phone: null,
  });

  const [billingData, setBillingData] = useState<AddressFormData>({
    name: '',
    line1: '',
    line2: null,
    city: '',
    state: null,
    postalCode: '',
    country: 'SA',
    phone: null,
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBilling, setShowBilling] = useState(false);

  const validateAddress = (
    data: AddressFormData
  ): Record<string, string> => {
    const result = AddressFormSchema.safeParse(data);
    if (result.success) return {};
    const errs: Record<string, string> = {};
    for (const err of result.error.errors) {
      errs[err.path[0]] = err.message;
    }
    return errs;
  };

  const handleSubmit = () => {
    const shippingErrors = validateAddress(formData);
    const allErrors: Record<string, string> = { ...shippingErrors };

    if (!sameAsShipping) {
      const billingErrors = validateAddress(billingData);
      for (const [key, value] of Object.entries(billingErrors)) {
        allErrors[`billing_${key}`] = value;
      }
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setErrors({});
    const shipping: AddressInput = {
      name: formData.name,
      line1: formData.line1,
      line2: formData.line2 ?? null,
      city: formData.city,
      state: formData.state ?? null,
      postalCode: formData.postalCode,
      country: formData.country,
      phone: formData.phone ?? null,
    };

    const billing = sameAsShipping
      ? undefined
      : ({
        name: billingData.name,
        line1: billingData.line1,
        line2: billingData.line2 ?? null,
        city: billingData.city,
        state: billingData.state ?? null,
        postalCode: billingData.postalCode,
        country: billingData.country,
        phone: billingData.phone ?? null,
      } as AddressInput);

    onComplete(shipping, sameAsShipping, billing);
  };

  const updateField = (
    field: keyof AddressFormData,
    value: string | null,
    isBilling = false
  ) => {
    if (isBilling) {
      setBillingData((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error on change
    setErrors((prev) => {
      const next = { ...prev };
      delete next[isBilling ? `billing_${field}` : field];
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Shipping Address</h2>

      <AddressFormFields
        data={formData}
        errors={errors}
        prefix=""
        onChange={(field, value) => updateField(field, value)}
      />

      {/* Billing address toggle */}
      <div className="mt-6 mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!sameAsShipping}
            onChange={(e) => setSameAsShipping(!e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm font-medium text-gray-700">
            Billing address is different from shipping
          </span>
        </label>
      </div>

      {!sameAsShipping && (
        <>
          <h3 className="text-md font-bold text-gray-900 mb-4">Billing Address</h3>
          <AddressFormFields
            data={billingData}
            errors={errors}
            prefix="billing_"
            onChange={(field, value) => updateField(field, value, true)}
          />
        </>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
      >
        Continue to Shipping
      </button>
    </div>
  );
}

function AddressFormFields({
  data,
  errors,
  prefix,
  onChange,
}: {
  data: AddressFormData;
  errors: Record<string, string>;
  prefix: string;
  onChange: (field: keyof AddressFormData, value: string | null) => void;
}) {
  const error = (field: keyof AddressFormData) => errors[`${prefix}${field}`];

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor={`${prefix}name`} className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id={`${prefix}name`}
          type="text"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${error('name') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        />
        {error('name') && <p className="mt-1 text-xs text-red-500">{error('name')}</p>}
      </div>

      {/* Line 1 */}
      <div>
        <label htmlFor={`${prefix}line1`} className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1
        </label>
        <input
          id={`${prefix}line1`}
          type="text"
          value={data.line1}
          onChange={(e) => onChange('line1', e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${error('line1') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        />
        {error('line1') && <p className="mt-1 text-xs text-red-500">{error('line1')}</p>}
      </div>

      {/* Line 2 */}
      <div>
        <label htmlFor={`${prefix}line2`} className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 (optional)
        </label>
        <input
          id={`${prefix}line2`}
          type="text"
          value={data.line2 ?? ''}
          onChange={(e) => onChange('line2', e.target.value || null)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${prefix}city`} className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id={`${prefix}city`}
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${error('city') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
          />
          {error('city') && <p className="mt-1 text-xs text-red-500">{error('city')}</p>}
        </div>
        <div>
          <label htmlFor={`${prefix}state`} className="block text-sm font-medium text-gray-700 mb-1">
            State (optional)
          </label>
          <input
            id={`${prefix}state`}
            type="text"
            value={data.state ?? ''}
            onChange={(e) => onChange('state', e.target.value || null)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Postal Code + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${prefix}postalCode`} className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code
          </label>
          <input
            id={`${prefix}postalCode`}
            type="text"
            value={data.postalCode}
            onChange={(e) => onChange('postalCode', e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${error('postalCode') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
          />
          {error('postalCode') && <p className="mt-1 text-xs text-red-500">{error('postalCode')}</p>}
        </div>
        <div>
          <label htmlFor={`${prefix}country`} className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id={`${prefix}country`}
            value={data.country}
            onChange={(e) => onChange('country', e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${error('country') ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {error('country') && <p className="mt-1 text-xs text-red-500">{error('country')}</p>}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor={`${prefix}phone`} className="block text-sm font-medium text-gray-700 mb-1">
          Phone (optional)
        </label>
        <input
          id={`${prefix}phone`}
          type="tel"
          value={data.phone ?? ''}
          onChange={(e) => onChange('phone', e.target.value || null)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
