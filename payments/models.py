from django.db import models
from django.conf import settings

class Payment(models.Model):
    """Payment model to track course purchases."""
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True, null=True)
    stripe_payment_method_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment of {self.amount} {self.currency} by {self.user.email} for {self.course.title}"

class Coupon(models.Model):
    """Coupon model for course discounts."""
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )
    
    code = models.CharField(max_length=20, unique=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    courses = models.ManyToManyField('courses.Course', related_name='coupons', blank=True)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    max_uses = models.PositiveIntegerField(default=0)  # 0 means unlimited
    current_uses = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.code
    
    @property
    def is_valid(self):
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        if not self.is_active:
            return False
        if self.max_uses > 0 and self.current_uses >= self.max_uses:
            return False
        if now < self.valid_from or now > self.valid_to:
            return False
        return True
