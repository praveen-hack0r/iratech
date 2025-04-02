from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import uuid

from .models import UserProgress
from .serializers import (
    UserSerializer, 
    UserProfileSerializer, 
    UserRegistrationSerializer,
    ChangePasswordSerializer, 
    ResetPasswordRequestSerializer,
    ResetPasswordConfirmSerializer,
    UserProgressSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """Viewset for User model."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating user profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class RegisterView(generics.CreateAPIView):
    """View for user registration."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Automatically log in the user after registration
        login(request, user)
        
        return Response(
            {"user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )

class LoginView(APIView):
    """View for user login."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return Response(
                {"user": UserSerializer(user).data},
                status=status.HTTP_200_OK
            )
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

class LogoutView(APIView):
    """View for user logout."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response(
            {"detail": "Successfully logged out"},
            status=status.HTTP_200_OK
        )

class ChangePasswordView(generics.GenericAPIView):
    """View for changing password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            # Check old password
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response(
                    {"old_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            
            # Update session
            login(request, user)
            
            return Response(
                {"detail": "Password updated successfully"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordRequestView(generics.GenericAPIView):
    """View for requesting password reset."""
    serializer_class = ResetPasswordRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
                # Generate reset token
                user.reset_token = uuid.uuid4()
                user.reset_token_expiry = timezone.now() + timedelta(hours=24)
                user.save()
                
                # In a real app, send an email with reset link
                # For now, just return the token (NOT for production!)
                return Response(
                    {"detail": "Password reset instructions sent to email", "token": user.reset_token},
                    status=status.HTTP_200_OK
                )
            except User.DoesNotExist:
                # Don't reveal whether a user exists or not
                return Response(
                    {"detail": "Password reset instructions sent to email"},
                    status=status.HTTP_200_OK
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordConfirmView(generics.GenericAPIView):
    """View for confirming password reset."""
    serializer_class = ResetPasswordConfirmSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data["token"]
            new_password = serializer.validated_data["new_password"]
            
            try:
                user = User.objects.get(
                    reset_token=token,
                    reset_token_expiry__gt=timezone.now()
                )
                # Set new password
                user.set_password(new_password)
                # Clear reset token
                user.reset_token = None
                user.reset_token_expiry = None
                user.save()
                
                return Response(
                    {"detail": "Password has been reset successfully"},
                    status=status.HTTP_200_OK
                )
            except User.DoesNotExist:
                return Response(
                    {"detail": "Invalid or expired token"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProgressViewSet(viewsets.ModelViewSet):
    """Viewset for UserProgress model."""
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path=r'lesson/(?P<lesson_id>\d+)')
    def by_lesson(self, request, lesson_id=None):
        """Get progress for a specific lesson."""
        progress = get_object_or_404(
            UserProgress, 
            user=request.user, 
            lesson_id=lesson_id
        )
        serializer = self.get_serializer(progress)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path=r'lesson/(?P<lesson_id>\d+)/update')
    def update_progress(self, request, lesson_id=None):
        """Update progress for a specific lesson."""
        progress, created = UserProgress.objects.get_or_create(
            user=request.user,
            lesson_id=lesson_id,
            defaults={
                'watched_seconds': 0,
                'completed': False
            }
        )
        
        # Update fields
        watched_seconds = request.data.get('watched_seconds')
        if watched_seconds is not None:
            progress.watched_seconds = watched_seconds
            
        completed = request.data.get('completed')
        if completed is not None:
            progress.completed = completed
            
        notes = request.data.get('notes')
        if notes is not None:
            progress.notes = notes
            
        progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)