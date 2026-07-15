import { clsx, type ClassValue } from 'clsx';

/** Conditional className helper used across the hub UI primitives. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
