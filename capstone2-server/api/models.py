from django.db import models
from accounts.models import User

# Create your models here.

class World(models.Model):
    owner = models.ForeignKey(User, related_name='worlds', on_delete=models.CASCADE)
    basemap = models.JSONField()
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    start_x = models.IntegerField()
    start_y = models.IntegerField()

    def __str__(self):
        return self.name


class Direction:
    UP = "UP"
    DOWN = "DOWN"
    LEFT = "LEFT"
    RIGHT = "RIGHT"


class Airplane(models.Model):
    owner = models.ForeignKey(User, related_name='airplanes', on_delete=models.CASCADE)
    world = models.ForeignKey(World, related_name='airplanes', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    pos_y = models.IntegerField()
    pos_x = models.IntegerField()
    rotation = models.CharField(max_length=20, choices = [
        (Direction.UP, 'UP'),
        (Direction.DOWN, 'DOWN'),
        (Direction.LEFT, 'LEFT'),
        (Direction.RIGHT, 'RIGHT'),
    ], default=Direction.UP)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class PathPoint(models.Model):
    """
    Model to track each point in an airplane's path.
    """
    airplane = models.ForeignKey(Airplane, related_name='path_points', on_delete=models.CASCADE)
    pos_x = models.IntegerField()
    pos_y = models.IntegerField()
    rotation = models.CharField(max_length=20, choices = [
        (Direction.UP, 'UP'),
        (Direction.DOWN, 'DOWN'),
        (Direction.LEFT, 'LEFT'),
        (Direction.RIGHT, 'RIGHT'),
    ])
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['airplane', 'timestamp']),
        ]


class ScannedCell(models.Model):
    """
    Model to track each cell that has been scanned by an airplane.
    """
    world = models.ForeignKey(World, related_name='scanned_cells', on_delete=models.CASCADE)
    airplane = models.ForeignKey(Airplane, related_name='scanned_cells', on_delete=models.CASCADE)
    pos_x = models.IntegerField()
    pos_y = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Ensure we don't duplicate entries for the same cell in the same world
        unique_together = ('world', 'pos_x', 'pos_y')
        indexes = [
            models.Index(fields=['world', 'airplane']),
        ]


class CoverageStatistics(models.Model):
    """
    Model to store coverage statistics for each world.
    """
    world = models.OneToOneField(World, related_name='coverage_stats', on_delete=models.CASCADE)
    total_cells = models.IntegerField(default=0)  # Total number of traversable cells
    scanned_cells = models.IntegerField(default=0)  # Number of unique cells scanned
    coverage_percentage = models.FloatField(default=0.0)  # Percentage of coverage
    path_length = models.IntegerField(default=0)  # Total number of movements
    last_updated = models.DateTimeField(auto_now=True)
    
    def calculate_coverage(self):
        """
        Calculate coverage statistics for the world.
        """
        if self.total_cells > 0:
            self.coverage_percentage = (self.scanned_cells / self.total_cells) * 100
        else:
            self.coverage_percentage = 0
        return self.coverage_percentage