import { AdminLayout } from "@/components/layouts/admin-layout";
import { CourseForm } from "./components/course-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminNewCourse() {
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

      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>
            Fill out the form below to create a new course. You can add lessons and content later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
