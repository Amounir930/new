"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { setAuthToken, getAuthToken } from "@/lib/api"

export function TokenInput() {
    const [token, setToken] = useState("")

    useEffect(() => {
        const t = getAuthToken()
        if (t) setToken(t)
    }, [])

    const handleSave = () => {
        setAuthToken(token)
        alert("Token saved!")
        window.location.reload()
    }

    return (
        <div className="flex gap-2 items-center">
            <Input
                type="password"
                placeholder="Super Admin Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="max-w-xs"
            />
            <Button onClick={handleSave} variant="outline" size="sm">Save Token</Button>
        </div>
    )
}
