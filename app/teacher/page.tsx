"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import SunnyCharacter from "@/components/sunny-character"
// Import sampleLessonPlans directly and LessonPlan type
import { sampleLessonPlans, type LessonPlan } from "@/lib/lesson-plans"

export default function TeacherDashboard() {
  const [allLessonPlans, setAllLessonPlans] = useState<LessonPlan[]>([]); // Holds combined plans
  const [filteredPlans, setFilteredPlans] = useState<LessonPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let combinedPlans: LessonPlan[] = [];
    let localStoragePlans: LessonPlan[] = [];

    // Attempt to load plans from localStorage
    try {
      const storedPlansJSON = localStorage.getItem("sunnyLessonPlans");
      if (storedPlansJSON) {
        localStoragePlans = JSON.parse(storedPlansJSON) as LessonPlan[];
        // Basic type check, you might want more robust validation in a real app
        if (!Array.isArray(localStoragePlans)) {
          console.warn("localStorage data is not an array, resetting to empty.");
          localStoragePlans = [];
        }
      }
    } catch (error) {
      console.error("Failed to parse lesson plans from localStorage:", error);
      localStoragePlans = []; // Reset to empty if parsing fails
    }

    // Get IDs of localStorage plans to avoid duplicates and give precedence
    const localStoragePlanIds = new Set(localStoragePlans.map(p => p.id));

    // Filter sample plans to exclude those whose IDs are in localStorage
    const uniqueSamplePlans = sampleLessonPlans.filter(
      samplePlan => !localStoragePlanIds.has(samplePlan.id)
    );

    // Combine localStorage plans (which take precedence) with unique sample plans
    combinedPlans = [...localStoragePlans, ...uniqueSamplePlans];

    setAllLessonPlans(combinedPlans);
    // Initial set of filtered plans is all combined plans
    // The filtering useEffect below will handle actual filtering
  }, []); // Runs once on component mount

  useEffect(() => {
    let result = allLessonPlans;
    
    // Filter by category if not "all"
    if (selectedCategory !== "all") {
      result = result.filter(plan => plan.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        plan => 
          plan.title.toLowerCase().includes(term) || 
          plan.content.description.toLowerCase().includes(term) ||
          plan.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredPlans(result);
  }, [searchTerm, selectedCategory, allLessonPlans]); // Depend on allLessonPlans now

  return (
    <main className="flex min-h-screen flex-col p-4 bg-sky-100">
      <div className="max-w-7xl w-full mx-auto">
        <Card className="p-6 bg-white rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SunnyCharacter emotion="happy" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
                <p className="text-gray-600">Customize lessons for your classroom</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">Student View</Button>
              </Link>
              <Link href="/teacher/create">
                <Button className="bg-yellow-400 hover:bg-yellow-500">
                  Create New Lesson
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="searchLessons">Search Lessons</Label>
                  <Input 
                    id="searchLessons"
                    placeholder="Search by title, description..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Categories</Label>
                  <div className="space-y-2 mt-2">
                    <Button 
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory("all")}
                    >
                      All Categories
                    </Button>
                    <Button 
                      variant={selectedCategory === "math" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory("math")}
                    >
                      🧮 Math
                    </Button>
                    <Button 
                      variant={selectedCategory === "robots" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory("robots")}
                    >
                      🤖 Robots
                    </Button>
                    <Button 
                      variant={selectedCategory === "ideas" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory("ideas")}
                    >
                      💡 Ideas
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Grade Levels</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">K-2</Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">3-5</Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">6-8</Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Quick Links</h3>
                  <div className="space-y-1">
                    <Link href="/teacher/resources" className="text-blue-600 hover:underline block">
                      Teaching Resources
                    </Link>
                    <Link href="/teacher/community" className="text-blue-600 hover:underline block">
                      Teacher Community
                    </Link>
                    <Link href="/teacher/settings" className="text-blue-600 hover:underline block">
                      Classroom Settings
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="my-lessons">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="my-lessons" className="flex-1">My Lessons</TabsTrigger>
                <TabsTrigger value="community" className="flex-1">Community Lessons</TabsTrigger>
                <TabsTrigger value="favorites" className="flex-1">Favorites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-lessons">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">My Lesson Plans</h2>
                    <p className="text-gray-500">Showing {filteredPlans.length} results</p>
                  </div>
                  
                  {filteredPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPlans.map((plan) => (
                        <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="p-4 border-b">
                            <div className="flex justify-between">
                              <h3 className="text-xl font-semibold">{plan.title}</h3>
                              <Badge className={`${plan.category === 'math' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                {plan.category}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mt-2">{plan.content.description}</p>
                          </div>
                          <div className="p-4 bg-gray-50">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {plan.tags.map((tag, index) => (
                                <Badge key={index} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-500">
                                {plan.content.activities.length} Activities • {plan.gradeLevel.join(", ")}
                              </p>
                              <div className="flex gap-2">
                                <Link href={`/teacher/edit/${plan.id}`}>
                                  <Button variant="outline" size="sm">Edit</Button>
                                </Link>
                                <Link href={`/teacher/view/${plan.id}`}>
                                  <Button size="sm">View</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <div className="mx-auto w-16 h-16 mb-4">
                        <SunnyCharacter emotion="confused" />
                      </div>
                      <h3 className="text-xl font-semibold">No lesson plans found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your filters or create a new lesson plan</p>
                      <Link href="/teacher/create">
                        <Button className="bg-yellow-400 hover:bg-yellow-500">
                          Create New Lesson
                        </Button>
                      </Link>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="community">
                <Card className="p-6 text-center">
                  <h3 className="text-xl font-semibold">Community Lesson Plans</h3>
                  <p className="text-gray-600 my-2">
                    Browse and use lesson plans shared by other teachers
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    This feature is coming soon!
                  </p>
                </Card>
              </TabsContent>
              
              <TabsContent value="favorites">
                <Card className="p-6 text-center">
                  <h3 className="text-xl font-semibold">Your Favorite Lesson Plans</h3>
                  <p className="text-gray-600 my-2">
                    Quick access to your favorite lesson plans
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    You haven't saved any favorites yet
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
