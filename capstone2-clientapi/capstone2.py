import requests
import logging
import jwt
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

class Airplane:
    def __init__(self, host, token, name, skip_ssl=False):
        self.host = host
        self.name = name
        self.token = token
        self.skip_ssl = skip_ssl
        # decode jwt without verifying and get world
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.world = decoded.get("world")
        if self.world is None:
            raise ValueError("Invalid token. Missing 'world' claim")
        self.id = None
        
    def __enter__(self):
        try:
            response = requests.post(
                f"{self.host}/services/api/airplanes/",
                headers={"Authorization": f"Bearer {self.token}"},
                json={"name": self.name, "world": self.world},
                verify=not self.skip_ssl
            )
            response.raise_for_status()
            result = response.json()
                
            self.id = result["id"]
            self.world = result.get("world", self.world)  # Update world if provided
            logger.info(f"Created airplane: {self.name} with ID {self.id}")
            return self
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Failed to create airplane: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg += f" - Response: {json.dumps(error_data)}"
                except:
                    error_msg += f" - Response text: {e.response.text}"
            
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
        
    def __exit__(self, exc_type, exc_value, traceback):
        if self.id is not None:
            try:
                requests.delete(
                    f"{self.host}/services/api/airplanes/{self.id}/",
                    headers={"Authorization": f"Bearer {self.token}"},
                    verify=not self.skip_ssl
                )
                logger.info(f"Deleted airplane: {self.name}")
            except Exception as e:
                logger.error(f"Error deleting airplane: {str(e)}")

    def move(self):
        # send requests to action endpoint
        try:
            response = requests.post(
                f"{self.host}/services/api/airplanes/{self.id}/move/",
                headers={"Authorization": f"Bearer {self.token}"},
                verify=not self.skip_ssl
            )
            
            # Check if request was successful
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Move successful: {result}")
            return result
        except requests.exceptions.HTTPError as e:
            # Handle HTTP errors (like 400, 401, 500, etc.)
            error_msg = f"Move failed with status {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f": {json.dumps(error_data)}"
            except:
                error_msg += f": {e.response.text}"
            
            logger.error(error_msg)
            print(error_msg)
            return {"error": error_msg}
        except Exception as e:
            logger.error(f"Move failed with exception: {str(e)}")
            print(f"Move failed with exception: {str(e)}")
            return {"error": str(e)}

    def rotate_left(self):
        try:
            response = requests.post(
                f"{self.host}/services/api/airplanes/{self.id}/rotate_left/",
                headers={"Authorization": f"Bearer {self.token}"},
                verify=not self.skip_ssl
            )
            
            response.raise_for_status()
            result = response.json()
            logger.info(f"Rotate left successful: {result}")
            return result
        except requests.exceptions.HTTPError as e:
            error_msg = f"Rotate left failed with status {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f": {json.dumps(error_data)}"
            except:
                error_msg += f": {e.response.text}"
            
            logger.error(error_msg)
            print(error_msg)
            return {"error": error_msg}
        except Exception as e:
            logger.error(f"Rotate left failed with exception: {str(e)}")
            print(f"Rotate left failed with exception: {str(e)}")
            return {"error": str(e)}
    
    def rotate_right(self):
        try:
            response = requests.post(
                f"{self.host}/services/api/airplanes/{self.id}/rotate_right/",
                headers={"Authorization": f"Bearer {self.token}"},
                verify=not self.skip_ssl
            )
            
            response.raise_for_status()
            result = response.json()
            logger.info(f"Rotate right successful: {result}")
            return result
        except requests.exceptions.HTTPError as e:
            error_msg = f"Rotate right failed with status {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f": {json.dumps(error_data)}"
            except:
                error_msg += f": {e.response.text}"
            
            logger.error(error_msg)
            print(error_msg)
            return {"error": error_msg}
        except Exception as e:
            logger.error(f"Rotate right failed with exception: {str(e)}")
            print(f"Rotate right failed with exception: {str(e)}")
            return {"error": str(e)}
            
    def get_status(self):
        try:
            response = requests.get(
                f"{self.host}/services/api/airplanes/{self.id}/",
                headers={"Authorization": f"Bearer {self.token}"},
                verify=not self.skip_ssl
            )
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get status: {str(e)}")
            return {"error": str(e)}

if __name__ == "__main__":
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

    input_message = "S: Move Forward, A: Rotate Left, D: Rotate Right, Q: Quit, I: Info: "

    with Airplane(host, token, name, skip_ssl=SKIP_SSL) as airplane:
        while True:
            input_val = input(input_message).lower()
            if input_val == "q":
                break
            elif input_val == "s":
                result = airplane.move()
                if "error" in result:
                    print(f"Error: {result['error']}")
                else:
                    print(f"Moved to position: ({result['pos_x']}, {result['pos_y']}), facing: {result['rotation']}")
            elif input_val == "a":
                result = airplane.rotate_left()
                if "error" in result:
                    print(f"Error: {result['error']}")
                else:
                    print(f"Rotated left to: {result['rotation']}")
            elif input_val == "d":
                result = airplane.rotate_right()
                if "error" in result:
                    print(f"Error: {result['error']}")
                else:
                    print(f"Rotated right to: {result['rotation']}")
            elif input_val == "i":
                status = airplane.get_status()
                if "error" in status:
                    print(f"Error: {status['error']}")
                else:
                    print(f"Current position: ({status['pos_x']}, {status['pos_y']}), facing: {status['rotation']}")
            else:
                print("Invalid input")


