import { HeaderBanner } from '@/components/HeaderBanner';
import { MainHeader } from '@/components/MainHeader';
import { ContactForm } from '@/components/ContactForm';
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

      <div className="min-h-screen bg-black text-white">
        <HeaderBanner />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <MainHeader />

          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Get In Touch</h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                Have a project in mind or want to discuss software engineering opportunities? I&apos;d love to hear from
                you. Send me a message and I&apos;ll get back to you within 48 hours.
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div>
                <h2 className="text-2xl font-bold mb-6 text-blue-400">Let&apos;s Connect</h2>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Remote (Available Worldwide)</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Usually responds within 24 hours</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                      />
                    </svg>
                    <span>Available for contract and part-time roles</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6 text-blue-400">What I Can Help With</h2>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">▸</span>
                    <span>Full-stack web application development</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">▸</span>
                    <span>Backend API development and architecture</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">▸</span>
                    <span>Cloud infrastructure and DevOps</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">▸</span>
                    <span>Technical consulting and code reviews</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">▸</span>
                    <span>Team leadership and mentoring</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-950 rounded-lg p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">Send me a message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
