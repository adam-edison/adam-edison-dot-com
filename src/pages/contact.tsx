import { PageLayout } from '@/shared/components/layout/PageLayout';
import { ContactHeader } from '@/features/contact/components/ContactHeader';
import { ContactInfo } from '@/features/contact/components/ContactInfo';
import { ServicesInfo } from '@/features/contact/components/ServicesInfo';
import { FormSection } from '@/features/contact/components/FormSection';
import Head from 'next/head';

export default function Contact() {
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

      <PageLayout>
        <div className="max-w-4xl">
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
