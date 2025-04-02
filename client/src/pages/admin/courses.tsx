import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { CourseWithCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "./components/admin-layout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  MoreVertical,
  Plus,
  Search,
  Check,
  X,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";

export default function AdminCourses() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch all courses
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery<CourseWithCategory[]>({
    queryKey: ["/api/admin/courses"],
  });

  // Toggle course published status
  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      await apiRequest("PUT", `/api/admin/courses/${id}`, { isPublished });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: variables.isPublished ? "Course Published" : "Course Unpublished",
        description: variables.isPublished
          ? "The course is now visible to users."
          : "The course is now hidden from users.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle course featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      await apiRequest("PUT", `/api/admin/courses/${id}`, { isFeatured });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: variables.isFeatured ? "Course Featured" : "Course Unfeatured",
        description: variables.isFeatured
          ? "The course will be featured on the homepage."
          : "The course will no longer be featured on the homepage.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete course
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Course Deleted",
        description: "The course has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get unique categories from courses
  const categories = courses
    ? Array.from(new Set(courses.map((course) => course.category?.name)))
        .filter(Boolean)
        .sort()
    : [];

  // Filter and sort courses
  const filteredCourses = courses
    ? courses
        .filter((course) => {
          // Filter by search query
          const matchesSearch =
            searchQuery === "" ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (course.description &&
              course.description.toLowerCase().includes(searchQuery.toLowerCase()));

          // Filter by category
          const matchesCategory =
            categoryFilter === "all" ||
            course.category?.name.toLowerCase() === categoryFilter.toLowerCase();

          // Filter by status
          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "published" && course.isPublished) ||
            (statusFilter === "draft" && !course.isPublished) ||
            (statusFilter === "featured" && course.isFeatured);

          return matchesSearch && matchesCategory && matchesStatus;
        })
        // Sort courses
        .sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case "title":
              comparison = a.title.localeCompare(b.title);
              break;
            case "category":
              comparison = (a.category?.name || "").localeCompare(b.category?.name || "");
              break;
            case "price":
              comparison = (a.salePrice || a.price) - (b.salePrice || b.price);
              break;
            case "date":
              // We don't have date in our schema, so we'll use id as a proxy
              comparison = a.id - b.id;
              break;
            default:
              comparison = a.title.localeCompare(b.title);
          }
          return sortOrder === "asc" ? comparison : -comparison;
        })
    : [];

  // Handle toggle published
  const handleTogglePublished = (id: number, isPublished: boolean) => {
    togglePublishedMutation.mutate({ id, isPublished });
  };

  // Handle toggle featured
  const handleToggleFeatured = (id: number, isFeatured: boolean) => {
    toggleFeaturedMutation.mutate({ id, isFeatured });
  };

  // Handle delete course
  const handleDeleteCourse = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Format price
  const formatPrice = (price: number, salePrice?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(salePrice || price);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Course Management</CardTitle>
          <CardDescription>
            Create, edit, and manage your courses from this dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 flex flex-col sm:flex-row gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category?.toLowerCase() || ""}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setSortBy("title")}
                    className="justify-between"
                  >
                    Title
                    {sortBy === "title" && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("category")}
                    className="justify-between"
                  >
                    Category
                    {sortBy === "category" && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("price")}
                    className="justify-between"
                  >
                    Price
                    {sortBy === "price" && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="justify-between"
                  >
                    <span>{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
                    <ArrowUpDown className="h-4 w-4 ml-2" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              Failed to load courses. Please try again.
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No courses found. Try adjusting your filters or create a new course.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {course.description?.slice(0, 60)}
                              {course.description && course.description.length > 60 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.category ? (
                          <Badge 
                            variant="outline" 
                            className={`${course.category.bgColor || 'bg-blue-100'} ${course.category.textColor || 'text-primary'}`}
                          >
                            {course.category.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.salePrice ? (
                          <div>
                            <span className="font-medium">{formatPrice(course.salePrice)}</span>
                            <span className="text-gray-500 line-through text-xs ml-1">
                              {formatPrice(course.price)}
                            </span>
                          </div>
                        ) : (
                          <span>{formatPrice(course.price)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={course.isPublished}
                          onCheckedChange={(checked) =>
                            handleTogglePublished(course.id, checked)
                          }
                          disabled={togglePublishedMutation.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={course.isFeatured}
                          onCheckedChange={(checked) =>
                            handleToggleFeatured(course.id, checked)
                          }
                          disabled={toggleFeaturedMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link href={`/courses/${course.slug}`} target="_blank">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Course
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/admin/courses/${course.id}/edit`}>
                              <DropdownMenuItem>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Course
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                  <span className="text-destructive">Delete Course</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete
                                    the course "{course.title}" and all its content.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
    </AdminLayout>
  );
}
