"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SunnyCharacter from "@/components/sunny-character"
import { ActivityType } from "@/lib/lesson-plans"

export default function CreateLessonPage() {
  const [lessonTitle, setLessonTitle] = useState("")
  const [lessonDescription, setLessonDescription] = useState("")
  const [category, setCategory] = useState("")
  const [gradeLevels, setGradeLevels] = useState<string[]>(["K-2"])
  const [activities, setActivities] = useState<any[]>([])
  const [currentTab, setCurrentTab] = useState("basic")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const availableImages = [
    { name: "Robot", path: "/robot.png", category: "robots" },
    { name: "Lightbulb", path: "/bulb.png", category: "ideas" },
    { name: "Star", path: "/star.png", category: "math" },
    { name: "Rainbow", path: "/rainbow.png", category: "ideas" },
    { name: "Thumbs Up", path: "/thimbsup.png", category: "general" }
  ]

  const handleAddActivity = () => {
    setActivities([
      ...activities,
      {
        id: `activity-${activities.length + 1}`,
        title: "",
        type: "multiple-choice" as ActivityType,
        description: "",
        content: {},
        difficulty: "beginner",
        estimatedTimeMinutes: 10,
        ageRange: { min: 5, max: 10 }
      }
    ])
  }

  const handleActivityChange = (index: number, field: string, value: any) => {
    const updatedActivities = [...activities]
    updatedActivities[index][field] = value
    setActivities(updatedActivities)
  }

  const handleGradeLevelToggle = (level: string) => {
    if (gradeLevels.includes(level)) {
      setGradeLevels(gradeLevels.filter(gl => gl !== level))
    } else {
      setGradeLevels([...gradeLevels, level])
    }
  }

  const handleSubmit = () => {
    // In a real implementation, this would save to a database
    console.log({
      title: lessonTitle,
      description: lessonDescription,
      category,
      gradeLevels,
      activities,
      image: selectedImage
    })
    alert("Lesson plan created successfully!")
  }

  return (
    <main className="flex min-h-screen flex-col p-4 bg-sky-100">
      <div className="max-w-6xl w-full mx-auto">
        <Card className="p-6 bg-white rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SunnyCharacter emotion="excited" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Create New Lesson Plan</h1>
                <p className="text-gray-600">Design a custom lesson for your classroom</p>
              </div>
            </div>
            <Link href="/teacher">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Tabs defaultValue="basic" value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                  <TabsTrigger value="activities" className="flex-1">Activities</TabsTrigger>
                  <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Lesson Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Fun with Numbers" 
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Describe what students will learn..." 
                        rows={4}
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="math">🧮 Math</SelectItem>
                          <SelectItem value="robots">🤖 Robots</SelectItem>
                          <SelectItem value="ideas">💡 Ideas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Grade Level</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["K-2", "3-5", "6-8"].map(level => (
                          <Badge 
                            key={level}
                            className={`cursor-pointer ${
                              gradeLevels.includes(level) 
                                ? 'bg-blue-500' 
                                : 'bg-gray-200 text-gray-800'
                            }`}
                            onClick={() => handleGradeLevelToggle(level)}
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Featured Image</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {availableImages.map((image) => (
                          <div 
                            key={image.path}
                            className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                              selectedImage === image.path ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:opacity-80'
                            }`}
                            onClick={() => setSelectedImage(image.path)}
                          >
                            <div className="aspect-square relative">
                              <Image
                                src={image.path}
                                alt={image.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="p-2 text-center bg-white border-t">
                              {image.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button className="w-full mt-4" onClick={() => setCurrentTab("activities")}>
                      Continue to Activities
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="activities">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Learning Activities</h2>
                      <Button onClick={handleAddActivity}>Add Activity</Button>
                    </div>
                    
                    {activities.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-600 mb-4">No activities added yet</p>
                        <Button onClick={handleAddActivity}>
                          Add Your First Activity
                        </Button>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        {activities.map((activity, index) => (
                          <Card key={activity.id} className="p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold">Activity {index + 1}</h3>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  const updated = [...activities]
                                  updated.splice(index, 1)
                                  setActivities(updated)
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`activity-${index}-title`}>Title</Label>
                                <Input 
                                  id={`activity-${index}-title`}
                                  value={activity.title}
                                  onChange={(e) => handleActivityChange(index, 'title', e.target.value)}
                                  placeholder="e.g., Number Matching"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`activity-${index}-type`}>Activity Type</Label>
                                <Select 
                                  value={activity.type}
                                  onValueChange={(value) => handleActivityChange(index, 'type', value)}
                                >
                                  <SelectTrigger id={`activity-${index}-type`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                    <SelectItem value="discussion">Discussion</SelectItem>
                                    <SelectItem value="pattern">Pattern</SelectItem>
                                    <SelectItem value="matching">Matching</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor={`activity-${index}-description`}>Description</Label>
                                <Textarea 
                                  id={`activity-${index}-description`}
                                  value={activity.description}
                                  onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                                  placeholder="Describe the activity..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentTab("basic")}>
                        Back
                      </Button>
                      <Button onClick={() => setCurrentTab("resources")}>
                        Continue to Resources
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="resources">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Additional Resources</h2>
                    <p className="text-gray-600">
                      Add links to helpful videos, articles, or worksheets for this lesson
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resource-title">Resource Title</Label>
                        <Input id="resource-title" placeholder="e.g., Counting Video" />
                      </div>
                      
                      <div>
                        <Label htmlFor="resource-url">URL</Label>
                        <Input id="resource-url" placeholder="https://..." />
                      </div>
                      
                      <div>
                        <Label htmlFor="resource-type">Type</Label>
                        <Select defaultValue="video">
                          <SelectTrigger id="resource-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="game">Game</SelectItem>
                            <SelectItem value="worksheet">Worksheet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button variant="outline" className="w-full">Add Resource</Button>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentTab("activities")}>
                        Back
                      </Button>
                      <Button onClick={() => setCurrentTab("preview")}>
                        Preview Lesson
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Lesson Preview</h2>
                      <Badge>{category || "No Category"}</Badge>
                    </div>
                    
                    <Card className="p-6">
                      <div className="flex space-x-4 mb-4">
                        {selectedImage && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden relative flex-shrink-0">
                            <Image 
                              src={selectedImage} 
                              alt={lessonTitle} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        )}
                        <div>
                          <h1 className="text-2xl font-bold">{lessonTitle || "Untitled Lesson"}</h1>
                          <p className="text-gray-600 mt-1">{lessonDescription || "No description provided"}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {gradeLevels.map(level => (
                              <Badge key={level}>{level}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-2">Activities ({activities.length})</h3>
                        {activities.length > 0 ? (
                          <div className="space-y-2">
                            {activities.map((activity, idx) => (
                              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between">
                                  <span className="font-medium">{activity.title || `Activity ${idx + 1}`}</span>
                                  <Badge variant="outline">{activity.type}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {activity.description || "No description"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No activities added</p>
                        )}
                      </div>
                    </Card>
                    
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentTab("resources")}>
                        Back to Edit
                      </Button>
                      <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                        Save Lesson Plan
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Tips & Resources</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-blue-600 mb-2">Creating Effective Lessons</h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Set clear learning objectives for each activity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Include a mix of activity types to engage different learners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Consider appropriate difficulty levels for your grade range</span>
                    </li>
                  </ul>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-blue-600 mb-2">Image Guidelines</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Choose images that are engaging and represent the lesson content clearly.
                  </p>
                  <div className="flex justify-center">
                    <SunnyCharacter emotion="happy" />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-blue-600 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600">
                    Check out our <Link href="#" className="text-blue-500 hover:underline">teacher guides</Link> or <Link href="#" className="text-blue-500 hover:underline">example lessons</Link> for inspiration.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
