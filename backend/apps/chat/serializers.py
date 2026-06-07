# apps/chat/serializers.py
from rest_framework import serializers
from .models import Room, Message, MessageRead, Reaction
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight user info — used inside messages and rooms."""
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar', 'is_online')


class MessageReadSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = MessageRead
        fields = ('user', 'read_at')


class ReactionSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ('user', 'emoji')


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)
    reads = MessageReadSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = (
            'id', 'room', 'sender', 'content',
            'message_type', 'attachment', 'is_edited',
            'created_at', 'reads', 'reactions'
        )
        read_only_fields = ('id', 'sender', 'created_at', 'is_edited')


class RoomSerializer(serializers.ModelSerializer):
    members = UserSummarySerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        write_only=True,
        source='members'
    )
    # last message preview for the conversation list sidebar
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ('id', 'name', 'is_group', 'members', 'member_ids', 'last_message', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return MessageSerializer(last).data
        return None

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        room = Room.objects.create(
            **validated_data,
            created_by=self.context['request'].user
        )
        room.members.set(members)
        # always add the creator as a member
        room.members.add(self.context['request'].user)
        return room