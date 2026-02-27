"use client";

import { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import { cn } from "@/app/lib/cn";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const onboardingSteps = [
  {
    id: 1,
    title: "Manipuler et faire tourner le graphique",
    description:
      "En maintenant le clic gauche de la souris, vous pouvez faire tourner le graphique en 3D pour explorer les relations sous différents angles.",
    image: "/mouse_leftclick-optimized.svg",
    action:
      "Tenez le clic gauche et faites glisser pour faire tourner le graphique",
    tip: "💡 Les résultats apparaîtront automatiquement pendant que vous tapez!",
  },
  {
    id: 2,
    title: "Naviguer dans le diagramme",
    description:
      " Vous pouvez zoomer pour voir plus de détails ou vous éloigner pour avoir une vue d'ensemble. Faites glisser pour déplacer la vue et explorer différentes zones du réseau.",
    image: "/mouse_scroll-optimized.svg",
    action:
      "Utilisez la molette de la souris pour zoomer, le zoom ira dans la direction du curseur",
    tip: "💡 Maintenez enfoncé et faites glisser pour déplacer la vue!",
  },
  {
    id: 3,
    title: "Voir les détails",
    description:
      "Découvrez des informations détaillées sur chaque élément du réseau. Faites un clic droit sur n'importe quel nœud (organisation, personne, dataset, ou application) pour ouvrir une carte détaillée avec toutes les informations disponibles.",
    image: "/mouse_rightclick-optimized.svg",
    action: "Clic droit sur un nœud pour afficher ses détails",
    tip: "💡 Chaque type de nœud a une couleur différente : bleu pour les organisations, vert pour les personnes, jaune pour les datasets, rouge pour les applications!",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
        className="btn btn-ghost"
        onClick={() => {
          setOpen(true);
        }}
      >
        ?
      </button>
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center animate-fadeIn",
          !open && "hidden"
        )}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-xs animate-fadeIn" />

        {/* Modal */}
        <div className="relative bg-base-200 rounded-2xl shadow-2xl max-w-2xl w-full h-[60vh] mx-4 overflow-hidden animate-slideUp flex flex-col gap-4">
          {/* Header */}
          <div className="bg-base-300 text-base-content px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Guide d'utilisation</h2>
              <button
                onClick={handleSkip}
                className="text-red-500 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <svg
                  className="w-6 h-6"
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
          <div className="p-8 flex-1 flex flex-col  text-base-content justify-around">
            <div className="text-center flex items-center justify-center gap-4 w-full px-12">
              <h3 className="text-xl font-bold  mb-2">
                {currentStepData.title}
              </h3>
            </div>

            <div className="space-y-4 flex flex-col">
              <p className="text-lg leading-relaxed px-4 text-center flex-1">
                {currentStepData.description}
              </p>

              <div className="bg-base-100 border-l-4 border-blue-400 p-4 rounded-r-lg flex justify-between gap-4">
                <div className="avatar ">
                  <div className="w-16 rounded-full">
                    <img
                      src={currentStepData.image}
                      alt={currentStepData.title}
                      className="size-32"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-base-content  mb-1">
                    Action :
                  </p>
                  <p className="text-base-content">{currentStepData.action}</p>
                </div>
              </div>
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
              <span>Précédent</span>
            </button>

            <button onClick={handleNext} className="btn btn-soft">
              <span>
                {currentStep === onboardingSteps.length - 1
                  ? "Terminer"
                  : "Suivant"}
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
            <span>Utilisez ← → ou Échap pour naviguer</span>
          </div>
        </div>
      </div>{" "}
    </Fragment>
  );
}
