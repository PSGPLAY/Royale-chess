from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import PlayerProfile


class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    win_rate = serializers.FloatField(read_only=True)
    global_rank = serializers.SerializerMethodField()
    normal_global_rank = serializers.SerializerMethodField()
    royale_global_rank = serializers.SerializerMethodField()

    class Meta:
        model = PlayerProfile
        fields = [
            'id',
            'username',
            'nickname',
            'avatar',
            'persistent_coins',
            'rating_elo',
            'normal_rating',
            'royale_rating',
            'global_rank',
            'normal_global_rank',
            'royale_global_rank',
            'total_matches',
            'wins',
            'losses',
            'draws',
            'win_rate',
            'created_at',
        ]

    def get_global_rank(self, obj):
        return self.get_normal_global_rank(obj)

    def get_normal_global_rank(self, obj):
        return PlayerProfile.objects.filter(normal_rating__gt=obj.normal_rating).count() + 1

    def get_royale_global_rank(self, obj):
        return PlayerProfile.objects.filter(royale_rating__gt=obj.royale_rating).count() + 1


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def validate(self, attrs):
        candidate = User(username=attrs.get('username', ''), email=attrs.get('email', ''))
        validate_password(attrs['password'], user=candidate)
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    win_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = PlayerProfile
        fields = [
            'id',
            'username',
            'nickname',
            'avatar',
            'rating_elo',
            'normal_rating',
            'royale_rating',
            'total_matches',
            'wins',
            'losses',
            'draws',
            'win_rate',
        ]


class PlayerSearchSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    win_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = PlayerProfile
        fields = [
            'id',
            'username',
            'nickname',
            'avatar',
            'rating_elo',
            'normal_rating',
            'royale_rating',
            'wins',
            'losses',
            'total_matches',
            'win_rate',
        ]


class FriendRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_nickname = serializers.CharField(source='sender.profile.nickname', read_only=True)
    sender_rating = serializers.IntegerField(source='sender.profile.rating_elo', read_only=True)
    sender_avatar = serializers.CharField(source='sender.profile.avatar', read_only=True)

    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    receiver_nickname = serializers.CharField(source='receiver.profile.nickname', read_only=True)
    receiver_rating = serializers.IntegerField(source='receiver.profile.rating_elo', read_only=True)
    receiver_avatar = serializers.CharField(source='receiver.profile.avatar', read_only=True)

    class Meta:
        from .models import FriendRequest
        model = FriendRequest
        fields = [
            'id',
            'sender_id',
            'sender_username',
            'sender_nickname',
            'sender_rating',
            'sender_avatar',
            'receiver_id',
            'receiver_username',
            'receiver_nickname',
            'receiver_rating',
            'receiver_avatar',
            'status',
            'created_at',
            'updated_at',
        ]


