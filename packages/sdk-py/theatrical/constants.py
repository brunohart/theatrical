"""SDK-wide constants for the theatrical Python package."""

SDK_VERSION = "0.1.0"
SDK_USER_AGENT = f"theatrical-python/{SDK_VERSION}"

DEFAULT_TIMEOUT_SECONDS = 30.0
DEFAULT_MAX_RETRIES = 3
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 500

VISTA_SANDBOX_URL = "https://api.sandbox.vista.co"
VISTA_STAGING_URL = "https://api.staging.vista.co"
VISTA_PRODUCTION_URL = "https://api.vista.co"

GAS_AUTH_URL = "https://auth.moviexchange.com"
