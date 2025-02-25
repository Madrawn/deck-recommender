"use client";
import { useCallback, useState, useEffect } from "react";
import { DeckStreamResult, Card as HsCard } from "./api/promptGen";
import renderDeckEvaluator from "./renderDeckEvaluator";
import useDeckChat from "./deckChatService";
import { doEventStream } from "./lib/sse/sse-client";

const HearthstoneDeckEvaluator = () => {
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deckCode, setDeckCode] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Deck data
  const [deckAnalysis, setDeckAnalysis] = useState<HsCard[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [userRequest, setUserRequest] = useState(
    "Can you evaluate this deck and suggest improvements?"
  );

  // Chat API
  const {
    messages,
    resetChat,
    setInput,
    error,
    handleSubmit: handleChatSubmit,
    status,
  } = useDeckChat();

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleDeckCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeckCode(e.target.value);
  };

  const handleError = useCallback((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${context}:`, message);
    setErrorMessage(`${context}: ${message}`);
  }, []);
  // Process deck code and submit to LLM
  useEffect(() => {
    if (status === "ready") resetChat();
  }, [resetChat, status]);

  useEffect(() => {
    if (promptInput) {
      handleChatSubmit();
      console.log("Deck evaluation running...");
    }
  }, [promptInput, handleChatSubmit]);

  const handleSubmit = useCallback(async () => {
    if (!deckCode.trim()) {
      setErrorMessage("Please enter a deck code");
      return;
    }

    setIsParsing(true);
    setErrorMessage("");
    function handleStreamError(): ((error: Error) => void) | undefined {
      return (error) => {
        handleError(error, "Deck evaluation stream failed");
        setIsParsing(false);
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
            setPromptInput(event.data.promptString);
            setInput(event.data.promptString);
            closeStream?.();
            break;
        }
      },
      {
        onError: handleStreamError(),
        onComplete: () => setIsParsing(false),
      }
    );
  }, [deckCode, handleError, setInput]);

  return renderDeckEvaluator({
    deckState: {
      deckCode,
      isParsing,
      errorMessage,
      deckAnalysis,
    },
    chatState: {
      messages,
      status,
      error,
    },
    modalState: {
      isModalOpen,
      handleCloseModal,
      handleOpenModal,
    },
    userRequestState: {
      userRequest,
      handleUserRequestChange: (e) => setUserRequest(e.target.value),
    },
    handlers: {
      handleDeckCodeChange,
      handleSubmit,
    },
  });
};

export default HearthstoneDeckEvaluator;
