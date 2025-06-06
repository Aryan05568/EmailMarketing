import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
            >
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Terms and Conditions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing or using Brainaura.in (“Website”), you agree to be bound by these Terms & Conditions and all applicable laws. If you do not agree, you are not permitted to use this Website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Brainaura.in provides [describe services, e.g., educational content, digital resources, consultancy, etc.]. We reserve the right to modify or discontinue any services without prior notice.
              </p>
              

            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3.  User Responsibilities
              </h2>
             
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>You agree to use the Website only for lawful purposes</li>
                <li>You shall not attempt to gain unauthorized access to the Website or its servers.</li>
                <li>You agree not to reproduce, duplicate, or resell any part of the Website without written permission.</li>
                
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Account Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you create an account, you are responsible for maintaining the confidentiality of your login credentials. You are solely responsible for any activity under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
               All content on Brainaura.in, including logos, text, graphics, and software, is the property of Brainaura or its licensors and is protected by applicable intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We strive to maintain high service availability but do not guarantee uninterrupted service. 
                We reserve the right to modify, suspend, or discontinue the service at any time with or without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Brainaura shall not be liable for any direct, indirect, incidental, or consequential damages arising out of your use or inability to use the Website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Termination
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
               We reserve the right to suspend or terminate your access to the Website at our sole discretion, without notice or liability, for any reason.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
              These Terms are governed by the laws of India. Any disputes arising shall be subject to the jurisdiction of the courts located in [Your City], India.
              </p>
            </section>

            {/* <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
                <br />
                Email: support@emailflow.com
                <br />
                Address: [Your Company Address]
              </p>
            </section> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;