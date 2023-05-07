import argparse
import sys
import time
import webbrowser
from os import makedirs
from os.path import exists, expanduser, join
from typing import Literal

import httpx
from rmmbr.crypto import generate_encryption_key


CLIENT_ID = "ARXipK0k64GivxcX9UVUWMp9g7ywQsqO"
AUTH0_TENANT = "https://dev-gy4q5ggc5zaobhym.us.auth0.com"
AUDIENCE = "rmmbr"


def _get_config_dir():
    local_dir = join(expanduser("~"), ".rmmbr")
    makedirs(local_dir, exist_ok=True)
    return local_dir


def get_or_generate_secret_key():
    secret_file = join(_get_config_dir(), "secret")
    if not exists(secret_file):
        secret = generate_encryption_key()
        with open(secret_file, "wt") as f:
            f.write(secret)
    else:
        with open(secret_file, "rt") as f:
            secret = f.read()

    print(secret)


def api_token():
    access_token = get_access_token()
    if access_token is None:
        print("Not logged-in, run the `login` command first.", file=sys.stderr)
        return

    get_response = api_token_request(access_token)
    if get_response.status_code == 200:
        print(get_response.text)
        return

    create_response = api_token_request(access_token, method="POST")
    if create_response.status_code == 200:
        print(create_response.text)
    else:
        print(f"Error creating an API token: '{create_response.text}'", file=sys.stderr)


def api_token_request(
    access_token: str, method: Literal["GET"] | Literal["POST"] = "GET"
):
    return httpx.request(
        url="http://localhost:8000/api-token/",
        method=method,
        headers={"Authorization": f"Bearer {access_token}"},
    )


def login():
    response = httpx.post(
        f"{AUTH0_TENANT}/oauth/device/code",
        headers={"Content-Type": "application/json"},
        json={
            "scope": "profile",
            "client_id": CLIENT_ID,
            "audience": AUDIENCE,
        },
    )

    resp_json = response.json()
    device_code = resp_json["device_code"]
    interval = resp_json["interval"]
    verification_uri_complete = resp_json["verification_uri_complete"]

    webbrowser.open_new_tab(verification_uri_complete)

    print(
        "Visit:\n"
        "\n"
        f"  {verification_uri_complete}\n"
        "\n"
        "and confirm to finish the login.\n"
    )
    print("Waiting...")

    while True:
        time.sleep(interval)

        response = httpx.post(
            f"{AUTH0_TENANT}/oauth/token",
            headers={"Content-Type": "application/json"},
            json={
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "device_code": device_code,
                "client_id": CLIENT_ID,
            },
        )

        resp_json = response.json()
        access_token = resp_json.get("access_token")
        if access_token is not None:
            store_access_token(access_token)
            print("Now logged in.")
            return

        error = resp_json["error"]
        if error == "expired_token":
            print("Waited too long, try again.")
            return
        elif error == "authorization_pending":
            # User hasn't authenticated yet, wait and try again:
            continue
        else:
            print(f"Unexpected error while waiting for authentication: {error}")
            return


def store_access_token(access_token: str):
    access_token_path = join(_get_config_dir(), "access_token")
    with open(access_token_path, "wt") as f:
        f.write(access_token)


def get_access_token():
    access_token_path = join(_get_config_dir(), "access_token")
    if not exists(access_token_path):
        return None

    with open(access_token_path, "rt") as f:
        return f.read()


def main():
    parser = argparse.ArgumentParser(description="rmmbr cli")
    parser.set_defaults(func=parser.print_help)

    subparsers = parser.add_subparsers(help="Commands")

    secret = subparsers.add_parser("login", help="Authenticate the CLI")
    secret.set_defaults(func=login)

    secret = subparsers.add_parser("api-token", help="Get or generate an api-token")
    secret.set_defaults(func=api_token)

    secret = subparsers.add_parser("secret", help="Get or generate a secret key")
    secret.set_defaults(func=get_or_generate_secret_key)

    args = parser.parse_args()
    args.func()
