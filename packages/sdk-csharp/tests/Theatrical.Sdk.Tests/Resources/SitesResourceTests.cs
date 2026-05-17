using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class SitesResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task ListAsync_returns_all_sites()
    {
        var sites = await _client.Sites.ListAsync();

        Assert.NotNull(sites);
        Assert.Equal(2, sites.Length);
        Assert.Equal("site_roxy_wellington", sites[0].Id);
        Assert.Equal("Roxy Cinema", sites[0].Name);
        Assert.Equal("Wellington", sites[0].City);
        Assert.Equal("NZ", sites[0].Country);
    }

    [Fact]
    public async Task GetAsync_returns_site_by_id()
    {
        var site = await _client.Sites.GetAsync("site_roxy_wellington");

        Assert.NotNull(site);
        Assert.Equal("site_roxy_wellington", site.Id);
        Assert.Equal("Roxy Cinema", site.Name);
        Assert.True(site.IsActive);
    }

    [Fact]
    public async Task GetScreensAsync_returns_screens()
    {
        var screens = await _client.Sites.GetScreensAsync("site_roxy_wellington");

        Assert.NotNull(screens);
        Assert.Equal(3, screens.Length);
        Assert.Equal("screen_roxy_1", screens[0].Id);
        Assert.Equal("Screen 1", screens[0].Name);
        Assert.Equal(200, screens[0].Capacity);
        Assert.Contains("2D", screens[0].Formats!);
        Assert.Contains("3D", screens[0].Formats!);
    }

    [Fact]
    public async Task NearbyAsync_delegates_to_list_with_geo_params()
    {
        var sites = await _client.Sites.NearbyAsync(-41.3007, 174.7766, 10);

        Assert.NotNull(sites);
        Assert.NotEmpty(sites);
    }

    public void Dispose() => _client.Dispose();
}
