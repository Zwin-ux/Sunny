"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getLessonPlanById, LessonPlan, LearningActivity } from "@/lib/lesson-plans"

// Clay-style CSS constants
const clayShadow = "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]"
const clayCard = `bg-white rounded-3xl border-4 ${clayShadow} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300`
const clayButton = `rounded-full py-3 px-6 font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${clayShadow}`

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const router = useRouter()
  const { lessonId } = params
  
  const [lesson, setLesson] = useState<LessonPlan | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [activityComplete, setActivityComplete] = useState(false)
  const [lessonComplete, setLessonComplete] = useState(false)
  const [activityResponses, setActivityResponses] = useState<any[]>([])
  
  useEffect(() => {
    const lessonPlan = getLessonPlanById(lessonId)
    if (lessonPlan) {
      setLesson(lessonPlan)
    } else {
      // Lesson not found, redirect to home
      router.push("/")
    }
  }, [lessonId, router])
  
  if (!lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className={`${clayCard} border-yellow-400 bg-yellow-100 p-8 max-w-md text-center`}>
          <div className="relative w-24 h-24 mx-auto mb-4 animate-pulse-slow">
            <Image src="/sun.png" alt="Sunny" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">Loading Your Lesson...</h1>
          <p className="text-yellow-800">Get ready for some fun learning!</p>
        </div>
      </div>
    )
  }
  
  const currentActivity = lesson.content.activities[currentActivityIndex]
  
  const handleActivityComplete = (response: any) => {
    const newResponses = [...activityResponses]
    newResponses[currentActivityIndex] = response
    setActivityResponses(newResponses)
    setActivityComplete(true)
  }
  
  const handleNextActivity = () => {
    if (currentActivityIndex < lesson.content.activities.length - 1) {
      setCurrentActivityIndex(prevIndex => prevIndex + 1)
      setActivityComplete(false)
    } else {
      setLessonComplete(true)
    }
  }
  
  const handleSendToChat = () => {
    // Save lesson progress to localStorage for the chat component to access
    localStorage.setItem('lastCompletedLesson', JSON.stringify({
      lessonId: lesson.id,
      title: lesson.title,
      activities: activityResponses,
      completedAt: new Date().toISOString()
    }))
    
    // Redirect to chat with a query parameter to trigger the chat integration
    router.push("/?lessonComplete=true")
  }
  
  const renderActivityComponent = (activity: LearningActivity) => {
    switch (activity.type) {
      case 'multiple-choice':
        return (
          <div className={`${clayCard} border-blue-400 bg-blue-100 p-6 mb-6 transform rotate-1`}>
            <h3 className="text-xl font-bold text-blue-800 mb-4">{activity.content.question}</h3>
            <div className="grid grid-cols-2 gap-4">
              {activity.content.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleActivityComplete(option)}
                  className={`${clayButton} bg-white border-4 border-blue-300 text-blue-800 hover:bg-blue-50 text-xl py-4 flex items-center justify-center`}
                >
                  <span className="text-2xl mr-2">{option}</span>
                </button>
              ))}
            </div>
          </div>
        )
      case 'creative':
        return (
          <div className={`${clayCard} border-purple-400 bg-purple-100 p-6 mb-6 transform -rotate-1`}>
            <h3 className="text-xl font-bold text-purple-800 mb-4">{activity.content.instructions}</h3>
            {activity.content.examples && (
              <div className="mb-4">
                <p className="font-bold text-purple-800 mb-2">Examples:</p>
                <div className="flex flex-wrap gap-3">
                  {activity.content.examples.map((example: string, index: number) => (
                    <div key={index} className="bg-white border-2 border-purple-300 rounded-xl p-3 text-purple-800">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <textarea
                className="w-full p-4 border-4 border-purple-300 rounded-2xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-200 min-h-[120px]"
                placeholder="Type your answer here..."
                id="creativeResponse"
              ></textarea>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    const response = (document.getElementById('creativeResponse') as HTMLTextAreaElement).value
                    if (response.trim()) {
                      handleActivityComplete(response)
                    }
                  }}
                  className={`${clayButton} bg-purple-400 border-4 border-purple-500 text-purple-800 hover:bg-purple-500`}
                >
                  Submit My Answer
                </button>
              </div>
            </div>
          </div>
        )
      case 'discussion':
        return (
          <div className={`${clayCard} border-green-400 bg-green-100 p-6 mb-6 transform rotate-1`}>
            <h3 className="text-xl font-bold text-green-800 mb-4">{activity.content.prompt}</h3>
            
            {activity.content.thinkingPoints && (
              <div className="mb-6">
                <p className="font-bold text-green-800 mb-2">Think about:</p>
                <ul className="list-disc pl-6 space-y-2">
                  {activity.content.thinkingPoints.map((point: string, index: number) => (
                    <li key={index} className="text-green-800">{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-6">
              <textarea
                className="w-full p-4 border-4 border-green-300 rounded-2xl text-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 transition-all duration-200 min-h-[150px]"
                placeholder="Write your ideas here..."
                id="discussionResponse"
              ></textarea>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    const response = (document.getElementById('discussionResponse') as HTMLTextAreaElement).value
                    if (response.trim()) {
                      handleActivityComplete(response)
                    }
                  }}
                  className={`${clayButton} bg-green-400 border-4 border-green-500 text-green-800 hover:bg-green-500`}
                >
                  Submit My Ideas
                </button>
              </div>
            </div>
          </div>
        )
      case 'matching':
        return (
          <div className={`${clayCard} border-orange-400 bg-orange-100 p-6 mb-6 transform -rotate-1`}>
            <h3 className="text-xl font-bold text-orange-800 mb-6">Match each item with the correct answer</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="font-bold text-orange-800 mb-2">Items:</p>
                {activity.content.pairs.map((pair: any, index: number) => (
                  <div key={index} className={`${clayButton} bg-white border-4 border-orange-300 text-orange-800 hover:bg-orange-50 py-3 px-4 text-lg`}>
                    {pair.item}
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <p className="font-bold text-orange-800 mb-2">Matches:</p>
                {activity.content.pairs.map((pair: any, index: number) => (
                  <div key={index} className={`${clayButton} bg-white border-4 border-orange-300 text-orange-800 hover:bg-orange-50 py-3 px-4 text-lg`}>
                    {pair.match}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleActivityComplete({ matched: true })}
                className={`${clayButton} bg-orange-400 border-4 border-orange-500 text-orange-800 hover:bg-orange-500`}
              >
                Complete Matching
              </button>
            </div>
          </div>
        )
      default:
        return (
          <div className={`${clayCard} border-yellow-400 bg-yellow-100 p-6 mb-6`}>
            <h3 className="text-xl font-bold text-yellow-800 mb-4">Activity type not fully supported yet</h3>
            <p className="text-yellow-800 mb-6">This activity is still being developed. Let's move on!</p>
            <div className="flex justify-end">
              <button
                onClick={() => handleActivityComplete({ completed: true })}
                className={`${clayButton} bg-yellow-400 border-4 border-yellow-500 text-yellow-800 hover:bg-yellow-500`}
              >
                Mark as Complete
              </button>
            </div>
          </div>
        )
    }
  }
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'math':
        return {
          bg: 'bg-blue-300',
          border: 'border-blue-400',
          text: 'text-blue-800'
        }
      case 'robots':
        return {
          bg: 'bg-purple-300',
          border: 'border-purple-400',
          text: 'text-purple-800'
        }
      case 'space':
        return {
          bg: 'bg-indigo-300',
          border: 'border-indigo-400',
          text: 'text-indigo-800'
        }
      default:
        return {
          bg: 'bg-green-300',
          border: 'border-green-400',
          text: 'text-green-800'
        }
    }
  }
  
  const colors = getCategoryColor(lesson.category)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-50 py-8">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <Image 
          src="/background.png" 
          alt="Background" 
          fill 
          className="object-cover brightness-105 contrast-105 saturate-[1.2]" 
          priority 
        />
      </div>
      
      {/* Floating Clay Elements */}
      <div className="fixed -top-10 -left-10 w-40 h-40 bg-blue-300 rounded-full opacity-60 animate-float-slow z-0"></div>
      <div className="fixed top-1/4 -right-20 w-52 h-52 bg-yellow-200 rounded-full opacity-50 animate-float-medium z-0"></div>
      <div className="fixed bottom-20 -left-10 w-36 h-36 bg-green-200 rounded-full opacity-50 animate-float-fast z-0"></div>
      
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 mb-8 relative z-10">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className={`${clayButton} ${colors.bg} ${colors.border} ${colors.text} flex items-center gap-2`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back Home</span>
            </button>
          </Link>
          
          <div className={`${clayCard} ${colors.bg} ${colors.border} p-3 flex items-center transform rotate-2`}>
            <div className="relative w-10 h-10 mr-2">
              <Image 
                src="/sun.png" 
                alt="Sunny" 
                fill 
                className="object-contain drop-shadow-md" 
              />
            </div>
            <span className={`text-lg font-bold ${colors.text}`}>Learning with Sunny</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Lesson Title Card */}
        <div className={`${clayCard} ${colors.bg} ${colors.border} p-6 mb-8 transform -rotate-1`}>
          <div className="flex items-start gap-6">
            <div className="relative w-20 h-20 flex-shrink-0">
              {(lesson.category === 'math' || lesson.category === 'space') && (
                <Image src="/star.png" alt={lesson.category} fill className="object-contain drop-shadow-md" />
              )}
              {lesson.category === 'robots' && (
                <Image src="/robot.png" alt={lesson.category} fill className="object-contain drop-shadow-md" />
              )}
              {!['math', 'robots', 'space'].includes(lesson.category) && (
                <Image src="/bulb.png" alt={lesson.category} fill className="object-contain drop-shadow-md" />
              )}
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${colors.text} mb-2`}>{lesson.content.title}</h1>
              <p className={`text-lg ${colors.text} mb-3`}>{lesson.content.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 ${colors.text} bg-white/50 rounded-full text-sm font-bold border-2 ${colors.border}`}>
                  {lesson.category}
                </span>
                {lesson.gradeLevel.map((grade) => (
                  <span key={grade} className={`px-3 py-1 ${colors.text} bg-white/50 rounded-full text-sm font-bold border-2 ${colors.border}`}>
                    Grade {grade}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {lessonComplete ? (
          // Lesson Complete Screen
          <div className={`${clayCard} border-yellow-400 bg-yellow-300 p-8 text-center transform rotate-1`}>
            <div className="relative w-32 h-32 mx-auto mb-4 animate-float-medium">
              <Image src="/rainbow.png" alt="Completed" fill className="object-contain drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-extrabold text-yellow-800 mb-4">AWESOME JOB!</h2>
            <p className="text-xl font-bold text-yellow-800 mb-8">You've completed all the activities!</p>
            
            <div className="flex justify-center gap-6">
              <button 
                onClick={handleSendToChat}
                className={`${clayButton} bg-green-400 border-4 border-green-500 text-green-800 hover:bg-green-500`}
              >
                Talk with Sunny about what you learned
              </button>
              <Link href="/">
                <button className={`${clayButton} bg-blue-400 border-4 border-blue-500 text-blue-800 hover:bg-blue-500`}>
                  Go back to home
                </button>
              </Link>
            </div>
          </div>
        ) : (
          // Activity Screen
          <div className={`${clayCard} border-white bg-white p-6 mb-8`}>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-gray-500">Activity {currentActivityIndex + 1} of {lesson.content.activities.length}</span>
                <h2 className="text-2xl font-bold text-gray-800">{currentActivity.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 bg-${currentActivity.difficulty === 'beginner' ? 'green' : currentActivity.difficulty === 'intermediate' ? 'yellow' : 'red'}-100 text-${currentActivity.difficulty === 'beginner' ? 'green' : currentActivity.difficulty === 'intermediate' ? 'yellow' : 'red'}-800 rounded-full text-sm font-bold border-2 border-${currentActivity.difficulty === 'beginner' ? 'green' : currentActivity.difficulty === 'intermediate' ? 'yellow' : 'red'}-200`}>
                  {currentActivity.difficulty}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-bold border-2 border-gray-200">
                  {currentActivity.estimatedTimeMinutes} min
                </span>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 mb-6">{currentActivity.description}</p>
            
            <div className="mb-6">
              {renderActivityComponent(currentActivity)}
            </div>
            
            {activityComplete && (
              <div className="flex justify-end">
                <button 
                  onClick={handleNextActivity}
                  className={`${clayButton} bg-green-400 border-4 border-green-500 text-green-800 hover:bg-green-500`}
                >
                  {currentActivityIndex < lesson.content.activities.length - 1 ? 'Next Activity' : 'Finish Lesson'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
