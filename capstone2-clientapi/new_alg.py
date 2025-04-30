import numpy as np
import sys
import requests
from capstone2 import Airplane
import time
import random
import copy
np.set_printoptions(threshold=sys.maxsize)

# Grid dimensions
GRID_WIDTH = 100
GRID_HEIGHT = 100

# Coverage threshold (80% of free cells)
COVERAGE_THRESHOLD = 0.1

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

class gridState:
    visited = 0
    cost = 0
    path = ""
    pos = 0, 0
    orientation = "UP"


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
    rel_coords = [(0, -1), (0, 0), (0, 1),
                  (-1, -1), (-1, 0), (-1, 1)]
    
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
        if(grid[row][col] == 1):
            return 1
    return False

def apply_action(airplane: Airplane, position, orientation, action, grid):
    """
    Compute the new position and orientation after applying an action.
    Returns new_position, new_orientation.
    """
    print("ORIENTATION IS", orientation,"\n\n\n\n")
    airplane.rotation = orientation
    if action == "F":
        # Move forward in current orientation
        print("MOVING FORWARD")
        result = airplane.move()
        dr, dc = MOVE_DELTA[orientation]
        new_position = (position[0] + dr, position[1] + dc)
        new_orientation = orientation

    elif action == "L":
        print("TURNING LEFT")
        # Turn left 
        result = airplane.rotate_right()
        new_orientation = ORIENTATIONS[(ORIENTATIONS.index(orientation) - 1) % 4]
        new_position = position
            
    elif action == "R":
        # Turn right
        print("TURNING RIGHT")
        result = airplane.rotate_left()
        new_orientation = ORIENTATIONS[(ORIENTATIONS.index(orientation) + 1) % 4]
        new_position = position
    else:
        raise ValueError("Invalid action")

    status = airplane.get_status()
    print("position is", new_position)
    print("result[x], result[y] is: ", status["pos_x"], status["pos_y"])
    print("rotation is; ", status["rotation"])
    print("Current orientation is: ", new_orientation)

    # Check if the new position is valid; if not, return None.
    if is_valid(new_position, grid):
        print("new_position, new_orientation", new_position, new_orientation)
        return new_position, new_orientation
    else:
        print("Error thrown in is_valid")
        return None, None

def compute_coverage(visited, grid):
    """
    Compute the fraction of free grid cells that have been covered.
    visited is a boolean grid the same size as grid.
    """
    free_cells = np.sum(grid == 0)
    covered_cells = np.sum(visited)
    return covered_cells / free_cells if free_cells > 0 else 0

def compute_path(grid, position, orientation, max_steps=10000):
    """
    Calculate the cost for each next position to travel to for the next step. This will be through a semi-Dijkstra related formula 
    Moving forward cost = 1  DONE
    Turning cost = 1  DONE
    All newly scanned blocks will lower cost by 4. i.e. if 4 of the 6 grid tiles are already explored, cost = -2; DONE

    After validating the next steps, keep track of all moves in a list sorted based on priority. If move is invalidm remove from queue. Otherwise, lowest cost goes next
    
    """

    vector = []
    cur = gridState()
    cur.visited = np.zeros_like(grid, dtype=bool)

    #Each state has an array for airplane Pos, visited tiles, and total cost of the algorithm so far
    posChange = "F"
    cur.cost = 0
    cur.path = ""
    cur.pos = position

    vector.insert(0, cur)
    #fix: add an initializer moment to make at least one test attempt so vector isn't empty
    while compute_coverage(cur.visited, grid) < COVERAGE_THRESHOLD:
        print(compute_coverage(cur.visited, grid))
        print("COST IS: ",cur.cost)

        temp = vector[0]
        vector.pop(0)
        #print_cur(cur)
        #print("COVERAGE IS: ",compute_coverage(cur.visited, grid))
        list = [0, 1, 2]
        for i in list:
            cur = copy.deepcopy(temp)
            if i == 0:
                posChange = "F"
                dr, dc = MOVE_DELTA[ORIENTATIONS[(ORIENTATIONS.index(cur.orientation)) %4]]
                posCheck = (cur.pos[0] + dr, cur.pos[1] + dc)
                compute_step(cur, grid, vector, posChange, posCheck, cur.orientation)
            elif i == 1:
                posChange = "R"
                posCheck = cur.pos
                cur.orientation = ORIENTATIONS[(ORIENTATIONS.index(cur.orientation) + 1) % 4]
                compute_step(cur, grid, vector, posChange, cur.pos, cur.orientation)
            elif i == 2:
                posChange = "L"
                posCheck = cur.pos
                cur.orientation = ORIENTATIONS[(ORIENTATIONS.index(cur.orientation) - 1) % 4]
                compute_step(cur, grid ,vector, posChange, cur.pos, cur.orientation)
    return vector[0].path

    #initialize array
    #compute_path()
    #test each available path from the current node. Delete invalid ones, otherwise insert in list based on cost



def compute_step(cur, grid, vector, posChange, posCheck, orientation):
    """
    Accepts a current possible state and checks for validity. If valid, calculates cost value. Otherwise, return 0 and move to next check

    """
    if is_valid(posCheck, grid):
        #Run a loop for every 'path' point in posChange
        if posChange == "F":
            cur.pos = posCheck

        cur.cost+=1

        cur.path = cur.path + posChange
        #calculate foortprint 
        footprint = get_sensor_footprint(cur.pos, cur.orientation)
        for (r, c) in footprint:
            if 0 <= r < grid.shape[0] and 0 <= c < grid.shape[1]:
                if grid[r, c] == 1 and cur.visited[r, c] == False:
                    cur.cost= cur.cost - 1
                    cur.visited[r, c] = True
        #check scanned area for grid positions passable, then cover them in the scanner. Keep track of how many positions were scanned for cost

        check = 0

        for i in range(len(vector)):
            if(check == 0):
                if cur.cost < vector[i].cost:
                    vector.insert(i, cur)
                    check = 1
                    return 1
        #cur is too big, so add it to end of queue
        if(check == 0):
            vector.append(cur)
        return 1
    else:
        print("Not valid!")
        return 0




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
        print("x, y ARE: ",start_x, start_y)
        rotation = status["rotation"]
        



        # Set starting position and orientation (choose a free cell)
        start_position = start_y, start_x
        start_orientation = rotation
        
        # Run the simulation
        path = compute_path(grid, start_position, start_orientation, max_steps=10000)
    
        next_position = start_position
        next_orientation = start_orientation
        print("Pos is: ", next_position)
        print("orientation is: ", next_orientation)
        #print("Path is: ", path)

        for action in path:
            next_position, next_orientation = apply_action(airplane, next_position, next_orientation, action, grid)
        check = 0
        print("Out of Loop!")
        while(check == 0):
            time.sleep(1)
            check = input()
if __name__ == "__main__":
    main()
