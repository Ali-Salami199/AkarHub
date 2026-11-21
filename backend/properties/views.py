from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Property, PropertyComment
from .serializers import PropertySerializer, PropertyCommentSerializer


class PropertyListCreateView(generics.ListCreateAPIView):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Property.objects.select_related('owner').prefetch_related('likes', 'comments__author').order_by('-created_at')
        prop_type = self.request.query_params.get('property_type')
        governorate = self.request.query_params.get('governorate')
        city = self.request.query_params.get('city')

        if prop_type:
            queryset = queryset.filter(property_type__iexact=prop_type)
        if governorate:
            queryset = queryset.filter(governorate__iexact=governorate)
        if city:
            queryset = queryset.filter(city__icontains=city)

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_property_like(request, pk):
    prop = get_object_or_404(Property, pk=pk)
    user = request.user

    if prop.likes.filter(id=user.id).exists():
        prop.likes.remove(user)
        is_liked = False
    else:
        prop.likes.add(user)
        is_liked = True

    return Response(
        {
            'likes_count': prop.likes.count(),
            'is_liked': is_liked,
        },
        status=status.HTTP_200_OK
    )


class PropertyCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = PropertyCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PropertyComment.objects.filter(property_id=self.kwargs['pk']).select_related('author')

    def perform_create(self, serializer):
        prop = get_object_or_404(Property, pk=self.kwargs['pk'])
        serializer.save(property=prop, author=self.request.user)