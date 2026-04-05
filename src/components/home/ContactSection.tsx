'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Script from 'next/script';
import { CheckCircle2, Send } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const SUCCESS_MODAL_MS = 5000;
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export default function ContactSection() {
  const t = useTranslations('Contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'verifying' | 'sending'>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error' | 'turnstile'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successRunId, setSuccessRunId] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
    token: string;
    honeypot: string;
    elapsedMs: number;
  } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const mountedAtRef = useRef(Date.now());
  const sectionRef = useRef<HTMLElement | null>(null);
  const previewDialogRef = useRef<HTMLDivElement | null>(null);
  const successDialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const isContactInView = useInView(sectionRef, { margin: '240px 0px', once: true });
  const [shouldLoadTurnstile, setShouldLoadTurnstile] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (isContactInView) {
      setShouldLoadTurnstile(true);
    }
  }, [isContactInView]);

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
      setSubmitState('idle');
    };
    window.onTurnstileExpired = () => {
      setTurnstileToken('');
      setSubmitState('turnstile');
    };
    window.onTurnstileError = () => {
      setTurnstileToken('');
      setSubmitState('turnstile');
    };

    return () => {
      delete window.onTurnstileSuccess;
      delete window.onTurnstileExpired;
      delete window.onTurnstileError;
    };
  }, []);

  useEffect(() => {
    if (submitState === 'success') {
      setSuccessRunId((prev) => prev + 1);
      setShowSuccessModal(true);
    }
  }, [submitState]);

  useEffect(() => {
    if (!showSuccessModal) return;
    const timerId = window.setTimeout(() => {
      setShowSuccessModal(false);
      setSubmitState('idle');
    }, SUCCESS_MODAL_MS);
    return () => window.clearTimeout(timerId);
  }, [showSuccessModal]);

  useEffect(() => {
    const dialog = isPreviewOpen ? previewDialogRef.current : showSuccessModal ? successDialogRef.current : null;
    if (!dialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    const focusableElements = getFocusableElements(dialog);
    (focusableElements[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPreviewOpen && !isSubmitting) {
          event.preventDefault();
          setIsPreviewOpen(false);
        } else if (showSuccessModal) {
          event.preventDefault();
          setShowSuccessModal(false);
          setSubmitState('idle');
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusable = getFocusableElements(dialog);
      if (currentFocusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      lastFocusedElementRef.current?.focus();
      lastFocusedElementRef.current = null;
    };
  }, [isPreviewOpen, isSubmitting, showSuccessModal]);

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSubmitState('idle');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isPreviewOpen) return;

    setSubmitState('idle');

    const form = event.currentTarget;
    formRef.current = form;
    const formData = new FormData(form);
    const honeypot = String(formData.get('_gotcha') ?? '').trim();
    const elapsedMs = Date.now() - mountedAtRef.current;
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const subject = String(formData.get('subject') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const token = String(formData.get('cf-turnstile-response') ?? turnstileToken ?? '').trim();

    if (!name || !email || !subject || !message) {
      setSubmitState('error');
      return;
    }

    if (!turnstileSiteKey || !token) {
      setSubmitState('turnstile');
      return;
    }

    setPendingPayload({ name, email, subject, message, token, honeypot, elapsedMs });
    setIsPreviewOpen(true);
  };

  const confirmSubmit = async () => {
    if (!pendingPayload) return;
    setIsSubmitting(true);
    setSubmitPhase('verifying');
    setSubmitState('idle');

    try {
      setSubmitPhase('sending');
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingPayload),
      });

      if (response.ok) {
        formRef.current?.reset();
        window.turnstile?.reset();
        setTurnstileToken('');
        setSubmitState('success');
        setIsPreviewOpen(false);
        setPendingPayload(null);
      } else {
        setSubmitState('error');
      }
    } catch {
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
      setSubmitPhase('idle');
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        {turnstileSiteKey && shouldLoadTurnstile ? (
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer strategy="afterInteractive" />
        ) : null}
        <ScrollReveal direction="none">
          <p className="section-label">{`> send_message`}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 sm:mb-3">{t('heading')}</h2>
          <p className="text-sm text-muted-foreground mb-8 sm:mb-12">{t('description')}</p>
        </ScrollReveal>

        <div className="bento-card bento-card--static p-5 sm:p-8">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              name="_gotcha"
              maxLength={200}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                  {t('name')}
                  <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  placeholder={t('namePlaceholder')}
                  autoComplete="name"
                  className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent placeholder:text-muted-foreground/40"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                  {t('email')}
                  <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  maxLength={320}
                  placeholder={t('emailPlaceholder')}
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                {t('subject')}
                <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                maxLength={160}
                placeholder={t('subjectPlaceholder')}
                autoComplete="off"
                className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent placeholder:text-muted-foreground/40"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                {t('message')}
                <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                maxLength={5000}
                placeholder={t('messagePlaceholder')}
                autoComplete="off"
                className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent resize-none placeholder:text-muted-foreground/40"
              />
            </div>

            {turnstileSiteKey && shouldLoadTurnstile ? (
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onTurnstileSuccess"
                data-expired-callback="onTurnstileExpired"
                data-error-callback="onTurnstileError"
              />
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !turnstileSiteKey || !shouldLoadTurnstile}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
              {isSubmitting ? t('sending') : t('preview')}
            </button>
            <div aria-live="polite" className="min-h-6">
              {submitState === 'turnstile' && <p className="text-sm text-amber-500">{t('turnstileRequired')}</p>}
              {submitState === 'error' && <p className="text-sm text-red-500">{t('error')}</p>}
            </div>
          </form>
        </div>

        {isPreviewOpen && pendingPayload ? (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(event) => {
              if (event.target === event.currentTarget && !isSubmitting) {
                setIsPreviewOpen(false);
              }
            }}
          >
            <div
              ref={previewDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-preview-title"
              aria-describedby="contact-preview-description"
              tabIndex={-1}
              className="w-full max-w-lg max-h-[calc(100svh-2rem)] overflow-y-auto rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl"
            >
              <h3 id="contact-preview-title" className="text-lg font-semibold tracking-tight mb-4">{t('previewTitle')}</h3>
              <p id="contact-preview-description" className="text-xs font-mono text-muted-foreground mb-4">{t('previewDescription')}</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('name')}</p>
                  <p>{pendingPayload.name}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('email')}</p>
                  <p>{pendingPayload.email}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('subject')}</p>
                  <p>{pendingPayload.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('message')}</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{pendingPayload.message}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button type="button" className="btn-outline" onClick={() => setIsPreviewOpen(false)} disabled={isSubmitting}>
                  {t('backToEdit')}
                </button>
                <button type="button" className="btn-primary" onClick={confirmSubmit} disabled={isSubmitting}>
                  {isSubmitting
                    ? submitPhase === 'verifying'
                      ? t('verifying')
                      : t('sending')
                    : t('confirmSend')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showSuccessModal ? (
          <div
            className="fixed inset-0 z-[60] bg-background/75 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeSuccessModal();
              }
            }}
          >
            <motion.div
              ref={successDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-success-title"
              aria-describedby="contact-success-description"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-sm max-h-[calc(100svh-2rem)] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.25 }}
                className="mx-auto mb-4 h-14 w-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={1.6} />
              </motion.div>
              <h3 id="contact-success-title" className="text-lg font-semibold tracking-tight text-center">{t('successTitle')}</h3>
              <p id="contact-success-description" className="mt-2 text-sm text-muted-foreground text-center">{t('success')}</p>
              <p className="mt-1 text-[11px] font-mono text-muted-foreground text-center">{t('successAutoClose')}</p>

              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  key={successRunId}
                  className="h-full success-countdown-bar"
                  style={{ animationDuration: `${SUCCESS_MODAL_MS}ms` }}
                />
              </div>

              <button type="button" className="btn-outline w-full mt-4" onClick={closeSuccessModal}>
                {t('close')}
              </button>
            </motion.div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
