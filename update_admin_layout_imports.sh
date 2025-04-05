#!/bin/bash

# Update all imports in admin pages
FILES="client/src/pages/admin/courses.tsx client/src/pages/admin/pending-enrollments.tsx client/src/pages/admin/resources.tsx client/src/pages/admin/users.tsx client/src/pages/admin/upload.tsx client/src/pages/admin/edit-course.tsx"

for file in $FILES; do
  sed -i 's|import { AdminLayout } from "./components/admin-layout";|import { AdminLayout } from "@/components/layouts/admin-layout";|g' $file
  echo "Updated $file"
done

echo "All imports updated"