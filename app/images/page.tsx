"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import SunnyCharacter from "@/components/sunny-character"

// Sample image data with educational themes in claymation style
const educationalImages = [
  {
    id: 1,
    title: "Math Adventures",
    description: "Explore the world of numbers and shapes!",
    category: "math",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/math-claymation-w3MTaYWRdqk1OB3fpnBhA8pSZS6sIb.png",
    alt: "Claymation math symbols and numbers"
  },
  {
    id: 2,
    title: "Robot Friends",
    description: "Learn how robots work and what they can do!",
    category: "robots",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/robot-claymation-3TYvmdOlbOVdlN2WmJNV6tOwdqxjvC.png",
    alt: "Cute claymation robot characters"
  },
  {
    id: 3,
    title: "Creative Ideas",
    description: "Spark your imagination with fun creative concepts!",
    category: "ideas",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ideas-claymation-wXFNEPG8Qd6gKlNvzMBbcMhV9LcGZx.png",
    alt: "Claymation lightbulb and creative elements"
  },
  {
    id: 4,
    title: "Pattern Play",
    description: "Discover patterns all around us!",
    category: "math",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/patterns-claymation-BuEVnMPm3e0ynRVy8Rl6NbCXBkROef.png",
    alt: "Colorful pattern blocks in claymation style"
  },
  {
    id: 5,
    title: "Learning Loops",
    description: "See how loops work in a fun way!",
    category: "robots",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/loops-claymation-DMrtNHHXVKWp5LLb2CRoTkb5XwJ9I9.png",
    alt: "Claymation representation of programming loops"
  },
  {
    id: 6,
    title: "Sunny's Friends",
    description: "Meet all of Sunny's educational pals!",
    category: "ideas",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/friends-claymation-2Wjd0BZMzgDnXTdYlUCXnmk8aHa5Le.png",
    alt: "Claymation character friends of Sunny"
  }
]

export default function ImagesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  
  // Filter images based on selected category
  const filteredImages = selectedCategory 
    ? educationalImages.filter(img => img.category === selectedCategory)
    : educationalImages
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-sky-100">
      <div className="w-full max-w-6xl mx-auto">
        <Card className="p-6 bg-white rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SunnyCharacter emotion="happy" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Sunny's Learning Gallery</h1>
                <p className="text-gray-600">Explore fun educational images!</p>
              </div>
            </div>
            <Link href="/">
              <Button className="bg-yellow-400 hover:bg-yellow-500">
                Back to Chat
              </Button>
            </Link>
          </div>
        </Card>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            onClick={() => setSelectedCategory(null)}
            className={`${!selectedCategory ? 'bg-blue-500' : 'bg-gray-200 text-gray-800'}`}
          >
            All
          </Button>
          <Button 
            onClick={() => setSelectedCategory('math')}
            className={`${selectedCategory === 'math' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800'}`}
          >
            🧮 Math
          </Button>
          <Button 
            onClick={() => setSelectedCategory('ideas')}
            className={`${selectedCategory === 'ideas' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800'}`}
          >
            💡 Ideas
          </Button>
          <Button 
            onClick={() => setSelectedCategory('robots')}
            className={`${selectedCategory === 'robots' ? 'bg-blue-500' : 'bg-gray-200 text-gray-800'}`}
          >
            🤖 Robots
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <Card 
              key={image.id} 
              className="overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => setSelectedImage(image.id)}
            >
              <div className="relative h-48">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50 z-10 rounded-t-xl"></div>
                <div className="w-full h-full relative">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover rounded-t-xl"
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800">{image.title}</h3>
                <p className="text-gray-600">{image.description}</p>
                <div className="mt-4 flex justify-end">
                  <Button className="bg-blue-400 hover:bg-blue-500">
                    Learn More
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {filteredImages.length === 0 && (
          <div className="text-center p-12">
            <div className="mb-4">
              <SunnyCharacter emotion="sad" />
            </div>
            <p className="text-2xl text-gray-600">No images found for this category</p>
            <Button 
              onClick={() => setSelectedCategory(null)}
              className="mt-4 bg-blue-400 hover:bg-blue-500"
            >
              Show All Images
            </Button>
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button 
              className="absolute -top-12 right-0 bg-red-500 hover:bg-red-600"
              onClick={() => setSelectedImage(null)}
            >
              Close
            </Button>
            <Card className="overflow-hidden">
              <div className="relative h-96">
                {educationalImages.find(img => img.id === selectedImage) && (
                  <Image
                    src={educationalImages.find(img => img.id === selectedImage)!.src}
                    alt={educationalImages.find(img => img.id === selectedImage)!.alt}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold">
                  {educationalImages.find(img => img.id === selectedImage)?.title}
                </h2>
                <p className="text-gray-600 mt-2">
                  {educationalImages.find(img => img.id === selectedImage)?.description}
                </p>
                <div className="mt-6 p-4 bg-sky-100 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">Fun Learning Activity:</h3>
                  <p>Can you create your own version of this using clay or playdough? What would you add to make it even more fun?</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}
