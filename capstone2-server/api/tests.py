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
        self.world = World.objects.create(
            name='testworld',
            owner=self.user,
            basemap=generate_map(),
            start_x=0,
            start_y=0,
        )
        self.token = generate_token_from_user(self.user)


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
        return super().tearDown()


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
