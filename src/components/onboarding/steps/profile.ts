import { common, PROFILE_FIELD_CONFIGS } from '@/src/constants/setup-form.config';
import type { ProfileData, ProfileField } from '@/src/types';
import { formatIndianNumber } from '@/src/utils/format';
import { getFieldError } from '@/src/validation/onboarding';
import React from 'react';
import { BText } from '../../ui';

type CreateProfileFieldsParams = {
  profile: ProfileData;
  errors: Record<string, string>;
  handleChange: (field: keyof ProfileData, text: string) => void;
};

/**
 * Get the formatted field value for display
 */
const getFieldValue = (profile: ProfileData, key: string): string => {
  if (key === 'name') return profile.name;

  const value = profile[key as keyof ProfileData];
  if (!value) return '';
  return formatIndianNumber(value);
};

export const createProfileFields = ({ profile, errors, handleChange }: CreateProfileFieldsParams): ProfileField[] => {
  const currencyIcon = React.createElement(BText, { muted: true }, common.currency);

  return PROFILE_FIELD_CONFIGS.map((config) => ({
    key: config.key,
    label: config.label,
    placeholder: config.placeholder,
    value: getFieldValue(profile, config.key),
    onChangeText: (text: string) => handleChange(config.key as keyof ProfileData, text),
    keyboardType: config.keyboardType,
    autoCapitalize: config.autoCapitalize,
    helperText: config.helperText,
    error: getFieldError(errors, config.key),
    leftIcon: config.hasCurrencyIcon ? currencyIcon : undefined,
    icon: config.icon,
  }));
};
