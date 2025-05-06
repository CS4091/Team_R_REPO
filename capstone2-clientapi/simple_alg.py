import numpy as np
import requests
from capstone2 import Airplane
import time
import random

# Grid dimensions
GRID_WIDTH = 100
GRID_HEIGHT = 100

# Coverage threshold (80% of free cells)
COVERAGE_THRESHOLD = 0.8

# Define possible orientations (0: North, 1: East, 2: South, 3: West)
ORIENTATIONS = ["UP", "RIGHT", "DOWN", "LEFT"]

# Movement actions: forward (F), left-turn (L), right-turn (R)
ACTIONS = ["F", "L", "R"]

# Map orientations to movement delta for a forward move:
MOVE_DELTA = {
    "UP": (-1, 0),  # North: decrease row
    "RIGHT": (0, 1),   # East: increase column
    "DOWN": (1, 0),   # South: increase row
    "LEFT": (0, -1)   # West: decrease column
}


def get_sensor_footprint(position, orientation):
    """
    Given the aircraft's position (row, col) and orientation, compute the sensor footprint.
    The sensor covers a 2x3 rectangle ahead of the aircraft.
    We assume the sensor rectangle is placed immediately in front of the aircraft.
    """
    row, col = position
    footprint = []
    # Relative coordinates for a 2x3 rectangle with the aircraft at the bottom center when facing North.
    # We'll define it for the North orientation and then rotate for other directions.
    # For North: rectangle is two rows high, three columns wide, in front of the aircraft.
    rel_coords = [(-1, -1), (-1, 0), (-1, 1),
                  (-2, -1), (-2, 0), (-2, 1)]
    
    # Rotate relative coordinates based on orientation
    def rotate(coord, orientation):
        r, c = coord
        # 90 degrees clockwise rotation
        for _ in range(ORIENTATIONS.index(orientation)):
            r, c = c, -r
        return (r, c)
    
    for rel in rel_coords:
        dr, dc = rotate(rel, orientation)
        footprint.append((row + dr, col + dc))
    return footprint

def is_valid(position, grid):
    """
    Check if a given position (row, col) is within the grid and not an obstacle.
    """
    row, col = position
    if 0 <= row < grid.shape[0] and 0 <= col < grid.shape[1]:
        return grid[row, col] == 1
    return False

def apply_action(airplane: Airplane, position, orientation, action, grid):
    """
    Compute the new position and orientation after applying an action.
    Returns new_position, new_orientation.
    """
    if action == "F":
        # Move forward in current orientation
        def dothis():
            result = airplane.move()
            try:
                new_position = result["pos_y"], result["pos_x"]
                return new_position, orientation
            except:
                return position, new_orientation
        dr, dc = MOVE_DELTA[orientation]
        new_position = (position[0] + dr, position[1] + dc)
        new_orientation = orientation
    
    elif action == "L":
        # Turn left and then move forward
        def dothis():
            result = airplane.rotate_left()
            new_orientation = result["rotation"]
            result = airplane.move()
            try:
                new_position = result["pos_y"], result["pos_x"]
                return new_position, new_orientation
            except:
                return position, new_orientation
        
        new_orientation = ORIENTATIONS[(ORIENTATIONS.index(orientation) + 1) % 4]
        dr, dc = MOVE_DELTA[new_orientation]
        new_position = (position[0] + dr, position[1] + dc)
    elif action == "R":
        # Turn right and then move forward
        def dothis():
            result = airplane.rotate_right()
            new_orientation = result["rotation"]
            result = airplane.move()
            try:
                new_position = result["pos_y"], result["pos_x"]
                return new_position, new_orientation
            except:
                return position, new_orientation
        new_orientation = ORIENTATIONS[(ORIENTATIONS.index(orientation) + 1) % 4]
        dr, dc = MOVE_DELTA[new_orientation]
        new_position = (position[0] + dr, position[1] + dc)
    
    else:
        raise ValueError("Invalid action")

    
    # Check if the new position is valid; if not, return None.
    if is_valid(new_position, grid):
        return new_position, new_orientation, dothis
    else:
        return None, None, None

def compute_coverage(visited, grid):
    """
    Compute the fraction of free grid cells that have been covered.
    visited is a boolean grid the same size as grid.
    """
    free_cells = np.sum(grid == 0)
    covered_cells = np.sum(visited)
    return covered_cells / free_cells if free_cells > 0 else 0

def simulate_flight(airplane: Airplane, grid, start_position, start_orientation, max_steps=10000):
    """
    Simulate the flight using a greedy strategy:
    At each step, try the three actions and choose the one that maximizes new sensor coverage.
    Stops when coverage threshold is reached or max_steps is exceeded.
    Returns the flight path (list of positions) and orientations.
    """
    current_position = start_position
    current_orientation = start_orientation
    path = [current_position]
    orientations = [current_orientation]
    
    # Create a grid to track sensor-covered cells.
    visited = np.zeros_like(grid, dtype=bool)
    
    # Initially mark sensor footprint as covered.
    for cell in get_sensor_footprint(current_position, current_orientation):
        r, c = cell
        if 0 <= r < grid.shape[0] and 0 <= c < grid.shape[1]:
            visited[r, c] = True

    steps = 0
    while compute_coverage(visited, grid) < COVERAGE_THRESHOLD and steps < max_steps:
        best_action = None
        best_new_cells = -1
        best_next_state = (None, None, None)
        
        # Evaluate each possible action
        for action in ACTIONS:
            next_position, next_orientation, dothis = apply_action(airplane, current_position, current_orientation, action, grid)
            if next_position is None:
                continue  # invalid move

            # Determine sensor coverage from the potential new state.
            footprint = get_sensor_footprint(next_position, next_orientation)
            new_cells = 0
            for (r, c) in footprint:
                if 0 <= r < grid.shape[0] and 0 <= c < grid.shape[1]:
                    if grid[r, c] == 0 and not visited[r, c]:
                        new_cells += 1
            if new_cells > best_new_cells:
                best_new_cells = new_cells
                best_action = action
                best_next_state = (next_position, next_orientation, dothis)
                   
        # If no action yields new coverage, still choose a valid move (e.g., forward if possible)
        if best_action is None:
            best_next_state = apply_action(airplane, current_position, current_orientation, "F", grid)
            if best_next_state[0] is None:
                current_orientation = "UP"
                continue

        # Update current state
        _, _, current_do_this = best_next_state
        current_position, current_orientation = current_do_this()

        path.append(current_position)
        orientations.append(current_orientation)
        # Update visited cells with new sensor footprint.
        for cell in get_sensor_footprint(current_position, current_orientation):
            r, c = cell
            if 0 <= r < grid.shape[0] and 0 <= c < grid.shape[1]:
                visited[r, c] = True
        
        steps += 1

    final_coverage = compute_coverage(visited, grid)
    print(f"Simulation finished after {steps} steps with {final_coverage*100:.2f}% coverage.")
    return path, orientations, visited


def main():
    # Create the grid with obstacles
    import sys
    import os
    
    SKIP_SSL = os.environ.get("SKIP_SSL", "false")
    SKIP_SSL = SKIP_SSL.lower() == "true"
    
    if len(sys.argv) != 4:
        print("Usage: python capstone2.py <host> <n> <token>")
        sys.exit(1)
    
    host = sys.argv[1]
    token = sys.argv[3]
    name = sys.argv[2]


    with Airplane(host, token, name, skip_ssl=SKIP_SSL) as airplane:
        grid = airplane.get_grid()

        # map 255,255,255 to 1
        for i in range(GRID_HEIGHT):
            for j in range(GRID_WIDTH):
                if grid[i][j] == [255,255,255]:
                    grid[i][j] = 1
                else:
                    grid[i][j] = 0
        
        grid = np.array(grid)
        status = airplane.get_status()
        start_x = int(status["pos_x"])
        start_y = int(status["pos_y"])
        rotation = status["rotation"]

        # Set starting position and orientation (choose a free cell)
        start_position = start_y, start_x
        if grid[start_position] == 1:
            # If starting cell is an obstacle, choose an alternative free cell.
            start_position = (GRID_HEIGHT - 1, 1)
        start_orientation = rotation

        # Run the simulation
        path, orientations, visited = simulate_flight(airplane, grid, start_position, start_orientation)
    

if __name__ == "__main__":
    main()
