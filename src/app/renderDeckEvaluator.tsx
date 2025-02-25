import { UIMessage } from "ai";
import { Card as HsCard } from "./api/promptGen";
import Markdown from "react-markdown";
import { deckCodeInputModal } from "./deckCodeInputModal";
export default function renderDeckEvaluator(props: {
  deckState: {
    deckCode: string;
    isParsing: boolean;
    errorMessage: string;
    deckAnalysis: HsCard[];
  };
  chatState: {
    messages: UIMessage[];
    status: "error" | "submitted" | "streaming" | "ready";
    error: Error | undefined;
  };
  modalState: {
    isModalOpen: boolean;
    handleCloseModal: () => void;
    handleOpenModal: () => void;
  };
  userRequestState: {
    userRequest: string;
    handleUserRequestChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  handlers: {
    handleDeckCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
  };
}) {
  const { deckState, chatState, modalState, userRequestState, handlers } =
    props;
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-purple-700 text-white p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-3xl font-bold">Hearthstone Deck Evaluator</h1>
          <p className="mt-2">
            Get AI-powered insights and recommendations for your Hearthstone
            deck
          </p>
        </header>

        {!deckState.deckCode ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold mb-4">Evaluate Your Deck</h2>
            <p className="mb-6 text-gray-600">
              Paste your Hearthstone deck code to get an AI evaluation and card
              recommendations
            </p>
            <button
              onClick={modalState.handleOpenModal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Paste Deck Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <button
                onClick={modalState.handleOpenModal}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 w-full"
              >
                Change Deck
              </button>
            </div>

            {/* Evaluation Section */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
              {chatState.messages ? (
                <>
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    AI Evaluations {chatState.status}
                  </h2>
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Analysis</h3>
                    {/*<div className="bg-gray-50 p-4 rounded-md">
                       <pre>{JSON.stringify(status, null, 2)}</pre>
                      <pre>{JSON.stringify(error, null, 2)}</pre>
                      <pre>{JSON.stringify(messages, null, 2)}</pre> 
                    </div>*/}
                  </div>
                  {deckState.isParsing || chatState.status === "submitted"
                    ? renderLoadingSpinner("Analyzing your deck...")
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
                                    <Markdown>{part.text}</Markdown>
                                  </p>
                                );
                              }

                              // reasoning parts:
                              if (part.type === "reasoning") {
                                return (
                                  <pre key={index} className="text-wrap">
                                    {part.details.map((detail) =>
                                      detail.type === "text"
                                        ? detail.text
                                        : "<redacted>"
                                    )}
                                  </pre>
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
