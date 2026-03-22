'use client';

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

import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import type { CreateProductInput } from '@apex/validation';

interface NicheAttributesProps {
  niche: string;
  register: UseFormRegister<CreateProductInput>;
  errors: FieldErrors<CreateProductInput>;
  setValue: UseFormSetValue<CreateProductInput>;
  watch: UseFormWatch<CreateProductInput>;
}

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
                {...register('attributes.bedrooms' as any, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.['bedrooms' as keyof typeof errors.attributes] && (
                <p className="text-xs text-red-500">
                  {(errors.attributes as any).bedrooms.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Bathrooms</Label>
              <Input
                type="number"
                step="0.5"
                {...register('attributes.bathrooms' as any, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.['bathrooms' as keyof typeof errors.attributes] && (
                <p className="text-xs text-red-500">
                  {(errors.attributes as any).bathrooms.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Area (SQFT)</Label>
              <Input
                type="number"
                {...register('attributes.sqft' as any, { valueAsNumber: true })}
              />
              {errors?.attributes?.['sqft' as keyof typeof errors.attributes] && (
                <p className="text-xs text-red-500">
                  {(errors.attributes as any).sqft.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                onValueChange={(v) =>
                  setValue('attributes.property_type' as any, v as any)
                }
                defaultValue={watch('attributes.property_type' as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
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
                {...register('attributes.duration_min' as any, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.[
                'duration_min' as keyof typeof errors.attributes
              ] && (
                <p className="text-xs text-red-500">
                  {(errors.attributes as any).duration_min.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                onValueChange={(v) =>
                  setValue('attributes.session_type' as any, v as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-on-one">One-on-One</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }

      case 'education': {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Instructor Name</Label>
              <Input {...register('attributes.instructor' as any)} />
              {errors?.attributes?.[
                'instructor' as keyof typeof errors.attributes
              ] && (
                <p className="text-xs text-red-500">
                  {(errors.attributes as any).instructor.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Number of Lessons</Label>
              <Input
                type="number"
                {...register('attributes.lessons_count' as any, {
                  valueAsNumber: true,
                })}
              />
              {errors?.attributes?.[
                'lessons_count' as keyof typeof errors.attributes
              ] && (
                <p className="text-xs text-red-500">
                  {(errors.attributes as any).lessons_count.message}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="cert"
                checked={!!watch('attributes.has_certificate' as any)}
                onCheckedChange={(checked: boolean) =>
                  setValue('attributes.has_certificate' as any, !!checked)
                }
              />
              <Label htmlFor="cert">Includes Certificate</Label>
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
