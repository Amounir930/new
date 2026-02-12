/**
 * Component Registry
 * Central mapping of component names to implementations from @apex/ui
 */

import {
  // Core Components
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  // Premium Components
  BentoCard,
  BentoGrid,
  CardBody,
  CardContainer,
  CardItem,
  Marquee,
  // Form Components
  AddressForm,
  PaymentInput,
  PhoneInput,
} from '@apex/ui';
import * as React from 'react';

/**
 * Component category classification
 */
export type ComponentCategory = 'core' | 'premium' | 'form' | 'layout';

/**
 * Registry entry for a single component
 */
export interface ComponentRegistryEntry {
  /** Unique component identifier */
  name: string;
  /** React component implementation */
  component: React.ComponentType<any>;
  /** Component category */
  category: ComponentCategory;
  /** Default props for the component */
  defaultProps?: Record<string, any>;
  /** Component description */
  description?: string;
  /** Whether component supports RTL */
  rtlSupport: boolean;
}

/**
 * Complete component registry
 */
export const COMPONENT_REGISTRY: ComponentRegistryEntry[] = [
  // Core Components
  {
    name: 'Button',
    component: Button,
    category: 'core',
    defaultProps: { variant: 'default', size: 'default' },
    description: 'Interactive button with multiple variants',
    rtlSupport: true,
  },
  {
    name: 'Input',
    component: Input,
    category: 'core',
    defaultProps: { type: 'text' },
    description: 'Text input field',
    rtlSupport: true,
  },
  {
    name: 'Card',
    component: Card,
    category: 'core',
    description: 'Container component for content sections',
    rtlSupport: true,
  },
  {
    name: 'CardHeader',
    component: CardHeader,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'CardTitle',
    component: CardTitle,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'CardDescription',
    component: CardDescription,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'CardContent',
    component: CardContent,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'CardFooter',
    component: CardFooter,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'Dialog',
    component: Dialog,
    category: 'core',
    description: 'Modal overlay',
    rtlSupport: true,
  },
  {
    name: 'DialogTrigger',
    component: DialogTrigger,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'DialogContent',
    component: DialogContent,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'DialogHeader',
    component: DialogHeader,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'DialogTitle',
    component: DialogTitle,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'DialogDescription',
    component: DialogDescription,
    category: 'core',
    rtlSupport: true,
  },
  {
    name: 'Badge',
    component: Badge,
    category: 'core',
    defaultProps: { variant: 'default' },
    description: 'Status indicator or tag',
    rtlSupport: true,
  },
  {
    name: 'Label',
    component: Label,
    category: 'core',
    description: 'Form field label',
    rtlSupport: true,
  },

  // Premium Components
  {
    name: 'Marquee',
    component: Marquee,
    category: 'premium',
    defaultProps: { pauseOnHover: false, vertical: false, repeat: 4 },
    description: 'Infinite scrolling content display',
    rtlSupport: true,
  },
  {
    name: 'BentoGrid',
    component: BentoGrid,
    category: 'premium',
    description: 'Modern grid layout for features',
    rtlSupport: true,
  },
  {
    name: 'BentoCard',
    component: BentoCard,
    category: 'premium',
    description: 'Feature card for BentoGrid',
    rtlSupport: true,
  },
  {
    name: 'CardContainer',
    component: CardContainer,
    category: 'premium',
    description: '3D card container with perspective',
    rtlSupport: true,
  },
  {
    name: 'CardBody',
    component: CardBody,
    category: 'premium',
    description: '3D card body',
    rtlSupport: true,
  },
  {
    name: 'CardItem',
    component: CardItem,
    category: 'premium',
    description: '3D card item with transforms',
    rtlSupport: true,
  },

  // Form Components
  {
    name: 'PaymentInput',
    component: PaymentInput,
    category: 'form',
    description: 'Credit card input with auto-formatting',
    rtlSupport: true,
  },
  {
    name: 'AddressForm',
    component: AddressForm,
    category: 'form',
    description: 'Complete address form for MENA region',
    rtlSupport: true,
  },
  {
    name: 'PhoneInput',
    component: PhoneInput,
    category: 'form',
    defaultProps: { initialCountryCode: '+20' },
    description: 'International phone number input',
    rtlSupport: true,
  },
];

/**
 * Get component by name
 */
export function getComponent(
  name: string
): React.ComponentType<any> | undefined {
  const entry = COMPONENT_REGISTRY.find((c) => c.name === name);
  return entry?.component;
}

/**
 * Get component registry entry by name
 */
export function getComponentEntry(
  name: string
): ComponentRegistryEntry | undefined {
  return COMPONENT_REGISTRY.find((c) => c.name === name);
}

/**
 * Get all components in a category
 */
export function getComponentsByCategory(
  category: ComponentCategory
): ComponentRegistryEntry[] {
  return COMPONENT_REGISTRY.filter((c) => c.category === category);
}

/**
 * Check if a component exists in registry
 */
export function hasComponent(name: string): boolean {
  return COMPONENT_REGISTRY.some((c) => c.name === name);
}

/**
 * Get all registered component names
 */
export function getAllComponentNames(): string[] {
  return COMPONENT_REGISTRY.map((c) => c.name);
}
