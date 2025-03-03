from rest_framework import serializers
from .models import Role, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_active',
                 'is_staff', 'username', 'last_login', 'is_superuser',
                 'groups', 'user_permissions']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'user', 'role']

