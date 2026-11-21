from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, EmailTokenObtainPairSerializer

User = get_user_model()

# واجهة تسجيل الدخول المخصصة للإيميل
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

# واجهة إنشاء الحساب
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer