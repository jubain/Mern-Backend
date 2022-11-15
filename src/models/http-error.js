class HttpError extends Error {
    constructor(message, errorCode) {
        super(message); // Call constructor of Error Class and pass message
        this.code = errorCode; // Add code property to
    };
}

module.exports = HttpError;