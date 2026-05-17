# Changelog

All notable changes to the Theatrical Python SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-18

### Added

- `TheatricalClient` with API key authentication and automatic token refresh
- Async-first design with `httpx` and `pydantic` v2
- Typed error hierarchy: `TheatricalError`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ValidationError`
- Mock mode via `TheatricalClient.create_mock()` with NZ cinema fixture data
- Singleton pattern via `TheatricalClient.set_global()` / `TheatricalClient.global_instance()`
- `ApiModel` base class with automatic camelCase alias support
- 8 resource modules with full API parity:
  - `sessions` — list, list_paginated, list_all, get, availability
  - `sites` — list, get, screens, nearby
  - `films` — now_showing, coming_soon, get, get_detail, search, advanced_search
  - `orders` — create, get, add_tickets, add_items, confirm, cancel, apply_loyalty, refund, complete, history
  - `loyalty` — get_member, authenticate, get_points_balance, get_history, list_redemption_options, redeem_points
  - `subscriptions` — list_plans, get_member_subscription, get_usage, check_benefit_eligibility, suspend, cancel
  - `pricing` — ticket_types, calculate, apply_coupons
  - `food_and_beverage` — menu, categories, item_detail, combos, add_to_order
- 332 pytest tests with spy HTTP client infrastructure
- mypy strict clean, ruff clean
- PEP 561 `py.typed` marker for downstream type checking

[Unreleased]: https://github.com/brunohart/theatrical/compare/v0.1.0-python...HEAD
[0.1.0]: https://github.com/brunohart/theatrical/releases/tag/v0.1.0-python
