import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ShippingPage() {
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
              Policies
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-4xl md:text-5xl font-serif italic mb-4"
            >
              Shipping & Returns
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
              <h2 className={headingClass}>Shipping Within India</h2>
              <p className={textClass}>
                We ship across India through trusted courier partners. Orders are
                typically dispatched within 2–3 business days after confirmation.
                Delivery usually takes 5–7 business days depending on your location.
                You will receive a confirmation email once your order is shipped.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Shipping Charges</h2>
              <p className={textClass}>
                Shipping charges are calculated at checkout based on your delivery
                location. We may offer free shipping on orders above a certain value
                — check the checkout page for any active offers.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Order Tracking</h2>
              <p className={textClass}>
                Once your order is shipped, you can track its status from the
                "My Orders" section in your account. You will also receive tracking
                updates via email.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Returns & Exchanges</h2>
              <p className={textClass}>
                Due to the personal nature of perfumes, we do not accept returns or
                exchanges on opened products. If you receive a damaged or incorrect
                item, please contact us within 48 hours of delivery with photos and
                we will arrange a replacement or refund.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Refunds</h2>
              <p className={textClass}>
                Refunds for eligible cases will be processed within 7–10 business days
                to your original payment method. For Cash on Delivery orders, refunds
                will be made via bank transfer.
              </p>
            </div>

            <div className={sectionClass}>
              <h2 className={headingClass}>Need Help?</h2>
              <p className={textClass}>
                For any shipping or return queries, reach out to us on Instagram{' '}
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
