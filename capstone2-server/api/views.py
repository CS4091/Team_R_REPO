from rest_framework.decorators import api_view
from rest_framework.response import Response
from .map_generator import generate_map
from .serializers import AirplaneSerializer
from django_filters.rest_framework import DjangoFilterBackend
import logging

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
