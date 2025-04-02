from django.contrib import admin
from .models import Payment, Coupon

class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for the Payment model."""
    list_display = ('user', 'course', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('user__email', 'course__title', 'stripe_payment_intent_id')
    readonly_fields = ('stripe_payment_intent_id', 'stripe_payment_method_id')

class CouponAdmin(admin.ModelAdmin):
    """Admin configuration for the Coupon model."""
    list_display = ('code', 'discount_type', 'discount_amount', 'valid_from', 'valid_to', 'is_active', 'current_uses', 'max_uses')
    list_filter = ('discount_type', 'is_active', 'valid_from', 'valid_to')
    search_fields = ('code',)
    filter_horizontal = ('courses',)

# Register models
admin.site.register(Payment, PaymentAdmin)
admin.site.register(Coupon, CouponAdmin)
