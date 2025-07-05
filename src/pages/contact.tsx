import { PageLayout } from '@/components/layout/PageLayout';
import { ContactHeader } from '@/components/contact/ContactHeader';
import { ContactInfo } from '@/components/contact/ContactInfo';
import { ServicesInfo } from '@/components/contact/ServicesInfo';
import { FormSection } from '@/components/contact/FormSection';
import Head from 'next/head';

interface ContactProps {
  onOpenCommand: () => void;
}

export default function Contact({ onOpenCommand }: ContactProps) {
  return (
    <>
      <Head>
        <title>Contact - Adam Edison</title>
        <meta
          name="description"
          content="Get in touch with Adam Edison for software engineering opportunities and collaborations."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PageLayout onOpenCommand={onOpenCommand}>
        <div className="max-w-4xl mx-auto">
          <ContactHeader />

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <ContactInfo />
            <ServicesInfo />
          </div>

          <FormSection />
        </div>
      </PageLayout>
    </>
  );
}
