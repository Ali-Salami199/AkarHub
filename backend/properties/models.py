from django.db import models
from django.conf import settings


class Property(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    property_type = models.CharField(max_length=100, default='شقة')  # شقة، فيلا، أرض، محل...
    governorate = models.CharField(max_length=100, blank=True, default='')  # المحافظة
    city = models.CharField(max_length=100, blank=True, default='')         # المدينة (جديد)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    image = models.ImageField(upload_to='properties/', blank=True, null=True)
    likes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='liked_properties',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.governorate} ({self.city})"


class PropertyComment(models.Model):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='property_comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.property_id}"