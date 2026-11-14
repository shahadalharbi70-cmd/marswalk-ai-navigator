alert("JavaScript is working!");
const planButton = document.getElementById("planButton");

planButton.addEventListener("click", function() {
    const start = document.getElementById("start").value.trim();
    const destination = document.getElementById("destination").value;
    const time = Number(document.getElementById("time").value);
    const result = document.getElementById("result");

    if (!start || !destination || !Number.isFinite(time) || time <= 0) {
        result.textContent = "Please complete all mission details.";
        return;
    }

    result.textContent =
        `Start: ${start} | Destination: ${destination} | ` +
        `Available time: ${time} minutes. ` +
        "Mission details received. Route calculation is not connected yet.";
});

const returnButton = document.getElementById("return-button");
const returnMessage = document.getElementById("return-message");

returnButton.addEventListener("click", function () {
    returnMessage.textContent =
        "Emergency return requested. Waiting for safe route calculation.";

    document.getElementById("helmet-alert").textContent =
        "RETURN REQUESTED";
});
