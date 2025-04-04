import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Lesson, Course, UploadVideoData, UploadResourceData } from "@shared/schema";
import { AdminLayout } from "./components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileVideo, FileUp } from "lucide-react";

// Form schema for video upload
const videoUploadSchema = z.object({
  lessonId: z.string().min(1, { message: "Lesson is required" }),
  video: z.instanceof(File, { message: "Video file is required" })
});

// Form schema for resource upload
const resourceUploadSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  courseId: z.string().min(1, { message: "Course is required" }),
  lessonId: z.string().optional(),
  file: z.instanceof(File, { message: "File is required" })
});

export default function AdminUpload() {
  const [activeTab, setActiveTab] = useState("video");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Fetch courses for the resource upload form
  const { 
    data: courses,
    isLoading: coursesLoading 
  } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  // Fetch lessons for the video upload form and filtered lesson select
  const {
    data: lessons,
    isLoading: lessonsLoading
  } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons"],
  });

  // Filter lessons based on selected course
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  
  // Define section type
  interface Section {
    id: number;
    title: string;
    courseId: number;
    order: number;
    description: string | null;
  }
  
  // Fetch sections to filter lessons by course
  const { 
    data: sections 
  } = useQuery<Section[]>({
    queryKey: ["/api/admin/sections"],
  });

  useEffect(() => {
    if (lessons && selectedCourseId && sections) {
      // Get the courseId from the selected lesson's section
      const filtered = lessons.filter(lesson => {
        const lessonSectionId = lesson.sectionId;
        // Find the section for this lesson
        const section = sections.find(s => s.id === lessonSectionId);
        return section && section.courseId === parseInt(selectedCourseId);
      });
      setFilteredLessons(filtered);
    } else {
      setFilteredLessons([]);
    }
  }, [selectedCourseId, lessons, sections]);

  // Video upload form
  const videoForm = useForm<z.infer<typeof videoUploadSchema>>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      lessonId: "",
    }
  });

  // Resource upload form
  const resourceForm = useForm<z.infer<typeof resourceUploadSchema>>({
    resolver: zodResolver(resourceUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      lessonId: "",
    }
  });

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      videoForm.setValue("video", e.target.files[0], { shouldValidate: true });
    }
  };

  // Handle resource file selection
  const handleResourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResourceFile(e.target.files[0]);
      resourceForm.setValue("file", e.target.files[0], { shouldValidate: true });
    }
  };

  // Handle video upload submission
  const onVideoSubmit = async (data: z.infer<typeof videoUploadSchema>) => {
    if (!videoFile) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("lessonId", data.lessonId);
      formData.append("video", videoFile);

      const response = await fetch("/api/admin/upload-video", {
        method: "POST",
        body: formData,
        credentials: "include", // Include credentials to send cookies for authentication
        // Don't set Content-Type header as FormData will set it with boundary
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      // Reset form
      videoForm.reset();
      setVideoFile(null);
      
      // Invalidate lessons cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });

    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle resource upload submission
  const onResourceSubmit = async (data: z.infer<typeof resourceUploadSchema>) => {
    if (!resourceFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("courseId", data.courseId);
      
      if (data.description) {
        formData.append("description", data.description);
      }
      
      if (data.lessonId) {
        formData.append("lessonId", data.lessonId);
      }
      
      formData.append("file", resourceFile);

      const response = await fetch("/api/admin/upload-resource", {
        method: "POST",
        body: formData,
        credentials: "include", // Include credentials to send cookies for authentication
        // Don't set Content-Type header as FormData will set it with boundary
      });

      if (!response.ok) {
        throw new Error("Failed to upload resource");
      }

      toast({
        title: "Success",
        description: "Resource uploaded successfully",
      });

      // Reset form
      resourceForm.reset();
      setResourceFile(null);
      setSelectedCourseId("");
      
      // Invalidate resources cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });

    } catch (error) {
      console.error("Error uploading resource:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload resource",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle course selection change for resource upload
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value);
    resourceForm.setValue("courseId", value);
    resourceForm.setValue("lessonId", ""); // Reset lesson selection
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upload Content</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="video" className="flex items-center gap-2">
            <FileVideo className="h-4 w-4" />
            <span>Upload Video</span>
          </TabsTrigger>
          <TabsTrigger value="resource" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span>Upload Resource</span>
          </TabsTrigger>
        </TabsList>

        {/* Video Upload Tab */}
        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Upload Lesson Video</CardTitle>
              <CardDescription>
                Upload video content for existing lessons. Supported formats: MP4, WebM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lessonsLoading ? (
                <div className="flex justify-center my-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : lessons && lessons.length > 0 ? (
                <Form {...videoForm}>
                  <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-6">
                    <FormField
                      control={videoForm.control}
                      name="lessonId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Lesson</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a lesson" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {lessons.map(lesson => (
                                <SelectItem key={lesson.id} value={lesson.id.toString()}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="video">Video File</Label>
                      <Input
                        id="video"
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={handleVideoChange}
                        className="cursor-pointer"
                      />
                      {videoFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected file: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isUploading || !videoFile}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Video"
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No lessons found. Please create lessons first.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = "/admin/courses"}
                  >
                    Go to Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Upload Tab */}
        <TabsContent value="resource">
          <Card>
            <CardHeader>
              <CardTitle>Upload Resource</CardTitle>
              <CardDescription>
                Upload course materials like PDFs, documents, or spreadsheets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex justify-center my-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : courses && courses.length > 0 ? (
                <Form {...resourceForm}>
                  <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-6">
                    <FormField
                      control={resourceForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter resource title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resourceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter resource description" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resourceForm.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Course</FormLabel>
                          <Select 
                            onValueChange={(value) => handleCourseChange(value)} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map(course => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resourceForm.control}
                      name="lessonId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Lesson (Optional)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!selectedCourseId || filteredLessons.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  !selectedCourseId 
                                    ? "Select a course first" 
                                    : filteredLessons.length === 0 
                                      ? "No lessons available" 
                                      : "Select a lesson (optional)"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredLessons.map(lesson => (
                                <SelectItem key={lesson.id} value={lesson.id.toString()}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="resource-file">Resource File</Label>
                      <Input
                        id="resource-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                        onChange={handleResourceChange}
                        className="cursor-pointer"
                      />
                      {resourceFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected file: {resourceFile.name} ({(resourceFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isUploading || !resourceFile}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Resource"
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No courses found. Please create a course first.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = "/admin/courses/new"}
                  >
                    Create Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}