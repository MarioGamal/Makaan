import Link from 'next/link';
import { useState } from 'react';

import { authCopy } from '../../i18n/auth';
import { Modal } from '../ui';
import { useLocale } from '../layout/LocaleProvider';

export function SellerAccessDialog({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const { locale } = useLocale();
  const copy = authCopy[locale].seller;
  const [stage, setStage] = useState<'choice' | 'onboarding'>('choice');
  const [step, setStep] = useState(0);
  const slides = [
    {
      title: copy.onboardingOneTitle,
      description: copy.onboardingOneDescription,
      number: '01',
    },
    {
      title: copy.onboardingTwoTitle,
      description: copy.onboardingTwoDescription,
      number: '02',
    },
    {
      title: copy.onboardingThreeTitle,
      description: copy.onboardingThreeDescription,
      number: '03',
    },
  ];
  const resetAndClose = () => {
    setStage('choice');
    setStep(0);
    onClose();
  };

  return (
    <Modal
      closeLabel={copy.onboardingSkip}
      onClose={resetAndClose}
      open={open}
      title={stage === 'choice' ? copy.accessTitle : copy.registerTitle}
    >
      {stage === 'choice' ? (
        <div className="space-y-5">
          <p className="text-ink-muted">{copy.accessDescription}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-ink transition hover:bg-surface-muted"
              href="/auth/login?mode=sign-in"
              onClick={resetAndClose}
            >
              {copy.signInAction}
            </Link>
            <button
              className="min-h-12 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong"
              onClick={() => setStage('onboarding')}
              type="button"
            >
              {copy.registerAction}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {copy.registerEyebrow}
          </p>
          <div
            className="mt-5 flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(${locale === 'ar' ? step * 100 : -step * 100}%)`,
            }}
          >
            {slides.map((slide) => (
              <article className="w-full shrink-0 px-2" key={slide.number}>
                <div className="rounded-[1.5rem] bg-primary p-6 text-white">
                  <p className="text-sm text-white/65">{slide.number}</p>
                  <h3 className="mt-12 font-display text-2xl font-medium leading-tight">
                    {slide.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-white/85">
                    {slide.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <nav
            aria-label={copy.registerTitle}
            className="mt-5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  aria-current={index === step ? 'step' : undefined}
                  aria-label={slide.title}
                  className={`h-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${index === step ? 'w-7 bg-primary' : 'w-2 bg-border hover:bg-primary/40'}`}
                  key={slide.number}
                  onClick={() => setStep(index)}
                  type="button"
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                aria-label={copy.onboardingBack}
                className="grid min-h-11 min-w-11 place-items-center rounded-full border border-border text-lg text-primary transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-35"
                disabled={step === 0}
                onClick={() => setStep((current) => current - 1)}
                type="button"
              >
                {locale === 'ar' ? '→' : '←'}
              </button>
              {step < slides.length - 1 ? (
                <button
                  aria-label={copy.onboardingNext}
                  className="grid min-h-11 min-w-11 place-items-center rounded-full bg-primary text-lg text-white transition hover:bg-primary-strong"
                  onClick={() => setStep((current) => current + 1)}
                  type="button"
                >
                  {locale === 'ar' ? '←' : '→'}
                </button>
              ) : (
                <Link
                  className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"
                  href="/auth/login?mode=register"
                  onClick={resetAndClose}
                >
                  {copy.onboardingStart}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </Modal>
  );
}
