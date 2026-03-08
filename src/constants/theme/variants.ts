export const SpacingValue = {
  NONE: 'none',
  XXS: 'xxs',
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  BASE: 'base',
  LG: 'lg',
  XL: 'xl',
  '2XL': '2xl',
  '3XL': '3xl',
  '4XL': '4xl',
  '5XL': '5xl',
} as const;
export type SpacingValueType = (typeof SpacingValue)[keyof typeof SpacingValue];

export const ButtonVariant = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  DANGER: 'danger',
} as const;
export type ButtonVariantType = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export const InputVariant = {
  DEFAULT: 'default',
  OUTLINE: 'outline',
  FILLED: 'filled',
} as const;
export type InputVariantType = (typeof InputVariant)[keyof typeof InputVariant];

export const TextVariant = {
  HEADING: 'heading',
  SUBHEADING: 'subheading',
  BODY: 'body',
  CAPTION: 'caption',
  LABEL: 'label',
} as const;
export type TextVariantType = (typeof TextVariant)[keyof typeof TextVariant];

export const LinkVariant = {
  DEFAULT: 'default',
  MUTED: 'muted',
} as const;
export type LinkVariantType = (typeof LinkVariant)[keyof typeof LinkVariant];

export const ComponentSize = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
} as const;
export type ComponentSizeType = (typeof ComponentSize)[keyof typeof ComponentSize];

export const CardVariant = {
  DEFAULT: 'default',
  FORM: 'form',
  SUMMARY: 'summary',
  ELEVATED: 'elevated',
} as const;
export type CardVariantType = (typeof CardVariant)[keyof typeof CardVariant];

export const IconFamily = {
  IONICONS: 'ionicons',
  MATERIAL: 'material',
  FEATHER: 'feather',
  FONTAWESOME: 'fontawesome',
} as const;
export type IconFamilyType = (typeof IconFamily)[keyof typeof IconFamily];

export const ModalPosition = {
  CENTER: 'center',
  BOTTOM: 'bottom',
} as const;
export type ModalPositionType = (typeof ModalPosition)[keyof typeof ModalPosition];

export const ToastVariant = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;
export type ToastVariantType = (typeof ToastVariant)[keyof typeof ToastVariant];

export const TransactionType = {
  EXPENSE: 'expense',
  SAVING: 'saving',
} as const;
export type TransactionTypeValue = (typeof TransactionType)[keyof typeof TransactionType];
