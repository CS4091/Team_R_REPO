from rest_framework.decorators import api_view
from rest_framework.response import Response
from .map_generator import generate_map
from .serializers import AirplaneSerializer, PathPointSerializer, ScannedCellSerializer, CoverageStatisticsSerializer, WorldSerializer
from django_filters.rest_framework import DjangoFilterBackend
import logging
import os
from datetime import datetime, timedelta
import jwt
from rest_framework.decorators import action
from .models import World, Airplane, PathPoint, ScannedCell, CoverageStatistics
from django.db import transaction
from django.db.models import Count

JWT_SECRET = os.environ["JWT_SECRET"]
logger = logging.getLogger(__name__)

@api_view(["GET"])
def generate_map_view(request):
    """
    API endpoint to generate and return a 100x100 map as a JSON response.
    """
    return Response({"map": generate_map()})

from rest_framework import viewsets, permissions, pagination, filters

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
        world = serializer.save(
            owner=self.request.user,
            basemap=basemap,
            start_y=pos_y,
            start_x=pos_x,
        )
        
        # Count total traversable cells (cells with value 0)
        total_traversable = sum(row.count(0) for row in basemap)
        
        # Create initial coverage statistics
        CoverageStatistics.objects.create(
            world=world,
            total_cells=total_traversable,
            scanned_cells=0,
            coverage_percentage=0.0,
            path_length=0
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
        airplane = serializer.save(
            owner=self.request.user,
            world=world,
            name=name,
            pos_y=world.start_y,
            pos_x=world.start_x,
        )
        
        # Record initial position in path
        PathPoint.objects.create(
            airplane=airplane,
            pos_x=airplane.pos_x,
            pos_y=airplane.pos_y,
            rotation=airplane.rotation
        )
        
        # Record initial scanned cells
        self._record_scanned_cells(airplane)

    def _record_scanned_cells(self, airplane):
        """
        Records the cells scanned by the airplane's sensor.
        """
        world = airplane.world
        x, y = airplane.pos_x, airplane.pos_y
        rotation = airplane.rotation
        
        # Define the scanner coverage (2x3 rectangle ahead of aircraft)
        scan_cells = []
        
        if rotation == "UP":
            # Scanning area is above the aircraft
            for i in range(-1, 1):  # 2 rows (up)
                for j in range(-1, 2):  # 3 columns (left to right)
                    scan_cells.append((x + j, y - 1 - i))
        elif rotation == "DOWN":
            # Scanning area is below the aircraft
            for i in range(-1, 1):  # 2 rows (down)
                for j in range(-1, 2):  # 3 columns (left to right)
                    scan_cells.append((x + j, y + 1 + i))
        elif rotation == "LEFT":
            # Scanning area is to the left of the aircraft
            for i in range(-1, 2):  # 3 rows (top to bottom)
                for j in range(-1, 1):  # 2 columns (left)
                    scan_cells.append((x - 1 - j, y + i))
        elif rotation == "RIGHT":
            # Scanning area is to the right of the aircraft
            for i in range(-1, 2):  # 3 rows (top to bottom)
                for j in range(-1, 1):  # 2 columns (right)
                    scan_cells.append((x + 1 + j, y + i))
        
        # Create ScannedCell records for each cell in the scan area
        basemap = world.basemap
        height = len(basemap)
        width = len(basemap[0]) if height > 0 else 0
        
        cells_added = False  # Flag to track if any new cells were added
        
        for scan_x, scan_y in scan_cells:
            # Skip if out of bounds
            if scan_x < 0 or scan_x >= width or scan_y < 0 or scan_y >= height:
                continue
                
            # Check if cell is traversable
            cell_value = basemap[scan_y][scan_x]
            is_traversable = False
            
            if isinstance(cell_value, int):
                # Integer representation
                is_traversable = (cell_value == 0)
            elif isinstance(cell_value, list):
                # List/array representation - consider all list values as traversable for simplicity
                # You may need to adjust this logic based on your actual map representation
                is_traversable = True
            
            if not is_traversable:
                continue
                
            # Record scanned cell, tracking if it was created or already existed
            _, created = ScannedCell.objects.get_or_create(
                world=world,
                airplane=airplane,
                pos_x=scan_x,
                pos_y=scan_y
            )
            
            if created:
                cells_added = True
                logger.info(f"New cell scanned at ({scan_x}, {scan_y})")
        
        # Update coverage statistics if new cells were added
        if cells_added:
            self._update_coverage_stats(world)
    
    def _update_coverage_stats(self, world):
        """
        Updates the coverage statistics for the world.
        """
        try:
            # Get or create statistics object for this world
            stats, created = CoverageStatistics.objects.get_or_create(
                world=world,
                defaults={
                    'total_cells': 0,
                    'scanned_cells': 0,
                    'coverage_percentage': 0.0,
                    'path_length': 0
                }
            )
            
            logger.info(f"Updating coverage statistics for world {world.id}")
            
            # Count traversable cells in the basemap if total_cells is 0
            if stats.total_cells == 0:
                basemap = world.basemap
                # Count cells that are traversable (value 0 or list representation)
                total_traversable = 0
                for y, row in enumerate(basemap):
                    for x, cell in enumerate(row):
                        if isinstance(cell, int) and cell == 0:
                            total_traversable += 1
                        elif isinstance(cell, list):
                            # Consider list values as traversable for visualization purposes
                            total_traversable += 1
                
                stats.total_cells = total_traversable
                logger.info(f"Counted {total_traversable} traversable cells in world")
            
            # Count unique scanned cells
            scanned_count = ScannedCell.objects.filter(world=world).values('pos_x', 'pos_y').distinct().count()
            logger.info(f"Scanned cells count: {scanned_count}")
            
            # Count total path length (number of path points across all airplanes)
            path_length = PathPoint.objects.filter(airplane__world=world).count()
            logger.info(f"Path length: {path_length}")
            
            # Update statistics
            stats.scanned_cells = scanned_count
            stats.path_length = path_length
            
            # Calculate coverage percentage
            if stats.total_cells > 0:
                stats.coverage_percentage = (stats.scanned_cells / stats.total_cells) * 100
                logger.info(f"Coverage percentage: {stats.coverage_percentage:.2f}%")
            else:
                stats.coverage_percentage = 0
            
            stats.save()
            logger.info("Statistics saved successfully")
            
        except Exception as e:
            logger.error(f"Error updating coverage statistics: {str(e)}")
            # Create statistics if they don't exist
            try:
                basemap = world.basemap
                # Count traversable cells in a similar way as above
                total_traversable = 0
                for y, row in enumerate(basemap):
                    for x, cell in enumerate(row):
                        if isinstance(cell, int) and cell == 0:
                            total_traversable += 1
                        elif isinstance(cell, list):
                            total_traversable += 1
                
                scanned_count = ScannedCell.objects.filter(world=world).values('pos_x', 'pos_y').distinct().count()
                path_length = PathPoint.objects.filter(airplane__world=world).count()
                
                coverage_percentage = 0
                if total_traversable > 0:
                    coverage_percentage = (scanned_count / total_traversable) * 100
                
                CoverageStatistics.objects.create(
                    world=world,
                    total_cells=total_traversable,
                    scanned_cells=scanned_count,
                    coverage_percentage=coverage_percentage,
                    path_length=path_length
                )
                logger.info("Created new coverage statistics")
            except Exception as nested_e:
                logger.error(f"Failed to create coverage statistics: {str(nested_e)}")

    @action(detail=True, methods=["POST"])
    @transaction.atomic
    def move(self, request, pk=None):
        airplane = self.get_object()
        
        # Debug logging
        logger.info(f"Move request for airplane {airplane.id} ({airplane.name})")
        logger.info(f"Initial position: ({airplane.pos_x}, {airplane.pos_y}), rotation: {airplane.rotation}")
        
        # Store original position for validation
        orig_x, orig_y = airplane.pos_x, airplane.pos_y
        
        # Update position based on rotation
        if airplane.rotation == "UP":
            airplane.pos_y -= 1
            logger.info(f"Moving UP to ({airplane.pos_x}, {airplane.pos_y})")
        elif airplane.rotation == "DOWN":
            airplane.pos_y += 1
            logger.info(f"Moving DOWN to ({airplane.pos_x}, {airplane.pos_y})")
        elif airplane.rotation == "LEFT":
            airplane.pos_x -= 1
            logger.info(f"Moving LEFT to ({airplane.pos_x}, {airplane.pos_y})")
        elif airplane.rotation == "RIGHT":
            airplane.pos_x += 1
            logger.info(f"Moving RIGHT to ({airplane.pos_x}, {airplane.pos_y})")
            
        # Validate new position (ensure it's within map bounds and on a traversable cell)
        world = airplane.world
        basemap = world.basemap
        height = len(basemap)
        width = len(basemap[0]) if height > 0 else 0
        
        logger.info(f"Map dimensions: {width}x{height}")
        
        # Check bounds
        if airplane.pos_x < 0 or airplane.pos_x >= width or airplane.pos_y < 0 or airplane.pos_y >= height:
            # Revert position if invalid
            logger.warning(f"Out of bounds: ({airplane.pos_x}, {airplane.pos_y})")
            airplane.pos_x, airplane.pos_y = orig_x, orig_y
            return Response({"error": "Cannot move outside map boundaries"}, status=400)
        
        # Check if cell is traversable
        try:
            cell_value = basemap[airplane.pos_y][airplane.pos_x]
            logger.info(f"Target cell value: {cell_value}")
        
            is_traversable = False
            if isinstance(cell_value, int):
                # Integer representation
                is_traversable = (cell_value == 0)
            elif isinstance(cell_value, list):
                is_traversable = True
            
            if not is_traversable:
                # Revert position if invalid
                logger.warning(f"Non-traversable cell: ({airplane.pos_x}, {airplane.pos_y}) with value {cell_value}")
                airplane.pos_x, airplane.pos_y = orig_x, orig_y
                return Response({"error": f"Cannot move to non-traversable cell with value {cell_value}"}, status=400)
            
            logger.info(f"Target cell is traversable")
            
        except Exception as e:
            logger.error(f"Error checking traversability: {str(e)}")
            airplane.pos_x, airplane.pos_y = orig_x, orig_y
            return Response({"error": f"Error validating move: {str(e)}"}, status=400)
        
        # Save the airplane's new position
        try:
            airplane.save()
            logger.info(f"Successfully moved to ({airplane.pos_x}, {airplane.pos_y})")
        except Exception as e:
            logger.error(f"Error saving airplane: {str(e)}")
            airplane.pos_x, airplane.pos_y = orig_x, orig_y
            return Response({"error": f"Error saving move: {str(e)}"}, status=400)
        
        # Record this position in the path
        try:
            PathPoint.objects.create(
                airplane=airplane,
                pos_x=airplane.pos_x,
                pos_y=airplane.pos_y,
                rotation=airplane.rotation
            )
            logger.info("Recorded path point")
        except Exception as e:
            logger.error(f"Error recording path point: {str(e)}")
            # Continue even if path recording fails
        
        # Record scanned cells
        try:
            self._record_scanned_cells(airplane)
            logger.info("Recorded scanned cells")
        except Exception as e:
            logger.error(f"Error recording scanned cells: {str(e)}")
            # Continue even if cell recording fails
    
        return Response(self.get_serializer(airplane).data)
    
    @action(detail=True, methods=["POST"])
    @transaction.atomic
    def rotate_left(self, request, pk=None):
        airplane = self.get_object()
        rotations = ["UP", "LEFT", "DOWN", "RIGHT"]
        current_rotation_index = rotations.index(airplane.rotation)
        new_rotation_index = (current_rotation_index - 1) % 4
        airplane.rotation = rotations[new_rotation_index]
        airplane.save()
        
        # Record this position with new rotation in the path
        PathPoint.objects.create(
            airplane=airplane,
            pos_x=airplane.pos_x,
            pos_y=airplane.pos_y,
            rotation=airplane.rotation
        )
        
        # Record scanned cells with new rotation
        self._record_scanned_cells(airplane)
        
        return Response(self.get_serializer(airplane).data)
        
    @action(detail=True, methods=["POST"])
    @transaction.atomic
    def rotate_right(self, request, pk=None):
        airplane = self.get_object()
        rotations = ["UP", "LEFT", "DOWN", "RIGHT"]
        current_rotation_index = rotations.index(airplane.rotation)
        new_rotation_index = (current_rotation_index + 1) % 4
        airplane.rotation = rotations[new_rotation_index]
        airplane.save()
        
        # Record this position with new rotation in the path
        PathPoint.objects.create(
            airplane=airplane,
            pos_x=airplane.pos_x,
            pos_y=airplane.pos_y,
            rotation=airplane.rotation
        )
        
        # Record scanned cells with new rotation
        self._record_scanned_cells(airplane)
        
        return Response(self.get_serializer(airplane).data)

# Add a new viewset for coverage statistics
class CoverageStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CoverageStatisticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['world']
    
    def get_queryset(self):
        return CoverageStatistics.objects.filter(world__owner=self.request.user)
    

class ScannedCellViewSet(viewsets.ModelViewSet):
    queryset = ScannedCell.objects.all()
    serializer_class = ScannedCellSerializer
    
    class pagination_class(pagination.PageNumberPagination):
        page_size = 100
        page_size_query_param = 'page_size'
        max_page_size = 10000

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['world', 'airplane']
    # Optional: Override get_queryset if additional filtering is needed
    def get_queryset(self):
        queryset = super().get_queryset()
        # You can add additional filtering logic here if required
        return queryset


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
