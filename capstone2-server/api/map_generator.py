import pathlib
import random
import json
import numpy as np
from noise import snoise2

# This script generates a 2D grid world of clear spaces and obstacles. The world
# is represented by a 2D array of zeroes and ones. Zeroes are clear free space
# and ones are an obstacle. The grid data is written to a CSV file and a supporting
# configuration data file is generated describing the grid world.
#
# Note: To run this file locally you'll need to install numpy, matplotlib, and noise
# `pip install matplotlib`
# `pip install numpy`
# `pip install noise`


def generate_grid(width, height, scale, threshold, octaves, persistence, lacunarity) -> np.ndarray:

    grid = np.zeros((height, width), dtype=int)

    for y in range(height):
        for x in range(width):
            noise_value = snoise2(x / scale, y / scale, octaves, persistence, lacunarity)
            normalized_value = (noise_value + 1) / 2
            
            if normalized_value > threshold:
                grid[y, x] = 1  # Obstacle
            else:
                grid[y, x] = 0  # Clear space

    return grid

def find_start_coordinate(grid: np.ndarray):
    """
    Find a random clear space to serve as the starting point for a search vehicle.

    Args:
        grid: A 2D grid of zeros and ones.

    Returns:
        A tuple of row and column indecies into the grid where the search vehicle
        should start.
    """
    row_index = None
    col_index = None

    while True:
        random_index = np.random.randint(0, grid.size)

        # Convert the index to 2D coordinates
        row_index = random_index // grid.shape[1]
        col_index = random_index % grid.shape[1]

        # Check if the coordinate is clear of obstacles
        random_cell = grid[row_index, col_index]
        if random_cell == 0:
            break
    
    return row_index, col_index


def write_problem_params(output_filepath: pathlib.Path, grid: np.ndarray):
    row, col = find_start_coordinate(grid)
    num_cells = grid.size

    with open(output_filepath, 'wt') as output:
        output.write('# Starting position\n')
        output.write(f'{row},{col}\n')
        output.write('# Number of moves\n')
        output.write(f'{int(num_cells * 0.4)}')
        output.write('# Sensor size (forward range, lateral width)\n')
        # Width should be an odd number to make centering on the platform simple
        # 
        #  This example has a forward range of 3 and a width of 7.
        #  The platform is on the bottom as the | character flying up the page.
        #  The width is centered on the platform so it can see up to 3 columns
        #  to the left and right in this example.  It can see up to 3 rows ahead.
        #      +-----+
        #      |     |
        #      +-----+      
        #         |
        output.write('3,7\n')


def main():
    width = 100  # Width of the grid
    height = 100  # Height of the grid

    #random.seed(42)

    scale = 50.0
    threshold = 0.4  # Threshold for determining if noise value becomes an obstacle
    octaves = 2
    persistence = random.uniform(0.25, 4.5)
    lacunarity = random.uniform(1, 5)

    print(f'Octaves: {octaves}')
    print(f'Persistence: {persistence}')
    print(f'Lacunarity: {lacunarity}')

    grid = generate_grid(width, height, scale, threshold, octaves, persistence, lacunarity)
    grid_list = [[[255, 255, 255] if cell == 1 else [0, 0, 0] for cell in row] for row in grid.tolist()]
    

    np.savetxt('grid_world.csv', grid, delimiter=',', fmt='%d')
    write_problem_params(pathlib.Path(f'./grid_world_params.txt'), grid)


def generate_map():
    width = 100  # Width of the grid
    height = 100  # Height of the grid
    scale = 50.0
    threshold = 0.4  # Threshold for determining if noise value becomes an obstacle
    octaves = 2
    persistence = random.uniform(0.25, 4.5)
    lacunarity = random.uniform(1, 5)
    grid = generate_grid(width, height, scale, threshold, octaves, persistence, lacunarity)
    grid_list = [[[255, 255, 255] if cell == 1 else [0, 0, 0] for cell in row] for row in grid.tolist()]
    pos = find_start_coordinate(grid)

    
    with open("/app/api/output.json") as fp:
        grid_list = json.load(fp)
    return grid_list, pos
