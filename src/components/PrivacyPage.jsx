import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sectionClass = "mb-12";
  const headingClass = "text-white text-xl font-serif italic mb-4";
  const textClass = "text-gray-400 text-sm leading-loose";

  return (
    <div className="min-h-screen bg-black pt-24">
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="mb-16 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-4"
            >
              Legal
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-4xl md:text-5xl font-serif italic mb-4"
            >
              Privacy Policy
            </motion.h1>
            <p className="text-gray-500 text-[11px] tracking-widest uppercase">
              Last updated: February 2026
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={sectionClass}>
              <h2 className={headingClass}>Information We Collect</h2>
              <p className={textClass}>
                When you make a purchase or create an account on Lupora, we collect
                personal information such as your name, email address, phone number,
                and shipping address. This information is necessary to process your
                orders and provide you with our services.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>How We Use Your Information</h2>
              <p className={textClass}>
                We use your information to process and fulfill orders, send order
                confirmations and shipping updates, communicate with you about your
                purchases, and improve our products and services. We do not sell or
                share your personal information with third parties for marketing purposes.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Payment Security</h2>
              <p className={textClass}>
                All payment transactions are processed through Razorpay, a secure
                payment gateway. We do not store your credit card or bank account
                details on our servers. Razorpay handles all payment data in compliance
                with PCI-DSS standards.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Cookies &amp; Analytics</h2>
              <p className={textClass}>
                We use essential cookies to maintain your session and shopping cart.
                We may use analytics tools to understand how visitors interact with
                our website, helping us improve the shopping experience. No personally
                identifiable information is shared with analytics providers.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Data Protection</h2>
              <p className={textClass}>
                Your data is stored securely using industry-standard encryption. We
                implement appropriate technical and organizational measures to protect
                your personal information against unauthorized access, alteration,
                disclosure, or destruction.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Your Rights</h2>
              <p className={textClass}>
                You have the right to access, update, or delete your personal information
                at any time. You can manage your account details through your profile,
                or contact us directly for any data-related requests.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Contact Us</h2>
              <p className={textClass}>
                If you have any questions about this Privacy Policy or our data practices,
                please reach out to us through our Instagram{' '}
                <a
                  href="https://www.instagram.com/lupora_perfumes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C5A059] hover:underline"
                >
                  @lupora_perfumes
                </a>{' '}
                or email us at{' '}
                <a href="mailto:chetnavakhari@gmail.com" className="text-[#C5A059] hover:underline">
                  chetnavakhari@gmail.com
                </a>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
