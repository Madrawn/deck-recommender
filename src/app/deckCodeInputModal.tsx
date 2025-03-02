import { Card } from "./types";
import { CollectionCard } from "./types";

export function DeckCodeInputModal(props: {
  modalState: {
    isModalOpen: boolean;
  };
  deckState: {
    deckCode: string;
    isParsing: boolean;
    errorMessage: string;
    deckAnalysis: Card[];
  };
  userRequestState: {
    userRequest: string;
    handleUserRequestChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selectedModel: string; // Add selected model
    handleModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Add handler for model change
  };
  handlers: {
    handleDeckCodeChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: () => Promise<void>;
    handleCloseModal: () => void;
    handleOpenModal: () => void;
    handleCollectionUpload: (collection: CollectionCard[]) => void; // Add handler for collection upload
  };
}) {
  const { deckState, userRequestState, handlers } = props;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const collectionFile = e.target.files?.[0] || null;
    if (collectionFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const collection = JSON.parse(event.target?.result as string);
          handlers.handleCollectionUpload(collection);
        } catch (error) {
          console.error("Error parsing collection file:", error);
        }
      };
      reader.readAsText(collectionFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Deck Analysis Request</h3>
            <button
              title="Close Modal"
              onClick={handlers.handleCloseModal}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

          <p className="mb-4 text-gray-600">
            Specify your analysis focus and paste your Hearthstone deck code
            below.
          </p>

          <input
            type="text"
            value={userRequestState.userRequest}
            onChange={userRequestState.handleUserRequestChange}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="What would you like to know about your deck? (Optional)"
          />

          <label htmlFor="model-select" className="sr-only">Select Model</label>
          <select
            id="model-select"
            value={userRequestState.selectedModel}
            onChange={userRequestState.handleModelChange}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="deepseek-reasoner">DeepSeek Reasoner</option>
            <option value="deepseek-coder">DeepSeek Coder</option>
            <option value="deepseek-chat">DeepSeek Chat</option>
          </select>

          <textarea
            value={deckState.deckCode}
            onChange={handlers.handleDeckCodeChange}
            className="whitespace-pre w-full h-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder={`### Deck Name
# Class: ...
# Format: ...
#
# 2x (1) Card Name
# ...
#
...`}
          ></textarea>
          <label htmlFor="collection">Upload a card collection.</label>
          <input
            type="file"
            id="collection"
            accept=".json"
            onChange={handleFileChange}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="mt-4">
            <p className="text-gray-600 mb-2">
              Download the Hearthstone Collection Fetcher tool to generate your
              collection file:
            </p>
            <a
              href="/HearthStoneCollectionFetch.exe"
              download="HearthStoneCollectionFetch.exe"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              Download HearthStoneCollectionFetch.exe
            </a>
            <p className="text-gray-600 mt-2 text-sm">
              Run this executable while Hearthstone is open to generate a
              &quot;collection.json&quot; file containing the cards you own.
            </p>
          </div>
          {deckState.errorMessage && (
            <p className="text-red-500 mt-2">{deckState.errorMessage}</p>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={handlers.handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handlers.handleSubmit();
                handlers.handleCloseModal();
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition duration-200"
              disabled={deckState.isParsing}
            >
              {deckState.isParsing ? "Processing..." : "Analyze Deck"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
