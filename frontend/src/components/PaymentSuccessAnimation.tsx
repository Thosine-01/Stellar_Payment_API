"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";

interface PaymentSuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  amount?: string;
  asset?: string;
  txId?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export const PaymentSuccessAnimation: React.FC<PaymentSuccessAnimationProps> = ({
  show,
  onComplete,
  amount = "0",
  asset = "XLM",
  txId,
}) => {
  const t = useTranslations();
  const hasTriggeredConfettiRef = useRef(false);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) {
      hasTriggeredConfettiRef.current = false;
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
      return;
    }

    if (!hasTriggeredConfettiRef.current) {
      hasTriggeredConfettiRef.current = true;
      confetti({
        particleCount: 140,
        spread: 78,
        startVelocity: 36,
        origin: { y: 0.65 },
        colors: ["#00F5D4", "#6C5CE7", "#00D4AA"],
      });
    }

    completeTimerRef.current = setTimeout(() => {
      onComplete?.();
    }, 4000);

    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    };
  }, [show, onComplete]);

  if (!show) return null;

  const screenReaderMessage =
    t("payment.successAnnounce") ||
    `Payment successful! ${amount} ${asset} has been received.`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        aria-describedby="payment-success-description"
      >
        <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
          {screenReaderMessage}
        </div>

        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-black via-gray-900 to-black p-8 text-center shadow-2xl"
          variants={childVariants}
        >
          <motion.button
            onClick={onComplete}
            className="absolute right-4 top-4 z-10 text-slate-500 transition-colors hover:text-white"
            aria-label={t("common.close") || "Close success animation"}
            variants={childVariants}
          >
            ×
          </motion.button>

          <motion.div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center" variants={childVariants}>
            <motion.div
              className="absolute inset-0 rounded-full bg-accent/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.95, 0.45] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="relative z-10 text-4xl"
              animate={{ scale: [0.9, 1.12, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              aria-hidden="true"
            >
              ?
            </motion.div>
          </motion.div>

          <motion.h1
            id="payment-success-title"
            className="mb-3 text-3xl font-bold tracking-tight text-white"
            variants={childVariants}
          >
            {t("payment.successTitle") || "Payment Successful!"}
          </motion.h1>

          <motion.div className="mb-4 rounded-xl bg-accent/10 p-4" variants={childVariants}>
            <p className="mb-1 text-sm text-slate-400">{t("payment.amountReceived") || "Amount Received"}</p>
            <p className="text-2xl font-bold text-accent">
              {amount} {asset}
            </p>
          </motion.div>

          <motion.p id="payment-success-description" className="mb-6 text-slate-400" variants={childVariants}>
            {t("payment.successMessage") ||
              "Your payment has been processed successfully. The transaction is now confirmed on the Stellar network."}
          </motion.p>

          {txId ? (
            <motion.div className="mb-6 rounded-lg bg-slate-800/50 p-3" variants={childVariants}>
              <p className="mb-1 text-xs text-slate-500">{t("payment.transactionId") || "Transaction ID"}</p>
              <p className="break-all text-xs font-mono text-slate-300">{txId}</p>
            </motion.div>
          ) : null}

          <motion.div className="flex w-full flex-col gap-3" variants={childVariants}>
            <button
              onClick={onComplete}
              className="flex items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-black transition-all hover:bg-accent/90 focus:ring-2 focus:ring-accent/50"
              aria-label={t("common.continue") || "Continue"}
            >
              {t("common.continue") || "Continue"}
            </button>
          </motion.div>

          <motion.p className="sr-only" variants={childVariants}>
            {t("payment.successHint") ||
              "Press the continue button or close button to dismiss this success message."}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentSuccessAnimation;
