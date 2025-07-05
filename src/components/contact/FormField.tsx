import { UseFormRegister, FieldError } from 'react-hook-form';
import { ContactFormData } from '@/lib/validations/contact';
import { CharacterCounter } from './CharacterCounter';

interface FormFieldProps {
  id: keyof ContactFormData;
  label: string;
  type?: 'text' | 'email' | 'textarea';
  placeholder: string;
  required?: boolean;
  rows?: number;
  register: UseFormRegister<ContactFormData>;
  error?: FieldError;
  maxLength?: number;
  minLength?: number;
  watchedValue?: string;
}

const inputClasses =
  'w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500';

export function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  required = false,
  rows,
  register,
  error,
  minLength,
  maxLength,
  watchedValue
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            {...register(id)}
            id={id}
            rows={rows || 6}
            className={`${inputClasses} resize-vertical`}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        ) : (
          <input
            {...register(id)}
            type={type}
            id={id}
            className={inputClasses}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        )}

        {type === 'textarea' && maxLength && minLength && (
          <CharacterCounter value={watchedValue || ''} minLength={minLength} maxLength={maxLength} />
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
    </div>
  );
}
