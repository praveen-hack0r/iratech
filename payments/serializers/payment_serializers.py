from rest_framework import serializers
from ..models import Payment, Coupon
from courses.models import Course
from courses.serializers import CourseListSerializer
from users.serializers import UserSerializer

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for the Payment model."""
    user = UserSerializer(read_only=True)
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = ('id', 'user', 'course', 'amount', 'currency', 'status', 
                  'stripe_payment_intent_id', 'stripe_payment_method_id', 
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'stripe_payment_intent_id', 
                           'stripe_payment_method_id', 'created_at', 'updated_at')

class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments."""
    course_id = serializers.IntegerField(write_only=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    
    class Meta:
        model = Payment
        fields = ('course_id', 'coupon_code')
    
    def validate_course_id(self, value):
        try:
            course = Course.objects.get(id=value, is_published=True)
            return value
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found or not available.")
    
    def validate_coupon_code(self, value):
        if not value:
            return None
        
        try:
            coupon = Coupon.objects.get(code=value)
            if not coupon.is_valid:
                raise serializers.ValidationError("Coupon is not valid or has expired.")
            return value
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code.")

class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for Stripe payment intent."""
    client_secret = serializers.CharField()
    payment_intent_id = serializers.CharField()

class CouponSerializer(serializers.ModelSerializer):
    """Serializer for the Coupon model."""
    courses = CourseListSerializer(many=True, read_only=True)
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = Coupon
        fields = ('id', 'code', 'discount_type', 'discount_amount', 'courses',
                  'valid_from', 'valid_to', 'max_uses', 'current_uses', 
                  'is_active', 'is_valid')
        read_only_fields = ('id', 'current_uses', 'is_valid')

class CouponValidationSerializer(serializers.Serializer):
    """Serializer for validating coupons."""
    code = serializers.CharField(max_length=20)
    course_id = serializers.IntegerField()
    
    def validate(self, attrs):
        code = attrs.get('code')
        course_id = attrs.get('course_id')
        
        try:
            coupon = Coupon.objects.get(code=code)
            if not coupon.is_valid:
                raise serializers.ValidationError({"code": "Coupon is not valid or has expired."})
                
            course = Course.objects.get(id=course_id)
            if coupon.courses.exists() and not coupon.courses.filter(id=course_id).exists():
                raise serializers.ValidationError({"code": "Coupon is not valid for this course."})
                
            attrs['coupon'] = coupon
            attrs['course'] = course
            return attrs
            
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid coupon code."})
        except Course.DoesNotExist:
            raise serializers.ValidationError({"course_id": "Course not found."})