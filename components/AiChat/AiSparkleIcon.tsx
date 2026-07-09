export function AiSparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ai-sparkle-gradient" x1="4" y1="4" x2="20" y2="20">
          <stop stopColor="#f43f5e" />
          <stop offset="0.48" stopColor="#a855f7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.8c1.45 4.19 3.01 5.75 7.2 7.2-4.19 1.45-5.75 3.01-7.2 7.2-1.45-4.19-3.01-5.75-7.2-7.2 4.19-1.45 5.75-3.01 7.2-7.2Z"
        fill="url(#ai-sparkle-gradient)"
      />
      <path
        d="M12 7.35c.8 2.32 1.66 3.18 3.98 3.98-2.32.8-3.18 1.66-3.98 3.98-.8-2.32-1.66-3.18-3.98-3.98 2.32-.8 3.18-1.66 3.98-3.98Z"
        fill="#fff"
      />
    </svg>
  )
}
