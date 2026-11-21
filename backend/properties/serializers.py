from rest_framework import serializers
from .models import Property, PropertyComment


class PropertyCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = PropertyComment
        fields = ['id', 'author', 'author_name', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'author_name', 'created_at']

    def get_author_name(self, obj):
        full = f"{obj.author.first_name} {obj.author.last_name}".strip()
        return full if full else obj.author.username


class PropertySerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_name = serializers.SerializerMethodField()
    owner_first_name = serializers.CharField(source='owner.first_name', read_only=True)
    owner_last_name = serializers.CharField(source='owner.last_name', read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = PropertyCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'id',
            'owner',
            'owner_id',
            'owner_name',
            'owner_first_name',
            'owner_last_name',
            'title',
            'description',
            'property_type',
            'governorate',
            'city',
            'price',
            'image',
            'likes_count',
            'is_liked',
            'comments',
            'created_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at']

    def get_owner_name(self, obj):
        full = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return full if full else obj.owner.username

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False