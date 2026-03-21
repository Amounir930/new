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

interface NicheAttributesProps {
  niche: string;
  register: any;
  errors: any;
  setValue: any;
  watch: any;
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
      case 'real_estate':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Input
                type="number"
                {...register('attributes.bedrooms', { valueAsNumber: true })}
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
                {...register('attributes.bathrooms', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Area (SQFT)</Label>
              <Input
                type="number"
                {...register('attributes.sqft', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                onValueChange={(v) => setValue('attributes.property_type', v)}
                defaultValue={watch('attributes.property_type')}
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

      case 'wellness':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Duration (Minutes)</Label>
              <Input
                type="number"
                {...register('attributes.duration_min', {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                onValueChange={(v) => setValue('attributes.session_type', v)}
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

      case 'education':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Instructor Name</Label>
              <Input {...register('attributes.instructor')} />
            </div>
            <div className="space-y-2">
              <Label>Number of Lessons</Label>
              <Input
                type="number"
                {...register('attributes.lessons_count', {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="cert"
                checked={watch('attributes.has_certificate')}
                onCheckedChange={(checked: boolean) =>
                  setValue('attributes.has_certificate', !!checked)
                }
              />
              <Label htmlFor="cert">Includes Certificate</Label>
            </div>
          </div>
        );

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
