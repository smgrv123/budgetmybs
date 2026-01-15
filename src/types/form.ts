import type { ReactNode } from 'react';

export type FormField = {
  key: string;
  type: 'input' | 'dropdown';
  label?: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  options?: { value: string; label: string }[];
  leftIcon?: ReactNode;
  helperText?: string;
};
