from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        TENANT = 'TENANT', 'مستأجر'
        LANDLORD = 'LANDLORD', 'مؤجر'

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.TENANT, verbose_name="نوع الحساب")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="رقم الهاتف")
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name="المحافظة السورية")
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True, verbose_name="الصورة الشخصية")
    is_verified = models.BooleanField(default=False, verbose_name="حساب موثق")

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"
