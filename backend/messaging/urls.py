from django.urls import path
from .views import MessageListView, UnreadCountView

urlpatterns = [
    path('messages/', MessageListView.as_view(), name='message-list'),
    path('messages/unread-count/', UnreadCountView.as_view(), name='unread-count'),
]