import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";

import Navbar from "../components/Navbar.tsx";
import Footer from "../components/Footer.tsx";
import AuthModal from "../components/AuthModal.tsx";
import toast from "react-hot-toast";
import Loader from "../components/Loader.tsx";

import RestaurantHero from "../components/restaurant/RestaurantHero.tsx";
import RestaurantInfo from "../components/restaurant/RestaurantInfo.tsx";
import RestaurantReviews from "../components/restaurant/RestaurantReviews.tsx";
import BookingWidget from "../components/restaurant/BookingWidget.tsx";

import api from "../lib/api.ts";

export default function RestaurantDetail() {
    const { slug } = useParams<{ slug: string }>();

    const {
        isAuthenticated,
        setAuthModalOpen,
    } = useAppContext();

    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Booking Widget states
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedGuests, setSelectedGuests] = useState("2");
    const [selectedSlot, setSelectedSlot] = useState("");

    const [slotsAvailability, setSlotsAvailability] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);


    // Fetch restaurant details
    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                setLoading(true);

                const res = await api.get(`/restaurants/${slug}`);

                setRestaurant(res.data);

                const today = new Date()
                    .toISOString()
                    .split("T")[0];

                setSelectedDate(today);

            } catch (error: any) {
                console.error("Error fetching restaurant:", error);

                toast.error(
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load restaurant"
                );

                navigate("/");

            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchRestaurant();
        }
    }, [slug, navigate]);


    // Fetch restaurant availability
    useEffect(() => {
    const fetchAvailability = async () => {
        if (!restaurant?._id || !selectedDate || !selectedGuests) {
            return;
        }

        try {
            setLoadingSlots(true);

            const res = await api.get(
                `/restaurants/${restaurant._id}/availability`,
                {
                    params: {
                        date: selectedDate,
                        guests: selectedGuests,
                    },
                }
            );

            console.log("Availability response:", res.data);

            setSlotsAvailability(
                res.data?.availability || []
            );

        } catch (error: any) {
            console.error(
                "Availability fetch error:",
                error
            );

            setSlotsAvailability([]);

            toast.error(
                error?.response?.data?.message ||
                "Failed to load available time slots"
            );
        } finally {
            setLoadingSlots(false);
        }
    };

    fetchAvailability();
}, [restaurant?._id, selectedDate, selectedGuests]);

    // Loading state
    if (loading) {
        return (
            <Loader text="Loading Restaurant Details..." />
        );
    }


    // Restaurant not found
    if (!restaurant) {
        return null;
    }


    // Reserve button
    const handleReserveClick = () => {

        if (!selectedDate) {
            toast.error("Please select a date.");
            return;
        }

        if (!selectedSlot) {
            toast.error(
                "Please select a dining time slot."
            );
            return;
        }

        if (!isAuthenticated) {
            setAuthModalOpen(true);
            return;
        }

        navigate(
            `/booking/${restaurant.slug}?slot=${encodeURIComponent(
                selectedSlot
            )}&date=${encodeURIComponent(
                selectedDate
            )}&guests=${encodeURIComponent(
                selectedGuests
            )}`
        );
    };


    return (
        <div className="min-h-screen bg-surface flex flex-col pt-20">

            <Navbar />

            <AuthModal />

            {/* Hero Image Section */}
            <RestaurantHero
                restaurant={restaurant}
            />


            {/* Main Content */}
            <main className="grow max-w-7xl w-full mx-auto px-6 md:px-10 py-12">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-12">

                        <RestaurantInfo
                            restaurant={restaurant}
                        />

                        <RestaurantReviews />

                    </div>


                    {/* Right Column */}
                    <div className="lg:col-span-4 lg:sticky lg:top-36">

                        <BookingWidget
                            restaurant={restaurant}

                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}

                            selectedGuests={selectedGuests}
                            setSelectedGuests={setSelectedGuests}

                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}

                            slotsAvailability={slotsAvailability}
                            loadingSlots={loadingSlots}

                            isAuthenticated={isAuthenticated}

                            handleReserveClick={
                                handleReserveClick
                            }
                        />

                    </div>

                </div>

            </main>


            <Footer />

        </div>
    );
}