# Theatrical SDK for Python

Type-safe async-first Python client for cinema platform APIs. Part of the [Theatrical](https://github.com/brunohart/theatrical) polyglot SDK.

## Install

```bash
pip install theatrical
```

## Status

**Alpha** — all 8 resource modules implemented with full TS API parity. 332 pytest tests passing. mypy strict clean, ruff clean.

## Requirements

- Python 3.10+
- httpx >= 0.27.0
- pydantic >= 2.0.0

## Quick Start

```python
from theatrical import TheatricalClient, TheatricalConfig, TheatricalEnvironment

async with TheatricalClient(TheatricalConfig(
    api_key="your-api-key",
    environment=TheatricalEnvironment.SANDBOX,
)) as client:
    sessions = await client.sessions.list()
```

## Mock Mode

```python
client = TheatricalClient.create_mock()
# Returns pre-defined NZ cinema fixture data — no API key needed
```

## Singleton Pattern

```python
# At startup:
TheatricalClient.set_global(TheatricalConfig(api_key="key"))

# Anywhere:
client = TheatricalClient.global_instance()
```

## Features

- Async-first design with `httpx` and context manager support
- `pydantic` v2 models with automatic camelCase alias support
- 8 resource modules: sessions, sites, films, orders, loyalty, subscriptions, pricing, F&B
- Typed error hierarchy: `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ValidationError`
- Mock mode with NZ cinema fixture data for offline development
- PEP 561 compliant — ships `py.typed` for downstream type checking
- 332 tests, mypy strict, ruff clean

## Development

```bash
pip install -e ".[dev]"
make check  # runs typecheck, lint, test
```

## Disclaimer

This project is an independent, open-source developer toolkit for cinema platform APIs. It is not affiliated with, endorsed by, or officially connected to Vista Group International Ltd or any of its subsidiaries. All product names, trademarks, and registered trademarks are property of their respective owners.
