import { ContactForm } from './ContactForm';

export function FormSection() {
  return (
    <div className="bg-gray-950 rounded-lg p-8 border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Send me a message</h2>
      <ContactForm />
    </div>
  );
}
