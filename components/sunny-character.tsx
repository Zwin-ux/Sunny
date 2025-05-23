import Image from "next/image"

interface SunnyCharacterProps {
  emotion?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { container: 'w-16 h-16', emoji: 'text-xs' },
  md: { container: 'w-24 h-24', emoji: 'text-base' },
  lg: { container: 'w-32 h-32', emoji: 'text-xl' }
}

export default function SunnyCharacter({ emotion = null, size = 'md' }: SunnyCharacterProps) {
  const sizeClass = sizeMap[size] || sizeMap.md
  
  return (
    <div className={`relative ${sizeClass.container}`}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ySFY4VBUB78wqYC2eRtsYonScSr0rL.png"
        alt="Sunny character"
        width={parseInt(sizeClass.container.match(/\d+/)?.[0] || '96')}
        height={parseInt(sizeClass.container.match(/\d+/)?.[0] || '96')}
        className="object-contain"
      />
      {emotion && (
        <div className={`absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md ${sizeClass.emoji}`}>
          {emotion === "happy" && "😄"}
          {emotion === "sad" && "😕"}
          {emotion === "excited" && "🤩"}
          {emotion === "confused" && "😶"}
        </div>
      )}
    </div>
  )
}
