"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

interface MiniChallengeProps {
  type: string
  question: string
  options?: string[]
  correctAnswer: string | string[]
  onComplete: (success: boolean) => void
}

export default function MiniChallenge({ type, question, options = [], correctAnswer, onComplete }: MiniChallengeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showConfetti, setShowConfetti] = useState<boolean>(false)

  const handleAnswerSubmit = () => {
    let correct = false

    if (Array.isArray(correctAnswer)) {
      correct = correctAnswer.includes(selectedAnswer)
    } else {
      correct = selectedAnswer === correctAnswer
    }

    setIsCorrect(correct)

    if (correct) {
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        onComplete(true)
      }, 2000)
    } else {
      setTimeout(() => {
        setIsCorrect(null)
      }, 1500)
    }
  }

  return (
    <Card className="p-4 bg-white rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Sunny Challenge!</h3>

      <p className="text-center mb-4">{question}</p>

      {type === "multiple-choice" && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {options.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === option ? "default" : "outline"}
              className={`p-3 ${selectedAnswer === option ? "bg-yellow-400 hover:bg-yellow-500" : ""}`}
              onClick={() => setSelectedAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      {type === "pattern" && (
        <div className="flex flex-col items-center space-y-4 mb-4">
          <div className="flex space-x-2 mb-2">
            {(correctAnswer as string[]).map((item, index) => (
              <div key={index} className="w-10 h-10 flex items-center justify-center text-2xl">
                {item}
              </div>
            ))}
          </div>

          <p className="text-sm text-center">What comes next in the pattern?</p>

          <div className="flex space-x-2">
            {options.map((option, index) => (
              <Button
                key={index}
                variant={selectedAnswer === option ? "default" : "outline"}
                className={`w-10 h-10 p-0 text-xl ${selectedAnswer === option ? "bg-yellow-400 hover:bg-yellow-500" : ""}`}
                onClick={() => setSelectedAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleAnswerSubmit}
        disabled={!selectedAnswer || isCorrect !== null}
        className="w-full bg-green-500 hover:bg-green-600"
      >
        Check Answer
      </Button>

      {isCorrect !== null && (
        <p className={`text-center mt-2 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
          {isCorrect ? "That's correct! Great job! 🎉" : "Not quite. Try again!"}
        </p>
      )}

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                top: "-10%",
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                top: "100%",
                left: `${Math.random() * 100}%`,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "linear",
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#FF5252", "#FFD740", "#64FFDA", "#448AFF"][Math.floor(Math.random() * 4)],
              }}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
