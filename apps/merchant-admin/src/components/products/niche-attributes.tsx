'use client';

import type { CreateProductInput, PRODUCT_NICHES } from '@apex/validation';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// 🛡️ Protocol Delta: Localized Form Value type to include the ID
type ProductFormValues = CreateProductInput & { id?: string };
type Niche = (typeof PRODUCT_NICHES)[number];

interface NicheAttributesProps {
  niche: Niche;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
}

/**
 * 🛡️ NicheAttributes Component
 * Zero-Debt Enforcement: Strictly types the nested 'attributes' object
 * using niche-specific assertions instead of 'as any'.
 */
export function NicheAttributes({
  niche,
  register,
  errors,
  setValue,
  watch,
}: NicheAttributesProps) {
  const renderFields = () => {
    switch (niche) {
      case 'real_estate': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input
                type="number"
                {...register('attributes.bedrooms' as const, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.bedrooms && (
                <p className="text-xs text-red-500">
                  {errors.attributes.bedrooms.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input
                type="number"
                step="0.5"
                {...register('attributes.bathrooms' as const, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.bathrooms && (
                <p className="text-xs text-red-500">
                  {errors.attributes.bathrooms.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Area (SQFT)</Label>
              <Input
                type="number"
                {...register('attributes.sqft' as const, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.sqft && (
                <p className="text-xs text-red-500">
                  {errors.attributes.sqft.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                onValueChange={(
                  v: 'apartment' | 'house' | 'commercial' | 'land'
                ) => setValue('attributes.property_type', v)}
                defaultValue={
                  watch('attributes.property_type') as string | undefined
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
              {errors?.attributes?.property_type && (
                <p className="text-xs text-red-500">
                  {errors.attributes.property_type.message}
                </p>
              )}
            </div>
          </div>
        );
      }

      case 'wellness': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Duration (Minutes)</Label>
              <Input
                type="number"
                {...register('attributes.duration_min' as const, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.duration_min && (
                <p className="text-xs text-red-500">
                  {errors.attributes.duration_min.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                onValueChange={(v: 'one-on-one' | 'group' | 'workshop') =>
                  setValue('attributes.session_type', v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-on-one">One-on-One</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
              {errors?.attributes?.session_type && (
                <p className="text-xs text-red-500">
                  {errors.attributes.session_type.message}
                </p>
              )}
            </div>
          </div>
        );
      }

      case 'education': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Instructor Name</Label>
              <Input {...register('attributes.instructor' as const)} />
              {errors?.attributes?.instructor && (
                <p className="text-xs text-red-500">
                  {errors.attributes.instructor.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Number of Lessons</Label>
              <Input
                type="number"
                {...register('attributes.lessons_count' as const, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.lessons_count && (
                <p className="text-xs text-red-500">
                  {errors.attributes.lessons_count.message}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="cert"
                checked={!!watch('attributes.has_certificate')}
                onCheckedChange={(checked: boolean) =>
                  setValue('attributes.has_certificate', !!checked)
                }
              />
              <Label htmlFor="cert">Includes Certificate</Label>
              {errors?.attributes?.has_certificate && (
                <p className="text-xs text-red-500">
                  {errors.attributes.has_certificate.message}
                </p>
              )}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="py-8 text-center text-muted-foreground italic">
            Standard retail attributes applied (Niche: {niche}).
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        Specific Attributes:{' '}
        <span className="capitalize text-indigo-600 font-bold">
          {niche.replace('_', ' ')}
        </span>
      </h3>
      {renderFields()}
    </div>
  );
}
