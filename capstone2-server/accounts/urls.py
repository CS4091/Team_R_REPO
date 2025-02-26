from django.urls import path
from .views import token_exchange

urlpatterns = [
    path('token/', token_exchange, name='token_exchange'),
]