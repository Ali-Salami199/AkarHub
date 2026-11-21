from django.urls import path
from .views import (
    PropertyListCreateView,
    toggle_property_like,
    PropertyCommentListCreateView,
)

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/like/', toggle_property_like, name='property-toggle-like'),
    path('<int:pk>/comments/', PropertyCommentListCreateView.as_view(), name='property-comments'),
]