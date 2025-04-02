from rest_framework import serializers
from ..models import Category, Course, Section, Lesson, Resource, Enrollment
from users.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for the Category model."""
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image')
        read_only_fields = ('id', 'slug')

class ResourceSerializer(serializers.ModelSerializer):
    """Serializer for the Resource model."""
    class Meta:
        model = Resource
        fields = ('id', 'title', 'description', 'file', 'resource_type', 'created_at')
        read_only_fields = ('id', 'created_at')

class LessonSerializer(serializers.ModelSerializer):
    """Serializer for the Lesson model."""
    resources = ResourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Lesson
        fields = ('id', 'title', 'section', 'description', 'video', 'duration', 
                  'order', 'is_preview', 'resources', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class SectionSerializer(serializers.ModelSerializer):
    """Serializer for the Section model."""
    lessons = LessonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = ('id', 'title', 'course', 'order', 'lessons')
        read_only_fields = ('id',)

class CourseListSerializer(serializers.ModelSerializer):
    """Serializer for listing courses."""
    instructor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Course
        fields = ('id', 'title', 'slug', 'description', 'category', 'instructor', 
                  'price', 'thumbnail', 'is_featured', 'is_published', 'created_at')
        read_only_fields = ('id', 'slug', 'created_at')

class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed course view."""
    instructor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    sections = SectionSerializer(many=True, read_only=True)
    resources = ResourceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = ('id', 'title', 'slug', 'description', 'category', 'instructor', 
                  'price', 'thumbnail', 'is_featured', 'is_published', 
                  'sections', 'resources', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for course creation and updates."""
    class Meta:
        model = Course
        fields = ('id', 'title', 'description', 'category', 'price', 'thumbnail', 
                  'is_featured', 'is_published')
        read_only_fields = ('id',)

class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for the Enrollment model."""
    user = UserSerializer(read_only=True)
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ('id', 'user', 'course', 'enrolled_at', 'status')
        read_only_fields = ('id', 'user', 'course', 'enrolled_at')

class EnrollmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating enrollments."""
    class Meta:
        model = Enrollment
        fields = ('course',)

    def create(self, validated_data):
        user = self.context['request'].user
        course = validated_data['course']
        
        # Check if enrollment already exists
        existing_enrollment = Enrollment.objects.filter(user=user, course=course).first()
        if existing_enrollment:
            if existing_enrollment.status == 'refunded' or existing_enrollment.status == 'expired':
                existing_enrollment.status = 'active'
                existing_enrollment.save()
                return existing_enrollment
            return existing_enrollment
            
        return Enrollment.objects.create(user=user, course=course, status='active')