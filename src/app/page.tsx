
"use client";
import { useState, useEffect } from 'react';
// Types
type Card = {
  cardName: string;
  stats: {
    Description: string;
    Cost: string;
    Attack?: string;
    Health?: string;
    Durability?: string;
    'Card type': string;
    Class?: string;
    Runes?: string;
    Rarity: string;
  };
};

type EvaluationResult = {
  thoughtText: string;
  responseText: string;
  recommendations: Card[];
};

// Mock functions
const getCards = (deckCode: string): Card[] => {
  // This would normally fetch card data from an API
  // For demo purposes, we'll return mock data if the input contains "Zerg Death Knight"
  if (deckCode.includes("Zerg Death Knight")) {
    return [
      { 
        cardName: "Orbital Moon", 
        stats: { 
          Description: "Give a minion Taunt and Lifesteal. If you played an adjacent card this turn, also give it Reborn.", 
          Cost: "1", 
          "Card type": "Spell", 
          Class: "Death Knight", 
          Runes: "2", 
          Rarity: "Common" 
        } 
      },
      { 
        cardName: "Spawning Pool", 
        stats: { 
          Description: "Get a 1/1 Zergling. Deathrattle: Your Zerg minions have Rush, this turn.", 
          Cost: "1", 
          Durability: "2", 
          "Card type": "Location", 
          Rarity: "Common" 
        } 
      },
      { 
        cardName: "Zergling", 
        stats: { 
          Description: "Battlecry: Summon a copy of this.", 
          Cost: "1", 
          Attack: "1", 
          Health: "1", 
          "Card type": "Minion", 
          Rarity: "Rare" 
        } 
      },
      // More cards would be here in a real implementation
    ];
  }
  return [];
};

const sendPrompt = async (cardsArray: Card[]): Promise<EvaluationResult> => {
  // This would normally send the cards to an API for evaluation
  // For demo purposes, we'll return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        thoughtText: "Analyzing the Zerg Death Knight deck... This deck has a strong early game presence with Zerglings and Spawning Pool. The mid-game is supported by Hive Queen and Infestor, which provide value over time. The late game has Kerrigan as a finisher.",
        responseText: "This Zerg Death Knight deck has a good curve and synergy between cards. The Zerg package provides early board presence while Death Knight cards offer control tools. However, the deck could benefit from more card draw and better late-game options.",
        recommendations: [
          { 
            cardName: "Brann Bronzebeard", 
            stats: { 
              Description: "Your Battlecries trigger twice.", 
              Cost: "3", 
              Attack: "2", 
              Health: "4", 
              "Card type": "Minion", 
              Rarity: "Legendary" 
            } 
          },
          { 
            cardName: "Sire Denathrius", 
            stats: { 
              Description: "Lifesteal. Battlecry: Deal 1 damage for each Infused minion. Gain +1/+1 for each damage dealt.", 
              Cost: "10", 
              Attack: "10", 
              Health: "10", 
              "Card type": "Minion", 
              Rarity: "Legendary" 
            } 
          },
          { 
            cardName: "Theotar, the Mad Duke", 
            stats: { 
              Description: "Battlecry: Discover a card in each player's hand. Swap them.", 
              Cost: "4", 
              Attack: "3", 
              Health: "3", 
              "Card type": "Minion", 
              Rarity: "Legendary" 
            } 
          }
        ]
      });
    }, 1000);
  });
};

const HearthstoneDeckEvaluator = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deckCode, setDeckCode] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDeckCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDeckCode(e.target.value);
  };

  const handleSubmit = async () => {
    if (!deckCode.trim()) {
      setError('Please enter a deck code');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Get cards from deck code
      const cardsArray = getCards(deckCode);
      
      if (cardsArray.length === 0) {
        setError('Invalid deck code or no cards found');
        setIsLoading(false);
        return;
      }
      
      setCards(cardsArray);
      
      // Send cards for evaluation
      const result = await sendPrompt(cardsArray);
      setEvaluation(result);
      
      // Close modal after successful submission
      handleCloseModal();
    } catch (err) {
      setError('An error occurred while evaluating the deck');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCardPlaceholder = (card: Card) => {
    const costColor = getCostColor(card.stats.Cost);
    
    return (
      <div key={card.cardName} className="flex flex-col items-center mb-4 w-32">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-32 mb-2 relative overflow-hidden">
          <div className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${costColor}`}>
            {card.stats.Cost}
          </div>
        </div>
        <div className="text-center">
          <p className="font-medium text-sm truncate w-full">{card.cardName}</p>
          <p className="text-xs text-gray-600">{card.stats["Card type"]}</p>
        </div>
      </div>
    );
  };

  const getCostColor = (cost: string) => {
    const costNum = parseInt(cost);
    if (costNum <= 2) return "bg-blue-500";
    if (costNum <= 4) return "bg-green-500";
    if (costNum <= 6) return "bg-yellow-500";
    if (costNum <= 8) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-purple-700 text-white p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-3xl font-bold">Hearthstone Deck Evaluator</h1>
          <p className="mt-2">Get AI-powered insights and recommendations for your Hearthstone deck</p>
        </header>

        {cards.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold mb-4">Evaluate Your Deck</h2>
            <p className="mb-6 text-gray-600">Paste your Hearthstone deck code to get an AI evaluation and card recommendations</p>
            <button 
              onClick={handleOpenModal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Paste Deck Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Deck Cards Section */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-1">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Your Deck ({cards.length} cards)</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {cards.map(card => renderCardPlaceholder(card))}
              </div>
              <button 
                onClick={handleOpenModal}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 w-full"
              >
                Change Deck
              </button>
            </div>

            {/* Evaluation Section */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-1 lg:col-span-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Analyzing your deck...</p>
                </div>
              ) : evaluation ? (
                <>
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">AI Evaluation</h2>
                  
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Analysis</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-700">{evaluation.thoughtText}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Recommendation</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-700">{evaluation.responseText}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Suggested Cards</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {evaluation.recommendations.map(card => renderCardPlaceholder(card))}
                    </div>
                  </div>
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Enter Deck Code</h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mb-4 text-gray-600">Paste your Hearthstone deck code below. You can copy this from the Hearthstone client.</p>
              
              <textarea
                value={deckCode}
                onChange={handleDeckCodeChange}
                className="w-full h-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="### Deck Name&#10;# Class: ...&#10;# Format: ...&#10;#&#10;# 2x (1) Card Name&#10;# ...&#10;#&#10;AAEC..."
              ></textarea>
              
              {error && <p className="text-red-500 mt-2">{error}</p>}
              
              <div className="flex justify-end gap-4 mt-4">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Evaluate Deck'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HearthstoneDeckEvaluator;