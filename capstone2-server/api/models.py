from django.db import models
from accounts.models import User
# Create your models here.

class World(models.Model):
    owner = models.ForeignKey(User, related_name='worlds', on_delete=models.CASCADE)
    basemap = models.JSONField()
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

