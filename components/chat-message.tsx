import { cn } from "@/lib/utils"

interface ChatMessageProps {
  type: string
  content: string
  name: string
}

export default function ChatMessage({ type, content, name }: ChatMessageProps) {
  const isUser = type === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl p-3", isUser ? "bg-blue-100" : "bg-yellow-100")}>
        <p className="font-semibold text-sm">{name}</p>
        <p className="text-gray-800">{content}</p>
      </div>
    </div>
  )
}
