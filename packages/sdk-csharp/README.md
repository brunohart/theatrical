# Theatrical SDK for C# / .NET

Type-safe C# client for cinema platform APIs. Part of the [Theatrical](https://github.com/brunohart/theatrical) polyglot SDK.

## Install

```bash
dotnet add package Theatrical.Sdk
```

## Status

**Alpha** — all 8 resource modules implemented with full TS API parity. 276 xUnit tests passing. Multi-targets net8.0 and netstandard2.1.

## Target Platforms

- .NET 8.0
- .NET Standard 2.1

## Quick Start

```csharp
using Theatrical.Sdk;

using var client = TheatricalClient.Create(new TheatricalClientOptions
{
    ApiKey = "your-api-key",
    Environment = TheatricalEnvironment.Sandbox,
});

var sessions = await client.Sessions.ListAsync("roxy-wellington");
```

## Mock Mode

```csharp
using var client = TheatricalClient.CreateMock();
// Returns pre-defined NZ cinema fixture data — no API key needed
```

## Singleton Pattern

```csharp
// At startup:
TheatricalClient.SetGlobal(new TheatricalClientOptions { ApiKey = "key" });

// Anywhere:
var client = TheatricalClient.Global();
```

## Features

- Type-safe client with API key authentication and automatic token refresh
- 8 resource modules: Sessions, Sites, Films, Orders, Loyalty, Subscriptions, Pricing, F&B
- Polly-based retry with exponential backoff and rate limit handling
- Mock mode with NZ cinema fixture data for offline development
- Typed error hierarchy: `AuthenticationError`, `NotFoundError`, `RateLimitError`, `ValidationError`
- SourceLink enabled for NuGet debugging
- Symbol packages (.snupkg) for source-level debugging

## Disclaimer

This project is an independent, open-source developer toolkit for cinema platform APIs. It is not affiliated with, endorsed by, or officially connected to Vista Group International Ltd or any of its subsidiaries. All product names, trademarks, and registered trademarks are property of their respective owners.
