'use client'

import { useState } from 'react'

interface Props {
  data: object
}

export function RawJsonViewer({ data }: Props) {
  const [copied, setCopied] = useState(false)
  const jsonString = JSON.stringify(data, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-gray-800 text-white p-4 rounded-lg font-mono text-xs">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded text-xs"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="overflow-x-auto whitespace-pre-wrap">{jsonString}</pre>
    </div>
  )
}