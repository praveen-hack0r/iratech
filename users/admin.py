from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProgress

class CustomUserAdmin(UserAdmin):
    """Admin configuration for the CustomUser model."""
    list_display = ('email', 'username', 'role', 'is_staff', 'is_verified')
    list_filter = ('role', 'is_staff', 'is_verified')
    search_fields = ('email', 'username')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'bio', 'profile_image', 'date_of_birth')}),
        ('Roles', {'fields': ('role', 'is_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Payment information', {'fields': ('stripe_customer_id', 'stripe_subscription_id')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role'),
        }),
    )
    ordering = ('email',)

class UserProgressAdmin(admin.ModelAdmin):
    """Admin configuration for the UserProgress model."""
    list_display = ('user', 'lesson', 'completed', 'last_watched')
    list_filter = ('completed', 'last_watched')
    search_fields = ('user__email', 'lesson__title')

# Register the models
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(UserProgress, UserProgressAdmin)
