import { UseFormRegister, FieldError } from 'react-hook-form';
import { ContactFormData } from '@/features/contact/ContactFormValidator';
import { FormFieldBase } from './FormFieldBase';
import { CharacterCounter } from './CharacterCounter';

interface TextareaFieldProps {
  id: keyof ContactFormData;
  label: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
  register: UseFormRegister<ContactFormData>;
  error?: FieldError;
  minLength: number;
  maxLength: number;
  watchedValue: string;
  'data-testid'?: string;
}

const textareaClasses =
  'w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 resize-vertical';

export function TextareaField({
  id,
  label,
  placeholder,
  required = false,
  rows = 6,
  register,
  error,
  minLength,
  maxLength,
  watchedValue,
  'data-testid': dataTestId
}: TextareaFieldProps) {
  return (
    <FormFieldBase id={id} label={label} required={required} error={error}>
      <div className="relative">
        <textarea
          {...register(id)}
          id={id}
          rows={rows}
          className={textareaClasses}
          placeholder={placeholder}
          maxLength={maxLength}
          data-testid={dataTestId}
        />
        <CharacterCounter value={watchedValue} minLength={minLength} maxLength={maxLength} />
      </div>
    </FormFieldBase>
  );
}
