const router = require("express").Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const Hotel = require("../models/hotel");
const { authenticateToken } = require("./userAuth");

router.post("/add-hotel", authenticateToken, async (req, res) => {
    try {
        const { id } = req.headers;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ message: "You do not have admin access" });
        }

        const hotels = req.body;

        if (!Array.isArray(hotels)) {
            return res.status(400).json({ message: "Request body must be an array of hotels" });
        }

        // Save Hotels
        const savedHotels = [];
        for (let hotel of hotels) {
            try {
                const newHotel = new Hotel({
                    name: hotel.name,
                    location: hotel.location,
                    description: hotel.description,
                    pricePerNight: hotel.pricePerNight,
                    facilities: hotel.facilities,
                    images: hotel.images,
                    roomsAvailable: hotel.roomsAvailable,
                    category: hotel.category,
                    owner: hotel.owner,
                    rating: hotel.rating
                });
                const savedHotel = await newHotel.save();
                savedHotels.push(savedHotel);
            } catch (err) {
                console.error("Error saving hotel:", err.message); 
            }
        }

        if (savedHotels.length === 0) {
            return res.status(400).json({ message: "No hotels were added due to errors" });
        }

        res.status(200).json({ message: "Hotels added successfully", hotels: savedHotels });

    } catch (error) {
        console.error("Error adding hotels:", error.message);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Update Hotel (Admin Only)
router.put("/update-hotel",  async (req, res) => {
    try {
        const { hotelid } = req.headers;
        await Hotel.findByIdAndUpdate(hotelid, {
            name: req.body.name,
            location: req.body.location,
            description: req.body.description,
            pricePerNight: req.body.pricePerNight,
            facilities: req.body.facilities,
            images: req.body.images,
            roomsAvailable: req.body.roomsAvailable,
            category: req.body.category,
        });
        return res.status(200).json({
            message: "Hotel updated successfully!",
        });
    } catch (error) {
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Delete Hotel (Admin Only)
router.delete("/delete-hotel",  async (req, res) => {
    try {
        const { hotelid } = req.headers;
        await Hotel.findByIdAndDelete(hotelid);
        return res.status(200).json({ message: "Hotel deleted successfully!" });
    } catch (error) {
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Bulk Delete Hotels (Admin Only)
router.delete("/delete-all-hotels", authenticateToken, async (req, res) => {
    try {
        await Hotel.deleteMany({});
        return res.status(200).json({ message: "All hotels deleted successfully!" });
    } catch (error) {
        return res.status(500).json({ message: "An error occurred", error });
    }
});

// Get All Hotels
router.get("/get-all-hotels", async (req, res) => {
    try {
        const hotels = await Hotel.find().sort({ createdAt: -1 });
        return res.json({
            status: "Success",
            data: hotels,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Get Recently Added Hotels (Limit 4)
router.get("/get-recent-hotels", async (req, res) => {
    try {
        const hotels = await Hotel.find().sort({ createdAt: -1 }).limit(4);
        return res.json({ status: "Success", data: hotels });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Get Hotel by ID
router.get("/get-hotel-by-id/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const hotel = await Hotel.findById(id);
        return res.json({
            status: "Success",
            data: hotel,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An error occurred" });
    }
});

// Search Hotels by Name
router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }

        const hotels = await Hotel.find({ name: { $regex: query, $options: "i" } });

        if (hotels.length === 0) {
            return res.status(404).json({ message: "No hotels found" });
        }

        res.status(200).json({ status: "Success", hotels });
    } catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get total number of hotels
router.get("/total-hotels",  async (req, res) => {
    try {
      const totalHotels = await Hotel.countDocuments();
      return res.json({ status: "Success", count: totalHotels });
    } catch (error) {
      console.error("Error fetching total hotels:", error);
      return res.status(500).json({ status: "Error", message: "An error occurred while fetching total hotels" });
    }
  });

module.exports = router;

