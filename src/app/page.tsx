"use client";
import { useCallback, useState, useEffect } from "react";
import generatePromptFromDeckString, { Card as HsCard } from "./api/promptGen";
import { useChat } from "@ai-sdk/react";
import renderDeckEvaluator from "./renderDeckEvaluator";

const HearthstoneDeckEvaluator = () => {
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deckCode, setDeckCode] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Deck data
  const [cards, setCards] = useState<{
    promptString: string;
    enrichedCards: HsCard[];
  }>({
    promptString: "",
    enrichedCards: [],
  });

  // Chat API
  const {
    messages,
    setMessages,
    setInput,
    error,
    handleSubmit: handleChatSubmit,
    status,
  } = useChat({
    onError: (error) => {
      console.error(error);
      setErrorMessage(
        "Error from chat API: " + (error.message || "Unknown error")
      );
    },
  });

  // Modal handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleDeckCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeckCode(e.target.value);
  };
  // Process deck code and submit to LLM

  useEffect(() => {
    if (cards.promptString) {
      handleChatSubmit();
      console.log("Deck evaluation running...");
    }
  }, [cards.promptString, handleChatSubmit]);

  const handleSubmit = useCallback(async () => {
    if (!deckCode.trim()) {
      setErrorMessage("Please enter a deck code");
      return;
    }

    setIsParsing(true);
    setErrorMessage("");

    try {
      // Close modal first
      handleCloseModal();

      // Parse deck code
      console.log("Fetching cards from deck code...");
      const cardPrompt = await generatePromptFromDeckString(deckCode);

      if (!cardPrompt || cardPrompt.enrichedCards.length === 0) {
        setErrorMessage("Invalid deck code or no cards found");
        return;
      }

      // Update cards state for UI
      setCards(cardPrompt);

      // Reset chat history
      setMessages([]);

      // Set the input and submit
      setInput(cardPrompt.promptString);
    } catch (err) {
      console.error(err);
      setErrorMessage("An error occurred while evaluating the deck");
    } finally {
      setIsParsing(false);
    }
  }, [deckCode, handleChatSubmit, setInput, setMessages]);

  return renderDeckEvaluator(
    deckCode,
    handleOpenModal,
    cards,
    isParsing,
    messages,
    status,
    error,
    isModalOpen,
    handleCloseModal,
    handleDeckCodeChange,
    errorMessage,
    handleSubmit
  );
};

export default HearthstoneDeckEvaluator;
