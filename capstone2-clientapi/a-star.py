import numpy as np
import sys
import os
import requests
import time
import random
import copy
from typing import Callable
import heapq
from collections import deque
from copy import deepcopy
from capstone2 import Airplane

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
    name = sys.argv[2]
    token = sys.argv[3]

    with Airplane(host, token, name, skip_ssl=SKIP_SSL) as airplane:
        print("Connection successful.")
        scanned_cells = airplane.get_scanned_cell()    
        for cells in scanned_cells:
            print(cells['pos_x'], cells['pos_y'])

if __name__ == "__main__":
    main()
