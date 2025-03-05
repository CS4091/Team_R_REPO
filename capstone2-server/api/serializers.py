from rest_framework import serializers
from .models import World

class WorldSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')  # Ensuring the owner is read-only
    basemap = serializers.ReadOnlyField()
    class Meta:
        model = World
        fields = ['id', 'owner', 'basemap', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    