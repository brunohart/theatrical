# Changelog

All notable changes to the Theatrical C# SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-18

### Added

- `TheatricalClient` with API key authentication and automatic token refresh
- HTTP client with Polly retry policies and rate limit handling
- Typed error hierarchy: `TheatricalException`, `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ValidationError`
- Mock mode via `TheatricalClient.CreateMock()` with NZ cinema fixture data
- Singleton pattern via `TheatricalClient.SetGlobal()` / `TheatricalClient.Global()`
- 8 resource modules with full API parity:
  - `Sessions` — list, get, availability
  - `Sites` — list, get, screens, nearby
  - `Films` — now showing, coming soon, search, advanced search
  - `Orders` — create, confirm, cancel, refund, complete, history
  - `Loyalty` — member auth, points balance, history, redemptions
  - `Subscriptions` — plans, usage, benefit eligibility, suspend, cancel
  - `Pricing` — ticket types, calculate, apply coupons
  - `FoodAndBeverage` — menu, categories, combos, add to order
- 276 xUnit tests with spy HTTP client infrastructure
- Multi-target: net8.0, netstandard2.1
- SourceLink for NuGet debugging
- Central package management via Directory.Packages.props

[Unreleased]: https://github.com/brunohart/theatrical/compare/v0.1.0-csharp...HEAD
[0.1.0]: https://github.com/brunohart/theatrical/releases/tag/v0.1.0-csharp
