using Xunit;
using Theatrical.Sdk.Resources;
using Theatrical.Sdk.Types;
using Theatrical.Sdk.Errors;
using Theatrical.Sdk.Tests.TestInfrastructure;

namespace Theatrical.Sdk.Tests.Resources;

public sealed class FilmsResourceSpyTests
{
    private static readonly TheatricalClientOptions DefaultOptions = new() { ApiKey = "test-key" };

    private static FilmsResource CreateResource(SpyHttpClient spy)
        => new(spy, DefaultOptions);

    private static Film CreateFilm(
        string? id = null,
        string? title = null,
        bool isNowShowing = true,
        bool isComingSoon = false,
        int runtimeMinutes = 133)
    {
        return new Film
        {
            Id = id ?? "film_holdovers_2023",
            Title = title ?? "The Holdovers",
            Synopsis = "A curmudgeon instructor at a prep school is forced to stay through Christmas.",
            Genres = ["Drama", "Comedy"],
            Rating = "R",
            RuntimeMinutes = runtimeMinutes,
            PosterUrl = "https://example.com/holdovers.jpg",
            ReleaseDate = "2023-10-27",
            Director = "Alexander Payne",
            IsNowShowing = isNowShowing,
            IsComingSoon = isComingSoon,
        };
    }

    private static FilmDetail CreateFilmDetail(string? id = null, string? title = null)
    {
        return new FilmDetail
        {
            Id = id ?? "film_holdovers_2023",
            Title = title ?? "The Holdovers",
            Synopsis = "A curmudgeon instructor at a prep school is forced to stay through Christmas.",
            Genres = ["Drama", "Comedy"],
            Rating = "R",
            RuntimeMinutes = 133,
            PosterUrl = "https://example.com/holdovers.jpg",
            ReleaseDate = "2023-10-27",
            Director = "Alexander Payne",
            Cast = [new CastMember { Name = "Paul Giamatti", Role = "Paul Hunham" }],
            Crew = [new CrewMember { Name = "Alexander Payne", Department = "Directing", Job = "Director" }],
            Ratings = [new FilmRating { Source = "IMDB", Value = "7.9" }],
            Formats = ["2D"],
            Languages = ["English"],
        };
    }

    [Fact]
    public async Task NowShowingAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.NowShowingAsync();

        Assert.Single(spy.Calls);
        Assert.Equal("GET", spy.LastCall.Method);
        Assert.Equal("/ocapi/v1/films/now-showing", spy.LastCall.Path);
    }

    [Fact]
    public async Task NowShowingAsync_passes_siteId_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.NowShowingAsync("site_roxy");

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("site_roxy", spy.LastCall.QueryParams["siteId"]);
    }

    [Fact]
    public async Task NowShowingAsync_sends_no_params_without_siteId()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.NowShowingAsync();

        Assert.Null(spy.LastCall.QueryParams);
    }

    [Fact]
    public async Task NowShowingAsync_returns_multiple_films()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[]
        {
            CreateFilm(id: "film_001", title: "The Holdovers"),
            CreateFilm(id: "film_002", title: "Oppenheimer", runtimeMinutes: 180),
        });
        var resource = CreateResource(spy);

        var result = await resource.NowShowingAsync();

        Assert.Equal(2, result.Length);
        Assert.Equal("The Holdovers", result[0].Title);
        Assert.Equal(180, result[1].RuntimeMinutes);
    }

    [Fact]
    public async Task ComingSoonAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm(isComingSoon: true, isNowShowing: false) });
        var resource = CreateResource(spy);

        await resource.ComingSoonAsync();

        Assert.Equal("/ocapi/v1/films/coming-soon", spy.LastCall.Path);
    }

    [Fact]
    public async Task ComingSoonAsync_passes_siteId_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.ComingSoonAsync("site_embassy");

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("site_embassy", spy.LastCall.QueryParams["siteId"]);
    }

    [Fact]
    public async Task GetAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateFilm());
        var resource = CreateResource(spy);

        await resource.GetAsync("film_holdovers_2023");

        Assert.Equal("/ocapi/v1/films/film_holdovers_2023", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetAsync_returns_film_details()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateFilm(title: "Oppenheimer", runtimeMinutes: 180));
        var resource = CreateResource(spy);

        var result = await resource.GetAsync("film_oppenheimer");

        Assert.Equal("Oppenheimer", result.Title);
        Assert.Equal(180, result.RuntimeMinutes);
    }

    [Fact]
    public async Task GetDetailAsync_calls_detail_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateFilmDetail());
        var resource = CreateResource(spy);

        await resource.GetDetailAsync("film_holdovers_2023");

        Assert.Equal("/ocapi/v1/films/film_holdovers_2023/detail", spy.LastCall.Path);
    }

    [Fact]
    public async Task GetDetailAsync_returns_cast_and_crew()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateFilmDetail());
        var resource = CreateResource(spy);

        var result = await resource.GetDetailAsync("film_holdovers_2023");

        Assert.NotNull(result.Cast);
        Assert.Single(result.Cast);
        Assert.Equal("Paul Giamatti", result.Cast[0].Name);
        Assert.NotNull(result.Crew);
        Assert.Equal("Directing", result.Crew[0].Department);
    }

    [Fact]
    public async Task GetDetailAsync_returns_ratings()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(CreateFilmDetail());
        var resource = CreateResource(spy);

        var result = await resource.GetDetailAsync("film_holdovers_2023");

        Assert.NotNull(result.Ratings);
        Assert.Equal("IMDB", result.Ratings[0].Source);
        Assert.Equal("7.9", result.Ratings[0].Value);
    }

    [Fact]
    public async Task SearchAsync_calls_correct_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.SearchAsync(new FilmFilter { Query = "holdovers" });

        Assert.Equal("/ocapi/v1/films", spy.LastCall.Path);
    }

    [Fact]
    public async Task SearchAsync_passes_query_param()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.SearchAsync(new FilmFilter { Query = "holdovers" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("holdovers", spy.LastCall.QueryParams["query"]);
    }

    [Fact]
    public async Task SearchAsync_passes_genre_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.SearchAsync(new FilmFilter { Genre = "Drama" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("Drama", spy.LastCall.QueryParams["genre"]);
    }

    [Fact]
    public async Task SearchAsync_passes_nowShowing_flag()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.SearchAsync(new FilmFilter { NowShowing = true });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("true", spy.LastCall.QueryParams["nowShowing"]);
    }

    [Fact]
    public async Task SearchAsync_passes_comingSoon_flag()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.SearchAsync(new FilmFilter { ComingSoon = true });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("true", spy.LastCall.QueryParams["comingSoon"]);
    }

    [Fact]
    public async Task SearchAsync_passes_siteId_filter()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.SearchAsync(new FilmFilter { SiteId = "site_roxy" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("site_roxy", spy.LastCall.QueryParams["siteId"]);
    }

    [Fact]
    public async Task SearchAsync_returns_empty_for_no_matches()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(Array.Empty<Film>());
        var resource = CreateResource(spy);

        var result = await resource.SearchAsync(new FilmFilter { Query = "nonexistent" });

        Assert.Empty(result);
    }

    [Fact]
    public async Task AdvancedSearchAsync_calls_search_endpoint()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { Query = "drama" });

        Assert.Equal("/ocapi/v1/films/search", spy.LastCall.Path);
    }

    [Fact]
    public async Task AdvancedSearchAsync_passes_runtime_filters()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { MinRuntime = 90, MaxRuntime = 180 });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("90", spy.LastCall.QueryParams["minRuntime"]);
        Assert.Equal("180", spy.LastCall.QueryParams["maxRuntime"]);
    }

    [Fact]
    public async Task AdvancedSearchAsync_passes_pagination_params()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { Limit = 10, Offset = 20 });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("10", spy.LastCall.QueryParams["limit"]);
        Assert.Equal("20", spy.LastCall.QueryParams["offset"]);
    }

    [Fact]
    public async Task AdvancedSearchAsync_passes_sort_params()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { SortBy = "releaseDate", SortOrder = "desc" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("releaseDate", spy.LastCall.QueryParams["sortBy"]);
        Assert.Equal("desc", spy.LastCall.QueryParams["sortOrder"]);
    }

    [Fact]
    public async Task AdvancedSearchAsync_passes_format_and_language()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { Format = "IMAX", Language = "English" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("IMAX", spy.LastCall.QueryParams["format"]);
        Assert.Equal("English", spy.LastCall.QueryParams["language"]);
    }

    [Fact]
    public async Task AdvancedSearchAsync_passes_release_date_range()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { ReleaseDateFrom = "2024-01-01", ReleaseDateTo = "2024-12-31" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("2024-01-01", spy.LastCall.QueryParams["releaseDateFrom"]);
        Assert.Equal("2024-12-31", spy.LastCall.QueryParams["releaseDateTo"]);
    }

    [Fact]
    public async Task AdvancedSearchAsync_passes_rating_classification()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueResponse(new[] { CreateFilm() });
        var resource = CreateResource(spy);

        await resource.AdvancedSearchAsync(new FilmSearchFilter { RatingClassification = "PG-13" });

        Assert.NotNull(spy.LastCall.QueryParams);
        Assert.Equal("PG-13", spy.LastCall.QueryParams["ratingClassification"]);
    }

    [Fact]
    public async Task GetAsync_propagates_not_found_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new NotFoundException("Film", "film_nonexistent"));
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<NotFoundException>(() => resource.GetAsync("film_nonexistent"));
    }

    [Fact]
    public async Task NowShowingAsync_propagates_server_error()
    {
        var spy = new SpyHttpClient();
        spy.EnqueueError(new ServerException());
        var resource = CreateResource(spy);

        await Assert.ThrowsAsync<ServerException>(() => resource.NowShowingAsync());
    }
}
