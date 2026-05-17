"""Tests for package metadata and public API surface."""

import theatrical


def test_version_is_string():
    assert isinstance(theatrical.__version__, str)


def test_version_is_semver():
    parts = theatrical.__version__.split(".")
    assert len(parts) >= 3
    assert all(p.split("-")[0].isdigit() for p in parts[:3])


def test_public_api_exports():
    assert hasattr(theatrical, "TheatricalClient")
    assert hasattr(theatrical, "TheatricalConfig")
    assert hasattr(theatrical, "TheatricalEnvironment")
    assert hasattr(theatrical, "TheatricalError")
    assert hasattr(theatrical, "AuthenticationError")
    assert hasattr(theatrical, "RateLimitError")
    assert hasattr(theatrical, "ValidationError")
    assert hasattr(theatrical, "NotFoundError")
    assert hasattr(theatrical, "ServerError")


def test_all_exports_match():
    for name in theatrical.__all__:
        assert hasattr(theatrical, name), f"{name} in __all__ but not importable"


def test_py_typed_marker_exists():
    import importlib.resources as resources

    files = resources.files("theatrical")
    py_typed = files / "py.typed"
    assert py_typed.is_file()
