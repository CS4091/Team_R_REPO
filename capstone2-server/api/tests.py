from django.test import TestCase, LiveServerTestCase
import requests
from accounts.models import User
# Create your tests here.


class TestApi(LiveServerTestCase):

    # setUp a test user
    def setUp(self):
        self.user = User.objects.create_user(
            id=9999,
            username='testuser'
        )
    
    def test_user_initialization(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.is_active, True)
        self.assertEqual(self.user.is_staff, False)
        self.assertEqual(self.user.is_superuser, False)

    def test_create_world(self):
        # create a world the endpoint is localhost:8000/services/api/worlds/
        url = 'http://0.0.0.0:8000/services/api/worlds/'
        data = {
            'name': 'testworld',
            'user': 9999
        }
        response = requests.post(url, data=data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['name'], 'testworld')
        self.assertEqual(response.json()['user'], 9999)
        
        # check that the world was created and in API response




    def tearDown(self):
        self.user.delete()
