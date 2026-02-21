import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import { isOtherType } from '@/src/constants/onboarding.config';
import type { CustomTypeModalConfig, FormField, ItemCardConfig, ListStepStrings } from '@/src/types';
import { formatIndianNumber, parseFormattedNumber } from '@/src/utils/format';
import { BModal, BText, BView } from '../ui';
import BAddItemButton from './addItemButton';
import BItemForm from './addItemForm';
import BItemCard from './itemCard';
import BCustomTypeModal from './modals/customType';
import BSkipStepButton from './skipStepButton';

export type ListStepProps<T extends { tempId: string }> = {
  // Content
  strings: ListStepStrings;

  // Data
  items: T[];
  itemCardConfig: ItemCardConfig<T>;
  onRemoveItem: (tempId: string) => void;
  onEditItem?: (tempId: string, data: any) => void;

  // Form
  formFields: FormField[];
  initialFormData: Record<string, string>;
  validationSchema: import('zod').ZodType;
  onAddItem: (data: any) => void;
  parseFormData: (formData: Record<string, string>) => any;

  // Navigation
  onNext: () => void;

  // Optional
  extraFormContent?: (formData: Record<string, string>) => ReactNode;
  customTypeModal?: CustomTypeModalConfig;
  nextButtonLabel?: string; // Custom label for settings reuse
  footerContent?: ReactNode; // Additional content above skip/continue button
};

const CURRENCY_FIELDS = ['amount', 'principal', 'targetAmount'];

function ListStep<T extends { tempId: string }>({
  strings,
  items,
  itemCardConfig,
  onRemoveItem,
  onEditItem,
  formFields,
  initialFormData,
  validationSchema,
  onAddItem,
  parseFormData,
  onNext,
  extraFormContent,
  customTypeModal,
  nextButtonLabel,
  footerContent,
}: ListStepProps<T>): React.JSX.Element {
  const scrollViewRef = useRef<ScrollView>(null);

  // ── Add-item form state ──────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Edit-item state ──────────────────────────────────────────────────────
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>(initialFormData);
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // ── Custom type modal state ──────────────────────────────────────────────
  const [showCustomTypeModal, setShowCustomTypeModal] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  // Auto-scroll to add form when it opens
  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [showForm]);

  // ── Field-change helpers (parameterised by which form state to update) ───

  const makeFieldChangeHandler =
    (
      data: Record<string, string>,
      setData: (d: Record<string, string>) => void,
      errors: Record<string, string>,
      setErrors: (e: Record<string, string>) => void
    ) =>
    (key: string, value: string) => {
      let formattedValue = value;
      if (CURRENCY_FIELDS.includes(key)) {
        formattedValue = formatIndianNumber(parseFormattedNumber(value));
      }
      setData({ ...data, [key]: formattedValue });
      if (errors[key]) {
        setErrors({ ...errors, [key]: '' });
      }
    };

  const handleFieldChange = makeFieldChangeHandler(formData, setFormData, formErrors, setFormErrors);
  const handleEditFieldChange = makeFieldChangeHandler(
    editFormData,
    setEditFormData,
    editFormErrors,
    setEditFormErrors
  );

  // ── Dropdown helpers ─────────────────────────────────────────────────────

  const makeDropdownHandler =
    (fieldChangeHandler: (key: string, value: string) => void) => (key: string, value: string | number) => {
      const stringValue = String(value);
      if (isOtherType(stringValue) && customTypeModal) {
        setTimeout(() => setShowCustomTypeModal(true), 500);
      } else {
        fieldChangeHandler(key, stringValue);
      }
    };

  const handleDropdownSelect = makeDropdownHandler(handleFieldChange);
  const handleEditDropdownSelect = makeDropdownHandler(handleEditFieldChange);

  // ── Custom type modal ────────────────────────────────────────────────────

  const handleAddCustomType = () => {
    if (customTypeName.trim()) {
      handleFieldChange('type', 'other');
      setCustomTypeName('');
      setShowCustomTypeModal(false);
    }
  };

  // ── Add-item handlers ────────────────────────────────────────────────────

  const handleAddItemSuccess = (parsedData: any) => {
    onAddItem(parsedData);
    setFormData(initialFormData);
    setFormErrors({});
    setShowForm(false);
  };

  const handleCancelAdd = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleOpenAddForm = () => {
    // Close any active edit session first
    if (editingTempId) {
      handleCancelEdit();
    }
    setShowForm(true);
  };

  // ── Edit-item handlers ───────────────────────────────────────────────────

  const handleStartEdit = (item: T) => {
    // Close add form if open
    if (showForm) {
      setShowForm(false);
      setFormData(initialFormData);
      setFormErrors({});
    }
    setEditingTempId(item.tempId);
    setEditFormData(itemCardConfig.toFormData ? itemCardConfig.toFormData(item) : initialFormData);
    setEditFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingTempId(null);
    setEditFormData(initialFormData);
    setEditFormErrors({});
  };

  const handleSaveEditSuccess = (parsedData: any) => {
    if (editingTempId && onEditItem) {
      onEditItem(editingTempId, parsedData);
    }
    handleCancelEdit();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <BView flex gap="xl">
      <BView>
        <BText variant="heading">{strings.heading}</BText>
        <BText variant="body" muted>
          {strings.subheading}
        </BText>
      </BView>

      <ScrollView ref={scrollViewRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const isEditing = editingTempId === item.tempId;
          const canEdit = !!onEditItem && !!itemCardConfig.toFormData;

          return (
            <Fragment key={item.tempId}>
              {/* Inline edit form — only for the item being edited */}
              {isEditing ? (
                <BItemForm
                  formFields={formFields}
                  formData={editFormData}
                  formErrors={editFormErrors}
                  setFormErrors={setEditFormErrors}
                  validationSchema={validationSchema}
                  parseFormData={parseFormData}
                  onSubmitAction={handleSaveEditSuccess}
                  onCancelAction={handleCancelEdit}
                  onFieldChange={handleEditFieldChange}
                  onDropdownChange={handleEditDropdownSelect}
                  extraFormContent={extraFormContent}
                  submitLabel={strings.form.saveButton}
                  cancelLabel={strings.form.cancelEditButton}
                />
              ) : (
                <BItemCard
                  title={itemCardConfig.getTitle(item)}
                  subtitle={itemCardConfig.getSubtitle?.(item)}
                  amount={itemCardConfig.getAmount(item)}
                  secondaryAmount={itemCardConfig.getSecondaryAmount?.(item)}
                  secondaryLabel={itemCardConfig.secondaryLabel}
                  onDelete={isEditing ? undefined : () => onRemoveItem(item.tempId)}
                  onEdit={canEdit && !isEditing ? () => handleStartEdit(item) : undefined}
                  isEditing={isEditing}
                />
              )}
            </Fragment>
          );
        })}

        {/* Add form / Add button — always visible; tapping Add while editing closes edit first */}
        {showForm ? (
          <BItemForm
            formFields={formFields}
            formData={formData}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            validationSchema={validationSchema}
            parseFormData={parseFormData}
            onSubmitAction={handleAddItemSuccess}
            onCancelAction={handleCancelAdd}
            onFieldChange={handleFieldChange}
            onDropdownChange={handleDropdownSelect}
            extraFormContent={extraFormContent}
            submitLabel={strings.form.addButton}
            cancelLabel={strings.form.cancelButton}
          />
        ) : (
          <BAddItemButton label={strings.addButton} onPress={handleOpenAddForm} />
        )}
      </ScrollView>

      {footerContent}

      <BSkipStepButton
        showSkip={items.length > 0}
        strings={strings}
        onNext={onNext}
        nextButtonLabel={nextButtonLabel}
      />

      {/* Custom Type Modal */}
      {customTypeModal && (
        <BModal
          isVisible={showCustomTypeModal}
          onClose={() => setShowCustomTypeModal(false)}
          title={customTypeModal.title}
        >
          <BCustomTypeModal
            customTypeModal={customTypeModal}
            customTypeName={customTypeName}
            setCustomTypeName={setCustomTypeName}
            handleAddCustomType={handleAddCustomType}
            setShowCustomTypeModal={setShowCustomTypeModal}
          />
        </BModal>
      )}
    </BView>
  );
}

export default ListStep;
