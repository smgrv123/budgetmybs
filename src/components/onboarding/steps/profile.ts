import { common, PROFILE_FIELD_CONFIGS } from '@/constants/setup-form.config';
import type { ProfileData, ProfileField } from '@/src/types';
import { getFieldError } from '@/src/validation/onboarding';
import React from 'react';
import { BText } from '../../ui';

type CreateProfileFieldsParams = {
  profile: ProfileData;
  errors: Record<string, string>;
  handleChange: (field: keyof ProfileData, text: string) => void;
};

export const createProfileFields = ({ profile, errors, handleChange }: CreateProfileFieldsParams): ProfileField[] => {
  const currencyIcon = React.createElement(BText, { muted: true }, common.currency);

  return PROFILE_FIELD_CONFIGS.map((config) => {
    const fieldValue =
      config.key === 'name'
        ? profile.name
        : profile[config.key as keyof ProfileData]
          ? String(profile[config.key as keyof ProfileData])
          : '';

    return {
      key: config.key,
      label: config.label,
      placeholder: config.placeholder,
      value: fieldValue,
      onChangeText: (text: string) => handleChange(config.key as keyof ProfileData, text),
      keyboardType: config.keyboardType,
      autoCapitalize: config.autoCapitalize,
      helperText: config.helperText,
      error: getFieldError(errors, config.key),
      leftIcon: config.hasCurrencyIcon ? currencyIcon : undefined,
      icon: config.icon,
    };
  });
};
