import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { insertCourseSchema, Category } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extended schema with slug generation helper
const courseFormSchema = insertCourseSchema.extend({
  thumbnailFile: z.instanceof(File).optional(),
}).refine(data => {
  // Either an existing thumbnailUrl or a new file must be provided
  return !!data.thumbnailUrl || !!data.thumbnailFile;
}, {
  message: "Either a thumbnail URL or file must be provided",
  path: ["thumbnailFile"],
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  courseId?: number;
  defaultValues?: CourseFormValues;
}

export function CourseForm({ courseId, defaultValues }: CourseFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);

  // Fetch categories for the dropdown
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create the form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      slug: "",
      thumbnailUrl: "",
      price: 0,
      salePrice: undefined,
      categoryId: 0,
      isFeatured: false,
      isPublished: false,
      duration: 0,
    },
  });

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-");
  };

  // Watch title to generate slug
  const title = form.watch("title");
  useEffect(() => {
    if (title && !courseId) {
      form.setValue("slug", generateSlug(title));
    }
  }, [title, form, courseId]);

  // Handle thumbnail upload
  const handleThumbnailUpload = async (file: File) => {
    try {
      setThumbnailUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append("thumbnail", file);
      
      // Simulate upload progress for demo
      const interval = setInterval(() => {
        setThumbnailProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      // In a real app, you would make an actual upload request here
      // For demo, we'll just create a fake URL after "uploading" is done
      setTimeout(() => {
        clearInterval(interval);
        setThumbnailProgress(100);
        setThumbnailUploading(false);
        
        // Set a fake URL for demonstration
        form.setValue("thumbnailUrl", URL.createObjectURL(file));
        
        toast({
          title: "Thumbnail uploaded",
          description: "The thumbnail has been uploaded successfully.",
        });
      }, 3000);
    } catch (error) {
      setThumbnailUploading(false);
      toast({
        title: "Upload failed",
        description: "The thumbnail could not be uploaded. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      // Remove thumbnailFile from data before sending to API
      const { thumbnailFile, ...courseData } = data;
      const response = await apiRequest("POST", "/api/admin/courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Course created",
        description: "The course has been created successfully.",
      });
      navigate("/admin/courses");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      // Remove thumbnailFile from data before sending to API
      const { thumbnailFile, ...courseData } = data;
      const response = await apiRequest("PUT", `/api/admin/courses/${courseId}`, courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Course updated",
        description: "The course has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit form
  const onSubmit = (data: CourseFormValues) => {
    if (courseId) {
      updateCourseMutation.mutate(data);
    } else {
      createCourseMutation.mutate(data);
    }
  };

  const isSubmitting = createCourseMutation.isPending || updateCourseMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {(createCourseMutation.error || updateCourseMutation.error) && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {createCourseMutation.error?.message || updateCourseMutation.error?.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="course-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be used for the course URL.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1999.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="999.00"
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Course duration in minutes"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Approximate total duration of the course in minutes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter course description"
                      className="h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Thumbnail Image</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept="image/*"
                      onUpload={file => {
                        onChange(file);
                        handleThumbnailUpload(file);
                      }}
                      uploading={thumbnailUploading}
                      uploadProgress={thumbnailProgress}
                      fileType="image"
                      {...fieldProps}
                    />
                  </FormControl>
                  {form.getValues("thumbnailUrl") && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Current thumbnail:</p>
                      <div 
                        className="w-full h-40 bg-cover bg-center rounded-md border"
                        style={{ backgroundImage: `url(${form.getValues("thumbnailUrl")})` }}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Featured Course</FormLabel>
                      <FormDescription>
                        Highlight this course on the homepage.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Published</FormLabel>
                      <FormDescription>
                        Make this course visible to users.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/courses")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || thumbnailUploading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {courseId ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {courseId ? "Update Course" : "Create Course"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
