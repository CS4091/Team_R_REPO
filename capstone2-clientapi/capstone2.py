import requests
import logging
import jwt


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
        
        result = requests.post(
            f"{self.host}/services/api/airplanes/",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"name": self.name, "world": self.world},
            verify=not self.skip_ssl
        ).json()

        self.id = result["id"]
        self.world = result["world"]
        logger.debug(f"Created airplane: {self.name}")

        return self

    def __exit__(self, exc_type, exc_value, traceback):
        requests.delete(
            f"{self.host}/services/api/airplanes/{self.id}/",
            headers={"Authorization": f"Bearer {self.token}"},
            verify=not self.skip_ssl
        )
        logger.debug(f"Deleted airplane: {self.name}")


    def move(self):
        # send requests to action endpoint
        response = requests.post(
            f"{self.host}/services/api/airplanes/{self.id}/move/",
            headers={"Authorization": f"Bearer {self.token}"},
            verify=not self.skip_ssl
        )
        return response.json()

    def rotate_left(self):
        response = requests.post(
            f"{self.host}/services/api/airplanes/{self.id}/rotate_left/",
            headers={"Authorization": f"Bearer {self.token}"},
            verify=not self.skip_ssl
        )
        return response.json()
    

    def rotate_right(self):
        response = requests.post(
            f"{self.host}/services/api/airplanes/{self.id}/rotate_right/",
            headers={"Authorization": f"Bearer {self.token}"},
            verify=not self.skip_ssl
        )
        return response.json()



if __name__ == "__main__":
    import sys
    import os

    SKIP_SSL = os.environ.get("SKIP_SSL", "false")
    SKIP_SSL = SKIP_SSL.lower() == "true"
    
    if len(sys.argv) != 4:
        print("Usage: python capstone2.py <host> <name> <token>")
        sys.exit(1)
    
    host = sys.argv[1]
    token = sys.argv[3]
    name = sys.argv[2]

    input_message = "S: Move Forward, A: Rotate Left, D: Rotate Right, Q: Quit: "

    with Airplane(host, token, name, skip_ssl=SKIP_SSL) as airplane:
        while True:
            input_val = input(input_message).lower()
            if input_val == "q":
                break
            elif input_val == "s":
                airplane.move()
            elif input_val == "a":
                airplane.rotate_left()
            elif input_val == "d":
                airplane.rotate_right()
            else:
                print("Invalid input")

    
