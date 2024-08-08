const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt';
const tableBody = document.getElementById('tableBody');
const loadingMessage = document.getElementById('loadingMessage');
const content = document.getElementById('content');
const quarterStartInput = document.getElementById('quarter-start');
const quarterEndInput = document.getElementById('quarter-end');
let records = [];
let changes = {}; // Object to store changes

// Redirect to login page if user is not authenticated
document.addEventListener("DOMContentLoaded", function() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
    }
});

// Check if the "Quarter Start" date is today and set Personaltime values to 8 if true
function checkQuarterStartOnce() {
    const lastChecked = localStorage.getItem('lastChecked');
    const today = new Date().toISOString().split('T')[0];
    const quarterStart = document.getElementById('quarter-start').value;

    if (lastChecked !== today && quarterStart === today) {
        console.log("Quarter Start date is today. Updating Personaltime values to 8.");
        const inputs = document.querySelectorAll('input[data-field="Personaltime"]');
        inputs.forEach(input => {
            input.value = 8;
            // Store the change
            const id = input.dataset.id;
            const field = input.dataset.field;
            if (!changes[id]) {
                changes[id] = {};
            }
            changes[id][field] = 8;
        });
        localStorage.setItem('lastChecked', today);
    }
}

// Clear session and local storage on page refresh
window.onbeforeunload = function() {
    sessionStorage.clear();
    localStorage.clear();
};
// Fetch data from Airtable
async function fetchData() {
    let offset = '';
    records = []; // Reset the records array
    let totalFetched = 0; // To keep track of the number of records fetched

    // Show loading message and hide content
    loadingMessage.classList.remove('d-none');
    content.classList.add('d-none');

    do {
        console.log(`Fetching data with offset: ${offset}`);
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?${offset}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        const data = await response.json();
        records = records.concat(data.records); // Append new records to the existing array
        offset = data.offset ? `&offset=${data.offset}` : ''; // Get the offset for the next set of records
        totalFetched += data.records.length; // Update the total number of records fetched
        console.log(`Fetched ${data.records.length} records, total fetched so far: ${totalFetched}`);
    } while (offset);

    console.log(`Total records fetched: ${totalFetched}`);
    // Filter out records without Employee Number
    records = records.filter(record => record.fields['Employee Number']);
    // Sort records by Employee Number
    records.sort((a, b) => a.fields['Employee Number'] - b.fields['Employee Number']);
    displayData(records);

    // Hide loading message and show content
    loadingMessage.classList.add('d-none');
    content.classList.remove('d-none');
}

// Display data in the table
function displayData(records) {
    tableBody.innerHTML = '';
    records.forEach(record => {
        if (!record.fields['Full Name'].toLowerCase().endsWith('branch')) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.fields['Full Name']}</td>
                <td><input type="number" value="${record.fields['Personaltime'] || 0}" data-id="${record.id}" data-field="Personaltime" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
<td><input type="number" value="${record.fields['PTO Total'] || 0}" data-id="${record.id}" data-field="PTO #" class="form-control time-input" min="0" step="1" oninput="storeChange(this)" disabled></td>
                                <td><input type="number" value="${record.fields['PTO'] || 0}" data-id="${record.id}" data-field="PTO" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>

            `;
            tableBody.appendChild(row);
        }
    });
    console.log(`Displayed ${records.length} records in the table`);
    checkQuarterStartOnce();
    // Set Quarter Start and End Dates
    if (records.length > 0) {
        const firstRecord = records[0];
        quarterStartInput.value = firstRecord.fields.PersonalStartDate || '';
        quarterEndInput.value = firstRecord.fields.PersonalTimeendDates || '';
    }
}


// Store changes in the changes object
function storeChange(input) {
    const id = input.dataset.id;
    const field = input.dataset.field;
    const value = parseInt(input.value, 10); // Ensure the value is an integer
    if (field === 'Personaltime' && value > 8) {
        alert('Personaltime cannot exceed 8 hours.');
        input.value = 8;
    }
    if (!changes[id]) {
        changes[id] = {};
    }
    changes[id][field] = value;
}

// Filter results based on search input
function filterResults() {
    const searchValue = document.getElementById('searchBar').value.toLowerCase();
    const filteredRecords = records.filter(record =>
        record.fields['Full Name'].toLowerCase().includes(searchValue) &&
        !record.fields['Full Name'].toLowerCase().endsWith('branch')
    );
    console.log(`Filtered results to ${filteredRecords.length} records based on search value: ${searchValue}`);
    displayData(filteredRecords);
}

// Submit changes to Airtable
async function submitChanges() {
    const updates = [];

    for (const id in changes) {
        if (changes.hasOwnProperty(id)) {
            updates.push({
                id,
                fields: changes[id]
            });
        }
    }

    console.log(`Submitting ${updates.length} updates to Airtable`);
    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: updates })
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Failed to submit changes:', errorDetails);
            alert(`Failed to submit changes: ${errorDetails.message || 'Unknown error'}`);
        } else {
            console.log('Changes submitted successfully!');
            alert('Changes submitted successfully!');
            fetchData(); // Refresh data
        }
    } catch (error) {
        console.error('Failed to submit changes:', error);
        alert('Failed to submit changes: ' + error.message);
    }
}

// Logout function
function logout() {
    console.log('Logging out...');
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'login.html';
}

// Initial fetch
fetchData();
