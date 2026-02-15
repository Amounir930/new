"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { JsonEditorWrapper } from "./JsonEditorWrapper"
import { Loader2, ArrowLeft } from "lucide-react"

interface BlueprintEditorProps {
    id: string // 'new' or UUID
}

export function BlueprintEditor({ id }: BlueprintEditorProps) {
    const router = useRouter()
    const isNew = id === "new"
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState("")
    const [plan, setPlan] = useState("free")
    const [isDefault, setIsDefault] = useState(false)
    const [json, setJson] = useState("{\n  \"version\": \"1.0\",\n  \"name\": \"Starter Template\",\n  \"settings\": {\n    \"site_name\": \"My Store\",\n    \"currency\": \"USD\"\n  },\n  \"pages\": [],\n  \"products\": []\n}")

    useEffect(() => {
        if (!isNew) {
            fetchBlueprint()
        }
    }, [id])

    const fetchBlueprint = async () => {
        try {
            const data = await apiFetch<any>(`/admin/blueprints/${id}`)
            setName(data.name)
            setPlan(data.plan)
            setIsDefault(data.isDefault)
            // Ensure blueprint is a string for the editor
            const bpString = typeof data.blueprint === 'string' ? data.blueprint : JSON.stringify(data.blueprint, null, 2)
            setJson(bpString)
        } catch (e: any) {
            alert("Failed to load: " + e.message)
            router.push("/super-admin/blueprints")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            let parsedBlueprint
            try {
                parsedBlueprint = JSON.parse(json)
            } catch (e) {
                alert("Invalid JSON")
                setSaving(false)
                return
            }

            const payload = {
                name,
                plan,
                isDefault,
                blueprint: parsedBlueprint,
            }

            if (isNew) {
                await apiFetch("/admin/blueprints", {
                    method: "POST",
                    body: JSON.stringify(payload)
                })
            } else {
                await apiFetch(`/admin/blueprints/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                })
            }

            router.push("/super-admin/blueprints")
        } catch (e: any) {
            alert("Error saving: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{isNew ? "Create Blueprint" : "Edit Blueprint"}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                        <CardDescription>Basic configurations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Gold Starter" />
                        </div>

                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Input value={plan} onChange={e => setPlan(e.target.value)} placeholder="free, basic, pro" />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={isDefault}
                                onChange={e => setIsDefault(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="isDefault">Is Default?</Label>
                        </div>

                        <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Blueprint
                        </Button>
                    </CardContent>
                </Card>

                <Card className="min-h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Blueprint JSON</CardTitle>
                        <CardDescription>Define the starter data schema</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden rounded-b-lg">
                        <JsonEditorWrapper
                            value={json}
                            onChange={(v) => setJson(v || "")}
                            height="600px"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
