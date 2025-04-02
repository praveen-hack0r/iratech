from django.db import models
from django.utils.text import slugify
from django.conf import settings
import uuid
import os

def course_image_path(instance, filename):
    """Generate file path for course images"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('courses/images', filename)

def video_upload_path(instance, filename):
    """Generate file path for video uploads"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('videos', filename)

def resource_upload_path(instance, filename):
    """Generate file path for resource uploads"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('resources', filename)

class Category(models.Model):
    """Category model for organizing courses."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=100)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to=course_image_path, blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Course(models.Model):
    """Course model containing information about a course."""
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='courses')
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    thumbnail = models.ImageField(upload_to=course_image_path)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.title

class Section(models.Model):
    """Section model for organizing lessons within a course."""
    title = models.CharField(max_length=200)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    """Lesson model representing individual video lessons."""
    title = models.CharField(max_length=200)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='lessons')
    description = models.TextField(blank=True, null=True)
    video = models.FileField(upload_to=video_upload_path)
    duration = models.PositiveIntegerField(default=0, help_text="Duration in seconds")
    order = models.PositiveIntegerField(default=0)
    is_preview = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return self.title

class Resource(models.Model):
    """Resource model for course or lesson supplementary materials."""
    RESOURCE_TYPE_CHOICES = (
        ('pdf', 'PDF Document'),
        ('doc', 'Word Document'),
        ('xls', 'Excel Spreadsheet'),
        ('zip', 'ZIP Archive'),
        ('other', 'Other File'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to=resource_upload_path)
    resource_type = models.CharField(max_length=10, choices=RESOURCE_TYPE_CHOICES, default='other')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class Enrollment(models.Model):
    """Enrollment model tracking course enrollments."""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('refunded', 'Refunded'),
        ('expired', 'Expired'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        unique_together = ('user', 'course')
        
    def __str__(self):
        return f"{self.user.email} enrolled in {self.course.title}"
