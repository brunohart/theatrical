# Theatrical SDK for C# / .NET

Type-safe C# client for cinema platform APIs. Part of the [Theatrical](https://github.com/brunohart/theatrical) polyglot SDK.

## Status

**Alpha** — scaffold complete. Core client, error hierarchy, 8 resource module stubs, and xUnit test project are in place. Resource implementations (PORT-CSHARP-002 through PORT-CSHARP-005) are next.

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

## Disclaimer

This project is an independent, open-source developer toolkit for cinema platform APIs. It is not affiliated with, endorsed by, or officially connected to Vista Group International Ltd or any of its subsidiaries. All product names, trademarks, and registered trademarks are property of their respective owners.
