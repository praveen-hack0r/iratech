import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSectionSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type SectionFormValues = z.infer<typeof insertSectionSchema>;

interface SectionFormProps {
  courseId: number;
  onSuccess?: () => void;
  defaultValues?: Partial<SectionFormValues>;
  sectionId?: number;
  triggerLabel?: string;
  title?: string;
}

export function SectionForm({
  courseId,
  onSuccess,
  defaultValues,
  sectionId,
  triggerLabel = "Add Section",
  title = "Add New Section"
}: SectionFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Create the form
  const form = useForm<SectionFormValues>({
    resolver: zodResolver(insertSectionSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      courseId: courseId,
      order: defaultValues?.order || 1,
    },
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: SectionFormValues) => {
      const response = await apiRequest("POST", "/api/admin/sections", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Section created",
        description: "The section has been added successfully.",
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create section",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async (data: SectionFormValues) => {
      const response = await apiRequest("PUT", `/api/admin/sections/${sectionId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}`] });
      toast({
        title: "Section updated",
        description: "The section has been updated successfully.",
      });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update section",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit form
  const onSubmit = (data: SectionFormValues) => {
    if (sectionId) {
      updateSectionMutation.mutate(data);
    } else {
      createSectionMutation.mutate(data);
    }
  };

  const isSubmitting = createSectionMutation.isPending || updateSectionMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={sectionId ? "outline" : "default"} size={sectionId ? "sm" : "default"}>
          {sectionId ? triggerLabel : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {triggerLabel}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter section title" {...field} />
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
                      placeholder="Enter section description" 
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
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Section order" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {sectionId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  sectionId ? "Update Section" : "Create Section"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
