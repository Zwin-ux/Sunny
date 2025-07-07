"use client"

interface EmotionSelectorProps {
  onSelect: (emotion: string) => void
}

export default function EmotionSelector({ onSelect }: EmotionSelectorProps) {
  const emotions = [
    { id: "happy", emoji: "😄", label: "Happy", color: "bg-yellow-300" },
    { id: "sad", emoji: "😕", label: "Sad", color: "bg-blue-300" },
    { id: "excited", emoji: "🤩", label: "Excited", color: "bg-purple-300" },
    { id: "confused", emoji: "😶", label: "Confused", color: "bg-green-300" },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {emotions.map((emotion) => (
        <button
          key={emotion.id}
          className={`flex flex-col items-center p-3 rounded-full ${emotion.color} shadow-md
                     hover:scale-110 active:scale-95 transition-all duration-200
                     border-4 border-white hover:border-yellow-200
                     transform hover:-rotate-3
                     focus:outline-none focus:ring-4 focus:ring-yellow-200`}
          onClick={() => onSelect(emotion.id)}
          aria-label={`Select ${emotion.label} emotion`}
        >
          <span className="text-4xl mb-1 transform hover:scale-110 transition-transform">{emotion.emoji}</span>
          <span className="text-sm font-bold text-gray-800">{emotion.label}</span>
        </button>
      ))}
    </div>
  )
}
