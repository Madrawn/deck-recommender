import { Card } from "./types";
import { DeckEvaluationState } from "./types";

export function renderLoadingSpinner(text: string) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );
}
export const renderCardPlaceholder = (card: Card) => {
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
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold bg-gray-700">
            x{card.count}
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
export const getCostColor = (cost: string) => {
  const costNum = parseInt(cost);
  if (costNum <= 2) return "bg-blue-500";
  if (costNum <= 4) return "bg-green-500";
  if (costNum <= 6) return "bg-yellow-500";
  if (costNum <= 8) return "bg-orange-500";
  return "bg-red-500";
};
export const getStateDescription = (state: DeckEvaluationState) => {
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