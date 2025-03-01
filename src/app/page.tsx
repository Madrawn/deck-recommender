"use client";
import { useCallback, useState, useEffect } from "react";
import { DeckStreamResult, Card as HsCard } from "./api/promptGen";
import renderDeckEvaluator from "./renderDeckEvaluator";
import useDeckChat from "./deckChatService";
import { doEventStream } from "./lib/sse/sse-client";
import { CollectionCard, DeckEvaluationState } from "./types";

const HearthstoneDeckEvaluator = () => {
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deckCode, setDeckCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [manaAnalysis, setManaAnalysis] = useState<string>("");

  // Deck data
  const [deckAnalysis, setDeckAnalysis] = useState<HsCard[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [userRequest, setUserRequest] = useState(
    "Can you evaluate this deck and suggest improvements?"
  );
  const [collection, setCollection] = useState<CollectionCard[]>([]); // Add state for collection

  // State tracking
  const [evaluationState, setEvaluationState] = useState<DeckEvaluationState>(
    DeckEvaluationState.ENTER_DECK_CODE
  );

  // Chat API
  const {
    messages,
    resetChat,
    setInput,
    error,
    handleSubmit: handleChatSubmit,
    stop,
    status,
  } = useDeckChat();

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleDeckCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeckCode(e.target.value);
  };

  const handleCollectionUpload = (collection: CollectionCard[]) => {
    setCollection(collection);
  };

  const handleError = useCallback((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${context}:`, message);
    setErrorMessage(`${context}: ${message}`);
  }, []);

  useEffect(() => {
    if (promptInput) {
      handleChatSubmit();
      console.log("Deck evaluation running...");
    }
  }, [promptInput, handleChatSubmit]);

  useEffect(() => {
    if (
      evaluationState === DeckEvaluationState.SUBMITTING &&
      status === "streaming"
    ) {
      setEvaluationState(DeckEvaluationState.EVALUATING);
    }
  }, [evaluationState, status]);
  useEffect(() => {
    if (
      evaluationState === DeckEvaluationState.EVALUATING &&
      status !== "streaming"
    ) {
      setEvaluationState(DeckEvaluationState.DONE);
    }
  }, [evaluationState, status]);

  const handleSubmit = useCallback(async () => {
    if (!deckCode.trim()) {
      setErrorMessage("Please enter a deck code");
      return;
    }

    setEvaluationState(DeckEvaluationState.FETCHING_CARDS);
    setErrorMessage("");
    function handleStreamError(): ((error: Error) => void) | undefined {
      return (error) => {
        handleError(error, "Deck evaluation stream failed");
        setEvaluationState(DeckEvaluationState.ENTER_DECK_CODE);
      };
    }
    const encodedDeck = btoa(deckCode);
    const closeStream = await doEventStream<DeckStreamResult>(
      `/api/deck-eval?d=${encodedDeck}`,
      (event) => {
        switch (event.type) {
          case "card":
            setDeckAnalysis((prev) => [...prev, event.data]);
            break;
          case "error":
            console.error(`Error processing ${event.cardName}:`, event.error);
            break;
          case "complete":
            setManaAnalysis(event.data.manaCurveAnalysis);
            const filteredCollection = JSON.stringify(
              collection
                .filter(
                  (item) =>
                    item.CardDetails.Class.toLowerCase() ===
                      deckCode.match(/# Class: (\w+)/)?.[1].toLowerCase() ||
                    item.CardDetails.Class.toLowerCase() === "neutral"
                )
                .map((item) => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { Type, Class, Rarity, ...rest } = item.CardDetails;
                  // Remove properties with value 0 from the rest object
                  const cleanedStats = Object.fromEntries(
                    Object.entries(rest).filter(([, value]) => value !== 0)
                  );
                  return {
                    ...cleanedStats,
                  };
                })
            );
            const promptWithCollection = `${event.data.promptString}\n\n${userRequest}\n\nThese are the cards I own in my collection and fit into this deck:\n${filteredCollection}`;
            setPromptInput(promptWithCollection);
            setInput(promptWithCollection);
            closeStream?.();
            break;
        }
      },
      {
        onError: handleStreamError(),
        onComplete: () => setEvaluationState(DeckEvaluationState.SUBMITTING),
      }
    );
  }, [deckCode, handleError, collection, userRequest, setInput]);

  return renderDeckEvaluator({
    deckState: {
      deckCode,
      isParsing:
        evaluationState === DeckEvaluationState.FETCHING_CARDS ||
        evaluationState === DeckEvaluationState.SUBMITTING,
      errorMessage,
      deckAnalysis,
      manaCurve: manaAnalysis, // Add manaCurve to deckState
    },
    chatState: {
      promptInput,
      messages,
      status,
      error,
    },
    modalState: {
      isModalOpen,
    },
    userRequestState: {
      userRequest,
      handleUserRequestChange: (e) => setUserRequest(e.target.value),
    },
    handlers: {
      handleDeckCodeChange,
      handleSubmit,
      handleResetMessages: () => {
        resetChat();
        setDeckAnalysis([]);
        setEvaluationState(DeckEvaluationState.ENTER_DECK_CODE);
      },
      handleCloseModal,
      handleOpenModal,
      stop,
      handleCollectionUpload, // Pass collection upload handler
    },
    evaluationState,
    collection, // Pass collection data
  });
};

export default HearthstoneDeckEvaluator;
