export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 11V8.8C7 6.15 9.15 4 11.8 4h.4C14.85 4 17 6.15 17 8.8V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7.6 20h8.8c1.44 0 2.6-1.16 2.6-2.6v-3.8c0-1.44-1.16-2.6-2.6-2.6H7.6C6.16 11 5 12.16 5 13.6v3.8C5 18.84 6.16 20 7.6 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function OpenLockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M17 11V9.2C17 6.33 14.67 4 11.8 4h-.4C8.53 4 6.2 6.33 6.2 9.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7.6 20h8.8c1.44 0 2.6-1.16 2.6-2.6v-3.8c0-1.44-1.16-2.6-2.6-2.6H7.6C6.16 11 5 12.16 5 13.6v3.8C5 18.84 6.16 20 7.6 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M12 14.3v2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
