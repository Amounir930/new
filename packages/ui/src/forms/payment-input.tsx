/**
 * Payment Input Component
 * Specialized input for credit card details with validation
 * RTL-aware and fully accessible
 */

"use client"

import * as React from "react"
import { Input } from "../core/input"
import { Label } from "../core/label"
import { cn } from "../core/utils"

export interface PaymentInputProps extends React.HTMLAttributes<HTMLDivElement> {
    onCardNumberChange?: (value: string) => void
    onExpiryChange?: (value: string) => void
    onCVVChange?: (value: string) => void
    errors?: {
        cardNumber?: string
        expiry?: string
        cvv?: string
    }
}

export function PaymentInput({
    className,
    onCardNumberChange,
    onExpiryChange,
    onCVVChange,
    errors,
    ...props
}: PaymentInputProps) {
    const [cardNumber, setCardNumber] = React.useState("")
    const [expiry, setExpiry] = React.useState("")
    const [cvv, setCVV] = React.useState("")

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ""
        const parts = []

        for (let i = 0; i < match.length; i += 4) {
            parts.push(match.substring(i, i + 4))
        }

        if (parts.length) {
            return parts.join(" ")
        } else {
            return value
        }
    }

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4)
        }

        return v
    }

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value)
        setCardNumber(formatted)
        onCardNumberChange?.(formatted.replace(/\s/g, ""))
    }

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatExpiry(e.target.value)
        setExpiry(formatted)
        onExpiryChange?.(formatted)
    }

    const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/gi, "").substring(0, 4)
        setCVV(value)
        onCVVChange?.(value)
    }

    return (
        <div className={cn("space-y-4", className)} {...props}>
            {/* Card Number */}
            <div className="space-y-2">
                <Label htmlFor="card-number">رقم البطاقة / Card Number</Label>
                <Input
                    id="card-number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    className={cn(
                        "font-mono",
                        errors?.cardNumber && "border-destructive focus-visible:ring-destructive"
                    )}
                    dir="ltr"
                />
                {errors?.cardNumber && (
                    <p className="text-sm text-destructive">{errors.cardNumber}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="space-y-2">
                    <Label htmlFor="expiry">تاریخ الانتهاء / Expiry</Label>
                    <Input
                        id="expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className={cn(
                            "font-mono",
                            errors?.expiry && "border-destructive focus-visible:ring-destructive"
                        )}
                        dir="ltr"
                    />
                    {errors?.expiry && (
                        <p className="text-sm text-destructive">{errors.expiry}</p>
                    )}
                </div>

                {/* CVV */}
                <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={handleCVVChange}
                        maxLength={4}
                        className={cn(
                            "font-mono",
                            errors?.cvv && "border-destructive focus-visible:ring-destructive"
                        )}
                        dir="ltr"
                    />
                    {errors?.cvv && (
                        <p className="text-sm text-destructive">{errors.cvv}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
