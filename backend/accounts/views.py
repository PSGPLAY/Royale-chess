from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from .models import PlayerProfile, FriendRequest
from .serializers import (
    RegisterSerializer,
    PlayerProfileSerializer,
    LeaderboardSerializer,
    PlayerSearchSerializer,
    FriendRequestSerializer,
)


def get_or_create_profile(user):
    profile, _ = PlayerProfile.objects.get_or_create(
        user=user,
        defaults={'nickname': user.username},
    )
    return profile


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            profile_serializer = PlayerProfileSerializer(get_or_create_profile(user))
            return Response({
                'token': token.key,
                'user': profile_serializer.data,
                'message': 'Account created successfully!'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not hasattr(request.data, 'get'):
            return Response({'error': 'Expected a JSON object.'}, status=status.HTTP_400_BAD_REQUEST)
        identifier = str(request.data.get('username') or request.data.get('email') or '').strip()
        password = request.data.get('password')

        if not identifier or not password:
            return Response(
                {'error': 'Both username/email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. First attempt to authenticate directly with identifier as username
        user = authenticate(username=identifier, password=password)

        # 2. If not authenticated, check if identifier matches a registered email
        if not user:
            for candidate in User.objects.filter(email__iexact=identifier):
                user = authenticate(username=candidate.username, password=password)
                if user:
                    break

        if not user:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, _ = Token.objects.get_or_create(user=user)
        profile_serializer = PlayerProfileSerializer(get_or_create_profile(user))
        return Response({
            'token': token.key,
            'user': profile_serializer.data,
            'message': f'Welcome aboard, Captain {user.profile.nickname or user.username}!'
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = PlayerProfileSerializer(get_or_create_profile(request.user))
        return Response(serializer.data)


class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            profile = PlayerProfile.objects.select_related('user').get(user__username__iexact=username)
        except PlayerProfile.DoesNotExist:
            return Response({'error': 'Player not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PlayerProfileSerializer(profile).data)

    def patch(self, request):
        if not hasattr(request.data, 'get'):
            return Response({'error': 'Expected a JSON object.'}, status=status.HTTP_400_BAD_REQUEST)
        profile = get_or_create_profile(request.user)
        nickname = request.data.get('nickname')
        avatar = request.data.get('avatar')

        if nickname is not None:
            profile.nickname = str(nickname).strip()
        if avatar is not None:
            profile.avatar = str(avatar).strip()

        profile.save()
        serializer = PlayerProfileSerializer(profile)
        return Response(serializer.data)


class LeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 20))
        except (TypeError, ValueError):
            return Response({'error': 'Limit must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        limit = max(1, min(limit, 100))
        top_players = PlayerProfile.objects.order_by('-rating_elo')[:limit]
        serializer = LeaderboardSerializer(top_players, many=True)
        return Response(serializer.data)


class PlayerSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = str(request.query_params.get('q', '')).strip()
        if not query:
            return Response([])

        profiles = PlayerProfile.objects.select_related('user').filter(
            Q(user__username__icontains=query) | Q(nickname__icontains=query)
        ).distinct()[:15]

        serializer = PlayerSearchSerializer(profiles, many=True)
        return Response(serializer.data)


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Accepted friend requests
        accepted_reqs = FriendRequest.objects.filter(
            Q(sender=user) | Q(receiver=user),
            status='accepted'
        ).select_related('sender__profile', 'receiver__profile')

        friend_profiles = []
        for req in accepted_reqs:
            friend_user = req.receiver if req.sender == user else req.sender
            friend_profiles.append(PlayerProfileSerializer(friend_user.profile).data)

        # 2. Received pending requests
        received_reqs = FriendRequest.objects.filter(
            receiver=user,
            status='pending'
        ).select_related('sender__profile')

        # 3. Sent pending requests
        sent_reqs = FriendRequest.objects.filter(
            sender=user,
            status='pending'
        ).select_related('receiver__profile')

        return Response({
            'friends': friend_profiles,
            'received_requests': FriendRequestSerializer(received_reqs, many=True).data,
            'sent_requests': FriendRequestSerializer(sent_reqs, many=True).data,
        })


class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_username = str(request.data.get('username', '')).strip()
        if not target_username:
            return Response({'error': 'Target username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_username.lower() == request.user.username.lower():
            return Response({'error': 'You cannot send a friend request to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(username__iexact=target_username)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check existing request in either direction
        existing = FriendRequest.objects.filter(
            Q(sender=request.user, receiver=target_user) |
            Q(sender=target_user, receiver=request.user)
        ).first()

        if existing:
            if existing.status == 'accepted':
                return Response({'message': 'You are already allies with this commander.', 'status': 'friends'})
            if existing.sender == target_user and existing.status == 'pending':
                # Target already sent request to us -> automatically accept it!
                existing.status = 'accepted'
                existing.save()
                return Response({'message': 'Friend request accepted! You are now allies.', 'status': 'friends'})
            if existing.sender == request.user and existing.status == 'pending':
                return Response({'message': 'Friend request already pending.', 'status': 'pending_sent'})
            # If rejected previously, allow re-requesting
            existing.sender = request.user
            existing.receiver = target_user
            existing.status = 'pending'
            existing.save()
            return Response({'message': 'Friend request sent!', 'status': 'pending_sent'})

        new_req = FriendRequest.objects.create(
            sender=request.user,
            receiver=target_user,
            status='pending'
        )
        return Response({
            'message': 'Friend request sent successfully!',
            'status': 'pending_sent',
            'request': FriendRequestSerializer(new_req).data
        }, status=status.HTTP_201_CREATED)


class RespondFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        action = str(request.data.get('action', '')).strip().lower()
        if action not in ('accept', 'reject'):
            return Response({'error': 'Action must be "accept" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            req = FriendRequest.objects.get(id=request_id, receiver=request.user)
        except FriendRequest.DoesNotExist:
            return Response({'error': 'Friend request not found.'}, status=status.HTTP_404_NOT_FOUND)

        req.status = 'accepted' if action == 'accept' else 'rejected'
        req.save()

        return Response({
            'message': f'Friend request {req.status}.',
            'status': req.status
        })


class FriendshipStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        if not request.user.is_authenticated:
            return Response({'status': 'none'})

        target_username = username.strip()
        if target_username.lower() == request.user.username.lower():
            return Response({'status': 'self'})

        try:
            target_user = User.objects.get(username__iexact=target_username)
        except User.DoesNotExist:
            return Response({'status': 'none'})

        existing = FriendRequest.objects.filter(
            Q(sender=request.user, receiver=target_user) |
            Q(sender=target_user, receiver=request.user)
        ).first()

        if not existing or existing.status == 'rejected':
            return Response({'status': 'none'})

        if existing.status == 'accepted':
            return Response({'status': 'friends', 'request_id': existing.id})

        if existing.sender == request.user:
            return Response({'status': 'pending_sent', 'request_id': existing.id})

        return Response({'status': 'pending_received', 'request_id': existing.id})

