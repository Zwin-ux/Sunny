"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import SunnyCharacter from "@/components/sunny-character"

export default function EditLessonPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-sky-100">
      <Card className="p-8 max-w-md text-center shadow-lg">
        <div className="mx-auto w-24 h-24 mb-6">
          <SunnyCharacter emotion="working" /> {/* Or any other suitable emotion */}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Edit Lesson Plan
        </h1>
        <p className="text-gray-600 mb-2">
          Editing functionality is currently under development.
        </p>
        <p className="text-gray-700 font-semibold mb-6">
          Coming Soon!
        </p>

        <div className="bg-gray-100 p-3 rounded-md mb-6">
          <p className="text-sm text-gray-700">
            Attempting to edit Lesson ID: <span className="font-medium text-blue-600">{params.id}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/teacher">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/teacher/view/${params.id}`}>
            <Button className="w-full sm:w-auto">
              View Lesson
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  )
}
