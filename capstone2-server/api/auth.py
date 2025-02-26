from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from accounts.models import User
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import os
import jwt
import logging

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ["JWT_SECRET"]

class CustomOAuthAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Extract the token from the Authorization header
        auth_header = request.headers.get('Authorization')
        token = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]  # Extract token part
        else:
            # If no Authorization header, check for accessToken cookie
            token = request.COOKIES.get('accessToken')
        
        if not token:
            return None  # No token provided in either header or cookie
        
        # Validate the token (replace with your custom OAuth logic)
        user = self.validate_token(token)
        if not user:
            raise AuthenticationFailed('Invalid token or user not found.')

        # Return the user and the token (or None if no authentication)
        return (user, token)

    def validate_token(self, token):
        # Replace this with your logic to validate the token
        # For example, you might query your database or call an external service
        try:
            
            token = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], options={"verify_aud":False})
            # Example: Find the user associated with the token
            user = User.objects.get(id=token["sub"])  # Replace `oauth_token` with your field
            return user
        
        except ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired.')
        except InvalidTokenError:
            raise AuthenticationFailed('Invalid token.')
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found.')
