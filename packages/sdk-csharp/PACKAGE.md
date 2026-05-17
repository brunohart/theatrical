# Theatrical.Sdk

Type-safe C# client for cinema platform APIs. Sessions, ticketing, loyalty, F&B, analytics.

## Quick Start

```csharp
using Theatrical.Sdk;

// Production
using var client = TheatricalClient.Create(new TheatricalClientOptions
{
    ApiKey = "your-api-key",
    Environment = TheatricalEnvironment.Production,
});

var sessions = await client.Sessions.ListAsync("roxy-wellington");
```

## Mock Mode

```csharp
using var client = TheatricalClient.CreateMock();
var films = await client.Films.NowShowingAsync();
// Returns NZ cinema fixture data — no API key needed
```

## Resources

| Resource | Methods |
|----------|---------|
| Sessions | List, Get, Availability |
| Sites | List, Get, Screens, Nearby |
| Films | NowShowing, ComingSoon, Get, Search |
| Orders | Create, Confirm, Cancel, Refund, History |
| Loyalty | Authenticate, Points, Redemptions |
| Subscriptions | Plans, Usage, Benefits, Suspend, Cancel |
| Pricing | TicketTypes, Calculate, Coupons |
| FoodAndBeverage | Menu, Categories, Combos, AddToOrder |

## Error Handling

```csharp
try
{
    await client.Orders.ConfirmAsync(orderId);
}
catch (RateLimitError e)
{
    await Task.Delay(TimeSpan.FromSeconds(e.RetryAfter));
}
catch (NotFoundError e)
{
    Console.WriteLine($"Resource not found: {e.ResourceId}");
}
```

## Links

- [GitHub](https://github.com/brunohart/theatrical)
- [Documentation](https://theatrical.dev)
- [Changelog](https://github.com/brunohart/theatrical/blob/main/packages/sdk-csharp/CHANGELOG.md)
