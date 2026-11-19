from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    LeaderboardView,
    PublicProfileView,
    PlayerSearchView,
    FriendListView,
    SendFriendRequestView,
    RespondFriendRequestView,
    FriendshipStatusView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('players/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('search/', PlayerSearchView.as_view(), name='player-search'),
    path('friends/', FriendListView.as_view(), name='friend-list'),
    path('friends/request/', SendFriendRequestView.as_view(), name='friend-request'),
    path('friends/<int:request_id>/respond/', RespondFriendRequestView.as_view(), name='friend-respond'),
    path('friends/status/<str:username>/', FriendshipStatusView.as_view(), name='friend-status'),
]

