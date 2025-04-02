from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid

class CustomUser(AbstractUser):
    """Custom user model with additional fields for the education platform."""
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('admin', 'Administrator'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Stripe related fields
    stripe_customer_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Password reset fields
    reset_token = models.UUIDField(blank=True, null=True)
    reset_token_expiry = models.DateTimeField(blank=True, null=True)
    
    # Account verification
    is_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email

class UserProgress(models.Model):
    """Track user progress through courses and lessons."""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='progress')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, related_name='user_progress')
    watched_seconds = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    last_watched = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ('user', 'lesson')
        
    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} progress"
