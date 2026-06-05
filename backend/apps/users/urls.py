from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, LogoutView, token_view

urlpatterns = [
    path('register/', RegisterView.as_view()),        # POST — create account
    path('token/', token_view),    # POST — login, get tokens
    path('token/refresh/', TokenRefreshView.as_view()), # POST — get new access token
    path('logout/', LogoutView.as_view()),             # POST — blacklist refresh token
    path('me/', MeView.as_view()),                     # GET/PATCH — current user profile
]