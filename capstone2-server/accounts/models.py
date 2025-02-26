from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, id, email=None, **extra_fields):
        if not id:
            raise ValueError("The Auth0 Subject ID must be set")
        user = self.model(id=id, email=email, **extra_fields)
        user.set_password(None)  # Passwords not needed for OAuth users
        user.save(using=self._db)
        return user

    def create_superuser(self, id, email=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(id, email, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.CharField(max_length=255, primary_key=True)  # Use Auth0 `sub` as the primary key
    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=30, null=True, blank=True)
    last_name = models.CharField(max_length=30, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    username = models.TextField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'id'  # Auth0 `sub` is used for authentication
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.id


class RoleEnum(models.TextChoices):
    DISTRIBUTOR = "distributor", "Distributor"
    COLLECTOR = "collector", "Collector"
    DELIVERER = "deliverer", "Deliverer"


class Role(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=RoleEnum.choices)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'role'], name='unique_user_role')
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role}"

