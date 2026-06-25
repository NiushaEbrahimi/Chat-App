from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MeView, LogoutView, token_view, PasswordResetRequestView, PasswordResetConfirmView, UserSearchView

urlpatterns = [
    path('users/', UserSearchView.as_view()),
    path('register/', RegisterView.as_view()),        # POST — create account
    path('token/', token_view),    # POST — login, get tokens
    path('token/refresh/', TokenRefreshView.as_view()), # POST — get new access token
    path('logout/', LogoutView.as_view()),             # POST — blacklist refresh token
    path('me/', MeView.as_view()),                     # GET/PATCH — current user profile
    path('password-reset/', PasswordResetRequestView.as_view()),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view()),
]