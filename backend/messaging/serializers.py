from rest_framework import serializers
from .models import Message


def _format_full_name(user):
    if not user:
        return ''
    full = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip()
    return full or user.username


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    sender_full_name = serializers.SerializerMethodField()
    receiver_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'sender_name',
            'sender_full_name',
            'receiver',
            'receiver_name',
            'receiver_full_name',
            'content',
            'timestamp',
            'is_delivered',
            'is_read',
        ]
        read_only_fields = ['id', 'sender', 'timestamp']
    def get_sender_full_name(self, obj):
        return _format_full_name(obj.sender)

    def get_receiver_full_name(self, obj):
        return _format_full_name(obj.receiver)