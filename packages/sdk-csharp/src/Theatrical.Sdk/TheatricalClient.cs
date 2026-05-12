using Theatrical.Sdk.Resources;

namespace Theatrical.Sdk;

public sealed class TheatricalClient : IDisposable
{
    private readonly TheatricalClientOptions _options;
    private readonly HttpClient _httpClient;
    private bool _disposed;

    private SessionsResource? _sessions;
    private SitesResource? _sites;
    private FilmsResource? _films;
    private OrdersResource? _orders;
    private LoyaltyResource? _loyalty;
    private SubscriptionsResource? _subscriptions;
    private PricingResource? _pricing;
    private FoodAndBeverageResource? _fnb;

    private static TheatricalClient? _globalInstance;

    private TheatricalClient(TheatricalClientOptions options, HttpClient httpClient)
    {
        _options = options;
        _httpClient = httpClient;
    }

    public static TheatricalClient Create(TheatricalClientOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        options.Validate();

        var httpClient = new HttpClient
        {
            BaseAddress = new Uri(options.ResolvedBaseUrl),
            Timeout = options.Timeout,
        };
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {options.ApiKey}");

        return new TheatricalClient(options, httpClient);
    }

    public static TheatricalClient CreateMock()
    {
        var options = new TheatricalClientOptions
        {
            ApiKey = "mock-api-key",
            Environment = TheatricalEnvironment.Mock,
            Debug = false,
        };

        return new TheatricalClient(options, new HttpClient());
    }

    public static TheatricalClient Global()
    {
        return _globalInstance
            ?? throw new InvalidOperationException(
                "No global TheatricalClient configured. Call TheatricalClient.SetGlobal(options) first.");
    }

    public static void SetGlobal(TheatricalClientOptions options)
    {
        _globalInstance = Create(options);
    }

    public static void ResetGlobal()
    {
        _globalInstance?.Dispose();
        _globalInstance = null;
    }

    public SessionsResource Sessions => _sessions ??= new SessionsResource(_httpClient, _options);
    public SitesResource Sites => _sites ??= new SitesResource(_httpClient, _options);
    public FilmsResource Films => _films ??= new FilmsResource(_httpClient, _options);
    public OrdersResource Orders => _orders ??= new OrdersResource(_httpClient, _options);
    public LoyaltyResource Loyalty => _loyalty ??= new LoyaltyResource(_httpClient, _options);
    public SubscriptionsResource Subscriptions => _subscriptions ??= new SubscriptionsResource(_httpClient, _options);
    public PricingResource Pricing => _pricing ??= new PricingResource(_httpClient, _options);
    public FoodAndBeverageResource FoodAndBeverage => _fnb ??= new FoodAndBeverageResource(_httpClient, _options);

    public void Dispose()
    {
        if (!_disposed)
        {
            _httpClient.Dispose();
            _disposed = true;
        }
    }
}
