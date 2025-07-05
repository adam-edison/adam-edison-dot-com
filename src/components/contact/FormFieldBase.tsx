import { FieldError } from 'react-hook-form';

interface FormFieldBaseProps {
  id: string;
  label: string;
  required?: boolean;
  error?: FieldError;
  children: React.ReactNode;
}

export function FormFieldBase({ id, label, required = false, error, children }: FormFieldBaseProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
    </div>
  );
}
