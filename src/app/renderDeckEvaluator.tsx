import { UIMessage } from "ai";
import { Card as HsCard } from "./api/promptGen";
import Markdown from "react-markdown";
import { deckCodeInputModal } from "./deckCodeInputModal";
import { useState } from "react";
import { DeckEvaluationState } from "./types";

type renderStateStepperProps = {
  evaluationState: DeckEvaluationState;
  handlers: { handleResetMessages: () => void; handleOpenModal: () => void };
};

export const RenderStateStepper: React.FC<renderStateStepperProps> = ({
  evaluationState,
  handlers,
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
            className={`px-4 py-2 rounded-full ${
              evaluationState === step.state
                ? step.state === DeckEvaluationState.DONE
                  ? "bg-red-500 text-white cursor-pointer"
                  : "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
            onClick={
              step.state === DeckEvaluationState.DONE
                ? handlers.handleResetMessages
                : step.state === DeckEvaluationState.ENTER_DECK_CODE
                ? handlers.handleOpenModal
                : undefined
            }
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

type DeckEvaluatorProps = {
  deckState: {
    deckCode: string;
    isParsing: boolean;
    errorMessage: string;
    deckAnalysis: HsCard[];
    manaCurve: string; // Add manaCurve to deckState
  };
  chatState: {
    messages: UIMessage[];
    status: "error" | "submitted" | "streaming" | "ready";
    error: Error | undefined;
  };
  modalState: {
    isModalOpen: boolean;
  };
  userRequestState: {
    userRequest: string;
    handleUserRequestChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  handlers: {
    handleDeckCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
    handleResetMessages: () => void;
    handleCloseModal: () => void;
    handleOpenModal: () => void;
    stop: () => void;
  };
  evaluationState: DeckEvaluationState;
};

export default function RenderDeckEvaluator(props: DeckEvaluatorProps) {
  const {
    deckState,
    chatState,
    modalState,
    userRequestState,
    handlers,
    evaluationState,
  } = props;
  const [showReasoning, setShowReasoning] = useState(false);

  const toggleReasoning = () => {
    setShowReasoning(!showReasoning);
  };

  const getStateDescription = (state: DeckEvaluationState) => {
    switch (state) {
      case DeckEvaluationState.ENTER_DECK_CODE:
        return "Enter your deck code to begin.";
      case DeckEvaluationState.FETCHING_CARDS:
        return "Fetching cards from the deck code...";
      case DeckEvaluationState.SUBMITTING:
        return "Submitting cards for Analysis...";
      case DeckEvaluationState.EVALUATING:
        return "Evaluating your deck...";
      case DeckEvaluationState.DONE:
        return "Evaluation complete!";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-purple-700 text-white p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-3xl font-bold">Hearthstone Deck Evaluator</h1>
          <p className="mt-2">
            Get AI-powered insights and recommendations for your Hearthstone
            deck
          </p>
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm">
                {getStateDescription(evaluationState)}
              </span>
            </div>
          </div>
        </header>

        <RenderStateStepper
          {...{ evaluationState, handlers, showReasoning, setShowReasoning }}
        />

        {evaluationState === DeckEvaluationState.ENTER_DECK_CODE ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold mb-4">Evaluate Your Deck</h2>
            <p className="mb-6 text-gray-600">
              Paste your Hearthstone deck code to get an AI evaluation and card
              recommendations
            </p>
            <button
              onClick={handlers.handleOpenModal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Paste Deck Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mana Curve Section */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-3">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">
                Mana Curve Analysis
              </h2>
              <pre className="whitespace-pre-wrap">{deckState.manaCurve}</pre>
            </div>

            {/* Deck Cards Section */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-1">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">
                Your Deck ({deckState.deckAnalysis.length} cards)
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {deckState.deckAnalysis.map((card) =>
                  renderCardPlaceholder(card)
                )}
              </div>
            </div>

            {/* Evaluation Section */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
              {chatState.messages ? (
                <>
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    AI Evaluations {chatState.status}
                    {evaluationState === DeckEvaluationState.EVALUATING && (
                      <button
                        onClick={handlers.stop}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ml-4"
                      >
                        Stop
                      </button>
                    )}
                  </h2>

                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Analysis</h3>
                  </div>
                  {evaluationState === DeckEvaluationState.FETCHING_CARDS ||
                  evaluationState === DeckEvaluationState.SUBMITTING
                    ? renderLoadingSpinner(getStateDescription(evaluationState))
                    : chatState.messages
                        .filter((message) => message.role !== "user")
                        .map((message) => (
                          <div key={message.id}>
                            <h3 className="font-semibold text-lg mb-2">
                              {message.role === "user" ? "User: " : "AI: "}
                            </h3>
                            {message.parts.map((part, index) => {
                              // text parts:
                              if (part.type === "text") {
                                return (
                                  <p
                                    className="whitespace-break-spaces"
                                    key={index}
                                  >
                                    <h3 className="font-semibold text-lg mb-2">
                                      Response:
                                    </h3>
                                    <Markdown>
                                      {part.text.replace(/^\s*[\r\n]/gm, "")}
                                    </Markdown>
                                  </p>
                                );
                              }

                              // reasoning parts:
                              if (part.type === "reasoning") {
                                const reasoningText = part.details
                                  .map((detail) =>
                                    detail.type === "text"
                                      ? detail.text
                                      : "<redacted>"
                                  )
                                  .join(" ");
                                return (
                                  <div key={index} className="border-b pb-2">
                                    <h4
                                      className="font-semibold text-lg mb-2 cursor-pointer flex items-center"
                                      onClick={toggleReasoning}
                                    >
                                      <span className="mr-2">
                                        Reasoning ({reasoningText.length}{" "}
                                        characters)
                                      </span>
                                      <span
                                        className={`transform transition-transform ${
                                          showReasoning ? "rotate-90" : ""
                                        }`}
                                      >
                                        ▶
                                      </span>
                                    </h4>
                                    {showReasoning && (
                                      <pre className="text-wrap">
                                        {reasoningText}
                                      </pre>
                                    )}
                                  </div>
                                );
                              }
                            })}
                          </div>
                        ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <p>Submit your deck to see the evaluation</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for deck code input */}
      {modalState.isModalOpen &&
        deckCodeInputModal({
          modalState,
          deckState,
          userRequestState,
          handlers,
        })}
    </div>
  );
}

function renderLoadingSpinner(text: string) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );
}

const renderCardPlaceholder = (card: HsCard) => {
  if ("error" in card && card.error) {
    return (
      <div key={card.cardName} className="flex flex-col items-center mb-4 w-32">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-32 mb-2 relative overflow-hidden">
          <div className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold bg-red-500">
            !
          </div>
        </div>
        <div className="text-center">
          <p className="font-medium text-sm truncate w-full">{card.cardName}</p>
          <p className="text-xs text-gray-600">Error</p>
        </div>
      </div>
    );
  } else if ("stats" in card) {
    const costColor = getCostColor(card.stats.Cost);

    return (
      <div key={card.cardName} className="flex flex-col items-center mb-4 w-32">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-32 mb-2 relative overflow-hidden">
          <div
            className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${costColor}`}
          >
            {card.stats.Cost}
          </div>
        </div>
        <div className="text-center">
          <p className="font-medium text-sm truncate w-full">{card.cardName}</p>
          <p className="text-xs text-gray-600">{card.stats["Card type"]}</p>
        </div>
      </div>
    );
  }
};

const getCostColor = (cost: string) => {
  const costNum = parseInt(cost);
  if (costNum <= 2) return "bg-blue-500";
  if (costNum <= 4) return "bg-green-500";
  if (costNum <= 6) return "bg-yellow-500";
  if (costNum <= 8) return "bg-orange-500";
  return "bg-red-500";
};
