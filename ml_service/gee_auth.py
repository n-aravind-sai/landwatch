import os, json, base64
from dotenv import load_dotenv
import ee
from google.oauth2 import service_account

def init_gee():
    """
    Initializes Google Earth Engine using a service account key from a base64-encoded environment variable.
    Raises:
        RuntimeError: If the environment variable is missing or invalid.
    """
    load_dotenv()
    b64 = os.getenv("GEE_JSON_B64")
    if not b64:
        raise RuntimeError("GEE_JSON_B64 not found in .env")

    key_str = base64.b64decode(b64).decode()
    service_info = json.loads(key_str)

    credentials = service_account.Credentials.from_service_account_info(
        service_info,
        scopes=["https://www.googleapis.com/auth/earthengine"]
    )

    ee.Initialize(credentials)
