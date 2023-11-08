let conditionCount = 0; // Initialize the condition counter

// Function to handle form submission
document.getElementById('disability-form').onsubmit = function(event) {
    event.preventDefault();
    let totalRating = calculateTotalDisability(); // Capture the returned total rating
    let dependents = parseInt(document.getElementById('dependents').value);
    let compensation = calculateCompensation(totalRating, dependents);
    document.getElementById('compensation-result').innerHTML = `<strong>Estimated Compensation: $${compensation} per month</strong>`;
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

    document.getElementById('condition-list').insertAdjacentHTML('beforeend', newCondition);
    conditionCount++;
}

// Function to enable or disable the side dropdown based on extremities selection
function toggleSide(index) {
    let extremitiesId = `extremities${index}`;
    let sideId = `side${index}`;
    document.getElementById(sideId).disabled = document.getElementById(extremitiesId).value === "None";
}

function calculateTotalDisability() {
    let disabilities = [];
    let summaryDetails = []; // For detailed summary of calculations

    // Collect all percentages
    for (let i = 0; i < conditionCount; i++) {
        let percentage = parseInt(document.getElementById(`percentage${i}`).value) || 0;
        let extremity = document.getElementById(`extremities${i}`).value;
        let side = document.getElementById(`side${i}`).value;
        let conditionName = document.getElementById(`condition${i}`).value || `Condition ${i + 1}`;
        disabilities.push({ condition: conditionName, percentage: percentage, extremity: extremity, side: side });
    }

    // Sort all conditions from highest to lowest percentage
    disabilities.sort((a, b) => b.percentage - a.percentage);

    // Initialize bilateral conditions object
    let bilateralConditions = { Upper: [], Lower: [] };
    let nonBilateralConditions = [];

    // Classify each disability as bilateral or non-bilateral
    disabilities.forEach(disability => {
        if (disability.extremity !== "None" && disability.side !== "N/A") {
            bilateralConditions[disability.extremity].push(disability);
        } else {
            nonBilateralConditions.push(disability);
        }
    });

    // Check for bilateral pairs and move non-paired conditions to nonBilateralConditions
    ['Upper', 'Lower'].forEach(extremity => {
        let leftSide = bilateralConditions[extremity].filter(cond => cond.side === 'Left');
        let rightSide = bilateralConditions[extremity].filter(cond => cond.side === 'Right');
        if (!(leftSide.length && rightSide.length)) {
            nonBilateralConditions = [...nonBilateralConditions, ...leftSide, ...rightSide];
            bilateralConditions[extremity] = []; // Clear out the extremity as it's not bilateral
        }
    });

    // Calculate combined rating for non-bilateral conditions
    let baseDisabilityRating = nonBilateralConditions.reduce((combinedRating, disability) => {
        return combineRatings(combinedRating, disability.percentage);
    }, 0);

    summaryDetails.push('<strong>Base Disability Calculations:</strong>');
    nonBilateralConditions.forEach((disability, index) => {
        summaryDetails.push(`${index + 1}. ${disability.condition}: ${disability.percentage}%`);
    });
    summaryDetails.push(`Base disability rating: ${baseDisabilityRating}%`);

    // Calculate and apply bilateral adjustments for Upper and Lower extremities
    ['Upper', 'Lower'].forEach(extremity => {
        if (bilateralConditions[extremity].length > 0) {
            summaryDetails.push(`<strong>${extremity} Extremity Bilateral Calculations:</strong>`);
            let bilateralSummary = calculateBilateralRating(bilateralConditions[extremity]);
            bilateralSummary.forEach((bilateralCondition, index) => {
                if (index < bilateralSummary.length - 3) {
                    summaryDetails.push(`${index + 1}. ${bilateralCondition.condition}: ${bilateralCondition.percentage}%`);
                }
            });
            summaryDetails.push(`Subtotal for ${extremity} extremity bilateral conditions: ${bilateralSummary[bilateralSummary.length - 3].percentage}%`);
            summaryDetails.push(`Bilateral Condition Adjustment: ${bilateralSummary[bilateralSummary.length - 2].percentage}%`);
            summaryDetails.push(`Total Disability Rating for ${extremity} Extremity: ${bilateralSummary[bilateralSummary.length - 1].percentage}%`);
            baseDisabilityRating = combineRatings(baseDisabilityRating, bilateralSummary[bilateralSummary.length - 1].percentage);
        }
    });

    let totalDisabilityRating = Math.round(baseDisabilityRating / 10) * 10;

    summaryDetails.push(`<strong>Total Disability Rating (Unrounded): ${baseDisabilityRating}%</strong>`);
    summaryDetails.push(`<strong>Total Disability Rating (Rounded): ${totalDisabilityRating}%</strong>`);

    document.getElementById('result').innerText = `Rounded Total Combined Rating: ${totalDisabilityRating}%`;
    document.getElementById('summary').innerHTML = summaryDetails.join('<br>');
    
    return totalDisabilityRating; // Return the total rating for compensation calculation
}

// Function to calculate compensation
function calculateCompensation(rating, dependents) {
    // Placeholder for the logic to determine compensation based on rating and dependents
    // This should be replaced with the actual logic based on the current VA compensation rates
    let baseCompensation = 100; // Example base compensation
    let additionalDependentAmount = 50; // Example additional amount per dependent
    let totalCompensation = baseCompensation + (dependents * additionalDependentAmount);
    
    return totalCompensation;
}

// Function to calculate bilateral rating and adjustment
function calculateBilateralRating(conditions) {
    let subtotalLeft = 0, subtotalRight = 0;
    conditions.forEach(condition => {
        if (condition.side === 'Left') {
            subtotalLeft = combineRatings(subtotalLeft, condition.percentage);
        } else if (condition.side === 'Right') {
            subtotalRight = combineRatings(subtotalRight, condition.percentage);
        }
    });

    let subtotal = combineRatings(subtotalLeft, subtotalRight);
    let adjustment = Math.round(subtotal * 0.1);
    let total = subtotal + adjustment;

    return [...conditions, { condition: 'Subtotal', percentage: subtotal }, { condition: 'Adjustment', percentage: adjustment }, { condition: 'Total', percentage: total }];
}

function combineRatings(currentRating, newRating) {
    let combinedRating = 100 - ((100 - currentRating) * (100 - newRating) / 100);
    return Math.round(combinedRating);
}

document.addEventListener('DOMContentLoaded', function() {
    addCondition(); // Add the first condition input
});
