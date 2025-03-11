from rest_framework import serializers
from .models import World, Airplane


class WorldSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')  # Ensuring the owner is read-only
    basemap = serializers.ReadOnlyField()
    class Meta:
        model = World
        fields = ['id', 'owner', 'basemap', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AirplaneSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    world = serializers.PrimaryKeyRelatedField(queryset=World.objects.all()) 
    class Meta:
        model = Airplane
        fields = "__all__"
        read_only_fields = ['id', 'created_at', 'updated_at', 'rotation', 'pos_x', 'pos_y']