import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Terminal as TerminalIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface TerminalProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
  maxHeight?: string;
}

const Terminal: React.FC<TerminalProps> = ({
  code,
  language = "typescript",
  title = "Example",
  showLineNumbers = false,
  className,
  maxHeight = "max-h-[500px]",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom syntax highlighting theme based on our dark theme
  const customStyle = {
    ...coldarkDark,
    'pre[class*="language-"]': {
      ...coldarkDark['pre[class*="language-"]'],
      background: "transparent",
      margin: 0,
      padding: 0,
      overflow: "visible",
      fontFamily:
        'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: "0.875rem",
      lineHeight: "1.5",
    },
    'code[class*="language-"]': {
      ...coldarkDark['code[class*="language-"]'],
      background: "transparent",
      textShadow: "none",
      padding: 0,
      fontFamily:
        'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: "0.875rem",
      lineHeight: "1.5",
    },
  };

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden shadow-xl bg-card border border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center ml-2 text-sm font-medium text-muted-foreground">
            <TerminalIcon size={14} className="mr-1.5" />
            {title}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-rmmbr-400 transition-colors"
        >
          {copied
            ? <Check size={14} className="text-green-500" />
            : <Copy size={14} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <div
        className={cn("overflow-auto p-4 bg-muted/50 terminal-code", maxHeight)}
      >
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          showLineNumbers={showLineNumbers}
          wrapLines={true}
          wrapLongLines={false}
          customStyle={{
            background: "transparent",
            margin: 0,
            padding: 0,
            overflowX: "auto",
          }}
          codeTagProps={{
            className: "font-mono text-sm",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default Terminal;
