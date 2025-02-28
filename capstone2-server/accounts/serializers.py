from rest_framework import serializers
from .models import Role, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['password']  # Explicitly exclude the password field

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'user', 'role']

