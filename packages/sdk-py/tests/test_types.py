"""Tests for domain type models."""

from theatrical.types.session import (
    Session,
    SessionFormat,
    SessionFilter,
    Seat,
    SeatStatus,
    SeatAvailability,
)
from theatrical.types.site import Site, GeoLocation, Address, Screen, Amenity, SiteConfig
from theatrical.types.film import (
    Film,
    FilmDetail,
    Genre,
    FilmFormat,
    FilmLanguage,
    Rating,
    CastMember,
    CrewMember,
    FilmRating,
)
from theatrical.types.order import Order, OrderStatus, Ticket, OrderItem, ORDER_TRANSITIONS
from theatrical.types.loyalty import (
    LoyaltyMember,
    LoyaltyTier,
    LoyaltyTierName,
    PointsTransaction,
    RedemptionOption,
)
from theatrical.types.subscription import (
    SubscriptionPlan,
    MemberSubscription,
    SubscriptionUsage,
    SubscriptionBenefit,
    SubscriptionInterval,
    SubscriptionStatus,
    BenefitCategory,
)
from theatrical.types.pricing import (
    TicketType,
    TicketCategory,
    TaxConfig,
    Discount,
    DiscountSource,
    Surcharge,
    SurchargeReason,
    PriceBreakdown,
    PriceCalculation,
    SessionPricingFormat,
    DayPart,
)
from theatrical.types.menu import (
    MenuItem,
    MenuCategory,
    ComboOffer,
    DietaryFlag,
    MenuSectionType,
    ItemCustomisation,
    CustomisationOption,
    FnbOrderLineItem,
)
from theatrical.types.pagination import PaginatedResponse, PaginationStrategy


class TestSessionTypes:
    def test_session_creation(self) -> None:
        session = Session(
            id="ses-001",
            film_id="film-001",
            film_title="The Dark Knight",
            site_id="roxy-wellington",
            screen_id="screen-3",
            screen_name="Screen 3",
            start_time="2026-05-12T19:30:00+12:00",
            end_time="2026-05-12T22:00:00+12:00",
            format=SessionFormat.IMAX,
            is_bookable=True,
            is_sold_out=False,
            seats_available=120,
            seats_total=200,
            price_from=18.50,
            currency="NZD",
            attributes={"subtitled": "false"},
        )
        assert session.id == "ses-001"
        assert session.format == SessionFormat.IMAX
        assert session.seats_available == 120
        assert session.attributes["subtitled"] == "false"

    def test_session_format_values(self) -> None:
        assert SessionFormat.TWO_D.value == "2D"
        assert SessionFormat.IMAX3D.value == "IMAX3D"
        assert SessionFormat.DOLBY_CINEMA.value == "DOLBY_CINEMA"

    def test_seat_creation(self) -> None:
        seat = Seat(
            id="seat-H12",
            row="H",
            number=12,
            status=SeatStatus.AVAILABLE,
            x=120.0,
            y=80.0,
            is_accessible=False,
        )
        assert seat.row == "H"
        assert seat.status == SeatStatus.AVAILABLE

    def test_seat_availability(self) -> None:
        avail = SeatAvailability(
            session_id="ses-001",
            screen_name="Screen 3",
            seats=[],
            row_count=15,
            screen_position="top",
            available_count=120,
            total_count=200,
        )
        assert avail.available_count == 120

    def test_session_filter_defaults(self) -> None:
        f = SessionFilter()
        assert f.site_id is None
        assert f.limit is None


class TestSiteTypes:
    def test_site_creation(self) -> None:
        site = Site(
            id="roxy-wellington",
            name="The Roxy Cinema",
            address=Address(
                line1="5 Park Road",
                city="Wellington",
                postal_code="6012",
                country="NZ",
            ),
            location=GeoLocation(latitude=-41.3133, longitude=174.7851),
            screens=[
                Screen(
                    id="screen-1",
                    name="Main",
                    seat_count=350,
                    formats=["2D", "3D"],
                    is_accessible=True,
                )
            ],
            config=SiteConfig(
                booking_lead_time=30,
                max_tickets_per_order=10,
                loyalty_enabled=True,
                fnb_enabled=True,
            ),
            timezone="Pacific/Auckland",
            currency="NZD",
            is_active=True,
            amenities=[Amenity(id="bar", label="Licensed Bar")],
        )
        assert site.name == "The Roxy Cinema"
        assert site.screens[0].seat_count == 350
        assert site.config.loyalty_enabled is True
        assert site.amenities is not None and len(site.amenities) == 1


class TestFilmTypes:
    def test_film_creation(self) -> None:
        film = Film(
            id="film-001",
            title="Hunt for the Wilderpeople",
            synopsis="A national manhunt...",
            genres=[Genre.COMEDY, Genre.ADVENTURE],
            runtime=101,
            rating=Rating(classification="PG"),
            release_date="2016-03-31",
            cast=[CastMember(name="Sam Neill", role="Hec")],
            director="Taika Waititi",
            distributor="Madman Entertainment",
            is_now_showing=True,
            is_coming_soon=False,
        )
        assert film.title == "Hunt for the Wilderpeople"
        assert Genre.COMEDY in film.genres

    def test_film_detail_extends_film(self) -> None:
        detail = FilmDetail(
            id="film-001",
            title="Test",
            synopsis="Test",
            genres=[Genre.DRAMA],
            runtime=120,
            rating=Rating(classification="M"),
            release_date="2026-01-01",
            cast=[],
            director="Test Director",
            is_now_showing=True,
            is_coming_soon=False,
            crew=[CrewMember(name="DP", department="Camera", job="Cinematographer")],
            ratings=[FilmRating(source="IMDB", score="8.5", out_of="10")],
            formats=[FilmFormat.IMAX, FilmFormat.DOLBY_ATMOS],
            languages=[FilmLanguage.EN, FilmLanguage.MI],
        )
        assert len(detail.crew) == 1
        assert detail.formats[0] == FilmFormat.IMAX

    def test_genre_values(self) -> None:
        assert Genre.SCI_FI.value == "sci-fi"
        assert Genre.ACTION.value == "action"

    def test_film_format_values(self) -> None:
        assert FilmFormat.IMAX_3D.value == "IMAX 3D"
        assert FilmFormat.FOUR_DX.value == "4DX"


class TestOrderTypes:
    def test_order_creation(self) -> None:
        order = Order(
            id="ord-001",
            session_id="ses-001",
            status=OrderStatus.DRAFT,
            tickets=[
                Ticket(
                    id="tkt-001",
                    type="adult",
                    seat_id="seat-H12",
                    seat_label="H12",
                    price=18.50,
                )
            ],
            items=[],
            subtotal=18.50,
            tax=2.78,
            discount=0,
            total=18.50,
            currency="NZD",
            created_at="2026-05-12T10:00:00Z",
        )
        assert order.status == OrderStatus.DRAFT
        assert len(order.tickets) == 1

    def test_order_transitions_defined(self) -> None:
        assert len(ORDER_TRANSITIONS) == 9
        draft_to_held = ORDER_TRANSITIONS[0]
        assert draft_to_held.from_status == OrderStatus.DRAFT
        assert draft_to_held.to_status == OrderStatus.HELD
        assert draft_to_held.action == "hold"

    def test_order_status_values(self) -> None:
        assert OrderStatus.HELD.value == "held"
        assert OrderStatus.REFUNDED.value == "refunded"


class TestLoyaltyTypes:
    def test_loyalty_member_creation(self) -> None:
        member = LoyaltyMember(
            id="mem-001",
            email="fan@example.com",
            first_name="Hec",
            last_name="Faulkner",
            tier=LoyaltyTier(
                id="tier-gold",
                name=LoyaltyTierName.GOLD,
                level=3,
                benefits=["10% discount", "Free popcorn"],
                points_threshold=5000,
            ),
            points=3200,
            lifetime_points=12000,
            member_since="2023-01-15",
            active=True,
        )
        assert member.tier.name == LoyaltyTierName.GOLD
        assert member.points == 3200

    def test_points_transaction(self) -> None:
        txn = PointsTransaction(
            id="txn-001",
            member_id="mem-001",
            type="earn",
            points=150,
            balance_after=3350,
            description="Purchase at The Roxy",
            created_at="2026-05-12T10:00:00Z",
            order_id="ord-001",
        )
        assert txn.type == "earn"
        assert txn.balance_after == 3350

    def test_redemption_option(self) -> None:
        opt = RedemptionOption(
            id="opt-001",
            name="Free Adult Ticket",
            description="Redeem for any standard session",
            points_cost=2000,
            category="ticket",
            available=True,
        )
        assert opt.points_cost == 2000
        assert opt.category == "ticket"


class TestSubscriptionTypes:
    def test_subscription_plan(self) -> None:
        plan = SubscriptionPlan(
            id="plan-unlimited",
            name="Cinema Unlimited",
            description="See unlimited films",
            price=29.99,
            currency="NZD",
            interval=SubscriptionInterval.MONTHLY,
            bookings_included=None,
            benefits=[
                SubscriptionBenefit(
                    id="ben-001",
                    category=BenefitCategory.BOOKING,
                    name="Unlimited bookings",
                    description="Book any standard session",
                    active=True,
                )
            ],
            available=True,
            minimum_term_months=3,
        )
        assert plan.interval == SubscriptionInterval.MONTHLY
        assert plan.minimum_term_months == 3

    def test_member_subscription(self) -> None:
        sub = MemberSubscription(
            id="sub-001",
            plan_id="plan-unlimited",
            member_id="mem-001",
            status=SubscriptionStatus.ACTIVE,
            start_date="2026-01-01",
            renewal_date="2026-06-01",
            auto_renew=True,
        )
        assert sub.status == SubscriptionStatus.ACTIVE
        assert sub.auto_renew is True

    def test_subscription_usage(self) -> None:
        usage = SubscriptionUsage(
            subscription_id="sub-001",
            member_id="mem-001",
            period_start="2026-05-01",
            period_end="2026-05-31",
            bookings_used=4,
            bookings_included=None,
            bookings_remaining=None,
            benefit_usage={"ben-001": 4},
        )
        assert usage.bookings_used == 4
        assert usage.bookings_included is None


class TestPricingTypes:
    def test_ticket_type(self) -> None:
        tt = TicketType(
            id="tt-adult",
            name="Adult",
            price=18.50,
            currency="NZD",
            category=TicketCategory.ADULT,
            is_default=True,
            requires_loyalty=False,
            is_available=True,
        )
        assert tt.category == TicketCategory.ADULT
        assert tt.is_default is True

    def test_price_breakdown(self) -> None:
        breakdown = PriceBreakdown(
            base_price=1850,
            discounts=[],
            surcharges=[
                Surcharge(
                    id="sur-001",
                    reason=SurchargeReason.FORMAT,
                    label="IMAX Surcharge",
                    amount=500,
                )
            ],
            tax_amount=0,
            total_discount=0,
            total_surcharge=500,
            price_per_ticket=2350,
            total_price=2350,
            quantity=1,
            currency="NZD",
            tax_config=TaxConfig(
                currency="NZD",
                rate=0.15,
                label="GST",
                inclusive=True,
            ),
        )
        assert breakdown.total_surcharge == 500
        assert breakdown.tax_config.inclusive is True

    def test_session_pricing_format_values(self) -> None:
        assert SessionPricingFormat.GOLD_CLASS.value == "gold-class"
        assert DayPart.MATINEE.value == "matinee"


class TestMenuTypes:
    def test_menu_item(self) -> None:
        item = MenuItem(
            id="item-001",
            name="Large Popcorn",
            price=850,
            currency="NZD",
            category_id="cat-snacks",
            dietary=[DietaryFlag.GLUTEN_FREE],
            is_available=True,
            is_pre_order_eligible=True,
        )
        assert DietaryFlag.GLUTEN_FREE in item.dietary
        assert item.is_pre_order_eligible is True

    def test_menu_item_with_customisations(self) -> None:
        item = MenuItem(
            id="item-002",
            name="Combo Deal",
            price=1850,
            currency="NZD",
            category_id="cat-combos",
            dietary=[],
            is_available=True,
            is_pre_order_eligible=False,
            customisations=[
                ItemCustomisation(
                    id="cust-size",
                    name="Size",
                    required=True,
                    options=[
                        CustomisationOption(id="opt-l", name="Large", price_delta=0),
                        CustomisationOption(id="opt-xl", name="Extra Large", price_delta=200),
                    ],
                )
            ],
        )
        assert item.customisations is not None
        assert len(item.customisations[0].options) == 2

    def test_combo_offer(self) -> None:
        combo = ComboOffer(
            id="combo-001",
            name="Date Night Combo",
            price=3200,
            currency="NZD",
            item_ids=["item-001", "item-003"],
            savings=400,
            is_available=True,
            is_pre_order_eligible=True,
        )
        assert combo.savings == 400

    def test_menu_section_type_values(self) -> None:
        assert MenuSectionType.HOT_FOOD.value == "hot-food"
        assert MenuSectionType.ICE_CREAM.value == "ice-cream"

    def test_dietary_flag_values(self) -> None:
        assert DietaryFlag.VEGAN.value == "vegan"
        assert DietaryFlag.NUT_FREE.value == "nut-free"


class TestPaginationTypes:
    def test_paginated_response(self) -> None:
        resp = PaginatedResponse[str](
            data=["a", "b", "c"],
            total=10,
            has_more=True,
            next_offset=3,
            strategy=PaginationStrategy.OFFSET,
        )
        assert len(resp.data) == 3
        assert resp.has_more is True
        assert resp.strategy == PaginationStrategy.OFFSET
