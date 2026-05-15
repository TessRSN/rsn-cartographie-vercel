"use client";

import React, { useState, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { cn } from "@/app/lib/cn";

const stepIcon = (children: React.ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const stepIds = ["welcome", "graph", "cards", "table", "map"] as const;

const stepIcons: Record<(typeof stepIds)[number], React.ReactNode> = {
  welcome: stepIcon(<><path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L16.18 19 12 15.27 7.82 19l1.09-6.26L3.82 9l6.09-.74z"/></>),
  graph: stepIcon(<><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><line x1="8.5" y1="7.5" x2="15.5" y2="16.5"/><line x1="15.5" y1="7.5" x2="8.5" y2="16.5"/></>),
  cards: stepIcon(<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/></>),
  table: stepIcon(<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></>),
  map: stepIcon(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>),
};

export function OnboardingModal() {
  const t = useTranslations("onboarding");
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = stepIds.map((id, index) => ({
    id: index + 1,
    title: t(`steps.${id}.title`),
    description: t(`steps.${id}.description`),
    tip: t(`steps.${id}.tip`),
    icon: stepIcons[id],
  }));

  useEffect(() => {
    // Check if user has already seen the onboarding
    const seen = localStorage.getItem("hasSeenOnboarding");
    if (seen !== "true") {
      setOpen(true);
    }
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          handleSkip();
          break;
        case "ArrowRight":
        case " ":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    handleFinish();
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <Fragment>
      <button
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all font-semibold"
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "#e2e8f0",
        }}
        onClick={() => {
          setOpen(true);
        }}
        aria-label={t("openAriaLabel")}
      >
        ?
      </button>
      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-xs animate-fadeIn" />

          {/* Modal */}
          <div className="relative bg-base-200 rounded-2xl shadow-2xl max-w-2xl w-full h-[70vh] mx-4 overflow-hidden animate-slideUp flex flex-col gap-4">
            {/* Header */}
            <div className="bg-base-300 text-base-content px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t("title")}</h2>
                <button
                  onClick={handleSkip}
                  aria-label={t("closeAriaLabel")}
                  className="text-base-content/50 hover:text-base-content transition-colors p-1 rounded-full hover:bg-base-content/10"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 flex-1 flex flex-col text-base-content justify-around overflow-y-auto">
              <div className="text-center flex items-center justify-center gap-3 w-full px-12">
                <span className="text-base-content/60 flex-shrink-0">{currentStepData.icon}</span>
                <h3 className="text-xl font-bold">
                  {currentStepData.title}
                </h3>
              </div>

              <div className="space-y-4 flex flex-col">
                <p className="text-base leading-relaxed px-4 text-center flex-1">
                  {currentStepData.description}
                </p>

                <div className="bg-base-100 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <p className="text-sm text-base-content/70">
                    {currentStepData.tip}
                  </p>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex justify-center gap-2 pt-4">
                {onboardingSteps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentStep ? "bg-primary w-6" : "bg-base-300"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-base-300 px-8 py-6 flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="btn btn-soft"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>{t("previous")}</span>
              </button>

              <button onClick={handleNext} className="btn btn-soft">
                <span>
                  {currentStep === onboardingSteps.length - 1
                    ? t("finish")
                    : t("next")}
                </span>
                {currentStep < onboardingSteps.length - 1 && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
              <span>{t("keyboardHint")}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Fragment>
  );
}
