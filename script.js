let conditionCount = 0; // Initialize the condition counter

// Function to handle form submission
document.getElementById('disability-form').onsubmit = function(event) {
    event.preventDefault();
    calculateTotalDisability();
};

// Function to add a new condition
function addCondition() {
    let conditionId = `condition${conditionCount}`;
    let percentageId = `percentage${conditionCount}`;
    let extremitiesId = `extremities${conditionCount}`;
    let sideId = `side${conditionCount}`;

    let newCondition = `
        <div class="form-group">
            <label for="${conditionId}" style="font-weight: bold;">Health Condition #${conditionCount + 1}</label>
            <input type="text" class="form-control" id="${conditionId}" style="margin-bottom:10px" required>
            <div style="display:flex">
                <div style="margin-right:25px;">
                    <label for="${percentageId}">Percentage</label>
                    <input type="number" class="form-control mb-2 mr-2" id="${percentageId}" min="0" max="100" step="1" required>
                </div>
                <div style="margin-right:25px;">
                    <label for="${extremitiesId}">Extremities</label>
                    <select class="form-control mb-2 mr-2" id="${extremitiesId}" onchange="toggleSide(${conditionCount})">
                        <option value="None">None</option>
                        <option value="Upper">Upper</option>
                        <option value="Lower">Lower</option>
                    </select>
                </div>
                <div style="margin-right:25px;">
                    <label for="${sideId}">Side</label>
                    <select class="form-control" id="${sideId}" disabled>
                        <option value="N/A">N/A</option>
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    // Insert the new condition before the buttons
    let conditionListDiv = document.getElementById('condition-list');
    conditionListDiv.insertAdjacentHTML('beforeend', newCondition);
    conditionCount++; // Increment the condition count
}

// Function to enable or disable the side dropdown based on extremities selection
function toggleSide(index) {
    let extremitiesId = `extremities${index}`;
    let sideId = `side${index}`;
    let extremitiesValue = document.getElementById(extremitiesId).value;
    document.getElementById(sideId).disabled = (extremitiesValue === "None");
}

// Function to calculate the total disability
function calculateTotalDisability() {
    let allDisabilities = [];
    let summaryDetails = []; // For detailed summary of calculations

    // Collect all percentages and sort them from highest to lowest
    for (let i = 0; i < conditionCount; i++) {
        let percentage = parseInt(document.getElementById(`percentage${i}`).value) || 0;
        let extremity = document.getElementById(`extremities${i}`).value;
        let side = document.getElementById(`side${i}`).value;
        let conditionName = document.getElementById(`condition${i}`).value || `Condition ${i + 1}`;

        allDisabilities.push({ condition: conditionName, percentage: percentage, extremity: extremity, side: side });
    }

    // Sort all conditions from highest to lowest percentage
    allDisabilities.sort((a, b) => b.percentage - a.percentage);

    // Calculate combined rating for all conditions
    let combinedRating = 0;
    summaryDetails.push('<strong>Base Disability Calculations:</strong>');
    allDisabilities.forEach((disability, index) => {
        summaryDetails.push(`${index + 1}. ${disability.condition}: ${disability.percentage}%`);
        combinedRating = combineRatings(combinedRating, disability.percentage);
    });
    summaryDetails.push(`Combined rating before bilateral adjustment: ${combinedRating.toFixed(2)}%`);

    // Bilateral factor calculations for extremities after standard scoring model
    let bilateralAdjustmentTotal = 0;
    ['Upper', 'Lower'].forEach((extremityType) => {
        let extremityConditions = allDisabilities.filter(ed => ed.extremity === extremityType);
        let leftSide = extremityConditions.filter(ed => ed.side === 'Left');
        let rightSide = extremityConditions.filter(ed => ed.side === 'Right');
        
        summaryDetails.push(`<strong>${extremityType} Extremity Bilateral Factor Conditions:</strong>`);
        if (leftSide.length > 0 || rightSide.length > 0) {
            extremityConditions.forEach(condition => {
                summaryDetails.push(`${condition.condition} (${condition.side}): ${condition.percentage}%`);
            });
            if (leftSide.length > 0 && rightSide.length > 0) {
                // Only calculate if there are conditions on both sides
                let bilateralFactor = calculateBilateralAdjustment(extremityConditions);
                bilateralAdjustmentTotal += bilateralFactor;
                summaryDetails.push(`${extremityType} Extremity Bilateral Adjustment: ${bilateralFactor.toFixed(2)}%`);
            } else {
                summaryDetails.push(`${extremityType} Extremity Bilateral Adjustment: No bilateral issues found.`);
            }
        } else {
            summaryDetails.push(`${extremityType} Extremity Bilateral Adjustment: No bilateral issues found.`);
        }
    });

    // Apply bilateral adjustments to the combined rating
    let totalDisabilityRating = Math.min(Math.round(combinedRating + bilateralAdjustmentTotal), 100);

    // Append total combined rating to the summary
    summaryDetails.push(`<strong>Total Combined Rating: ${totalDisabilityRating}%</strong>`);

    // Output the summary details
    document.getElementById('result').innerText = `Total Combined Rating: ${totalDisabilityRating}%`;
    document.getElementById('summary').innerHTML = summaryDetails.join('<br>');
}

// Calculate bilateral adjustment
function calculateBilateralAdjustment(extremityConditions) {
    let leftSide = extremityConditions.filter(ed => ed.side === 'Left').sort((a, b) => b.percentage - a.percentage);
    let rightSide = extremityConditions.filter(ed => ed.side === 'Right').sort((a, b) => b.percentage - a.percentage);
    let bilateralAdjustment = 0;

    if (leftSide.length > 0 && rightSide.length > 0) {
        // Calculate the bilateral adjustment using the largest percentage from each side
        bilateralAdjustment = combineRatings(leftSide[0].percentage, rightSide[0].percentage) * 0.1; // 10% of the combined extremity rating
    }
    return bilateralAdjustment;
}

// Helper function to combine two ratings
function combineRatings(rating1, rating2) {
    let combined = 100 - ((100 - rating1) * (100 - rating2) / 100);
    return combined > 100 ? 100 : combined; // Ensure the combined rating doesn't exceed 100%
}

// Add initial condition on page load
document.addEventListener('DOMContentLoaded', function() {
    addCondition(); // Add the first condition input
});
