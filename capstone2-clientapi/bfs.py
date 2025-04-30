from collections import deque
from capstone2 import Airplane
import sys
import os
import time

def explore_airplane(airplane):
    grid = airplane.get_grid()
    rows, cols = len(grid), len(grid[0])

    # Map directions to dx, dy
    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]  # UP, RIGHT, DOWN, LEFT

    visited = set()
    direction = 0  # Start facing UP
    pos = [0, 0]  # Assume airplane starts at (0, 0)

    # BFS queue: (x, y, direction, airplane state copy, path so far)
    queue = deque()
    queue.append((tuple(pos), direction))

    visited.add((pos[0], pos[1]))

    while queue:
        (x, y), dir = queue.popleft()

        for turn in ["none", "left", "right"]:
            # Copy airplane state
            if turn == "left":
                airplane.rotate_left()
                dir = (dir - 1) % 4
            elif turn == "right":
                airplane.rotate_right()
                dir = (dir + 1) % 4

            # Attempt move forward
            move_result = airplane.move()

            if "error" in move_result:
                continue
            time.sleep(0.5)

            # Calculate new position
            dx, dy = directions[dir]
            nx, ny = x + dx, y + dy

            if (nx, ny) not in visited and 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 0:
                visited.add((nx, ny))
                queue.append(((nx, ny), dir))

    return visited


SKIP_SSL = os.environ.get("SKIP_SSL", "false")
SKIP_SSL = SKIP_SSL.lower() == "true"

if len(sys.argv) != 4:
    print("Usage: python capstone2.py <host> <n> <token>")
    sys.exit(1)

host = sys.argv[1]
token = sys.argv[3]
name = sys.argv[2]

with Airplane(host, token, name, skip_ssl=SKIP_SSL) as airplane:
    visited_cells = explore_airplane(airplane)
    print(f"Visited cells: {visited_cells}")