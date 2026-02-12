/**
 * Address Form Component
 * Complete address input with country/city dropdowns
 * RTL-aware and validation-ready
 */

"use client"

import * as React from "react"
import { Input } from "../core/input"
import { Label } from "../core/label"
import { cn } from "../core/utils"

export interface AddressFormProps extends React.HTMLAttributes<HTMLDivElement> {
    onAddressChange?: (address: AddressData) => void
    initialAddress?: Partial<AddressData>
    errors?: Partial<Record<keyof AddressData, string>>
}

export interface AddressData {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
}

export function AddressForm({
    className,
    onAddressChange,
    initialAddress,
    errors,
    ...props
}: AddressFormProps) {
    const [address, setAddress] = React.useState<AddressData>({
        street: initialAddress?.street || "",
        city: initialAddress?.city || "",
        state: initialAddress?.state || "",
        postalCode: initialAddress?.postalCode || "",
        country: initialAddress?.country || "EG",
    })

    const handleChange = (field: keyof AddressData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const newAddress = { ...address, [field]: e.target.value }
        setAddress(newAddress)
        onAddressChange?.(newAddress)
    }

    return (
        <div className={cn("space-y-4", className)} {...props}>
            {/* Street Address */}
            <div className="space-y-2">
                <Label htmlFor="street">العنوان / Street Address</Label>
                <Input
                    id="street"
                    type="text"
                    placeholder="123 Main Street"
                    value={address.street}
                    onChange={handleChange("street")}
                    className={errors?.street && "border-destructive"}
                />
                {errors?.street && (
                    <p className="text-sm text-destructive">{errors.street}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div className="space-y-2">
                    <Label htmlFor="city">المدينة / City</Label>
                    <Input
                        id="city"
                        type="text"
                        placeholder="Cairo"
                        value={address.city}
                        onChange={handleChange("city")}
                        className={errors?.city && "border-destructive"}
                    />
                    {errors?.city && (
                        <p className="text-sm text-destructive">{errors.city}</p>
                    )}
                </div>

                {/* State/Province */}
                <div className="space-y-2">
                    <Label htmlFor="state">المحافظة / State</Label>
                    <Input
                        id="state"
                        type="text"
                        placeholder="Cairo"
                        value={address.state}
                        onChange={handleChange("state")}
                        className={errors?.state && "border-destructive"}
                    />
                    {errors?.state && (
                        <p className="text-sm text-destructive">{errors.state}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Postal Code */}
                <div className="space-y-2">
                    <Label htmlFor="postalCode">الرمز البريدي / Postal Code</Label>
                    <Input
                        id="postalCode"
                        type="text"
                        placeholder="11511"
                        value={address.postalCode}
                        onChange={handleChange("postalCode")}
                        className={errors?.postalCode && "border-destructive"}
                    />
                    {errors?.postalCode && (
                        <p className="text-sm text-destructive">{errors.postalCode}</p>
                    )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                    <Label htmlFor="country">الدولة / Country</Label>
                    <select
                        id="country"
                        value={address.country}
                        onChange={handleChange("country")}
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            errors?.country && "border-destructive"
                        )}
                    >
                        <option value="EG">مصر / Egypt</option>
                        <option value="SA">السعودية / Saudi Arabia</option>
                        <option value="AE">الإمارات / UAE</option>
                        <option value="KW">الكويت / Kuwait</option>
                        <option value="QA">قطر / Qatar</option>
                        <option value="BH">البحرين / Bahrain</option>
                        <option value="OM">عمان / Oman</option>
                        <option value="JO">الأردن / Jordan</option>
                        <option value="LB">لبنان / Lebanon</option>
                    </select>
                    {errors?.country && (
                        <p className="text-sm text-destructive">{errors.country}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
