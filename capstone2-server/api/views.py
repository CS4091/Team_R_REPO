from rest_framework.decorators import api_view
from rest_framework.response import Response
from .map_generator import generate_map


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
        serializer.save(
            owner=self.request.user,
            basemap=generate_map(),
        )
