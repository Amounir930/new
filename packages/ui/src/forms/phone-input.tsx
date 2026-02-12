/**
 * Phone Input Component
 * International phone number input with country code selector
 * RTL-aware with MENA region support
 */

'use client';

import * as React from 'react';
import { Input } from '../core/input';
import { Label } from '../core/label';
import { cn } from '../core/utils';

export interface PhoneInputProps extends React.HTMLAttributes<HTMLDivElement> {
  onPhoneChange?: (phone: { countryCode: string; number: string }) => void;
  initialCountryCode?: string;
  initialNumber?: string;
  error?: string;
}

const countryCodes = [
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'مصر' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'الكويت' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'قطر' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'البحرين' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'عمان' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'الأردن' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'لبنان' },
];

export function PhoneInput({
  className,
  onPhoneChange,
  initialCountryCode = '+20',
  initialNumber = '',
  error,
  ...props
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCountryCode(code);
    onPhoneChange?.({ countryCode: code, number: phoneNumber });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(value);
    onPhoneChange?.({ countryCode, number: value });
  };

  return (
    <div className={cn('space-y-2', className)} {...props}>
      <Label htmlFor="phone">رقم الهاتف / Phone Number</Label>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className={cn(
            'flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            error && 'border-destructive'
          )}
          dir="ltr"
        >
          {countryCodes.map((c) => (
            <option key={c.country} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <Input
          id="phone"
          type="tel"
          placeholder="1234567890"
          value={phoneNumber}
          onChange={handleNumberChange}
          className={cn(
            'flex-1 font-mono',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          dir="ltr"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
