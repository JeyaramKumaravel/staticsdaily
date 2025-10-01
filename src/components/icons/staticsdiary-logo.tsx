
import type { LucideProps } from 'lucide-react';

export const StaticsDiaryLogo = (props: LucideProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M7 16V7h9" />
      <path d="M7 12h5" />
      <path d="M12 16v-4" />
    </svg>
  );
};
