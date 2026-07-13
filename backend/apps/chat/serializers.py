from rest_framework import serializers
from .models import Room, Message, MessageRead, Reaction
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

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
    last_message = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        url = obj.get_avatar(request.user)
        if not url:
            return None
        # already an absolute URL (e.g. from user.avatar.url)
        if url.startswith('http'):
            return url
        return request.build_absolute_uri(url)

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()  # fix: was .last() which is oldest
        if last:
            return MessageSerializer(last).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        # saved messages never have unread
        if obj.is_saved_messages:
            return 0
        # count messages in this room not read by the current user
        read_message_ids = MessageRead.objects.filter(
            user=request.user
        ).values_list('message_id', flat=True)
        return obj.messages.exclude(id__in=read_message_ids).exclude(
            sender=request.user
        ).count()

    class Meta:
        model = Room
        fields = (
            'id', 'name', 'is_group', 'is_saved_messages',
            'members', 'member_ids', 'last_message',
            'created_at', 'avatar_url', 'unread_count',
        )
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        room = Room.objects.create(
            **validated_data,
            created_by=self.context['request'].user
        )
        room.members.set(members)
        room.members.add(self.context['request'].user)
        return room