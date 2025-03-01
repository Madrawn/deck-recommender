import { renderStateStepperProps } from "./renderDeckEvaluator";
import { DeckEvaluationState } from "./types";


export const RenderStateStepper: React.FC<renderStateStepperProps> = ({
  evaluationState, handlers,
}) => {
  const stateSteps = [
    { state: DeckEvaluationState.ENTER_DECK_CODE, label: "Enter Deck Code" },
    { state: DeckEvaluationState.FETCHING_CARDS, label: "Fetching Cards" },
    { state: DeckEvaluationState.SUBMITTING, label: "Submitting Cards" },
    { state: DeckEvaluationState.EVALUATING, label: "Evaluating" },
    { state: DeckEvaluationState.DONE, label: "Reset" },
  ];

  return (
    <div className="flex justify-center mb-8">
      {stateSteps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`px-4 py-2 rounded-full ${evaluationState === step.state
                ? step.state === DeckEvaluationState.DONE
                  ? "bg-red-500 text-white cursor-pointer"
                  : "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-600"}`}
            onClick={step.state === DeckEvaluationState.DONE
              ? handlers.handleResetMessages
              : step.state === DeckEvaluationState.ENTER_DECK_CODE
                ? handlers.handleOpenModal
                : undefined}
          >
            {step.label}
          </div>
          {index < stateSteps.length - 1 && (
            <div className="w-8 h-1 bg-gray-300 mx-2"></div>
          )}
        </div>
      ))}
    </div>
  );
};
