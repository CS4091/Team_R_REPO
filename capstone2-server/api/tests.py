from django.test import TestCase, LiveServerTestCase
import requests
from accounts.models import User
from api.models import World, Airplane
from api.auth import generate_token_from_user
from api.map_generator import generate_map
import uuid
# Create your tests here.


class TestWorld(LiveServerTestCase):

    # setUp a test user
    def setUp(self):
        id = str(uuid.uuid4())
        self.user = User.objects.create_user(
            id=id,
            username='testuser'
        )
        self.token = generate_token_from_user(self.user)
    
    def test_user_initialization(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.is_active, True)
        self.assertEqual(self.user.is_staff, False)
        self.assertEqual(self.user.is_superuser, False)

    def test_create_world(self):
        # create a world the endpoint is localhost:8000/services/api/worlds/
        url = self.live_server_url + '/services/api/worlds/'
        data = {
            'name': 'testworld',
            'user': self.user.id
        }
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        response = requests.post(url, data=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['name'], 'testworld')


    def tearDown(self):
        self.user.delete()


class TestAirplane(LiveServerTestCase):

    def setUp(self):
        id = str(uuid.uuid4())
        self.user = User.objects.create_user(
            id=id,
            username='testuser'
        )
        # Create a predictable map for testing movement
        # Using list representation [0,0,0] for traversable, [255,255,255] for obstacle
        self.test_map = [
            [[255, 255, 255], [255, 255, 255], [255, 255, 255]], # Row 0 (Obstacles)
            [[255, 255, 255], [  0,   0,   0], [  0,   0,   0]], # Row 1 (Obstacle, Start(1,1), Clear(2,1))
            [[255, 255, 255], [  0,   0,   0], [255, 255, 255]], # Row 2 (Obstacle, Clear(1,2), Obstacle(2,2))
        ]
        self.start_x = 1
        self.start_y = 1

        self.world = World.objects.create(
            name='testworld_movement',
            owner=self.user,
            basemap=self.test_map,
            start_x=self.start_x,
            start_y=self.start_y,
        )
        self.token = generate_token_from_user(self.user)

        # Create the airplane via API to ensure initial PathPoint and ScannedCells are created
        create_url = self.live_server_url + '/services/api/airplanes/'
        create_data = {
            'name': 'testairplane_move',
            'world': self.world.id
        }
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.post(create_url, data=create_data, headers=headers)
        self.assertEqual(response.status_code, 201, f"Failed to create airplane: {response.text}")
        self.airplane_data = response.json()
        self.airplane_id = self.airplane_data['id']
        # Fetch the actual airplane object if needed later, though API calls are preferred for testing views
        self.airplane = Airplane.objects.get(id=self.airplane_id)


    def test_create_airplane(self):
        url = self.live_server_url + '/services/api/airplanes/'
        data = {
            'name': 'testairplane',
            'world': self.world.id
        }
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        response = requests.post(url, data=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['name'], 'testairplane')
        
    def test_delete_airplane(self):
        url = self.live_server_url + '/services/api/airplanes/'
        data = {
            'name': 'testairplane',
            'world': self.world.id
        }
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        response = requests.post(url, data=data, headers=headers)
        airplane_id = response.json()['id']
        url = self.live_server_url + f'/services/api/airplanes/{airplane_id}/'
        response = requests.delete(url, headers=headers)
        self.assertEqual(response.status_code, 204)
    

    def tearDown(self):
        # Clean up created objects
        if hasattr(self, 'world'):
            self.world.delete() # This should cascade delete airplanes, pathpoints etc.
        if hasattr(self, 'user'):
            self.user.delete()
        # super().tearDown() # Not strictly needed if base class tearDown is empty
    def test_airplane_movement_validation(self):
        """
        Tests moving the airplane into valid, invalid (obstacle), and out-of-bounds cells.
        """
        base_url = f"{self.live_server_url}/services/api/airplanes/{self.airplane_id}"
        move_url = f"{base_url}/move/"
        rotate_left_url = f"{base_url}/rotate_left/"
        rotate_right_url = f"{base_url}/rotate_right/"
        headers = {'Authorization': f'Bearer {self.token}'}

        # Initial state check (created at 1, 1, facing UP)
        self.assertEqual(self.airplane.pos_x, self.start_x)
        self.assertEqual(self.airplane.pos_y, self.start_y)
        self.assertEqual(self.airplane.rotation, "UP")

        # --- Fully Corrected Test Sequence ---
        # Rotation List: ["UP", "LEFT", "DOWN", "RIGHT"] (Indices 0, 1, 2, 3)
        # Rotate Right: index = (current + 1) % 4
        # Rotate Left:  index = (current - 1) % 4
        # Map:
        # [[O, O, O],  # Row 0
        #  [O, S, C],  # Row 1 (S=Start(1,1), C=Clear(2,1))
        #  [O, C, O]]  # Row 2 (C=Clear(1,2), O=Obstacle(2,2))

        # 1. Start State: Pos=(1,1), Rot=UP (idx 0)
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 1, "UP"), "Initial State Check")

        # 2. Move UP -> (1, 0) Obstacle -> Fail. State: (1,1), UP (idx 0)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 400, f"Step 2 Failed: {response.text}")
        self.assertIn("Cannot move to non-traversable cell", response.json().get("error", ""))
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 1, "UP"), "Step 2 State Check")

        # 3. Rotate LEFT (UP -> RIGHT) -> (0-1)%4 = 3 -> RIGHT. State: (1,1), RIGHT (idx 3)
        response = requests.post(rotate_left_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 3 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 1, "RIGHT"), "Step 3 State Check")

        # 4. Move RIGHT -> (2, 1) Clear -> Success. State: (2,1), RIGHT (idx 3)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 4 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (2, 1, "RIGHT"), "Step 4 State Check")

        # 5. Move RIGHT -> (3, 1) OOB -> Fail. State: (2,1), RIGHT (idx 3)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 400, f"Step 5 Failed: {response.text}")
        self.assertIn("Cannot move outside map boundaries", response.json().get("error", ""))
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (2, 1, "RIGHT"), "Step 5 State Check")

        # 6. Rotate LEFT (RIGHT -> DOWN) -> (3-1)%4 = 2 -> DOWN. State: (2,1), DOWN (idx 2)
        response = requests.post(rotate_left_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 6 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (2, 1, "DOWN"), "Step 6 State Check")

        # 7. Move DOWN -> (2, 2) Obstacle -> Fail. State: (2,1), DOWN (idx 2)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 400, f"Step 7 Failed: {response.text}")
        self.assertIn("Cannot move to non-traversable cell", response.json().get("error", ""))
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (2, 1, "DOWN"), "Step 7 State Check")

        # 8. Rotate LEFT (DOWN -> LEFT) -> (2-1)%4 = 1 -> LEFT. State: (2,1), LEFT (idx 1)
        response = requests.post(rotate_left_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 8 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (2, 1, "LEFT"), "Step 8 State Check")

        # 9. Move LEFT -> (1, 1) Clear -> Success. State: (1,1), LEFT (idx 1)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 9 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 1, "LEFT"), "Step 9 State Check")

        # 10. Move LEFT -> (0, 1) Obstacle -> Fail. State: (1,1), LEFT (idx 1)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 400, f"Step 10 Failed: {response.text}")
        self.assertIn("Cannot move to non-traversable cell", response.json().get("error", ""))
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 1, "LEFT"), "Step 10 State Check")

        # 11. Rotate RIGHT (LEFT -> DOWN) -> (1+1)%4 = 2 -> DOWN. State: (1,1), DOWN (idx 2)
        response = requests.post(rotate_right_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 11 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 1, "DOWN"), "Step 11 State Check")

        # 12. Move DOWN -> (1, 2) Clear -> Success. State: (1,2), DOWN (idx 2)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 200, f"Step 12 Failed: {response.text}")
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 2, "DOWN"), "Step 12 State Check")

        # 13. Move DOWN -> (1, 3) OOB -> Fail. State: (1,2), DOWN (idx 2)
        response = requests.post(move_url, headers=headers)
        self.assertEqual(response.status_code, 400, f"Step 13 Failed: {response.text}")
        self.assertIn("Cannot move outside map boundaries", response.json().get("error", ""))
        airplane = Airplane.objects.get(id=self.airplane_id)
        self.assertEqual((airplane.pos_x, airplane.pos_y, airplane.rotation), (1, 2, "DOWN"), "Step 13 State Check")



class TestMultiUserAirplane(LiveServerTestCase):

    def setUp(self):
        id = str(uuid.uuid4())
        self.user1 = User.objects.create_user(
            id=id,
            username='testuser1'
        )
        id = str(uuid.uuid4())
        self.user2 = User.objects.create_user(
            id=id,
            username='testuser2'
        )
        self.world = World.objects.create(
            name='testworld',
            owner=self.user1,
            basemap=generate_map(),
            start_x=0,
            start_y=0,
        )
        self.token1 = generate_token_from_user(self.user1)
        self.token2 = generate_token_from_user(self.user2)

        # user1 creates airplane in world - without API calls
        self.airplane = self.world.airplanes.create(
            name='testairplane',
            world=self.world,
            owner=self.user1,
            pos_y=0,
            pos_x=0,
        )

        # user2 creates airplane in world - without API calls
        self.airplane2 = self.world.airplanes.create(
            name='testairplane2',
            world=self.world,
            owner=self.user2,
            pos_y=0,
            pos_x=0,
        )
    
    def test_airplane_from_both_user_appears(self):
        url = self.live_server_url + '/services/api/airplanes/'
        headers = {
            'Authorization': f'Bearer {self.token1}'
        }
        response = requests.get(url, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["results"]), 2)

        #Get JSON
        results = response.json()["results"]
        self.assertEqual(results[0]['name'], 'testairplane')
        self.assertEqual(results[1]['name'], 'testairplane2')


    def tearDown(self):
        return super().tearDown()
