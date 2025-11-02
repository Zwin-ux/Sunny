'use client';

interface Props {
  onPick: (text: string) => void
}

const SUGGESTIONS = [
  'Start a mission',
  'Play a math game',
  'Quiz me on fractions',
  'Review my mistakes',
  'Show my progress',
  'Explain photosynthesis simply',
]

export default function SmartSuggestions({ onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {SUGGESTIONS.map((s) => (
        <button key={s} onClick={() => onPick(s)} className="text-xs px-3 py-1 rounded-full border-2 border-black bg-white hover:bg-yellow-50 font-semibold">
          {s}
        </button>
      ))}
    </div>
  )
}

