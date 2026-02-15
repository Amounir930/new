"use client"

import Editor from "@monaco-editor/react"

interface JsonEditorProps {
    value: string
    onChange: (value: string | undefined) => void
    readOnly?: boolean
    height?: string
}

export function JsonEditorWrapper({ value, onChange, readOnly = false, height = "500px" }: JsonEditorProps) {
    // Simple default theme

    return (
        <div className="border rounded-md overflow-hidden">
            <Editor
                height={height}
                defaultLanguage="json"
                value={value}
                onChange={onChange}
                theme="vs-dark" // hardcoded dark for "Wow" effect or make dynamic check
                options={{
                    minimap: { enabled: false },
                    readOnly,
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                }}
            />
        </div>
    )
}
