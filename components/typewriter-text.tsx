"use client";

import { useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export function TypewriterText({ text, className, speed = 55 }: TypewriterTextProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(id);
  }, [count, text.length, speed]);

  const displayed = text.slice(0, count);
  const done = count >= text.length;

  return (
    <span className={className}>
      {displayed.split("\n").map((line, idx, arr) => (
        <span key={idx}>
          {line}
          {idx < arr.length - 1 && <br />}
        </span>
      ))}
      {!done && (
        <span
          className="inline-block w-[3px] h-[0.85em] bg-current align-middle ml-1 relative top-[-0.05em]"
          style={{ animation: "blink 0.8s step-end infinite" }}
        />
      )}
    </span>
  );
}
