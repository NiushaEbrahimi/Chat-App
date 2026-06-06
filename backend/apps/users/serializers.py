from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from .emails import send_password_reset_email

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'identifier'

    def validate(self, attrs):
        identifier = attrs.get('identifier')
        password = attrs.get('password')

        user = authenticate(
            request=self.context.get('request'),
            username=identifier,
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                {'detail': 'Invalid credentials.'},
                code='authorization'
            )

        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

class PasswordResetRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # email or username

    def validate_identifier(self, value):
        # find the user but don't expose whether they exist
        try:
            if '@' in value:
                user = User.objects.get(email__iexact=value)
            else:
                user = User.objects.get(username__iexact=value)
            self.context['user'] = user
        except User.DoesNotExist:
            pass  # silently do nothing — vague response
        return value

    def send_reset_email(self):
        user = self.context.get('user')
        if not user:
            return  # user doesn't exist, do nothing silently

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uid}&token={token}"
        send_password_reset_email(user, reset_link)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password2 = serializers.CharField()

    def validate(self, data):
        # decode uid and get user
        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            raise serializers.ValidationError({'uid': 'Invalid reset link.'})

        # validate token
        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError({'token': 'Reset link is invalid or has expired.'})

        # check passwords match
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})

        self.context['user'] = user
        return data

    def save(self):
        user = self.context['user']
        user.set_password(self.validated_data['new_password'])
        user.save()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta: 
        model = User
        fields = ('id', 'email', 'username', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Used for returning user profile data — never exposes password."""
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'avatar', 'is_online', 'last_seen')
        read_only_fields = ('id', 'is_online', 'last_seen')