from rest_framework import serializers
from .models import World, Airplane, PathPoint, ScannedCell, CoverageStatistics

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
    color = serializers.CharField(read_only=True)  # Ensure color is always included
    flight_ended = serializers.BooleanField(required=False)
    class Meta:
        model = Airplane
        fields = "__all__"
        read_only_fields = ['id', 'created_at', 'updated_at', 'rotation', 'pos_x', 'pos_y', 'color']

class PathPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathPoint
        fields = ['id', 'airplane', 'pos_x', 'pos_y', 'rotation', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class ScannedCellSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScannedCell
        fields = ['id', 'world', 'airplane', 'pos_x', 'pos_y', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class CoverageStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoverageStatistics
        fields = ['id', 'world', 'total_cells', 'scanned_cells', 'coverage_percentage', 'path_length', 'last_updated']
        read_only_fields = ['id', 'last_updated']