import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Personal Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Name and contact information</li>
                <li>Account credentials</li>
                <li>Email lists and contact data</li>
             
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Usage Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We automatically collect certain information about your use of our service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Log data and usage statistics</li>
                <li>Device and browser information</li>
                <li>IP addresses and location data</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Provide, maintain, and improve our email marketing services</li>
                <li>Process transactions and manage your account</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and optimize our platform</li>
                <li>Comply with legal obligations and protect against fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Cookies & Tracking
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and similar technologies to enhance your browsing experience. You can disable cookies through your browser settings
              </p>
           
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Data Sharing
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell or rent your personal data. We may share your data with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Service providers working on our behalf</li>
                <li>Legal authorities, if required by law.</li>
                <li>Access controls and authentication</li>
                <li>Secure data centers and infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement reasonable security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Access, update, or delete your personal information.</li>
                <li>Withdraw consent at any time (if processing is based on consent).</li>
                <li>Lodge a complaint with a data protection authority</li>
            
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Third-Party Links
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our Website may contain links to other websites. We are not responsible for their privacy practices
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this policy periodically. Please review this page occasionally to stay informed.
              </p>
            </section>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;