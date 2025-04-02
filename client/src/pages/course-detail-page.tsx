import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseWithCategory, Section, Lesson, Resource } from "@shared/schema";
import { 
  Clock, 
  FileText, 
  Star, 
  CheckCircle, 
  ChevronRight,
  Lock,
  Play,
  FileIcon,
  Download
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface CourseDetailData extends CourseWithCategory {
  sections: (Section & {
    lessons: Lesson[];
  })[];
  resources: Resource[];
}

interface EnrollmentStatus {
  isEnrolled: boolean;
  inProgress: boolean;
  completedPercent: number;
}

export default function CourseDetailPage() {
  const [match, params] = useRoute("/courses/:slug");
  const slug = params?.slug || "";
  const { user, isLoading: authLoading } = useAuth();
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch course data
  const {
    data: courseData,
    isLoading: courseLoading,
    error: courseError
  } = useQuery<CourseDetailData>({
    queryKey: [`/api/courses/${slug}`],
    enabled: !!slug,
  });

  // Fetch enrollment status if user is logged in
  const {
    data: enrollmentData,
    isLoading: enrollmentLoading
  } = useQuery<EnrollmentStatus>({
    queryKey: [`/api/enrollments/${courseData?.id}`],
    enabled: !!user && !!courseData?.id,
  });

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // Calculate total course content stats
  const calculateCourseStats = () => {
    if (!courseData?.sections) return { totalLessons: 0, totalDuration: 0 };
    
    let totalLessons = 0;
    let totalDuration = 0; // in minutes
    
    courseData.sections.forEach(section => {
      totalLessons += section.lessons.length;
      section.lessons.forEach(lesson => {
        totalDuration += (lesson.duration || 0) / 60; // convert seconds to minutes
      });
    });
    
    return { totalLessons, totalDuration };
  };

  const { totalLessons, totalDuration } = calculateCourseStats();

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Handle preview lesson click
  const handlePreviewLesson = async (lesson: Lesson) => {
    console.log("Getting preview for lesson:", lesson.id, lesson.title);
    
    try {
      // Fetch the preview video details to ensure we have the correct URL
      const response = await fetch(`/api/preview-video/${lesson.id}`);
      
      if (response.ok) {
        const previewData = await response.json();
        console.log("Preview data:", previewData);
        setPreviewLesson(previewData);
      } else {
        console.error("Failed to fetch preview video:", await response.text());
        // Use the lesson as-is if we can't fetch more details
        setPreviewLesson(lesson);
      }
      
      setSelectedTab("preview");
    } catch (error) {
      console.error("Error fetching preview:", error);
      // Fallback to using the lesson as-is
      setPreviewLesson(lesson);
      setSelectedTab("preview");
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <FileIcon className="h-4 w-4" />;
    
    if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else {
      return <FileIcon className="h-4 w-4" />;
    }
  };

  // Determine button text and link based on enrollment status
  const getEnrollmentButton = () => {
    if (authLoading || enrollmentLoading) {
      return (
        <Button disabled className="w-full">
          <Skeleton className="h-5 w-24" />
        </Button>
      );
    }
    
    if (!user) {
      return (
        <Button asChild className="w-full">
          <Link href={`/auth?redirect=/courses/${slug}`}>
            Sign in to Enroll
          </Link>
        </Button>
      );
    }
    
    if (enrollmentData?.isEnrolled) {
      return (
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link href="/my-learning">
            Continue Learning
          </Link>
        </Button>
      );
    }
    
    return (
      <Button asChild className="w-full">
        <Link href={`/checkout/${courseData?.id}`}>
          Enroll Now
        </Link>
      </Button>
    );
  };

  return (
    <MainLayout>
      {courseLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              
              <div className="aspect-video">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-lg overflow-hidden shadow-md sticky top-20">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : courseError ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center p-12 bg-red-50 rounded-lg">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Course Not Found</h1>
            <p className="text-red-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/courses">Browse All Courses</Link>
            </Button>
          </div>
        </div>
      ) : courseData ? (
        <>
          {/* Course Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center">
                <div className="w-full lg:w-2/3 pr-0 lg:pr-8">
                  <div className="mb-4">
                    <Link href={`/courses?category=${courseData.category?.slug}`}>
                      <a className={`${courseData.category?.bgColor || 'bg-blue-100'} ${courseData.category?.textColor || 'text-primary'} text-xs px-2 py-1 rounded inline-block mb-2`}>
                        {courseData.category?.name}
                      </a>
                    </Link>
                    {courseData.isFeatured && (
                      <Badge variant="secondary" className="ml-2 bg-primary text-white">
                        BESTSELLER
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {courseData.title}
                  </h1>
                  <p className="text-gray-600 mb-6 text-lg">
                    {courseData.description}
                  </p>
                  <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4 mb-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                      <span>4.8 (320 ratings)</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-1" />
                      <span>{totalLessons} lessons ({formatDuration(totalDuration)})</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-1" />
                      <span>{courseData.resources.length} resources</span>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    {courseData.thumbnailUrl ? (
                      <div 
                        className="w-full h-48 bg-center bg-cover"
                        style={{ backgroundImage: `url(${courseData.thumbnailUrl})` }}
                        aria-label={`${courseData.title} course thumbnail`}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No thumbnail available</span>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-3xl font-bold text-gray-900">
                            {courseData.salePrice 
                              ? formatPrice(courseData.salePrice)
                              : formatPrice(courseData.price)
                            }
                          </span>
                          {courseData.salePrice && (
                            <span className="text-lg text-gray-500 line-through ml-2">
                              {formatPrice(courseData.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {getEnrollmentButton()}
                      
                      <div className="mt-6 text-center text-sm text-gray-500">
                        Full lifetime access to this course
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                {previewLesson && (
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="overview" className="space-y-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                  <div className="prose max-w-none">
                    <p>{courseData.description}</p>
                    {/* This would be expanded with more content in a real implementation */}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <p>
                          {i === 0 ? "Master core concepts with hands-on projects" :
                           i === 1 ? "Learn industry best practices and tools" :
                           i === 2 ? "Build real-world applications from scratch" :
                           "Prepare for professional certification"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="curriculum">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">Course Content</h2>
                  <div className="text-sm text-gray-500 mb-6">
                    {totalLessons} lessons • {formatDuration(totalDuration)} total length
                  </div>
                  
                  <Accordion type="multiple" className="w-full">
                    {courseData.sections.map((section) => (
                      <AccordionItem key={section.id} value={`section-${section.id}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="text-left">
                            <h3 className="font-semibold">{section.title}</h3>
                            <p className="text-sm text-gray-500">
                              {section.lessons.length} lessons • 
                              {formatDuration(
                                section.lessons.reduce((acc, lesson) => acc + ((lesson.duration || 0) / 60), 0)
                              )}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-2">
                            {section.lessons.map((lesson) => (
                              <div 
                                key={lesson.id} 
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md"
                              >
                                <div className="flex items-center">
                                  {lesson.isPreview ? (
                                    <Play className="h-4 w-4 text-primary mr-2" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-400 mr-2" />
                                  )}
                                  <span>{lesson.title}</span>
                                  {lesson.isPreview && (
                                    <Badge variant="outline" className="ml-2">Preview</Badge>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-500 mr-3">
                                    {formatDuration((lesson.duration || 0) / 60)}
                                  </span>
                                  {lesson.isPreview && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handlePreviewLesson(lesson)}
                                    >
                                      Preview
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </TabsContent>
              
              <TabsContent value="resources">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">Downloadable Resources</h2>
                  {enrollmentData?.isEnrolled ? (
                    <div className="space-y-4">
                      {courseData.resources.length === 0 ? (
                        <p className="text-gray-500">No resources available for this course yet.</p>
                      ) : (
                        courseData.resources.map((resource) => (
                          <Card key={resource.id} className="flex items-center">
                            <div className="flex-grow p-4">
                              <div className="flex items-start">
                                {getFileIcon(resource.fileType)}
                                <div className="ml-3">
                                  <h3 className="font-medium">{resource.title}</h3>
                                  {resource.description && (
                                    <p className="text-sm text-gray-500">{resource.description}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {resource.fileType} • {(resource.fileSize || 0) / (1024 * 1024) > 1 
                                      ? `${((resource.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB` 
                                      : `${((resource.fileSize || 0) / 1024).toFixed(2)} KB`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <Button asChild size="sm" variant="ghost" className="flex items-center">
                                <a href={resource.fileUrl} download target="_blank" rel="noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Resources are locked</h3>
                      <p className="text-gray-500 mb-4">
                        Enroll in this course to access {courseData.resources.length} downloadable resources.
                      </p>
                      {getEnrollmentButton()}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {previewLesson && (
                <TabsContent value="preview">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">{previewLesson.title}</h2>
                    <div className="aspect-video mb-6">
                      <VideoPlayer 
                        videoUrl={previewLesson.videoUrl || ""} 
                        lessonId={previewLesson.id} 
                        isPreview={true}
                      />
                    </div>
                    <div className="prose max-w-none">
                      <p>{previewLesson.description}</p>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </>
      ) : null}
    </MainLayout>
  );
}
