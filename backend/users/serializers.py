from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()

# 1. Serializer لإنشاء حساب جديد
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'phone_number']

    def create(self, validated_data):
        email = validated_data.get('email')
        validated_data['username'] = email  # جعل اسم المستخدم هو الإيميل
        user = User.objects.create_user(
            username=validated_data['username'],
            email=email,
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', '')
        )
        return user


# 2. Serializer لتسجيل الدخول بالإيميل وتوليد التوكن مباشرة
class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "البريد الإلكتروني أو كلمة المرور غير صحيحة."})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "البريد الإلكتروني أو كلمة المرور غير صحيحة."})

        # توليد الـ Token يدوياً للمستخدم الصحيح
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'email': user.email
        }