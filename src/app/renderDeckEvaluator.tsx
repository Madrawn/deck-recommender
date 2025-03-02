import { UIMessage } from "ai";
import { Card as HsCard } from "./types";
import Markdown from "react-markdown";
import { DeckCodeInputModal } from "./deckCodeInputModal";
import { useMemo, useState } from "react";
import { CollectionCard, DeckEvaluationState } from "./types";
import { getVersion } from "./version";
import {
  getStateDescription,
  renderCardPlaceholder,
  renderLoadingSpinner,
} from "./renderDeckEvaluator.util";
import { RenderStateStepper } from "./RenderStateStepper";

type DeckEvaluatorProps = {
  deckState: {
    deckCode: string;
    isParsing: boolean;
    errorMessage: string;
    deckAnalysis: HsCard[];
    manaCurve: string; // Add manaCurve to deckState
  };
  chatState: {
    promptInput: string;
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
    handleCollectionUpload: (collection: CollectionCard[]) => void; // Add handler for collection upload
  };
  evaluationState: DeckEvaluationState;
  collection: CollectionCard[]; // Add collection to props
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
  const version = useMemo(() => getVersion(), []);
  const toggleReasoning = () => {
    setShowReasoning(!showReasoning);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-purple-700 text-white p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-3xl font-bold">
            Hearthstone Deck Evaluator {version.FullSemVer}{" "}
          </h1>
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
                Your Deck ({deckState.deckAnalysis.length} unique cards)
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
                                        {chatState.promptInput}
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
        DeckCodeInputModal({
          modalState,
          deckState,
          userRequestState,
          handlers,
        })}
    </div>
  );
}
