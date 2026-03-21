import type { CreditCardProvider } from '@/db/types';
import { CreditCardProviderEnum } from '@/db/types';
import type { BIconProps } from '@/src/components/ui';
import { CREDIT_CARDS_SETTINGS_STRINGS } from '@/src/constants/settings.strings';
import { IconFamily, type IconFamilyType } from '@/src/constants/theme';
import type { DropdownOption } from '@/src/types';

export const CREDIT_CARD_PROVIDER_OPTIONS: DropdownOption[] = [
  { value: CreditCardProviderEnum.VISA, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.visa },
  { value: CreditCardProviderEnum.MASTERCARD, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.mastercard },
  { value: CreditCardProviderEnum.AMEX, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.amex },
  { value: CreditCardProviderEnum.RUPAY, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.rupay },
  { value: CreditCardProviderEnum.DINERS, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.diners },
  { value: CreditCardProviderEnum.DISCOVER, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.discover },
  { value: CreditCardProviderEnum.OTHER, label: CREDIT_CARDS_SETTINGS_STRINGS.providers.other },
];

export const CREDIT_CARD_DATE_FORMATS = {
  dueDate: 'D MMM',
} as const;

export const CREDIT_CARD_ICON_NAMES = {
  card: 'card-outline',
  edit: 'create-outline',
  delete: 'trash-outline',
  add: 'add',
  payBill: 'card-outline',
} as const;

export const CREDIT_CARD_PROVIDER_COLORS: Record<CreditCardProvider, string> = {
  [CreditCardProviderEnum.VISA]: '#1A1F71',
  [CreditCardProviderEnum.MASTERCARD]: '#EB001B',
  [CreditCardProviderEnum.AMEX]: '#2E77BC',
  [CreditCardProviderEnum.RUPAY]: '#097838',
  [CreditCardProviderEnum.DINERS]: '#004A97',
  [CreditCardProviderEnum.DISCOVER]: '#E65C00',
  [CreditCardProviderEnum.OTHER]: '#6B7280',
};

export const CREDIT_CARD_PROVIDER_ICONS: Record<
  CreditCardProvider,
  { name: BIconProps['name']; family: IconFamilyType }
> = {
  [CreditCardProviderEnum.VISA]: { name: 'cc-visa', family: IconFamily.FONTAWESOME },
  [CreditCardProviderEnum.MASTERCARD]: { name: 'cc-mastercard', family: IconFamily.FONTAWESOME },
  [CreditCardProviderEnum.AMEX]: { name: 'cc-amex', family: IconFamily.FONTAWESOME },
  [CreditCardProviderEnum.RUPAY]: { name: CREDIT_CARD_ICON_NAMES.card, family: IconFamily.IONICONS },
  [CreditCardProviderEnum.DINERS]: { name: 'cc-diners-club', family: IconFamily.FONTAWESOME },
  [CreditCardProviderEnum.DISCOVER]: { name: 'cc-discover', family: IconFamily.FONTAWESOME },
  [CreditCardProviderEnum.OTHER]: { name: CREDIT_CARD_ICON_NAMES.card, family: IconFamily.IONICONS },
};
