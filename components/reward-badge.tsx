"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function RewardBadge() {
  const [rewardType, setRewardType] = useState<string>("")

  useEffect(() => {
    const rewards = ["star", "lightbulb", "thumbsup"]
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)]
    setRewardType(randomReward)
  }, [])

  const rewardImages: Record<string, string> = {
    star: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WoeoeM5efPQY5Itey34CzaKf7mQwk3.png",
    lightbulb: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hJUH2WfC80tyioVr6zsvna44vlyIPw.png",
    thumbsup: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IOQsVx7YjOLiU3yI1C4meA7g780GCE.png",
  }

  const rewardMessages: Record<string, string> = {
    star: "You're a star learner!",
    lightbulb: "Brilliant idea!",
    thumbsup: "Great job!",
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30"
    >
      <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center max-w-xs w-full">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 1, repeat: 1 }}
          className="w-32 h-32 relative mb-4"
        >
          <Image
            src={rewardImages[rewardType] || "/placeholder.svg"}
            alt="Reward badge"
            width={128}
            height={128}
            className="object-contain"
          />
        </motion.div>

        <h3 className="text-xl font-bold text-center mb-2">{rewardMessages[rewardType]}</h3>

        <p className="text-center text-gray-600 mb-4">Keep up the great learning! You've earned a special badge!</p>

        <Button className="bg-yellow-400 hover:bg-yellow-500">Continue Learning</Button>
      </div>
    </motion.div>
  )
}
