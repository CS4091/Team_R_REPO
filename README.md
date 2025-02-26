# TEAM_R
Everything for Team R

## Members:
- Sam Pauley
- Dominick Dickerson
- Samarth Sinha
- Kevin Lai
- Noah Schaben
- Kshitij Sharma

# Project Scope

## Project Goals

### Primary Goal
- Develop and implement an algorithm that generates an efficient flight path for an aircraft using a 2D grid world to scan at least 80% of all traversable grid cells.
- **Satisfy Movement Constraints**: Adhere to the aircraft’s movement restrictions (Forward, left turn, right turn, no backwards movement).
- **Avoid Non-Traversable Cells**: Make sure the aircraft does not go into any non-traversable cells.
- **Scan Coverage**: Ensure that the aircraft’s 2x3 sensor scans 80% of the cells during the flight.

### Secondary (Stretch) Goals
- Create multiple competing heuristics and/or algorithms. Analyze which provides better results and why.
- New constraint: The aircraft can only move a total of X times. Maximize the grid world coverage within this constraint.
- What if we had two vehicles? Come up with routes that optimize scanning the grid world using both aircraft simultaneously.
- Create a mechanism to visualize the problem and solution(s).

## Project Boundaries

### Identify what's included

**Which features will you implement?**
- 100x100 grid, which may change depending on the computational power required.
- Django backend and React frontend.

**What functionality is essential?**
- Mapping at minimum 80% of the provided map.
- Achieving this as efficiently as possible.

**What data will you handle?**
- The generated map of the terrain.

### Specify what's excluded

**Which features are out of scope?**
- 3D rendering of the map.

**What won't your system handle?**
- Three dimensions of topography. The map will be fully 2-dimensional, including only accessible and inaccessible tiles.

**What are the limitations?**
- Extremely large maps. Theoretically, it could support them, but the larger the maps get, the more computationally expensive they become.

### Example Boundaries

**The project will:**
- Handle only specified data formats.
- Process up to X locations/tasks.
- Support specific algorithms.

**The project will not:**
- Handle real-time updates.
- Include advanced visualizations.
- Support multiple users.

## Stretch Goals
- Multi-user/algorithm plane search within the given grid.
  - Either cooperating and exploring the given land together or competing with different algorithms to explore as much of the terrain as possible.
- Moving obstructions.
- Parallel computing implementation.
- Obstacle detection using image processing.
- Programmable real-life drone.

## Required Resources

### List technical resources
- Python (Django) and JavaScript (React) with HTML/CSS.
- AWS for hosting the frontend and backend.

### Identify data requirements
- Input data in the form of a Python script.
- Test data from Boeing.

### Specify computing needs
- AWS for frontend and backend rendering.
- Algorithm needs to be computable in a realistic amount of time.