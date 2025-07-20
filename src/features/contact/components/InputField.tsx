import { UseFormRegister, FieldError } from 'react-hook-form';
import { ContactFormData } from '@/features/contact/ContactFormValidator';
import { FormFieldBase } from './FormFieldBase';

interface InputFieldProps {
  id: keyof ContactFormData;
  label: string;
  type: 'text' | 'email';
  placeholder: string;
  required?: boolean;
  register: UseFormRegister<ContactFormData>;
  error?: FieldError;
  maxLength?: number;
  'data-testid'?: string;
}

const inputClasses =
  'w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500';

export function InputField({
  id,
  label,
  type,
  placeholder,
  required = false,
  register,
  error,
  maxLength,
  'data-testid': dataTestId
}: InputFieldProps) {
  return (
    <FormFieldBase id={id} label={label} required={required} error={error}>
      <input
        {...register(id)}
        type={type}
        id={id}
        className={inputClasses}
        placeholder={placeholder}
        maxLength={maxLength}
        data-testid={dataTestId}
      />
    </FormFieldBase>
  );
}
