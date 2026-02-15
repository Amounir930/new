"use client";

import { useState } from "react";
import Link from "next/link";

export default function BlueprintEditor({ params }: { params: { id: string } }) {
    const isNew = params.id === "new";
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        plan: "free",
        isDefault: false,
        blueprint: JSON.stringify({
            products: [],
            pages: [],
            settings: {}
        }, null, 2)
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "isDefault" ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const validateJson = (json: string) => {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        // S3 Validation: Client-side JSON check
        if (!validateJson(formData.blueprint)) {
            setError("Invalid JSON format in Blueprint Editor.");
            setSaving(false);
            return;
        }

        try {
            // API Call placeholder
            // await fetch(...)
            console.log("Saving blueprint:", formData);
            alert("Blueprint saved (Simulation)");
        } catch (err) {
            setError("Failed to save blueprint.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">{isNew ? "Create Blueprint" : "Edit Blueprint"}</h1>
                <Link href="/super-admin/blueprints" className="text-gray-500 hover:text-gray-700">
                    Cancel
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Plan</label>
                        <select
                            name="plan"
                            value={formData.plan}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="isDefault"
                        id="isDefault"
                        checked={formData.isDefault}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                        Set as default blueprint for this plan
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Blueprint JSON
                        <span className="text-xs text-gray-500 ml-2">(Products, Pages, Settings)</span>
                    </label>
                    <textarea
                        name="blueprint"
                        value={formData.blueprint}
                        onChange={handleChange}
                        rows={20}
                        className="w-full font-mono text-sm px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Must be valid JSON. Validated strictly on save (S3 Protocol).
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Blueprint"}
                    </button>
                </div>
            </form>
        </div>
    );
}
