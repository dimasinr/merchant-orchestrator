'use client';

import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface JsonViewerProps {
  data: string | object;
  title?: string;
  maxHeight?: string;
}

export function JsonViewer({ data, title, maxHeight = 'max-h-80' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [pretty, setPretty] = useState(true);

  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  const prettyJson = JSON.stringify(parsedData, null, 2);
  const minifiedJson = JSON.stringify(parsedData);

  const handleCopy = () => {
    navigator.clipboard.writeText(pretty ? prettyJson : minifiedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/40">
        <span className="text-zinc-400 font-semibold select-none text-[11px] uppercase tracking-wider">
          {title || 'JSON Payload'}
        </span>
        <div className="flex items-center gap-2">
          {/* Format Toggle */}
          <button
            onClick={() => setPretty(!pretty)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all"
            title={pretty ? 'Minify JSON' : 'Prettify JSON'}
          >
            {pretty ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all flex items-center gap-1 font-sans text-[10px]"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display */}
      <pre
        className={`p-4 overflow-auto ${maxHeight} text-zinc-300 leading-relaxed scrollbar-thin select-text`}
      >
        <code>
          {pretty ? (
            // Colorizing basic parts for extreme fidelity
            prettyJson.split('\n').map((line, idx) => {
              // Regex to match Key vs Value
              const keyValRegex = /^(\s*)"([^"]+)": (.*)$/;
              const match = line.match(keyValRegex);
              if (match) {
                const indent = match[1];
                const key = match[2];
                const val = match[3];

                // Determine value color
                let valSpan = <span className="text-amber-300">{val}</span>; // default string
                if (val.trim() === 'true' || val.trim() === 'false') {
                  valSpan = <span className="text-purple-400">{val}</span>;
                } else if (!isNaN(Number(val.replace(/,$/, '').trim()))) {
                  valSpan = <span className="text-indigo-400">{val}</span>;
                } else if (val.trim() === 'null') {
                  valSpan = <span className="text-zinc-500">{val}</span>;
                }

                return (
                  <div key={idx}>
                    {indent}
                    <span className="text-sky-400">"{key}"</span>: {valSpan}
                  </div>
                );
              }
              return <div key={idx}>{line}</div>;
            })
          ) : (
            <span className="text-sky-400">{minifiedJson}</span>
          )}
        </code>
      </pre>
    </div>
  );
}
