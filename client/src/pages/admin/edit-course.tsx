import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useParams, Link, useLocation } from "wouter";
import { Section, Lesson, Course, CourseWithCategory } from "@shared/schema";
import { AdminLayout } from "./components/admin-layout";
import { CourseForm } from "./components/course-form";
import { SectionForm } from "./components/section-form";
import { LessonForm } from "./components/lesson-form";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  PlusCircle,
  Edit,
  Trash2,
  FilePlus,
  Video,
  File,
  Clock,
  ChevronDown,
  AlertTriangle,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";

interface CourseData extends CourseWithCategory {
  sections: (Section & {
    lessons: Lesson[];
  })[];
  resources: any[];
}

export default function AdminEditCourse() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("content");
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceProgress, setResourceProgress] = useState(0);

  // Fetch course data
  const {
    data: courseData,
    isLoading,
    error,
  } = useQuery<CourseData>({
    queryKey: [`/api/admin/courses/${courseId}`],
    enabled: !!courseId,
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.statusText}`);
      }
      return await response.json();
    }
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      await apiRequest("DELETE", `/api/admin/sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Section deleted",
        description: "The section has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete section",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await apiRequest("DELETE", `/api/admin/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Lesson deleted",
        description: "The lesson has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle resource upload
  const handleResourceUpload = async (file: File) => {
    try {
      setResourceUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("courseId", courseId.toString());
      
      // Set up progress tracking
      const interval = setInterval(() => {
        setResourceProgress(prev => Math.min(prev + 5, 95)); // Only go up to 95% until we get confirmation
      }, 300);
      
      // Make the actual upload request
      const response = await fetch("/api/admin/upload-resource", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      clearInterval(interval);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setResourceProgress(100);
      setResourceUploading(false);
      
      // Refresh the resources list
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      
      toast({
        title: "Resource uploaded",
        description: "The resource has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Resource upload error:", error);
      setResourceUploading(false);
      setResourceProgress(0);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The resource could not be uploaded. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      await apiRequest("DELETE", `/api/admin/resources/${resourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Resource deleted",
        description: "The resource has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete resource",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate total duration of lessons
  const calculateTotalDuration = (sections: Section & { lessons: Lesson[] }[]) => {
    let totalSeconds = 0;
    sections.forEach(section => {
      section.lessons.forEach(lesson => {
        totalSeconds += lesson.duration || 0;
      });
    });
    
    // Format into hours and minutes
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Format video duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !courseData) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error Loading Course</h1>
          <p className="text-gray-500 mb-6">
            {error instanceof Error ? error.message : "Failed to load the course. It might have been deleted."}
          </p>
          <Button asChild>
            <Link href="/admin/courses">Back to Courses</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{courseData.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={courseData.isPublished ? "default" : "outline"}>
              {courseData.isPublished ? "Published" : "Draft"}
            </Badge>
            {courseData.isFeatured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            <Badge 
              variant="outline" 
              className={courseData.category?.textColor || "text-primary"}
            >
              {courseData.category?.name || "Uncategorized"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/courses/${courseData.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="content">Content & Lessons</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Course Details</CardTitle>
              <CardDescription>
                Update the course information, pricing, and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm 
                courseId={courseId} 
                defaultValues={{
                  title: courseData.title,
                  description: courseData.description || "",
                  slug: courseData.slug,
                  thumbnailUrl: courseData.thumbnailUrl || "",
                  price: courseData.price,
                  salePrice: courseData.salePrice,
                  categoryId: courseData.categoryId,
                  isFeatured: courseData.isFeatured,
                  isPublished: courseData.isPublished,
                  duration: courseData.duration || 0,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Course Content</CardTitle>
                    <CardDescription>
                      Organize your course into sections and lessons.
                    </CardDescription>
                  </div>
                  <SectionForm 
                    courseId={courseId}
                    triggerLabel="Add New Section"
                  />
                </CardHeader>
                <CardContent>
                  {courseData.sections.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg border-dashed">
                      <PlusCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Sections Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Create your first section to start adding lessons to your course.
                      </p>
                      <SectionForm
                        courseId={courseId}
                        triggerLabel="Create First Section"
                      />
                    </div>
                  ) : (
                    <Accordion type="multiple" defaultValue={[`section-${courseData.sections[0].id}`]}>
                      {courseData.sections.map((section, index) => (
                        <AccordionItem key={section.id} value={`section-${section.id}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pr-4">
                              <div className="text-left">
                                <div className="font-medium text-base">{section.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <SectionForm
                                  courseId={courseId}
                                  sectionId={section.id}
                                  defaultValues={{
                                    title: section.title,
                                    description: section.description || "",
                                    courseId: courseId,
                                    order: section.order,
                                  }}
                                  triggerLabel="Edit"
                                  title="Edit Section"
                                />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete
                                        the section "{section.title}" and all its lessons.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteSectionMutation.mutate(section.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deleteSectionMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 mt-2">
                              {section.lessons.length === 0 ? (
                                <div className="text-center py-8 border rounded-lg border-dashed">
                                  <Video className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                  <p className="text-sm text-gray-500 mb-3">
                                    No lessons in this section yet.
                                  </p>
                                  <LessonForm
                                    sectionId={section.id}
                                    courseId={courseId}
                                    triggerLabel="Add First Lesson"
                                  />
                                </div>
                              ) : (
                                <>
                                  {section.lessons.map((lesson, lessonIndex) => (
                                    <div 
                                      key={lesson.id} 
                                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                                          {lessonIndex + 1}
                                        </div>
                                        <div>
                                          <div className="font-medium">{lesson.title}</div>
                                          <div className="text-sm text-muted-foreground flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatDuration(lesson.duration)}
                                            {lesson.isPreview && (
                                              <Badge variant="outline" className="ml-2 text-xs">Preview</Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <LessonForm
                                          sectionId={section.id}
                                          courseId={courseId}
                                          lessonId={lesson.id}
                                          defaultValues={{
                                            title: lesson.title,
                                            description: lesson.description || "",
                                            sectionId: section.id,
                                            order: lesson.order,
                                            videoUrl: lesson.videoUrl || "",
                                            duration: lesson.duration || 0,
                                            isPreview: lesson.isPreview,
                                          }}
                                          triggerLabel="Edit"
                                          title="Edit Lesson"
                                        />
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete
                                                the lesson "{lesson.title}" and its content.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                {deleteLessonMutation.isPending ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  "Delete"
                                                )}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="pl-12 pt-2">
                                    <LessonForm
                                      sectionId={section.id}
                                      courseId={courseId}
                                      triggerLabel="Add Lesson"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Course Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Sections</h3>
                    <p className="text-lg font-semibold">{courseData.sections.length}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Lessons</h3>
                    <p className="text-lg font-semibold">
                      {courseData.sections.reduce((acc, section) => acc + section.lessons.length, 0)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Duration</h3>
                    <p className="text-lg font-semibold">
                      {calculateTotalDuration(courseData.sections)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Resources</h3>
                    <p className="text-lg font-semibold">
                      {courseData.resources.length}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(courseData.salePrice || courseData.price)}
                      {courseData.salePrice && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(courseData.price)}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Course Resources</CardTitle>
              <CardDescription>
                Manage downloadable resources for this course.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Upload New Resource</h3>
                <FileUpload
                  label="Upload a resource file (PDF, DOCX, XLSX, etc.)"
                  onUpload={handleResourceUpload}
                  uploading={resourceUploading}
                  uploadProgress={resourceProgress}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                  maxSize={50}
                  buttonText="Select Resource File"
                />
              </div>

              <Separator className="my-6" />

              <h3 className="text-lg font-medium mb-4">Existing Resources</h3>
              
              {courseData.resources.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
                  <p className="text-gray-500">
                    Upload resources like PDFs, documents, spreadsheets, or presentation slides.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseData.resources.map((resource) => (
                    <Card key={resource.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                            <File className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">{resource.title}</h4>
                            {resource.description && (
                              <p className="text-sm text-gray-500">{resource.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {resource.fileType} • {resource.fileSize ? (
                                resource.fileSize > 1024 * 1024 
                                  ? `${(resource.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                  : `${(resource.fileSize / 1024).toFixed(2)} KB`
                              ) : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete
                                  the resource "{resource.title}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteResourceMutation.mutate(resource.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteResourceMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
