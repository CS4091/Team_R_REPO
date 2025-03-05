from rest_framework.decorators import api_view
from rest_framework.response import Response
from .map_generator import generate_map


@api_view(["GET"])
def generate_map_view(request):
    """
    API endpoint to generate and return a 100x100 map as a JSON response.
    """

    return Response({"map": generate_map()})
