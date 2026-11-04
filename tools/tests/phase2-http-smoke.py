#!/usr/bin/env python3
"""Real HTTP session/CSRF smoke against isolated RestaurantOS Docker Compose."""
from __future__ import annotations

import http.cookiejar
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8000"
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def call(path: str, method: str = "GET", data: dict | None = None, csrf: bool = True):
    if method not in ("GET", "HEAD") and csrf:
        status, _ = call("/sanctum/csrf-cookie")
        assert status == 204, f"CSRF bootstrap: expected 204, got {status}"

    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if method not in ("GET", "HEAD") and csrf:
        tokens = [cookie.value for cookie in jar if cookie.name == "XSRF-TOKEN"]
        assert tokens, "CSRF cookie missing"
        headers["X-XSRF-TOKEN"] = urllib.parse.unquote(tokens[-1])
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with opener.open(req, timeout=15) as response:
            payload = response.read()
            return response.status, json.loads(payload) if payload else {}
    except urllib.error.HTTPError as error:
        payload = error.read()
        try:
            decoded = json.loads(payload)
        except ValueError:
            decoded = {}
        return error.code, decoded


def expect(path: str, wanted: int, method: str = "GET", data: dict | None = None, csrf: bool = True):
    status, body = call(path, method, data, csrf)
    if status != wanted:
        raise AssertionError(f"{method} {path}: expected HTTP {wanted}, got {status}; response fields: {list(body) if isinstance(body, dict) else 'nonobject'}")
    return body


def main():
    expect("/api/v1/health", 200)
    expect("/api/v1/auth/me", 401)
    register = {
        "name": "Docker Test",
        "email": "docker-identity@example.test",
        "password": "StrongPassphrase123",
        "password_confirmation": "StrongPassphrase123",
    }
    expect("/api/v1/auth/register", 419, "POST", register, csrf=False)
    result = expect("/api/v1/auth/register", 201, "POST", register)
    assert result["user"]["email_verified"] is False
    expect("/api/v1/auth/me", 200)
    expect("/api/v1/restaurants", 403)
    expect("/api/v1/auth/logout", 200, "POST", {})
    expect("/api/v1/auth/me", 401)
    expect("/api/v1/auth/login", 422, "POST", {"email": register["email"], "password": "invalid"})
    expect("/api/v1/auth/login", 200, "POST", {"email": register["email"], "password": register["password"]})
    expect("/api/v1/auth/me", 200)
    print("PASS: Docker HTTP CSRF, registration, verified gate, logout, bad login, login and session")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise
