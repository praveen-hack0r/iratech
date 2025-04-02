from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Category, Course, Section, Lesson, Resource, Enrollment
from .serializers import (
    CategorySerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    SectionSerializer,
    LessonSerializer,
    ResourceSerializer,
    EnrollmentSerializer,
    EnrollmentCreateSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow admins to edit."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class IsEnrolledOrPreview(permissions.BasePermission):
    """Custom permission to only allow enrolled users to view lessons."""
    def has_object_permission(self, request, view, obj):
        # Allow if the lesson is marked as preview
        if obj.is_preview:
            return True
        # Allow if user is staff/admin
        if request.user.is_staff:
            return True
        # Allow if user is enrolled in the course
        return Enrollment.objects.filter(
            user=request.user, 
            course=obj.section.course,
            status='active'
        ).exists()

class IsInstructorOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow instructors of a course to edit it."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Allow if user is admin
        if request.user.is_staff:
            return True
        # Allow if user is the instructor of the course
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user
        # For sections and lessons, check the course instructor
        if hasattr(obj, 'course'):
            return obj.course.instructor == request.user
        if hasattr(obj, 'section'):
            return obj.section.course.instructor == request.user
        return False

class CategoryViewSet(viewsets.ModelViewSet):
    """Viewset for Category model."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

class CourseViewSet(viewsets.ModelViewSet):
    """Viewset for Course model."""
    queryset = Course.objects.all()
    permission_classes = [IsInstructorOrReadOnly]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        return CourseListSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Course.objects.all()
        # Regular users can only see published courses
        return Course.objects.filter(is_published=True)
    
    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)
        
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, slug=None):
        course = self.get_object()
        serializer = EnrollmentCreateSerializer(
            data={'course': course.id},
            context={'request': request}
        )
        if serializer.is_valid():
            enrollment = serializer.save()
            return Response(
                EnrollmentSerializer(enrollment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def check_enrollment(self, request, slug=None):
        course = self.get_object()
        enrollment = Enrollment.objects.filter(
            user=request.user,
            course=course,
            status='active'
        ).first()
        if enrollment:
            return Response(
                {"enrolled": True, "enrollment": EnrollmentSerializer(enrollment).data},
                status=status.HTTP_200_OK
            )
        return Response(
            {"enrolled": False},
            status=status.HTTP_200_OK
        )
    
class FeaturedCoursesView(generics.ListAPIView):
    """View for featured courses."""
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Course.objects.filter(is_featured=True, is_published=True)

class SectionViewSet(viewsets.ModelViewSet):
    """Viewset for Section model."""
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsInstructorOrReadOnly]

class LessonViewSet(viewsets.ModelViewSet):
    """Viewset for Lesson model."""
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsInstructorOrReadOnly]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if the user has permission to view this lesson
        if not IsEnrolledOrPreview().has_object_permission(request, self, instance):
            return Response(
                {"detail": "You must be enrolled in this course to access this lesson."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class ResourceViewSet(viewsets.ModelViewSet):
    """Viewset for Resource model."""
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = Resource.objects.all()
        
        # Filter by course_id if provided
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        # Filter by lesson_id if provided
        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
            
        return queryset

class EnrollmentViewSet(viewsets.ModelViewSet):
    """Viewset for Enrollment model."""
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            # Admin can see all enrollments
            return Enrollment.objects.all()
        # Users can only see their own enrollments
        return Enrollment.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = EnrollmentCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            enrollment = serializer.save()
            return Response(
                EnrollmentSerializer(enrollment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        enrollment = self.get_object()
        status_value = request.data.get('status')
        
        if not status_value:
            return Response(
                {"detail": "Status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if status_value not in [s[0] for s in Enrollment.STATUS_CHOICES]:
            return Response(
                {"detail": "Invalid status value"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        enrollment.status = status_value
        enrollment.save()
        
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_200_OK
        )