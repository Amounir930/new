import { type TemplateSlot, getComponentEntry } from '@apex/template-engine';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@apex/ui';
import { Settings2, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { useBuilderStore } from '../store/use-builder-store';

export const PropertyEditor: React.FC = () => {
  const { selectedSlotId, getSelectedSlot, updateSlotProps, selectSlot } =
    useBuilderStore();

  const slot = getSelectedSlot();

  if (!slot) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Select a component to edit its properties</p>
      </div>
    );
  }

  const _componentEntry = getComponentEntry(slot.componentName);

  const handlePropChange = (key: string, value: any) => {
    updateSlotProps(slot.id, { [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Editing Component
          </span>
          <div className="flex items-center gap-2">
            <h2 className="font-bold">{slot.componentName}</h2>
            <Badge variant="outline" className="text-[10px] py-0">
              {slot.id}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => selectSlot(null)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Basic Props */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium border-b pb-2">Properties</h3>

          {/* Mock Dynamic Fields for now */}
          {Object.entries(slot.props || {}).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </Label>
              {typeof value === 'string' && (
                <Input
                  id={key}
                  value={value}
                  onChange={(e) => handlePropChange(key, e.target.value)}
                />
              )}
            </div>
          ))}

          {slot.componentName === 'Button' && !slot.props?.children && (
            <div className="space-y-2">
              <Label htmlFor="btn-text">Label Text</Label>
              <Input
                id="btn-text"
                placeholder="Click me"
                onChange={(e) => handlePropChange('children', e.target.value)}
              />
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <section className="pt-4 border-t mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {}}
          >
            <Trash2 className="w-4 h-4" />
            Delete Component
          </Button>
        </section>
      </div>
    </div>
  );
};
