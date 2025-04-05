import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Search, MoreVertical, FileText, Download, Trash, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ResourceWithExtras extends Resource {
  courseInfo?: {
    id: number;
    title: string;
  } | null;
  lessonInfo?: {
    id: number;
    title: string;
  } | null;
}

export default function AdminResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceToDelete, setResourceToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch all resources
  const {
    data: resources,
    isLoading,
    error,
  } = useQuery<ResourceWithExtras[]>({
    queryKey: ["/api/admin/resources"],
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      await apiRequest("DELETE", `/api/admin/resources/${resourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({
        title: "Resource deleted",
        description: "The resource has been successfully deleted.",
      });
      setResourceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete resource",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format file size to readable format
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Get file type badge color
  const getFileTypeBadgeVariant = (fileType: string | null | undefined) => {
    if (!fileType) return "secondary";
    
    if (fileType.includes("pdf")) return "destructive";
    if (fileType.includes("image")) return "default";
    if (fileType.includes("video")) return "default";
    if (fileType.includes("audio")) return "default";
    if (fileType.includes("text")) return "secondary";
    if (fileType.includes("msword") || fileType.includes("officedocument")) return "default";
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "default";
    
    return "secondary";
  };

  // Filter resources based on search query
  const filteredResources = resources
    ? resources.filter((resource) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          resource.title.toLowerCase().includes(searchLower) ||
          resource.courseInfo?.title.toLowerCase().includes(searchLower) ||
          resource.lessonInfo?.title.toLowerCase().includes(searchLower) ||
          (resource.description && resource.description.toLowerCase().includes(searchLower))
        );
      })
    : [];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">
              Manage all course resources and materials
            </p>
          </div>
          <Button asChild>
            <a href="/admin/upload">Upload New Resource</a>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>All Resources</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search resources..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              {resources ? resources.length : 0} resources found in total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <p className="text-center py-4 text-destructive">
                Failed to load resources: {error.message}
              </p>
            ) : filteredResources.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No resources found{searchQuery ? " matching your search" : ""}
              </p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{resource.title}</span>
                          </div>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                              {resource.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {resource.courseInfo ? (
                            <span>{resource.courseInfo.title}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {resource.lessonInfo ? (
                            <span>{resource.lessonInfo.title}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getFileTypeBadgeVariant(resource.fileType)}>
                            {resource.fileType
                              ? resource.fileType.split("/")[1]?.toUpperCase() || 
                                resource.fileType.split("/")[0]?.toUpperCase()
                              : "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatFileSize(resource.fileSize)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                aria-label="Open menu"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <a
                                  href={resource.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center cursor-pointer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={resource.fileUrl}
                                  download
                                  className="flex items-center cursor-pointer"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setResourceToDelete(resource.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={resourceToDelete !== null} onOpenChange={() => setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource and remove it from courses and lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resourceToDelete) {
                  deleteResourceMutation.mutate(resourceToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteResourceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}