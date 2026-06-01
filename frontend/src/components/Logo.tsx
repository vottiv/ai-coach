/**
 * Логотип AI Coach (ТЗ п. 4.3): четыре сегмента в цветах модулей,
 * сходящиеся в общий центр — связность независимых модулей.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="AI Coach" role="img">
      <circle cx="24" cy="13" r="9" fill="#F97316" opacity="0.92" />
      <circle cx="35" cy="24" r="9" fill="#22C55E" opacity="0.92" />
      <circle cx="24" cy="35" r="9" fill="#3B82F6" opacity="0.92" />
      <circle cx="13" cy="24" r="9" fill="#8B5CF6" opacity="0.92" />
      <circle cx="24" cy="24" r="5" fill="#0a0a0b" />
    </svg>
  );
}
