const axios = require("axios");
const HttpError = require("../models/http-error");
const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
    const response = await axios.get(
        `http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${address}`
    )
    const data = response.data.data[0];
    if (!data) {
        const error = new HttpError('Could not find location for the address', 422)
        throw error;
    }
    const coordinates = { lat: data.latitude, lng: data.longitude };
    return coordinates;
};

module.exports = getCoordsForAddress;