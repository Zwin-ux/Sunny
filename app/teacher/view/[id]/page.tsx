"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SunnyCharacter from "@/components/sunny-character"
import { getLessonPlanById, type LessonPlan, type LearningActivity } from "@/lib/lesson-plans"

export default function ViewLessonPage({ params }: { params: { id: string } }) {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch the lesson plan data
    const fetchLessonPlan = () => {
      try {
        setIsLoading(true)
        // In a real app, this would be an API call
        const plan = getLessonPlanById(params.id)
        if (plan) {
          setLessonPlan(plan)
          if (plan.content.activities.length > 0) {
            setSelectedActivity(plan.content.activities[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching lesson plan:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLessonPlan()
  }, [params.id])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-sky-100">
        <div className="text-center">
          <SunnyCharacter emotion="happy" />
          <p className="mt-4 text-lg">Loading lesson plan...</p>
        </div>
      </main>
    )
  }

  if (!lessonPlan) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-sky-100">
        <Card className="p-8 max-w-md text-center">
          <SunnyCharacter emotion="confused" />
          <h1 className="text-2xl font-bold mt-4">Lesson Plan Not Found</h1>
          <p className="text-gray-600 my-4">
            We couldn't find the lesson plan you're looking for.
          </p>
          <Link href="/teacher">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </main>
    )
  }

  const currentActivity = lessonPlan.content.activities.find(
    (activity) => activity.id === selectedActivity
  )

  // Determine the appropriate image path based on the category
  const getImagePath = (category: string) => {
    switch (category) {
      case "math":
        return "/star.png"
      case "robots":
        return "/robot.png"
      case "ideas":
        return "/bulb.png"
      default:
        return "/rainbow.png"
    }
  }

  return (
    <main className="flex min-h-screen flex-col p-4 bg-sky-100">
      <div className="max-w-6xl w-full mx-auto">
        <Card className="p-6 bg-white rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SunnyCharacter emotion="happy" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {lessonPlan.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    className={`${
                      lessonPlan.category === "math"
                        ? "bg-blue-500"
                        : lessonPlan.category === "robots"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {lessonPlan.category}
                  </Badge>
                  {lessonPlan.gradeLevel.map((level) => (
                    <Badge key={level} variant="outline">
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/teacher">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href={`/teacher/edit/${params.id}`}>
                <Button>Edit Lesson</Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="relative h-64 w-full rounded-t-lg overflow-hidden">
                <Image
                  src={getImagePath(lessonPlan.category)}
                  alt={lessonPlan.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">
                  {lessonPlan.content.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {lessonPlan.content.description}
                </p>

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Learning Outcomes</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {lessonPlan.content.learningOutcomes.map((outcome, index) => (
                      <li key={index} className="text-gray-700">
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {lessonPlan.content.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Learning Activities</h2>
                
                <Tabs defaultValue={lessonPlan.content.activities[0]?.id || ""} value={selectedActivity || ""} onValueChange={setSelectedActivity}>
                  <TabsList className="mb-4">
                    {lessonPlan.content.activities.map((activity) => (
                      <TabsTrigger key={activity.id} value={activity.id}>
                        {activity.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {lessonPlan.content.activities.map((activity) => (
                    <TabsContent key={activity.id} value={activity.id}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-semibold">{activity.title}</h3>
                          <Badge variant="outline">
                            {activity.type}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700">{activity.description}</p>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Activity Details</h4>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Age Range:</span>{" "}
                              <span className="font-medium">
                                {activity.ageRange.min}-{activity.ageRange.max} years
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Difficulty:</span>{" "}
                              <span className="font-medium">
                                {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Estimated Time:</span>{" "}
                              <span className="font-medium">
                                {activity.estimatedTimeMinutes} minutes
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {activity.type === "multiple-choice" && activity.content.question && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Sample Question</h4>
                            <p className="mb-3">{activity.content.question}</p>
                            
                            {activity.content.options && (
                              <div className="space-y-2">
                                {activity.content.options.map((option: string, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className={`p-2 rounded-lg border ${
                                      option === activity.content.correctAnswer 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    {option}
                                    {option === activity.content.correctAnswer && (
                                      <span className="ml-2 text-green-600">✓</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {activity.type === "creative" && activity.content && (
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Creative Task</h4>
                            {activity.content.instructions && (
                              <div className="mb-3">
                                <h5 className="text-sm font-semibold mb-1">Instructions:</h5>
                                <p className="whitespace-pre-wrap">{activity.content.instructions}</p>
                              </div>
                            )}

                            {activity.content.examples && Array.isArray(activity.content.examples) && activity.content.examples.length > 0 && (
                              <div className="mb-3">
                                <h5 className="text-sm font-semibold mb-1">Examples:</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                  {activity.content.examples.map((example: string, idx: number) => (
                                    <li key={idx} className="text-sm">{example}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {activity.content.submissionType && (
                              <div>
                                <h5 className="text-sm font-semibold mb-1">Submission Type:</h5>
                                <p className="text-sm capitalize">{activity.content.submissionType.replace('-', ' or ')}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {activity.type === "discussion" && activity.content.prompt && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Discussion Prompt</h4>
                            <p className="mb-3">{activity.content.prompt}</p>
                            
                            {activity.content.thinkingPoints && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Thinking Points:</h5>
                                <ul className="list-disc pl-5 space-y-1">
                                  {activity.content.thinkingPoints.map((point: string, idx: number) => (
                                    <li key={idx} className="text-sm">{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Lesson Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                  <p>{lessonPlan.author.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Created</h3>
                  <p>{new Date(lessonPlan.dateCreated).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Modified</h3>
                  <p>{new Date(lessonPlan.dateModified).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Related Topics</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {lessonPlan.content.relatedTopics.map((topic, index) => (
                      <Badge key={index} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            
            {lessonPlan.content.additionalResources && lessonPlan.content.additionalResources.length > 0 && (
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
                
                <div className="space-y-3">
                  {lessonPlan.content.additionalResources.map((resource, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-1">
                        {resource.type === 'video' && '🎥'}
                        {resource.type === 'article' && '📄'}
                        {resource.type === 'game' && '🎮'}
                        {resource.type === 'worksheet' && '📝'}
                      </div>
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          View Resource
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            <div className="mt-6">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Use This Lesson
              </Button>
              <div className="flex justify-between mt-4">
                <Button variant="outline" className="flex-1 mr-2">
                  <span className="mr-1">📥</span> Download
                </Button>
                <Button variant="outline" className="flex-1 ml-2">
                  <span className="mr-1">⭐</span> Favorite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
