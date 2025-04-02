from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.conf import settings
import stripe
import json

from .models import Payment, Coupon
from courses.models import Course, Enrollment
from .serializers import (
    PaymentSerializer,
    PaymentCreateSerializer,
    PaymentIntentSerializer,
    CouponSerializer,
    CouponValidationSerializer
)

# Configure Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentViewSet(viewsets.ModelViewSet):
    """Viewset for Payment model."""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            # Admin can see all payments
            return Payment.objects.all()
        # Regular users can only see their own payments
        return Payment.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = PaymentCreateSerializer(data=request.data)
        if serializer.is_valid():
            course_id = serializer.validated_data.get('course_id')
            coupon_code = serializer.validated_data.get('coupon_code')
            
            # Get the course
            course = get_object_or_404(Course, id=course_id, is_published=True)
            
            # Calculate the amount (apply coupon if provided)
            amount = course.price
            
            if coupon_code:
                try:
                    coupon = Coupon.objects.get(code=coupon_code)
                    if coupon.is_valid and (not coupon.courses.exists() or coupon.courses.filter(id=course_id).exists()):
                        if coupon.discount_type == 'percentage':
                            amount = amount * (1 - coupon.discount_amount / 100)
                        else:  # fixed amount
                            amount = max(0, amount - coupon.discount_amount)
                except Coupon.DoesNotExist:
                    # Invalid coupon, ignore and use full price
                    pass
            
            # Create the payment with pending status
            payment = Payment.objects.create(
                user=request.user,
                course=course,
                amount=amount,
                status='pending'
            )
            
            # Return the payment
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreatePaymentIntentView(APIView):
    """View for creating Stripe payment intent."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        payment_id = request.data.get('payment_id')
        
        if not payment_id:
            return Response(
                {"detail": "Payment ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get the payment
        payment = get_object_or_404(
            Payment, 
            id=payment_id, 
            user=request.user, 
            status='pending'
        )
        
        try:
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),  # Convert to cents
                currency=payment.currency.lower(),
                metadata={'payment_id': payment.id, 'course_id': payment.course.id},
                receipt_email=request.user.email if hasattr(request.user, 'email') else None,
            )
            
            # Update payment with payment intent ID
            payment.stripe_payment_intent_id = intent.id
            payment.save()
            
            # Create response
            return Response({
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
            })
            
        except stripe.error.StripeError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class StripeWebhookView(APIView):
    """View for handling Stripe webhooks."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            # Verify webhook signature and parse the event
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            # Invalid payload
            return Response(
                {"detail": "Invalid payload"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            return Response(
                {"detail": "Invalid signature"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Handle the event
        if event.type == 'payment_intent.succeeded':
            payment_intent = event.data.object
            self._handle_payment_succeeded(payment_intent)
        elif event.type == 'payment_intent.payment_failed':
            payment_intent = event.data.object
            self._handle_payment_failed(payment_intent)
            
        return Response(status=status.HTTP_200_OK)
        
    def _handle_payment_succeeded(self, payment_intent):
        # Get payment by payment intent ID
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent.id)
            
            # Update payment status
            payment.status = 'completed'
            payment.save()
            
            # Create enrollment
            Enrollment.objects.create(
                user=payment.user,
                course=payment.course,
                status='active'
            )
            
            # Update coupon usage if used
            if hasattr(payment, 'coupon') and payment.coupon:
                coupon = payment.coupon
                coupon.current_uses += 1
                coupon.save()
                
        except Payment.DoesNotExist:
            # Payment not found, log this error in a real application
            pass
    
    def _handle_payment_failed(self, payment_intent):
        # Get payment by payment intent ID
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent.id)
            
            # Update payment status
            payment.status = 'failed'
            payment.save()
                
        except Payment.DoesNotExist:
            # Payment not found, log this error in a real application
            pass

class CouponViewSet(viewsets.ModelViewSet):
    """Viewset for Coupon model."""
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]

class ValidateCouponView(generics.GenericAPIView):
    """View for validating coupon codes."""
    serializer_class = CouponValidationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            coupon = serializer.validated_data['coupon']
            course = serializer.validated_data['course']
            
            # Calculate discount
            original_price = course.price
            discounted_price = original_price
            
            if coupon.discount_type == 'percentage':
                discount_amount = original_price * (coupon.discount_amount / 100)
                discounted_price = original_price - discount_amount
            else:  # fixed amount
                discount_amount = coupon.discount_amount
                discounted_price = max(0, original_price - discount_amount)
                
            return Response({
                'valid': True,
                'coupon': CouponSerializer(coupon).data,
                'original_price': original_price,
                'discounted_price': discounted_price,
                'discount_amount': discount_amount
            })
            
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )