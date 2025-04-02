import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryCard } from "@/components/category-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Category, CourseWithCategory } from "@shared/schema";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function CoursesPage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("default");

  // Parse URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location]);

  // Fetch all categories
  const {
    data: categories,
    isLoading: categoriesLoading
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch all courses
  const {
    data: courses,
    isLoading: coursesLoading,
    error: coursesError
  } = useQuery<CourseWithCategory[]>({
    queryKey: ["/api/courses"],
  });

  // Filter courses based on search, category, and tab
  const filteredCourses = courses?.filter(course => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === "" || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by category
    const matchesCategory = 
      selectedCategory === "" || 
      course.category?.slug === selectedCategory;
    
    // Filter by tab (all, featured, etc.)
    const matchesTab = 
      selectedTab === "all" || 
      (selectedTab === "featured" && course.isFeatured);
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  // Sort courses based on selected option
  const sortedCourses = [...(filteredCourses || [])].sort((a, b) => {
    switch (sortOption) {
      case "price-low":
        return (a.salePrice || a.price) - (b.salePrice || b.price);
      case "price-high":
        return (b.salePrice || b.price) - (a.salePrice || a.price);
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  // Get selected category name
  const selectedCategoryName = categories?.find(
    cat => cat.slug === selectedCategory
  )?.name;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedTab("all");
    setSortOption("default");
  };

  return (
    <MainLayout>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {selectedCategoryName ? `${selectedCategoryName} Courses` : "Browse Our Courses"}
            </h1>
            <p className="text-xl text-gray-600">
              {selectedCategoryName 
                ? `Explore our ${selectedCategoryName.toLowerCase()} courses taught by industry experts.`
                : "Discover the perfect course to boost your skills and advance your career."}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Scroller */}
        {!categoriesLoading && categories && (
          <div className="mb-8 overflow-x-auto pb-4">
            <div className="flex space-x-4 min-w-max">
              <Button
                variant={selectedCategory === "" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setSelectedCategory("")}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  className={`rounded-full ${
                    selectedCategory === category.slug
                      ? `bg-primary text-white`
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={selectedTab} onValueChange={setSelectedTab}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="featured">Featured Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="title-asc">Title: A to Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={clearFilters}
                disabled={!searchQuery && !selectedCategory && selectedTab === "all" && sortOption === "default"}
              >
                <X size={16} className="mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Active filters */}
          {(searchQuery || selectedCategory || selectedTab !== "all" || sortOption !== "default") && (
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="text-sm text-gray-500 mr-2 my-auto">Active filters:</div>
              {searchQuery && (
                <Badge variant="secondary" className="px-2 py-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-2 focus:outline-none" aria-label="Remove filter">
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="px-2 py-1">
                  Category: {selectedCategoryName}
                  <button onClick={() => setSelectedCategory("")} className="ml-2 focus:outline-none" aria-label="Remove filter">
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {selectedTab !== "all" && (
                <Badge variant="secondary" className="px-2 py-1">
                  {selectedTab === "featured" ? "Featured Only" : selectedTab}
                  <button onClick={() => setSelectedTab("all")} className="ml-2 focus:outline-none" aria-label="Remove filter">
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {sortOption !== "default" && (
                <Badge variant="secondary" className="px-2 py-1">
                  Sorted by: {
                    sortOption === "price-low" ? "Price: Low to High" :
                    sortOption === "price-high" ? "Price: High to Low" :
                    sortOption === "title-asc" ? "Title: A to Z" :
                    sortOption === "title-desc" ? "Title: Z to A" : 
                    sortOption
                  }
                  <button onClick={() => setSortOption("default")} className="ml-2 focus:outline-none" aria-label="Remove filter">
                    <X size={12} />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md">
                <Skeleton className="w-full h-48" />
                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <Skeleton className="h-5 w-20" />
                    <div className="flex items-center ml-auto">
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : coursesError ? (
          <div className="text-center p-12 bg-red-50 rounded-lg">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Courses</h3>
            <p className="text-red-600">There was a problem loading the courses. Please try again later.</p>
          </div>
        ) : sortedCourses?.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Courses Found</h3>
            <p className="text-gray-600 mb-4">We couldn't find any courses matching your criteria.</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedCourses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
