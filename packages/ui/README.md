# 📚 Apex v2 UI Components - Complete Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-02-12

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Components (Shadcn)](#core-components)
3. [Premium Components (Magic UI & Aceternity)](#premium-components)
4. [Form Components](#form-components)
5. [Theme System](#theme-system)
6. [RTL Support](#rtl-support)

---

## 🎯 Overview

The Apex v2 UI Component Library is a **production-ready** collection of 12+ React components built for the 60sec.shop e-commerce platform. All components support:

- ✅ **RTL/LTR** - Full bidirectional text support
- ✅ **Dark Mode** - Seamless theme switching
- ✅ **TypeScript** - Complete type safety
- ✅ **Accessibility** - ARIA compliant
- ✅ **Arabic/English** - Bilingual labels

### Component Count

| Category | Count | Source |
|:---|:---:|:---|
| Core | 6 | Shadcn/UI |
| Premium | 3 | Magic UI + Aceternity |
| Forms | 3 | Custom (MENA-optimized) |
| **Total** | **12** | - |

---

## 🧱 Core Components

### Button

Multi-variant button component with accessibility built-in.

**Import:**
```tsx
import { Button } from '@apex/ui'
```

**Usage:**
```tsx
<Button variant="default">Click Me</Button>
<Button variant="destructive" size="lg">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

**Props:**

| Prop | Type | Default | Description |
|:---|:---|:---|:---|
| `variant` | `default` \| `destructive` \| `outline` \| `secondary` \| `ghost` \| `link` | `default` | Visual style |
| `size` | `default` \| `sm` \| `lg` \| `icon` | `default` | Button size |
| `asChild` | `boolean` | `false` | Render as child element |

---

### Input

Text input field with validation states.

**Import:**
```tsx
import { Input } from '@apex/ui'
```

**Usage:**
```tsx
<Input type="email" placeholder="email@example.com" />
<Input type="password" className="border-destructive" />
```

**Props:** Extends `HTMLInputElement` attributes.

---

### Card

Container component for content sections.

**Import:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@apex/ui'
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Product Title</CardTitle>
    <CardDescription>Product description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content here</p>
  </CardContent>
  <CardFooter>
    <Button>Buy Now</Button>
  </CardFooter>
</Card>
```

---

### Dialog

Modal overlay for focused interactions.

**Import:**
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@apex/ui'
```

**Usage:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <Button>Confirm</Button>
  </DialogContent>
</Dialog>
```

---

### Badge

Status indicators and tags.

**Import:**
```tsx
import { Badge } from '@apex/ui'
```

**Usage:**
```tsx
<Badge variant="default">New</Badge>
<Badge variant="destructive">Out of Stock</Badge>
<Badge variant="outline">Sale</Badge>
```

---

### Label

Form field labels with accessibility.

**Import:**
```tsx
import { Label } from '@apex/ui'
```

**Usage:**
```tsx
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

---

## ✨ Premium Components

### Marquee (Magic UI)

Infinite scrolling content display.

**Import:**
```tsx
import { Marquee } from '@apex/ui'
```

**Usage:**
```tsx
<Marquee pauseOnHover>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Marquee>

{/* Vertical scrolling */}
<Marquee vertical reverse>
  <ReviewCard />
  <ReviewCard />
</Marquee>
```

**Props:**

| Prop | Type | Default | Description |
|:---|:---|:---|:---|
| `reverse` | `boolean` | `false` | Reverse scroll direction |
| `pauseOnHover` | `boolean` | `false` | Pause animation on hover |
| `vertical` | `boolean` | `false` | Vertical scrolling |
| `repeat` | `number` | `4` | Content repetition count |

---

### Bento Grid (Magic UI)

Modern grid layout for feature showcases.

**Import:**
```tsx
import { BentoGrid, BentoCard } from '@apex/ui'
```

**Usage:**
```tsx
<BentoGrid>
  <BentoCard
    name="Feature 1"
    description="Description here"
    Icon={IconComponent}
    href="/feature-1"
    cta="Learn More"
    background={<div className="bg-gradient-to-br from-primary/20" />}
    className="col-span-2" // For featured cards
  />
</BentoGrid>
```

**BentoCard Props:**

| Prop | Type | Required | Description |
|:---|:---|:---:|:---|
| `name` | `string` | ✅ | Card title |
| `description` | `string` | ✅ | Card description |
| `Icon` | `React.ElementType` | ✅ | Icon component |
| `href` | `string` | ✅ | Link URL |
| `cta` | `string` | ✅ | Call-to-action text |
| `background` | `ReactNode` | ✅ | Background element |

> **RTL Note:** Arrow icons automatically flip in RTL (`rtl:rotate-180`)

---

### 3D Card (Aceternity)

Interactive card with parallax perspective effect.

**Import:**
```tsx
import { CardContainer, CardBody, CardItem } from '@apex/ui'
```

**Usage:**
```tsx
<CardContainer>
  <CardBody className="bg-gray-50 rounded-xl">
    <CardItem translateZ="50" className="text-xl font-bold">
      Hover over me
    </CardItem>
    <CardItem translateZ="100" rotateX={20} rotateZ={-10}>
      <img src="/image.jpg" alt="3D effect" />
    </CardItem>
  </CardBody>
</CardContainer>
```

**CardItem Props:**

| Prop | Type | Default | Description |
|:---|:---|:---|:---|
| `translateX` | `number \| string` | `0` | X-axis translation |
| `translateY` | `number \| string` | `0` | Y-axis translation |
| `translateZ` | `number \| string` | `0` | Z-axis translation (depth) |
| `rotateX` | `number \| string` | `0` | X-axis rotation |
| `rotateY` | `number \| string` | `0` | Y-axis rotation |
| `rotateZ` | `number \| string` | `0` | Z-axis rotation |

---

## 📋 Form Components

### Payment Input

Credit card input with auto-formatting.

**Import:**
```tsx
import { PaymentInput } from '@apex/ui'
```

**Usage:**
```tsx
<PaymentInput
  onCardNumberChange={(number) => console.log(number)}
  onExpiryChange={(expiry) => console.log(expiry)}
  onCVVChange={(cvv) => console.log(cvv)}
  errors={{
    cardNumber: "Invalid card number",
    expiry: "Invalid date",
    cvv: "Required"
  }}
/>
```

**Features:**
- ✅ Auto-formats card number (1234 5678 9012 3456)
- ✅ Expiry date formatting (MM/YY)
- ✅ CVV validation (3-4 digits)
- ✅ Bilingual labels (Arabic/English)

---

### Address Form

Complete address input for MENA region.

**Import:**
```tsx
import { AddressForm, type AddressData } from '@apex/ui'
```

**Usage:**
```tsx
<AddressForm
  onAddressChange={(address: AddressData) => {
    console.log(address.street, address.city, address.country)
  }}
  initialAddress={{
    country: "EG",
    city: "Cairo"
  }}
  errors={{
    street: "Street is required"
  }}
/>
```

**AddressData Interface:**
```tsx
interface AddressData {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}
```

**Supported Countries:**
- 🇪🇬 Egypt, 🇸🇦 Saudi Arabia, 🇦🇪 UAE, 🇰🇼 Kuwait
- 🇶🇦 Qatar, 🇧🇭 Bahrain, 🇴🇲 Oman, 🇯🇴 Jordan, 🇱🇧 Lebanon

---

### Phone Input

International phone number with country code selector.

**Import:**
```tsx
import { PhoneInput } from '@apex/ui'
```

**Usage:**
```tsx
<PhoneInput
  initialCountryCode="+20"
  onPhoneChange={({ countryCode, number }) => {
    console.log(`${countryCode}${number}`)
  }}
  error="Invalid phone number"
/>
```

**Features:**
- ✅ 9 MENA country codes
- ✅ Flag emojis (🇪🇬 🇸🇦 🇦🇪)
- ✅ Auto number-only validation

---

## 🎨 Theme System

### Setup

```tsx
import { initializeTheme, setThemeMode, setTextDirection } from '@apex/ui'

// On app mount
useEffect(() => {
  initializeTheme()
}, [])

// Toggle dark mode
<Button onClick={() => setThemeMode('dark')}>Dark Mode</Button>

// Toggle RTL
<Button onClick={() => setTextDirection('rtl')}>عربي</Button>
```

### Design Tokens

```tsx
import { designTokens } from '@apex/ui'

const spacing = designTokens.spacing[4] // "1rem"
const fontSize = designTokens.fontSize.lg // ["1.125rem", { lineHeight: "1.75rem" }]
```

---

## 🔄 RTL Support

All components automatically adapt to RTL layout when `dir="rtl"` is set on `<html>`.

### RTL-Aware Utilities

```tsx
import { cn, rtlAnimations, rtlPositioning } from '@apex/ui/premium'

// Directional animations
<div className={rtlAnimations.slideInStart} />

// Directional positioning
<div className={rtlPositioning.paddingStart} />
```

### Tailwind RTL Classes

The theme includes custom RTL utilities:

```css
.ms-auto  /* margin-inline-start: auto */
.me-auto  /* margin-inline-end: auto */
.ps-4     /* padding-inline-start: 1rem */
.pe-4     /* padding-inline-end: 1rem */
```

---

## 🚀 Quick Start Example

```tsx
import { 
  Button, 
  Card, CardHeader, CardTitle, CardContent,
  PaymentInput,
  Marquee,
  initializeTheme
} from '@apex/ui'

function CheckoutPage() {
  useEffect(() => {
    initializeTheme()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>الدفع / Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentInput
            onCardNumberChange={(num) => console.log(num)}
          />
          <Button className="mt-4 w-full">
            إتمام الشراء / Complete Purchase
          </Button>
        </CardContent>
      </Card>

      <Marquee className="mt-8" pauseOnHover>
        <div>Trusted by 1000+ stores</div>
        <div>موثوق من 1000+ متجر</div>
      </Marquee>
    </div>
  )
}
```

---

## 📦 Installation

```bash
# Install the UI package
bun add @apex/ui

# Peer dependencies (if not already installed)
bun add react react-dom
```

## 🛠️ Development

```bash
# Build the library
cd packages/ui
bun run build

# Watch mode
bun run dev

# Type checking
bun run typecheck
```

---

**Built with ❤️ for 60sec.shop**
