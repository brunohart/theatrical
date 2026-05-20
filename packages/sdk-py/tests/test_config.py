"""Tests for TheatricalConfig and TheatricalEnvironment."""

import pytest
from pydantic import ValidationError as PydanticValidationError

from theatrical.config import TheatricalConfig, TheatricalEnvironment


class TestTheatricalEnvironment:
    def test_sandbox_url(self) -> None:
        assert TheatricalEnvironment.SANDBOX.base_url == "https://api-sandbox.vista.co"

    def test_staging_url(self) -> None:
        assert TheatricalEnvironment.STAGING.base_url == "https://api-staging.vista.co"

    def test_production_url(self) -> None:
        assert TheatricalEnvironment.PRODUCTION.base_url == "https://api.vista.co"

    def test_values(self) -> None:
        assert TheatricalEnvironment.SANDBOX.value == "sandbox"
        assert TheatricalEnvironment.STAGING.value == "staging"
        assert TheatricalEnvironment.PRODUCTION.value == "production"


class TestTheatricalConfig:
    def test_minimal_config(self) -> None:
        config = TheatricalConfig(api_key="test-key")
        assert config.api_key == "test-key"
        assert config.environment == TheatricalEnvironment.SANDBOX
        assert config.timeout == 30.0
        assert config.max_retries == 3
        assert config.debug is False

    def test_full_config(self) -> None:
        config = TheatricalConfig(
            api_key="prod-key",
            environment=TheatricalEnvironment.PRODUCTION,
            base_url="https://custom.api.co",
            timeout=15.0,
            max_retries=5,
            debug=True,
        )
        assert config.api_key == "prod-key"
        assert config.environment == TheatricalEnvironment.PRODUCTION
        assert config.base_url == "https://custom.api.co"
        assert config.timeout == 15.0
        assert config.max_retries == 5
        assert config.debug is True

    def test_resolved_base_url_from_environment(self) -> None:
        config = TheatricalConfig(api_key="key")
        assert config.resolved_base_url == "https://api-sandbox.vista.co"

    def test_resolved_base_url_override(self) -> None:
        config = TheatricalConfig(api_key="key", base_url="https://custom.co")
        assert config.resolved_base_url == "https://custom.co"

    def test_empty_api_key_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="")

    def test_whitespace_api_key_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="   ")

    def test_api_key_with_special_chars_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="key with spaces")

    def test_api_key_with_injection_chars_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="key;DROP TABLE")

    def test_negative_timeout_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="key", timeout=-1)

    def test_excessive_timeout_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="key", timeout=200)

    def test_negative_max_retries_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="key", max_retries=-1)

    def test_excessive_max_retries_raises(self) -> None:
        with pytest.raises(PydanticValidationError):
            TheatricalConfig(api_key="key", max_retries=99)
