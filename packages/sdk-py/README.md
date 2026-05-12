# Theatrical SDK for Python

Type-safe async-first Python client for cinema platform APIs. Part of the [Theatrical](https://github.com/brunohart/theatrical) polyglot SDK.

## Status

**Alpha** — scaffold complete. Core client, error hierarchy, 8 domain type modules (full field fidelity with TS SDK), 8 resource stubs, and pytest suite are in place. Resource implementations (PORT-PYTHON-002 through PORT-PYTHON-005) are next.

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

## Development

```bash
pip install -e ".[dev]"
pytest
mypy theatrical
ruff check theatrical
```

## Disclaimer

This project is an independent, open-source developer toolkit for cinema platform APIs. It is not affiliated with, endorsed by, or officially connected to Vista Group International Ltd or any of its subsidiaries. All product names, trademarks, and registered trademarks are property of their respective owners.
