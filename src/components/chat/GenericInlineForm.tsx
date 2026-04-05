/**
 * GenericInlineForm
 *
 * Renders any registry-based intent's form from its declarative config.
 * Field types: text, number, picker, date, static.
 * Delete intents use formType: 'deleteConfirm' and render a danger confirmation.
 */
import { INTENT_REGISTRY } from '@/src/constants/chatRegistry.config';
import { CHAT_REGISTRY_STRINGS } from '@/src/constants/chat.registry.strings';
import { ButtonVariant, SpacingValue, TextVariant } from '@/src/constants/theme';
import { useThemeColors } from '@/src/hooks/theme-hooks/use-theme-color';
import { useFormOptionSources } from '@/src/hooks';
import type { FormFieldDef } from '@/src/types';
import { BButton, BDateField, BDropdown, BIcon, BInput, BText, BView } from '@/src/components/ui';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

// ── Props ─────────────────────────────────────────────────────────────────────

interface GenericInlineFormProps {
  intent: string;
  initialValues: Record<string, string>;
  onConfirm: (formValues: Record<string, string>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

const GenericInlineForm: FC<GenericInlineFormProps> = ({
  intent,
  initialValues,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  const themeColors = useThemeColors();
  const optionSources = useFormOptionSources();
  const entry = INTENT_REGISTRY[intent];

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-apply initial values when they resolve asynchronously (e.g. after categories load)
  useEffect(() => {
    setValues((prev) => {
      // Merge: only overwrite empty fields with a non-empty resolved value
      const merged: Record<string, string> = { ...prev };
      for (const [k, v] of Object.entries(initialValues)) {
        if (!prev[k] && v) {
          merged[k] = v;
        }
      }
      return merged;
    });
  }, [initialValues]); // only merge on changes to initialValues — intentionally not including `values` to avoid loop

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleSubmit = () => {
    if (!entry) return;
    const errors = entry.validate(values);
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onConfirm(values);
  };

  if (!entry) return null;

  // ── Delete confirm form ───────────────────────────────────────────────────

  if (entry.formType === 'deleteConfirm') {
    const entityName = values[Object.keys(values)[0] ?? ''] ?? '';
    return (
      <BView
        rounded={SpacingValue.LG}
        border
        padding={SpacingValue.MD}
        gap={SpacingValue.MD}
        bg={themeColors.card}
        style={{ borderColor: themeColors.danger }}
      >
        <BView row align="center" gap={SpacingValue.XS}>
          <BIcon name="warning-outline" size={20} color={themeColors.danger} />
          <BText variant={TextVariant.LABEL} color={themeColors.danger} style={{ fontWeight: '600' }}>
            {entry.title}
          </BText>
        </BView>

        <BText variant={TextVariant.BODY} muted>
          {CHAT_REGISTRY_STRINGS.DELETE_CONFIRM_BODY_PREFIX}{' '}
          <BText variant={TextVariant.BODY} color={themeColors.text}>
            {entityName}
          </BText>
          {CHAT_REGISTRY_STRINGS.DELETE_CONFIRM_BODY_SUFFIX}
        </BText>

        <BView row gap={SpacingValue.SM}>
          <BButton variant={ButtonVariant.OUTLINE} onPress={onCancel} disabled={isSubmitting} fullWidth>
            <BText variant={TextVariant.LABEL}>{CHAT_REGISTRY_STRINGS.FORM_CANCEL}</BText>
          </BButton>
          <BButton
            variant={ButtonVariant.DANGER}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            fullWidth
          >
            <BText variant={TextVariant.LABEL} color={themeColors.white}>
              {isSubmitting ? CHAT_REGISTRY_STRINGS.FORM_DELETING : entry.submitLabel}
            </BText>
          </BButton>
        </BView>
      </BView>
    );
  }

  // ── Default form ─────────────────────────────────────────────────────────

  return (
    <BView rounded={SpacingValue.LG} border padding={SpacingValue.MD} gap={SpacingValue.MD} bg={themeColors.card}>
      <BText variant={TextVariant.SUBHEADING}>{entry.title}</BText>

      {entry.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values[field.key] ?? ''}
          allValues={values}
          optionSources={optionSources}
          onChange={handleChange}
          error={fieldErrors[field.key]}
        />
      ))}

      <BView row gap={SpacingValue.SM}>
        <BButton variant={ButtonVariant.OUTLINE} onPress={onCancel} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.text}>
            {CHAT_REGISTRY_STRINGS.FORM_CANCEL}
          </BText>
        </BButton>
        <BButton variant={entry.buttonVariant} onPress={handleSubmit} disabled={isSubmitting} style={{ flex: 1 }}>
          <BText variant={TextVariant.LABEL} color={themeColors.white}>
            {isSubmitting ? CHAT_REGISTRY_STRINGS.FORM_SUBMITTING : entry.submitLabel}
          </BText>
        </BButton>
      </BView>
    </BView>
  );
};

// ── Field Renderer ────────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: FormFieldDef;
  value: string;
  allValues: Record<string, string>;
  optionSources: ReturnType<typeof useFormOptionSources>;
  onChange: (key: string, val: string) => void;
  error?: string;
}

const FieldRenderer: FC<FieldRendererProps> = ({ field, value, allValues, optionSources, onChange, error }) => {
  const themeColors = useThemeColors();
  // Hooks must be called unconditionally — conditional display is handled below
  const options = field.optionsSource ? (optionSources[field.optionsSource] ?? []) : [];

  // Handle conditional display after all hooks
  if (field.showIf) {
    const conditionValue = allValues[field.showIf.field] ?? '';
    if (conditionValue !== field.showIf.equals) {
      return null;
    }
  }

  const fieldNode = (() => {
    switch (field.type) {
      case 'text':
        return (
          <BInput
            label={field.label}
            value={value}
            onChangeText={(val) => onChange(field.key, val)}
            placeholder={field.placeholder ?? field.label}
            keyboardType="default"
          />
        );

      case 'number':
        return (
          <BInput
            label={field.label}
            value={value}
            onChangeText={(val) => onChange(field.key, val)}
            placeholder={field.placeholder ?? '0'}
            keyboardType="numeric"
          />
        );

      case 'picker':
        return (
          <BDropdown
            label={field.label}
            options={options}
            value={value}
            onValueChange={(v) => onChange(field.key, String(v))}
            searchable
            modalTitle={field.modalTitle ?? field.label}
            placeholder={field.pickerPlaceholder}
          />
        );

      case 'date':
        return <BDateField label={field.label} value={value} onChange={(val) => onChange(field.key, val)} />;

      case 'static':
        return (
          <BView gap={SpacingValue.XS}>
            <BText variant={TextVariant.CAPTION} muted>
              {field.label}
            </BText>
            <BText variant={TextVariant.BODY}>{value}</BText>
          </BView>
        );

      default:
        return null;
    }
  })();

  if (!fieldNode) return null;

  return (
    <BView gap={SpacingValue.XS}>
      {fieldNode}
      {!!error && (
        <BText variant={TextVariant.CAPTION} color={themeColors.danger}>
          {error}
        </BText>
      )}
    </BView>
  );
};

export default GenericInlineForm;
