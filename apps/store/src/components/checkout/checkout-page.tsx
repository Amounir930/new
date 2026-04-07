'use client';

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AddressStep } from '@/components/checkout/address-step';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';
import { ShippingStep } from '@/components/checkout/shipping-step';
import { StepIndicator } from '@/components/checkout/step-indicator';
import type { AddressInput, CheckoutResponse } from '@/lib/api';
import { createCheckout } from '@/lib/api';
import type { CartItem } from '@/lib/cart-store';
import { useMountedCart } from '@/lib/cart-store';

// Initialize Stripe outside render to avoid recreation
const stripePromise = loadStripe(
  process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ||
    'pk_test_dummy_key_for_dev'
);

type CheckoutStep = 'address' | 'shipping' | 'payment';

/**
 * ── CHECKOUT PAGE (Store-#06) ──
 * Multi-step: Address → Shipping → Stripe Elements Payment
 * Zero-Trust: Server recalculates ALL prices.
 */
export function CheckoutPageClient() {
  const cart = useMountedCart();
  const [step, setStep] = useState<CheckoutStep>('address');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Form state
  const [shippingAddress, setShippingAddress] = useState<AddressInput | null>(
    null
  );
  const [billingAddress, setBillingAddress] = useState<AddressInput | null>(
    null
  );
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<
    'standard' | 'express' | 'overnight'
  >('standard');
  const [orderData, setOrderData] = useState<CheckoutResponse | null>(null);

  // Redirect to cart if empty
  useEffect(() => {
    const hasItems = cart.serverItems.length > 0 || cart.items.length > 0;
    if (!hasItems) {
      toast.error('Your cart is empty');
      window.location.href = '/cart';
    }
  }, [cart.serverItems.length, cart.items.length]);

  // Step 1 → Step 2
  const handleAddressComplete = useCallback(
    (address: AddressInput, same: boolean, billing?: AddressInput) => {
      setShippingAddress(address);
      setSameAsShipping(same);
      setBillingAddress(billing ?? null);
      setStep('shipping');
    },
    []
  );

  // Step 2 → Step 3
  const handleShippingComplete = useCallback(
    (method: typeof shippingMethod) => {
      setShippingMethod(method);
      setStep('payment');
    },
    []
  );

  // Step 3: Submit order → get clientSecret
  const handleSubmitOrder = useCallback(async () => {
    if (!shippingAddress) return;
    setIsLoading(true);
    try {
      const items = cart.serverItems.length > 0 ? cart.serverItems : cart.items;
      const cartItems = (items as unknown as CartItem[]).map((item) => ({
        productId: String(item.productId ?? ''),
        variantId: item.variantId ?? null,
        quantity: Number(item.quantity ?? 1),
      }));

      const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const result = await createCheckout({
        idempotencyKey,
        shippingAddress,
        billingAddress: sameAsShipping
          ? undefined
          : (billingAddress ?? undefined),
        sameAsShipping,
        shippingMethod,
        paymentMethod: 'card',
        cartItems,
      });

      setOrderData(result);
      setClientSecret(result.clientSecret ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create order';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    shippingAddress,
    billingAddress,
    sameAsShipping,
    shippingMethod,
    cart.serverItems,
    cart.items,
  ]);

  const handlePaymentSuccess = useCallback(() => {
    toast.success('Payment successful! Your order has been placed.');
    cart.clearCart();
    if (orderData?.orderNumber) {
      window.location.href = `/cart?order=${orderData.orderId}`;
    }
  }, [cart, orderData]);

  const handlePaymentError = useCallback((error: string) => {
    toast.error(`Payment failed: ${error}`);
    setPaymentProcessing(false);
  }, []);

  const handlePaymentStart = useCallback(() => {
    setPaymentProcessing(true);
  }, []);

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: 'address', label: 'Address' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <StepIndicator steps={steps} currentStep={currentStepIndex} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            {step === 'address' && (
              <AddressStep onComplete={handleAddressComplete} />
            )}

            {step === 'shipping' && (
              <ShippingStep
                onComplete={handleShippingComplete}
                onBack={() => setStep('address')}
              />
            )}

            {step === 'payment' && !clientSecret && (
              <PaymentStep
                onSubmit={handleSubmitOrder}
                onBack={() => setStep('shipping')}
                isLoading={isLoading}
              />
            )}

            {step === 'payment' && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: { colorPrimary: '#000000' },
                  },
                }}
              >
                <StripePaymentForm
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onProcessingChange={handlePaymentStart}
                  isProcessing={paymentProcessing}
                />
              </Elements>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary orderData={orderData} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 3: Review & Submit Order (before Stripe Elements loads).
 */
function PaymentStep({
  onSubmit,
  onBack,
  isLoading,
}: {
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Review Order</h2>
      <p className="text-sm text-gray-500 mb-6">
        Review your order details and click &quot;Place Order&quot; to proceed
        to payment.
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

/**
 * Stripe Payment Form — must be inside <Elements> provider.
 */
function StripePaymentForm({
  onSuccess,
  onError,
  onProcessingChange,
  isProcessing,
}: {
  onSuccess: () => void;
  onError: (error: string) => void;
  onProcessingChange: () => void;
  isProcessing: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    onProcessingChange();

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? 'Payment failed');
    } else {
      onSuccess();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your card details to complete the purchase.
      </p>

      {/* Stripe PaymentElement renders here */}
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      <div className="mt-6 flex gap-4">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
    </form>
  );
}
