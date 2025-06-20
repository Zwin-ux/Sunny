'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flashcard as FlashcardType } from '@/types/chat'

export function FlashcardSet({ cards }: { cards: FlashcardType[] }) {
  const [index, setIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const next = () => {
    setIndex((index + 1) % cards.length)
    setShowBack(false)
  }
  const current = cards[index]
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center bg-white shadow-lg">
        <div className="min-h-[4rem] flex items-center justify-center">
          {showBack ? current.back : current.front}
        </div>
      </Card>
      <div className="flex justify-between">
        <Button type="button" onClick={() => setShowBack(!showBack)}>
          {showBack ? 'Show Question' : 'Show Answer'}
        </Button>
        {cards.length > 1 && (
          <Button type="button" variant="outline" onClick={next}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}

