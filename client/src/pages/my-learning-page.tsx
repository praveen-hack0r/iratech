import { useState } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { PlayCircle, Search, Clock, CheckCircle, BookOpen, Ban } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/ui/video-player";
import { CourseWithCategory, Lesson, LessonWithProgress, Resource } from "@shared/schema";

interface EnrolledCourse extends CourseWithCategory {
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
    lastWatched?: {
      lessonId: number;
      lessonTitle: string;
      sectionTitle: string;
      lastWatchedAt: string;
    };
  };
}

interface CourseWithContentData {
  course: CourseWithCategory;
  sections: Array<{
    id: number;
    title: string;
    order: number;
    lessons: LessonWithProgress[];
  }>;
  resources: Resource[];
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
  };
}

export default function MyLearningPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCourse, setActiveCourse] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Fetch enrolled courses
  const {
    data: enrolledCourses,
    isLoading: coursesLoading,
    error: coursesError
  } = useQuery<EnrolledCourse[]>({
    queryKey: ["/api/enrollments"],
  });

  // Fetch course content when a course is selected
  const {
    data: courseContent,
    isLoading: contentLoading
  } = useQuery<CourseWithContentData>({
    queryKey: [`/api/courses/${activeCourse}/content`],
    enabled: !!activeCourse,
  });

  // Fetch lesson details when a lesson is selected
  const {
    data: lessonData,
    isLoading: lessonLoading
  } = useQuery<LessonWithProgress & { resources: Resource[] }>({
    queryKey: [`/api/lessons/${activeLesson?.id}`],
    enabled: !!activeLesson,
  });

  // Filter courses based on search query
  const filteredCourses = enrolledCourses?.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Handle lesson progress update
  const handleProgress = (watchTimeSeconds: number, completed: boolean) => {
    console.log(`Progress update: ${watchTimeSeconds}s, completed: ${completed}`);
    // In a real app, you would update the UI to reflect this change
  };

  // Find and select the last watched lesson
  const continueLastLesson = (courseId: number) => {
    const course = enrolledCourses?.find(c => c.id === courseId);
    if (course?.progress.lastWatched) {
      setActiveCourse(courseId);
      // Ideally you would also set the active lesson, but we need to wait for course content to load
    }
  };

  return (
    <MainLayout>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
          <p className="mt-2 text-gray-600">Track your progress and continue learning.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Course List */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">My Courses</h2>
                <span className="text-sm text-gray-500">
                  {enrolledCourses?.length || 0} courses
                </span>
              </div>
            </div>

            {coursesLoading ? (
              // Loading state
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="border">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-2/3 mb-1" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="py-2">
                      <Skeleton className="h-2 mb-2" />
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-4 w-16" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : coursesError ? (
              // Error state
              <Card className="border bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700">
                    <Ban className="inline-block mr-2 h-5 w-5" />
                    Error Loading Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">
                    There was a problem loading your courses. Please try again later.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </CardFooter>
              </Card>
            ) : filteredCourses?.length === 0 ? (
              // Empty state
              <Card className="border">
                <CardHeader>
                  <CardTitle>No Courses Found</CardTitle>
                </CardHeader>
                <CardContent>
                  {searchQuery ? (
                    <p className="text-gray-500">
                      No courses match your search query. Try adjusting your search.
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      You haven't enrolled in any courses yet.
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              // Courses list
              <div className="space-y-4">
                {filteredCourses?.map((course) => (
                  <Card 
                    key={course.id} 
                    className={`border cursor-pointer hover:border-primary transition-colors ${
                      activeCourse === course.id ? 'border-primary bg-blue-50' : ''
                    }`}
                    onClick={() => setActiveCourse(course.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <Badge variant="outline" className={course.category?.textColor || 'text-primary'}>
                          {course.category?.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <Progress value={course.progress.percentComplete} className="h-2 mb-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {course.progress.completedLessons} of {course.progress.totalLessons} lessons completed
                        </span>
                        <span className="font-medium">
                          {course.progress.percentComplete}%
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => continueLastLesson(course.id)}
                      >
                        <PlayCircle className="mr-1 h-4 w-4" />
                        Continue
                      </Button>
                      {course.progress.lastWatched && (
                        <span className="text-xs text-gray-500">
                          Last watched: {formatDate(course.progress.lastWatched.lastWatchedAt)}
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="w-full lg:w-2/3">
            {!activeCourse ? (
              // No course selected state
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Select a course to start learning</h2>
                <p className="text-gray-500 mb-6">
                  Choose a course from your enrolled courses to continue your learning journey.
                </p>
                <Button asChild>
                  <Link href="/courses">Browse More Courses</Link>
                </Button>
              </div>
            ) : contentLoading ? (
              // Loading content state
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                
                <div className="aspect-video mb-6">
                  <Skeleton className="h-full w-full" />
                </div>
                
                <Skeleton className="h-10 w-full mb-6" />
                
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-md p-4">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <div className="space-y-2 pl-4">
                        {[...Array(2)].map((_, j) => (
                          <div key={j} className="flex justify-between">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !activeLesson ? (
              // Course overview - no lesson selected
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{courseContent?.course.title}</h2>
                  <p className="text-gray-600 mb-4">{courseContent?.course.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="h-5 w-5 mr-1" />
                    <span>{courseContent?.progress.completedLessons} of {courseContent?.progress.totalLessons} lessons completed</span>
                    <span className="mx-2">•</span>
                    <span>{courseContent?.progress.percentComplete}% complete</span>
                  </div>
                  
                  <Progress 
                    value={courseContent?.progress.percentComplete} 
                    className="h-2 mb-2" 
                  />
                </div>
                
                <Tabs defaultValue="content">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Course Content</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    <div className="space-y-4">
                      {courseContent?.sections.map((section) => (
                        <div key={section.id} className="border rounded-md p-4">
                          <h3 className="font-semibold mb-2">{section.title}</h3>
                          <div className="space-y-2 pl-4">
                            {section.lessons.map((lesson) => (
                              <div 
                                key={lesson.id} 
                                className={`flex justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                                  lesson.progress?.completed ? 'bg-green-50' : ''
                                }`}
                                onClick={() => setActiveLesson(lesson)}
                              >
                                <div className="flex items-center">
                                  {lesson.progress?.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                  ) : (
                                    <PlayCircle className="h-5 w-5 text-gray-400 mr-2" />
                                  )}
                                  <span>{lesson.title}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="resources">
                    <div className="space-y-4">
                      {courseContent?.resources.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No resources available for this course.</p>
                        </div>
                      ) : (
                        courseContent?.resources.map((resource) => (
                          <Card key={resource.id} className="flex items-center">
                            <div className="flex-grow p-4">
                              <div className="flex items-start">
                                <FileBook className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <h3 className="font-medium">{resource.title}</h3>
                                  {resource.description && (
                                    <p className="text-sm text-gray-500">{resource.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <Button asChild size="sm" variant="outline">
                                <a href={resource.fileUrl} download target="_blank" rel="noreferrer">
                                  Download
                                </a>
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : lessonLoading ? (
              // Loading lesson state
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-8 w-2/3 mb-4" />
                <div className="aspect-video mb-6">
                  <Skeleton className="h-full w-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
              </div>
            ) : (
              // Lesson view
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveLesson(null)}
                  >
                    ← Back to Course
                  </Button>
                  <Badge variant={lessonData?.progress?.completed ? "success" : "outline"}>
                    {lessonData?.progress?.completed ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                
                <h2 className="text-2xl font-bold mb-4">{activeLesson.title}</h2>
                
                <div className="aspect-video mb-6">
                  <VideoPlayer 
                    videoUrl={lessonData?.videoUrl || ""} 
                    lessonId={lessonData?.id || 0}
                    onProgress={handleProgress}
                  />
                </div>
                
                {lessonData?.description && (
                  <div className="prose max-w-none mb-8">
                    <h3 className="text-xl font-semibold mb-2">Lesson Description</h3>
                    <p>{lessonData.description}</p>
                  </div>
                )}
                
                {lessonData?.resources && lessonData.resources.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Lesson Resources</h3>
                    <div className="space-y-3">
                      {lessonData.resources.map((resource) => (
                        <div key={resource.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-primary mr-2" />
                            <div>
                              <p className="font-medium">{resource.title}</p>
                              {resource.description && (
                                <p className="text-sm text-gray-500">{resource.description}</p>
                              )}
                            </div>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <a href={resource.fileUrl} download target="_blank" rel="noreferrer">
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator className="my-6" />
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    disabled={!lessonData?.progress?.completed}
                    onClick={() => {
                      // Mark as incomplete - in a real app, you would make an API call here
                      console.log("Mark as incomplete");
                    }}
                  >
                    Mark as Incomplete
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      // Mark as complete - in a real app, you would make an API call here
                      console.log("Mark as complete");
                    }}
                    disabled={lessonData?.progress?.completed}
                  >
                    Mark as Complete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Helper component for file icon
function FileBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
