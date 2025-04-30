from capstone2 import Airplane
import sys
import os
import time
import random

SKIP_SSL = os.environ.get("SKIP_SSL", "false")
SKIP_SSL = SKIP_SSL.lower() == "true"

if len(sys.argv) != 4:
    print("Usage: python capstone2.py <host> <n> <token>")
    sys.exit(1)

host = sys.argv[1]
token = sys.argv[3]
name = sys.argv[2]

visited = set()

temp = 0

# scan up vector is cells above the current cell, left, right, top left, top right
scan_up_vector = [
    (-1, 0),  # up
    (0, -1),  # left
    (0, 1),   # right
    (-1, -1), # top left
    (-1, 1)   # top right
]

scan_right_vector = [
    (0, 1),   # right
    (1, 0),   # down
    (-1, 0),  # up
    (1, 1),   # bottom right
    (-1, 1)   # top right
]

scan_left_vector = [
    (0, -1),  # left
    (1, 0),   # down
    (-1, 0),  # up
    (1, -1),  # bottom left
    (-1, -1)  # top left
]

scan_down_vector = [
    (1, 0),   # down
    (0, -1),  # left
    (0, 1),   # right
    (1, -1),  # bottom left
    (1, 1)    # bottom right
]


with Airplane(host, token, name, skip_ssl=SKIP_SSL) as airplane:
    while True:

        while result := airplane.move():
            if "error" in result:
                break
            
            num = random.randint(0, 3)
            if num == 0:
                airplane.move()
            if num == 1:
                airplane.rotate_left()
            if num == 2:
                airplane.rotate_left()

            
        
        for i in range(1, random.randint(1, 4)):
            airplane.rotate_left()
        
        
    
