using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class SitesResourceSpyTests
{
    private static readonly TheatricalClientOptions DefaultOptions = new() { ApiKey = "test-key" };

    private static SitesResource CreateResource(SpyHttpClient spy)
        => new(spy, DefaultOptions);

    private static Site CreateSite(
        string? id = null,
        string? name = null,
        string? city = null,
        double? latitude = null,
        double? longitude = null,
        bool isActive = true,
        int screenCount = 5)
    {
        return new Site
        {
            Id = id ?? "site_roxy_wellington",
            Name = name ?? "Roxy Cinema",
            Address = "5 Park Road, Miramar",
            City = city ?? "Wellington",
            Country = "NZ",
            Latitude = latitude ?? -41.3131,
            Longitude = longitude ?? 174.8090,
            Timezone = "Pacific/Auckland",
            IsActive = isActive,
            ScreenCount = screenCount,
            Features = ["IMAX", "Dolby Atmos"],
        };
    }

    private static Screen CreateScreen(string? id = null, string? name = null, int capacity = 120)
    {
        return new Screen
        {
            Id = id ?? "scr_roxy_1",
            Name = name ?? "Screen 1",
            Capacity = capacity,
            Formats = ["2D", "3D"],
            IsAccessible = true,
        };
    }

    [Fact]
    public async Task ListAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        await resource.ListAsync();

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/sites", spy.LastCall.Path);
    }

    [Fact]
    public async Task ListAsync_passes_no_params_when_no_filters()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        await resource.ListAsync();

        Assert.Null(spy.LastCall.QueryParams);
    }

    [Fact]
    public async Task ListAsync_passes_query_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        await resource.ListAsync(query: "Roxy");

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("Roxy", spy.LastCall.QueryParams["query"]);
    }

    [Fact]
    public async Task ListAsync_passes_geo_coordinates()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        await resource.ListAsync(latitude: -41.3, longitude: 174.8);

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Contains("latitude", spy.LastCall.QueryParams.Keys);
        Assert.Contains("longitude", spy.LastCall.QueryParams.Keys);
    }

    [Fact]
    public async Task ListAsync_passes_radius()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        await resource.ListAsync(latitude: -41.3, longitude: 174.8, radiusKm: 10.0);

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Contains("radius", spy.LastCall.QueryParams.Keys);
    }

    [Fact]
    public async Task ListAsync_returns_multiple_sites()
    {
        var spy = new SpyHttpClient();
        var sites = new[]
        {
            CreateSite(id: "site_roxy", name: "Roxy Cinema"),
            CreateSite(id: "site_embassy", name: "Embassy Theatre", city: "Wellington"),
        };
        spy.EnqueueResponse(sites);
        var resource = CreateResource(spy);

        var result = await resource.ListAsync();

        Assert.Equal(2, result.Length);
        Assert.Equal("Roxy Cinema", result[0].Name);
        Assert.Equal("Embassy Theatre", result[1].Name);
    }

    [Fact]
    public async Task ListAsync_returns_empty_when_no_sites()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(Array.Empty<Site>());
        var resource = CreateResource(spy);

        var result = await resource.ListAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task ListAsync_returns_site_features()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        var result = await resource.ListAsync();

        Assert.NotNull(result[0].Features);
        Assert.Contains("IMAX", result[0].Features);
        Assert.Contains("Dolby Atmos", result[0].Features);
    }

    [Fact]
    public async Task GetAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSite());
        var resource = CreateResource(spy);

        await resource.GetAsync("site_roxy_wellington");

        Assert.Equal("/ocapi/v1/sites/site_roxy_wellington", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetAsync_returns_site_details()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSite(id: "site_emb", name: "Embassy", city: "Wellington"));
        var resource = CreateResource(spy);

        var result = await resource.GetAsync("site_emb");

        Assert.Equal("site_emb", result.Id);
        Assert.Equal("Embassy", result.Name);
        Assert.Equal("Wellington", result.City);
    }

    [Fact]
    public async Task GetAsync_returns_inactive_site()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateSite(isActive: false));
        var resource = CreateResource(spy);

        var result = await resource.GetAsync("site_closed");

        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task GetScreensAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateScreen() });
        var resource = CreateResource(spy);

        await resource.GetScreensAsync("site_roxy_wellington");

        Assert.Equal("/ocapi/v1/sites/site_roxy_wellington/screens", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetScreensAsync_returns_multiple_screens()
    {
        var spy = new SpyHttpClient();
        var screens = new[]
        {
            CreateScreen(id: "scr_1", name: "Screen 1", capacity: 120),
            CreateScreen(id: "scr_2", name: "Screen 2", capacity: 80),
        };
        spy.EnqueueResponse(screens);
        var resource = CreateResource(spy);

        var result = await resource.GetScreensAsync("site_roxy");

        Assert.Equal(2, result.Length);
        Assert.Equal("Screen 1", result[0].Name);
        Assert.Equal(80, result[1].Capacity);
    }

    [Fact]
    public async Task GetScreensAsync_returns_accessibility_info()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateScreen() });
        var resource = CreateResource(spy);

        var result = await resource.GetScreensAsync("site_roxy");

        Assert.True(result[0].IsAccessible);
    }

    [Fact]
    public async Task GetScreensAsync_returns_formats()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateScreen() });
        var resource = CreateResource(spy);

        var result = await resource.GetScreensAsync("site_roxy");

        Assert.NotNull(result[0].Formats);
        Assert.Contains("2D", result[0].Formats);
        Assert.Contains("3D", result[0].Formats);
    }

    [Fact]
    public async Task NearbyAsync_calls_list_with_geo_params()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateSite() });
        var resource = CreateResource(spy);

        await resource.NearbyAsync(-41.3, 174.8, 15.0);

        Assert.Single(spy.Calls);
        Assert.Equal("/ocapi/v1/sites", spy.LastCall.Path);
        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Contains("latitude", spy.LastCall.QueryParams.Keys);
        Assert.Contains("longitude", spy.LastCall.QueryParams.Keys);
        Assert.Contains("radius", spy.LastCall.QueryParams.Keys);
    }

    [Fact]
    public async Task NearbyAsync_returns_sites_sorted_by_distance()
    {
        var spy = new SpyHttpClient();
        var sites = new[]
        {
            CreateSite(id: "site_near", name: "Near Cinema", latitude: -41.31, longitude: 174.81),
            CreateSite(id: "site_far", name: "Far Cinema", latitude: -41.50, longitude: 174.90),
        };
        spy.EnqueueResponse(sites);
        var resource = CreateResource(spy);

        var result = await resource.NearbyAsync(-41.3, 174.8, 25.0);

        Assert.Equal(2, result.Length);
    }

    [Fact]
    public async Task GetAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Site", "site_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() => resource.GetAsync("site_nonexistent"));
    }

    [Fact]
    public async Task ListAsync_propagates_authentication_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new AuthenticationException());
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<AuthenticationException>(() => resource.ListAsync());
    }
}
