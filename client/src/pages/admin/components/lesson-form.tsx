import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLessonSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Loader2, Plus, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type LessonFormValues = z.infer<typeof insertLessonSchema> & {
  videoFile?: File;
};

interface LessonFormProps {
  sectionId: number;
  courseId: number;
  onSuccess?: () => void;
  defaultValues?: Partial<LessonFormValues>;
  lessonId?: number;
  triggerLabel?: string;
  title?: string;
}

export function LessonForm({
  sectionId,
  courseId,
  onSuccess,
  defaultValues,
  lessonId,
  triggerLabel = "Add Lesson",
  title = "Add New Lesson"
}: LessonFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Create the form
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(insertLessonSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      sectionId: sectionId,
      order: defaultValues?.order || 1,
      videoUrl: defaultValues?.videoUrl || "",
      duration: defaultValues?.duration || 0,
      isPreview: defaultValues?.isPreview || false,
    },
  });

  // Handle video upload
  const handleVideoUpload = async (file: File) => {
    try {
      setVideoUploading(true);
      
      // Get video duration before uploading
      const durationPromise = new Promise<number>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          resolve(Math.round(video.duration));
        };
        
        video.src = URL.createObjectURL(file);
      });
      
      // Start progress tracking
      const interval = setInterval(() => {
        setVideoProgress(prev => Math.min(prev + 3, 95)); // Go slower to account for duration detection
      }, 500);
      
      // Wait for duration to be detected
      const duration = await durationPromise;
      
      // Create FormData
      const formData = new FormData();
      formData.append("video", file);
      formData.append("lessonId", lessonId ? lessonId.toString() : "");
      formData.append("duration", duration.toString());
      
      // Make the actual upload request
      console.log("Uploading video with duration:", duration);
      const response = await apiRequest("POST", "/api/admin/upload-video", formData, true);
      
      clearInterval(interval);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setVideoProgress(100);
      setVideoUploading(false);
      
      // Update form with the returned video URL and duration
      form.setValue("videoUrl", data.videoUrl);
      form.setValue("duration", duration);
      
      toast({
        title: "Video uploaded",
        description: `Video (${formatDuration(duration)}) has been uploaded successfully.`,
      });
    } catch (error) {
      console.error("Video upload error:", error);
      setVideoUploading(false);
      setVideoProgress(0);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The video could not be uploaded. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      // Remove videoFile from data before sending to API
      const { videoFile, ...lessonData } = data;
      const response = await apiRequest("POST", "/api/admin/lessons", lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Lesson created",
        description: "The lesson has been added successfully.",
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      // Remove videoFile from data before sending to API
      const { videoFile, ...lessonData } = data;
      const response = await apiRequest("PUT", `/api/admin/lessons/${lessonId}`, lessonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Lesson updated",
        description: "The lesson has been updated successfully.",
      });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit form
  const onSubmit = (data: LessonFormValues) => {
    if (lessonId) {
      updateLessonMutation.mutate(data);
    } else {
      createLessonMutation.mutate(data);
    }
  };

  const isSubmitting = createLessonMutation.isPending || updateLessonMutation.isPending;

  // Format duration to display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={lessonId ? "outline" : "secondary"} size={lessonId ? "sm" : "default"}>
          {lessonId ? triggerLabel : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {triggerLabel}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lesson title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter lesson description" 
                          className="h-24"
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPreview"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Preview Lesson</FormLabel>
                        <FormDescription>
                          Make this lesson available for free preview.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Lesson order" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Lesson duration in seconds" 
                          value={field.value || 0}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value && field.value > 0 ? `This is equivalent to ${formatDuration(field.value)}` : ''}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="videoFile"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Video</FormLabel>
                      <FormDescription>
                        Upload a video file for this lesson (MP4, WebM, MOV). Videos cannot be downloaded by students.
                      </FormDescription>
                      <FormControl>
                        <FileUpload
                          accept="video/*"
                          onUpload={file => {
                            onChange(file);
                            handleVideoUpload(file);
                          }}
                          uploading={videoUploading}
                          uploadProgress={videoProgress}
                          fileType="video"
                          maxSize={100} // 100MB
                          buttonText="Select Video"
                          label="Upload Video File"
                          {...fieldProps}
                        />
                      </FormControl>
                      {form.getValues("videoUrl") && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Current video:</p>
                          <div className="w-full rounded-md border overflow-hidden bg-black aspect-video">
                            <video 
                              src={form.getValues("videoUrl") || ''} 
                              className="w-full h-full" 
                              controls
                              controlsList="nodownload"
                              disablePictureInPicture
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || videoUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {lessonId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  lessonId ? "Update Lesson" : "Create Lesson"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
