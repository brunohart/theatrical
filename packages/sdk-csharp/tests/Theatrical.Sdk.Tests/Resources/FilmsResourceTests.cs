using Xunit;
using Theatrical.Sdk.Types;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class FilmsResourceTests : IDisposable
{
    private readonly TheatricalClient _client = TheatricalClient.CreateMock();

    [Fact]
    public async Task NowShowingAsync_returns_current_films()
    {
        var films = await _client.Films.NowShowingAsync();

        Assert.NotNull(films);
        Assert.Equal(2, films.Length);
        Assert.Equal("film_holdovers_2023", films[0].Id);
        Assert.Equal("The Holdovers", films[0].Title);
        Assert.True(films[0].IsNowShowing);
    }

    [Fact]
    public async Task ComingSoonAsync_returns_upcoming_films()
    {
        var films = await _client.Films.ComingSoonAsync();

        Assert.NotNull(films);
        Assert.Single(films);
        Assert.Equal("Dune: Part Two", films[0].Title);
        Assert.True(films[0].IsComingSoon);
    }

    [Fact]
    public async Task GetAsync_returns_film_by_id()
    {
        var film = await _client.Films.GetAsync("film_holdovers_2023");

        Assert.NotNull(film);
        Assert.Equal("film_holdovers_2023", film.Id);
        Assert.Equal("The Holdovers", film.Title);
        Assert.Contains("drama", film.Genres!);
    }

    [Fact]
    public async Task GetDetailAsync_returns_full_film_detail()
    {
        var detail = await _client.Films.GetDetailAsync("film_holdovers_2023");

        Assert.NotNull(detail);
        Assert.Equal("The Holdovers", detail.Title);
        Assert.NotNull(detail.Cast);
        Assert.NotEmpty(detail.Cast);
        Assert.Equal("Paul Giamatti", detail.Cast[0].Name);
        Assert.NotNull(detail.Crew);
        Assert.NotEmpty(detail.Crew);
        Assert.NotNull(detail.Ratings);
        Assert.Equal("IMDB", detail.Ratings[0].Source);
    }

    [Fact]
    public async Task SearchAsync_filters_films()
    {
        var films = await _client.Films.SearchAsync(new FilmFilter { Genre = "drama" });

        Assert.NotNull(films);
        Assert.NotEmpty(films);
    }

    [Fact]
    public async Task AdvancedSearchAsync_filters_films()
    {
        var films = await _client.Films.AdvancedSearchAsync(new FilmSearchFilter { Genre = "drama", Limit = 10 });

        Assert.NotNull(films);
        Assert.NotEmpty(films);
    }

    public void Dispose() => _client.Dispose();
}
