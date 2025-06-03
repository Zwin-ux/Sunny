"use client"

import { Button } from "@/components/ui/button"

interface TopicBubblesProps {
  onSelect: (topic: string) => void
}

export default function TopicBubbles({ onSelect }: TopicBubblesProps) {
  const topics = [
    { id: "math", emoji: "🧮", label: "Math" },
    { id: "ideas", emoji: "💡", label: "Ideas" },
    { id: "robots", emoji: "🤖", label: "Robots" },
    { id: "space", emoji: "🪐", label: "Space" },
  ]

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {topics.map((topic) => (
        <Button
          key={topic.id}
          variant="outline"
          className="flex items-center space-x-1 px-4 py-2 rounded-full bg-opacity-80"
          onClick={() => onSelect(topic.id)}
          style={{
            backgroundColor:
              topic.id === "math"
                ? "rgba(191, 219, 254, 0.8)"
                : topic.id === "ideas"
                  ? "rgba(254, 240, 138, 0.8)"
                  : topic.id === "space"
                    ? "rgba(199, 210, 254, 0.8)"
                    : "rgba(253, 186, 186, 0.8)",
          }}
        >
          <span>{topic.emoji}</span>
          <span>{topic.label}</span>
        </Button>
      ))}
    </div>
  )
}
