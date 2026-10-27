import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimecode(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toFixed(1).padStart(4, '0');
  return `${minsStr}:${secsStr}`;
}
