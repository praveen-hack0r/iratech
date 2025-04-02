from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet,
    CreatePaymentIntentView,
    CouponViewSet,
    ValidateCouponView,
    StripeWebhookView
)

router = DefaultRouter()
router.register(r'history', PaymentViewSet, basename='payment')
router.register(r'coupons', CouponViewSet)

urlpatterns = [
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('validate-coupon/', ValidateCouponView.as_view(), name='validate-coupon'),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
]

urlpatterns += router.urls