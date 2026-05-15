using System.Text.Json;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Mock;
using Xunit;

namespace Theatrical.Sdk.Tests.Mock;

public class MockHttpAdapterTests
{
    private readonly MockHttpAdapter _adapter = new();

    [Fact]
    public async Task GetAsync_FilmsNowShowing_ReturnsFixtureArray()
    {
        var films = await _adapter.GetAsync<JsonElement>("/ocapi/v1/films/now-showing");

        Assert.Equal(JsonValueKind.Array, films.ValueKind);
        Assert.Equal(2, films.GetArrayLength());
        Assert.Equal("The Holdovers", films[0].GetProperty("title").GetString());
    }

    [Fact]
    public async Task GetAsync_FilmsComingSoon_ReturnsDunePartTwo()
    {
        var films = await _adapter.GetAsync<JsonElement>("/ocapi/v1/films/coming-soon");

        Assert.Equal(1, films.GetArrayLength());
        Assert.Equal("Dune: Part Two", films[0].GetProperty("title").GetString());
    }

    [Fact]
    public async Task GetAsync_SingleFilmById_MatchesIdPattern()
    {
        var film = await _adapter.GetAsync<JsonElement>("/ocapi/v1/films/film_holdovers_2023");

        Assert.Equal("film_holdovers_2023", film.GetProperty("id").GetString());
    }

    [Fact]
    public async Task GetAsync_Sites_ReturnsNZCinemas()
    {
        var sites = await _adapter.GetAsync<JsonElement>("/ocapi/v1/sites");

        Assert.Equal(JsonValueKind.Array, sites.ValueKind);
        Assert.Equal(2, sites.GetArrayLength());
        Assert.Equal("Roxy Cinema", sites[0].GetProperty("name").GetString());
        Assert.Equal("Embassy Theatre", sites[1].GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetAsync_SingleSiteById_MatchesPattern()
    {
        var site = await _adapter.GetAsync<JsonElement>("/ocapi/v1/sites/site_roxy_wellington");

        Assert.Equal("Roxy Cinema", site.GetProperty("name").GetString());
        Assert.Equal("Wellington", site.GetProperty("city").GetString());
    }

    [Fact]
    public async Task GetAsync_LoyaltyMember_ReturnsGoldTier()
    {
        var member = await _adapter.GetAsync<JsonElement>("/ocapi/v1/loyalty/members/mem_hobbiton_jane");

        Assert.Equal("Gold", member.GetProperty("tier").GetString());
        Assert.Equal(4200, member.GetProperty("pointsBalance").GetInt32());
    }

    [Fact]
    public async Task GetAsync_UnknownPath_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _adapter.GetAsync<JsonElement>("/ocapi/v1/nonexistent"));
    }

    [Fact]
    public async Task PostAsync_Orders_ReturnsDraftOrder()
    {
        var order = await _adapter.PostAsync<JsonElement>("/ocapi/v1/orders");

        Assert.Equal("draft", order.GetProperty("status").GetString());
        Assert.StartsWith("ord_mock_", order.GetProperty("id").GetString());
    }

    [Fact]
    public async Task PostAsync_UnknownPath_ReturnsEmptyObject()
    {
        var result = await _adapter.PostAsync<JsonElement>("/ocapi/v1/something");
        Assert.Equal(JsonValueKind.Object, result.ValueKind);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsEmptyObject()
    {
        var result = await _adapter.DeleteAsync<JsonElement>("/ocapi/v1/orders/ord-123");
        Assert.Equal(JsonValueKind.Object, result.ValueKind);
    }

    [Fact]
    public async Task Constructor_WithOverrides_OverridesDefaults()
    {
        var overrides = new Dictionary<string, JsonElement>
        {
            ["/ocapi/v1/films/now-showing"] = JsonSerializer.SerializeToElement(new[] { new { id = "custom", title = "Custom Film" } }),
        };
        var adapter = new MockHttpAdapter(overrides);

        var films = await adapter.GetAsync<JsonElement>("/ocapi/v1/films/now-showing");

        Assert.Equal(1, films.GetArrayLength());
        Assert.Equal("Custom Film", films[0].GetProperty("title").GetString());
    }

    [Fact]
    public async Task GetAsync_Sessions_ReturnsSessions()
    {
        var result = await _adapter.GetAsync<JsonElement>("/ocapi/v1/sessions");

        var sessions = result.GetProperty("sessions");
        Assert.Equal(JsonValueKind.Array, sessions.ValueKind);
        Assert.Equal("The Holdovers", sessions[0].GetProperty("filmTitle").GetString());
        Assert.Equal("site_roxy_wellington", sessions[0].GetProperty("siteId").GetString());
    }
}
