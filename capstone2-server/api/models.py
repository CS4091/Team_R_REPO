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