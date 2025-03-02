export enum DeckEvaluationState {
  ENTER_DECK_CODE = 'ENTER_DECK_CODE',
  FETCHING_CARDS = 'FETCHING_CARDS',
  SUBMITTING = 'SUBMITTING',
  EVALUATING = 'EVALUATING',
  DONE = 'DONE'
}

export interface CollectionCard {
  Name: string
  TotalCount: number
  CardDetails: {
    Name: string
    Text: string
    Cost: number
    Attack: number
    Health: number
    Durability: number
    Type: string
    Class: string
    Rarity: string
  }
}
type CardClass = 'MAGE' | 'HUNTER' | 'PRIEST' | 'NEUTRAL' | string // Allow other potential classes

type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | string

type Mechanics =
  | 'SECRET'
  | 'BATTLECRY'
  | 'DEATHRATTLE'
  | 'INSPIRE'
  | 'HEROPOWER_DAMAGE'
  | 'RECEIVES_DOUBLE_SPELLDAMAGE_BONUS'
  | 'OVERHEAL'
  | 'TRIGGER_VISUAL'
  | string

type Race = 'UNDEAD' | 'DRAGON' | string

type SpellSchool = 'FIRE' | 'ARCANE' | 'HOLY' | 'SHADOW' | string

type CardType = 'SPELL' | 'MINION' | 'WEAPON' | string // Allow other potential types

export interface HearthstoneCard {
  artist: string
  cardClass: CardClass
  collectible: boolean
  cost: number
  dbfId: number
  flavor?: string
  id: string
  name: string
  rarity: Rarity
  set: string
  text?: string
  type: CardType

  // Spell-specific properties
  spellSchool?: SpellSchool

  // Minion-specific properties
  attack?: number
  health?: number
  race?: Race
  races?: Race[]

  // Weapon-specific properties
  durability?: number

  // Optional arrays
  mechanics?: Mechanics[]
  referencedTags?: string[]

  // Legendary flag
  elite?: boolean
}

// For cards that are specifically minions
export interface MinionCard extends HearthstoneCard {
  type: 'MINION'
  attack: number
  health: number
}

// For cards that are specifically spells
export interface SpellCard extends HearthstoneCard {
  type: 'SPELL'
}
export interface AppVersion {
  FullSemVer: string
  Major: number
  Minor: number
  Patch: number
  CommitDate: string
  Sha: string
}
export interface DeckStreamResultMap {
  card: CardMetadata
  complete: DeckPromptOutput
  error: CardError
}
export interface CardMetadata {
  cardName: string
  count: number
  stats: {
    Description: string
    Cost: string
    Attack?: string
    Health?: string
    Durability?: string
    'Card type': string
    Class?: string
    Runes?: string
    Rarity?: string
  }
}
export interface CardError {
  cardName: string
  error: string
}
export type Card = CardMetadata | CardError
export type DeckPromptOutput = {
  promptString: string
  enrichedCards: Card[]
  manaCurveAnalysis: string
}
export type DeckStreamResultBase<T extends keyof DeckStreamResultMap> = {
  type: T
  data: DeckStreamResultMap[T]
  cardName?: string
  error?: string
}
export type DeckStreamResult = {
  [T in keyof DeckStreamResultMap]: DeckStreamResultBase<T>
}[keyof DeckStreamResultMap]
export type renderStateStepperProps = {
  evaluationState: DeckEvaluationState
  handlers: { handleResetMessages: () => void; handleOpenModal: () => void }
}
