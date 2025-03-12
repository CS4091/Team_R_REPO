from rest_framework.decorators import api_view
from rest_framework.response import Response
from .map_generator import generate_map
from .serializers import AirplaneSerializer
from django_filters.rest_framework import DjangoFilterBackend
import logging
import os
from datetime import datetime, timedelta
import jwt
from rest_framework.decorators import action

JWT_SECRET = os.environ["JWT_SECRET"]
logger = logging.getLogger(__name__)

@api_view(["GET"])
def generate_map_view(request):
    """
    API endpoint to generate and return a 100x100 map as a JSON response.
    """

    return Response({"map": generate_map()})

from rest_framework import viewsets, permissions, pagination, filters
from .models import World
from .serializers import WorldSerializer


class WorldPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class WorldViewSet(viewsets.ModelViewSet):
    serializer_class = WorldSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = WorldPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'owner__username']

    def get_queryset(self):
        return World.objects.all()

    def perform_create(self, serializer):
        basemap, (pos_y, pos_x) = generate_map()
        serializer.save(
            owner=self.request.user,
            basemap=basemap,
            start_y=pos_y,
            start_x=pos_x,
        )


class AirplaneViewSet(viewsets.ModelViewSet):
    serializer_class = AirplaneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['world', 'owner']

    class pagination_class(pagination.PageNumberPagination):
        page_size = 10
        page_size_query_param = 'page_size'
        max_page_size = 100
    
    def get_queryset(self):
        return self.request.user.airplanes.all()

    def perform_create(self, serializer):
        world_id = self.request.data.get('world')
        name = self.request.data.get('name')

        world = World.objects.get(id=world_id)
        serializer.save(
            owner=self.request.user,
            world=world,
            name=name,
            pos_y=world.start_y,
            pos_x=world.start_x,
        )

    @action(detail=True, methods=["POST"])
    def move(self, request, pk=None):
        airplane = self.get_object()
        
        if airplane.rotation == "UP":
            airplane.pos_y -= 1
        elif airplane.rotation == "DOWN":
            airplane.pos_y += 1
        elif airplane.rotation == "LEFT":
            airplane.pos_x -= 1
        elif airplane.rotation == "RIGHT":
            airplane.pos_x += 1
        airplane.save()
    
        return Response(self.get_serializer(airplane).data)
    
    @action(detail=True, methods=["POST"])
    def rotate_left(self, request, pk=None):
        airplane = self.get_object()
        rotations = ["UP", "LEFT", "DOWN", "RIGHT"]
        current_rotation_index = rotations.index(airplane.rotation)
        new_rotation_index = (current_rotation_index - 1) % 4
        airplane.rotation = rotations[new_rotation_index]
        airplane.save()
        
        return Response(self.get_serializer(airplane).data)

    @action(detail=True, methods=["POST"])
    def rotate_right(self, request, pk=None):
        airplane = self.get_object()
        rotations = ["UP", "LEFT", "DOWN", "RIGHT"]
        current_rotation_index = rotations.index(airplane.rotation)
        new_rotation_index = (current_rotation_index + 1) % 4
        airplane.rotation = rotations[new_rotation_index]
        airplane.save()
        
        return Response(self.get_serializer(airplane).data)

    

@api_view(["GET"])
def generate_world_token(request):
    user = request.user
    world = request.GET.get("world")
    if world is None:
        return Response({"error": "World ID is required"}, status=400)
    payload = {
        "sub": user.id,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "world": world,  # Adding the world claim
    }

    world_token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return Response({"world_token": world_token})


@api_view(["GET"])
def world_token_info(request):
    # extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"error": "Authorization header is not provided."}, status=400)

    world_token = auth_header.split(" ")[1]
    if world_token is None:
        return Response({"error": "World token is required"}, status=400)
    try:
        payload = jwt.decode(world_token, JWT_SECRET, algorithms=["HS256"])
        return Response(payload)
    except jwt.ExpiredSignatureError:
        return Response({"error": "World token has expired"}, status=400)
    except jwt.InvalidTokenError as e:
        return Response({"error": "Invalid world token", "details": str(e)}, status=400)
    except Exception as e:
        return Response({"error": "An error occurred", "details": str(e)}, status=500)
