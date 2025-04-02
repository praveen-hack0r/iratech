from django.contrib import admin
from .models import Category, Course, Section, Lesson, Resource, Enrollment

class SectionInline(admin.TabularInline):
    model = Section
    extra = 1

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'category', 'price', 'is_featured', 'is_published', 'created_at')
    list_filter = ('is_featured', 'is_published', 'category', 'created_at')
    search_fields = ('title', 'description', 'instructor__email')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [SectionInline]

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1

class SectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    search_fields = ('title', 'course__title')
    inlines = [LessonInline]

class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'duration', 'is_preview', 'created_at')
    list_filter = ('is_preview', 'created_at', 'section__course')
    search_fields = ('title', 'description', 'section__title', 'section__course__title')

class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'course', 'lesson', 'created_at')
    list_filter = ('resource_type', 'created_at')
    search_fields = ('title', 'description', 'course__title', 'lesson__title')

class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'status', 'enrolled_at')
    list_filter = ('status', 'enrolled_at')
    search_fields = ('user__email', 'course__title')

# Register models
admin.site.register(Category, CategoryAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(Section, SectionAdmin)
admin.site.register(Lesson, LessonAdmin)
admin.site.register(Resource, ResourceAdmin)
admin.site.register(Enrollment, EnrollmentAdmin)
