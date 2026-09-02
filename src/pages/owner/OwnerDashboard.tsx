import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.tsx";
import Navbar from "../../components/Navbar.tsx";
import Footer from "../../components/Footer.tsx";
import Loader from "../../components/Loader.tsx";
import { CalendarIcon, SettingsIcon } from "lucide-react";

import RestaurantWizard from "../../components/owner/RestaurantWizard.tsx";
import PendingApproval from "../../components/owner/PendingApproval.tsx";
import RequestRejected from "../../components/owner/RequestRejected.tsx";
import OwnerBookings from "../../components/owner/OwnerBookings.tsx";
import OwnerProfileDetails from "../../components/owner/OwnerProfileDetails.tsx";

import api from "../../lib/api.ts";

export default function OwnerDashboard() {
    const { logout } = useAppContext();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<
        "bookings" | "details"
    >("bookings");

    // =========================
    // FETCH OWNER DATA
    // =========================
    const fetchOwnerData = async () => {
        try {
            setLoading(true);

            const res = await api.get("/owner/restaurant");

            console.log("OWNER RESTAURANT API:", res.data);

            /*
             * Handles both possible API responses:
             *
             * { restaurant: {...} }
             *
             * OR
             *
             * {...restaurant data...}
             */
            const restaurantData =
                res.data?.restaurant || res.data?.data || res.data;

            console.log("RESTAURANT DATA:", restaurantData);

            // If no restaurant exists
            if (
                !restaurantData ||
                restaurantData === null ||
                restaurantData === undefined
            ) {
                setRestaurant(null);
                setBookings([]);
                return;
            }

            setRestaurant(restaurantData);

            // =========================
            // FETCH BOOKINGS ONLY IF APPROVED
            // =========================
            if (restaurantData.status === "approved") {
                try {
                    const bookingsRes = await api.get("/owner/bookings");

                    console.log(
                        "OWNER BOOKINGS API:",
                        bookingsRes.data
                    );

                    /*
                     * Handles:
                     *
                     * [booking1, booking2]
                     *
                     * OR
                     *
                     * { bookings: [...] }
                     */
                    const bookingData =
                        Array.isArray(bookingsRes.data)
                            ? bookingsRes.data
                            : bookingsRes.data?.bookings ||
                              bookingsRes.data?.data ||
                              [];

                    setBookings(bookingData);
                } catch (bookingError: any) {
                    console.error(
                        "Error fetching bookings:",
                        bookingError?.response?.data ||
                            bookingError
                    );

                    setBookings([]);
                }
            } else {
                setBookings([]);
            }
        } catch (error: any) {
            console.error(
                "Error fetching owner restaurant:",
                error?.response?.data || error
            );

            setRestaurant(null);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        fetchOwnerData();
    }, []);

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <Loader text="Loading Owner Dashboard..." />
        );
    }

    // =========================
    // RESTAURANT STATUS
    // =========================
    const restaurantStatus = restaurant?.status;

    // =========================
    // RESTAURANT NAME
    // =========================
    const restaurantName =
        restaurant?.name ||
        restaurant?.restaurantName ||
        "Restaurant";

    // =========================
    // RESTAURANT INITIAL
    // =========================
    const restaurantInitial =
        restaurantName.charAt(0).toUpperCase();

    // =========================
    // TOTAL SEATS
    // =========================
    const totalSeats =
        restaurant?.totalSeats ??
        restaurant?.capacity ??
        restaurant?.seats ??
        0;

    return (
        <div className="min-h-screen bg-surface flex flex-col pt-20">
            <Navbar />

            <main className="grow max-w-7xl w-full mx-auto px-6 md:px-10 py-12">

                {/* =========================
                    HEADER
                ========================= */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-8 mb-8">

                    <div>
                        <h1 className="font-display text-2xl md:text-3xl text-primary">
                            Restaurant Portal
                        </h1>

                        <p className="text-xs text-black/55 mt-1.5">
                            Review capacity limits and process live
                            reservations.
                        </p>
                    </div>

                    <button
                        onClick={logout}
                        className="bg-error-container hover:bg-error-container/85 text-error px-4 py-2 text-[10px] font-medium tracking-widest uppercase transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                {/* =========================
                    NO RESTAURANT
                ========================= */}
                {!restaurant ? (
                    <RestaurantWizard
                        setRestaurant={setRestaurant}
                    />

                ) : restaurantStatus === "pending" ? (

                    /* =========================
                       PENDING APPROVAL
                    ========================= */
                    <PendingApproval
                        restaurant={restaurant}
                    />

                ) : restaurantStatus === "rejected" ? (

                    /* =========================
                       REJECTED
                    ========================= */
                    <RequestRejected
                        restaurantName={restaurantName}
                    />

                ) : (

                    /* =========================
                       APPROVED DASHBOARD
                    ========================= */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* =========================
                            SIDEBAR
                        ========================= */}
                        <aside className="lg:col-span-3 space-y-6 bg-white border border-outline-variant/20 p-6 rounded-md shadow-sm h-fit">

                            {/* Restaurant Info */}
                            <div className="flex items-center gap-3.5 border-b border-outline-variant/10 pb-5">

                                <span className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-base">
                                    {restaurantInitial}
                                </span>

                                <div className="min-w-0">

                                    <h4 className="font-display font-medium text-primary text-base line-clamp-1">
                                        {restaurantName}
                                    </h4>

                                    <span className="text-[9px] text-secondary tracking-widest uppercase bg-secondary-container/20 px-2 py-0.5 rounded-sm inline-block mt-0.5">
                                        {restaurantStatus?.toUpperCase() || "APPROVED"}
                                    </span>

                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex flex-col gap-1.5">

                                <button
                                    onClick={() =>
                                        setActiveTab("bookings")
                                    }
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase text-left rounded-sm cursor-pointer transition-colors ${
                                        activeTab === "bookings"
                                            ? "bg-primary text-white"
                                            : "text-black/55 hover:bg-surface"
                                    }`}
                                >
                                    <CalendarIcon size={14} />

                                    Bookings ({bookings.length})
                                </button>

                                <button
                                    onClick={() =>
                                        setActiveTab("details")
                                    }
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase text-left rounded-sm cursor-pointer transition-colors ${
                                        activeTab === "details"
                                            ? "bg-primary text-white"
                                            : "text-black/55 hover:bg-surface"
                                    }`}
                                >
                                    <SettingsIcon size={14} />

                                    Profile Details
                                </button>

                            </nav>
                        </aside>

                        {/* =========================
                            CONTENT
                        ========================= */}
                        <div className="lg:col-span-9 space-y-8">

                            {/* BOOKINGS */}
                            {activeTab === "bookings" && (
                                <OwnerBookings
                                    bookings={bookings}
                                    setBookings={setBookings}
                                    totalSeats={totalSeats}
                                />
                            )}

                            {/* PROFILE DETAILS */}
                            {activeTab === "details" && (
                                <OwnerProfileDetails
                                    restaurant={restaurant}
                                    setRestaurant={setRestaurant}
                                />
                            )}

                        </div>
                    </div>
                )}

            </main>

            <Footer />
        </div>
    );
}