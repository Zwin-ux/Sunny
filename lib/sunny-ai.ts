// This is a mock implementation of the AI response generation
// In a real implementation, this would call your AI backend with appropriate safety filters

export async function generateSunnyResponse(prompt: string, name: string): Promise<string> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simple keyword-based responses for the prototype
  const keywords = {
    loop: "A loop is like doing the same dance move again and again! 🔁💃 For example, if I say 'repeat jumping 3 times' - that's a loop! Can you make a loop with emojis? Try: 🐶🐶🐶",
    math: "Math is like having super powers for your brain! 🧠✨ Did you know that zero is the only number that can't be represented in Roman numerals? That's pretty cool! Want to try a math puzzle?",
    robot:
      "Robots are machines that can be programmed to do tasks! 🤖 Some robots can dance, some can explore Mars, and some can even help doctors perform surgery! What kind of robot would you invent?",
    idea: "Ideas are like little lightbulbs that pop up in your mind! 💡 The best ideas often come when you're having fun or solving problems. What's something you'd like to invent?",
    space:
      "Space is full of amazing planets and stars! 🌌 Did you know there are more stars in the universe than grains of sand on Earth? Which planet is your favorite?",
    hello: `Hi there, ${name}! It's great to chat with you! What would you like to learn about today?`,
    "how are you": `I'm sunny and bright today, thanks for asking! How about you, ${name}? What would you like to explore?`,
  }

  // Check for keywords in the prompt
  for (const [key, response] of Object.entries(keywords)) {
    if (prompt.toLowerCase().includes(key)) {
      return response
    }
  }

  // Default responses if no keywords match
  const defaultResponses = [
    `That's a great question, ${name}! Let's learn about it together! 🌈`,
    `I love your curiosity, ${name}! Here's something fun about that: did you know that asking questions is one of the best ways to learn? What else are you wondering about?`,
    `Wow, ${name}! That's something interesting to think about! What do you already know about this topic?`,
    `Let's explore that together, ${name}! Learning new things is like going on an adventure! 🚀`,
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

export async function generateMiniChallenge(topic: string): Promise<any> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Sample challenges based on topic
  const challenges = {
    math: {
      type: "multiple-choice",
      question: "What comes after 5 + 3?",
      options: ["7", "8", "9", "10"],
      correctAnswer: "8",
    },
    pattern: {
      type: "pattern",
      question: "What comes next in the pattern?",
      options: ["🔴", "🔵", "🟢", "🟡"],
      correctAnswer: ["🔵", "🔴", "🔵", "🔴"],
    },
    robots: {
      type: "multiple-choice",
      question: "Which of these helps a robot 'see'?",
      options: ["Camera", "Speaker", "Wheel", "Battery"],
      correctAnswer: "Camera",
    },
    space: {
      type: "multiple-choice",
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correctAnswer: "Mars",
    },
  }

  // Return a challenge based on the topic, or a default one
  return challenges[topic] || challenges.math
}
