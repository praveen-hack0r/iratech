from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, 
    UserProfileView, 
    RegisterView, 
    LoginView, 
    LogoutView,
    ChangePasswordView, 
    ResetPasswordRequestView, 
    ResetPasswordConfirmView,
    UserProgressViewSet
)

router = DefaultRouter()
router.register(r'progress', UserProgressViewSet, basename='user-progress')

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('reset-password/', ResetPasswordRequestView.as_view(), name='reset-password-request'),
    path('reset-password/confirm/', ResetPasswordConfirmView.as_view(), name='reset-password-confirm'),
]

urlpatterns += router.urls