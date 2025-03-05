from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.views import UserViewSet, RoleViewSet
from api import views


# Create a router and register the viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
urlpatterns = [
    path('', include(router.urls)),  # Include the router's URLs
    path('map/', views.generate_map_view),
]