from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from ..models import UserProgress

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'role', 
                  'bio', 'profile_image', 'date_of_birth', 'is_verified')
        read_only_fields = ('id', 'is_verified')

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates."""
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'bio', 
                  'profile_image', 'date_of_birth')
        read_only_fields = ('id', 'email')

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'first_name', 'last_name', 'role')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            role=validated_data.get('role', 'student')
        )
        return user

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class ResetPasswordRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField(required=True)

class ResetPasswordConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class UserProgressSerializer(serializers.ModelSerializer):
    """Serializer for the UserProgress model."""
    lesson_title = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProgress
        fields = ('id', 'user', 'lesson', 'lesson_title', 'watched_seconds', 'completed', 'last_watched', 'notes')
        read_only_fields = ('id', 'user', 'lesson_title', 'last_watched')
    
    def get_lesson_title(self, obj):
        return obj.lesson.title