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
let searchMode = false; // To track if we are in search mode

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
            input.style.backgroundColor = "lightblue"; // Set background color to light blue
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

// Show loading message with updated content
function showLoadingMessage() {
    loadingMessage.classList.remove('d-none');
    content.classList.add('d-none');
}

// Hide loading message
function hideLoadingMessage() {
    loadingMessage.classList.add('d-none');
    content.classList.remove('d-none');
}

// Fetch data from Airtable
async function fetchData() {
    let offset = '';
    records = []; // Reset the records array
    let totalFetched = 0; // To keep track of the number of records fetched

    showLoadingMessage(); // Show loading message

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
    // Sort records by Employee Number if it exists
    records.sort((a, b) => (a.fields['Employee Number'] || 0) - (b.fields['Employee Number'] || 0));
    displayData(records);

    hideLoadingMessage(); // Hide loading message
}

// Display data in the table
function displayData(records) {
    tableBody.innerHTML = '';

    // If in search mode, add Employee Number header
    if (searchMode) {
        tableBody.innerHTML = `
            <tr>
    
                <th>Employee Number</th> <!-- Display employee number header -->
            </tr>
        `;
    } else {
        tableBody.innerHTML = `
            <tr>
        
            </tr>
        `;
    }

    records.forEach(record => {
        const hasEmployeeNumber = !!record.fields['Employee Number'];
        if (!record.fields['Full Name'].toLowerCase().endsWith('branch')) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.fields['Full Name']}</td>
                <td><input type="number" value="${record.fields['Personaltime'] || 0}" data-id="${record.id}" data-field="Personaltime" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
                <td><input type="number" value="${record.fields['PTO Total'] || 0}" data-id="${record.id}" data-field="PTO #" class="form-control time-input" min="0" step="1" oninput="storeChange(this)" disabled></td>
                <td><input type="number" value="${record.fields['PTO'] || 0}" data-id="${record.id}" data-field="PTO" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
                ${searchMode ? `<td><input type="number" placeholder="Enter Employee #" data-id="${record.id}" data-field="Employee Number" class="form-control employee-input" onkeydown="checkEnterKey(event, this)"></td>` : ''}
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
    input.style.backgroundColor = "lightblue"; // Set background color to light blue
    if (field === 'Personaltime' && value > 8) {
        alert('Personaltime cannot exceed 8 hours.');
        input.value = 8;
    }
    if (!changes[id]) {
        changes[id] = {};
    }
    changes[id][field] = value;
}

// Check for "Enter" key press and handle saving Employee Number
function checkEnterKey(event, input) {
    if (event.key === 'Enter') {
        const id = input.dataset.id;
        const employeeNumber = parseInt(input.value, 10);
        if (!employeeNumber) {
            alert('Please enter a valid Employee Number.');
            return;
        }
        input.style.backgroundColor = "lightblue"; // Highlight the field
        if (!changes[id]) {
            changes[id] = {};
        }
        changes[id]['Employee Number'] = employeeNumber;
        console.log(`Entered Employee Number: ${employeeNumber} for record ID: ${id}`);
        // Optionally submit changes directly after employee number input
        submitEmployeeNumberChange(id);
    }
}

// Function to submit just the employee number change for that record
async function submitEmployeeNumberChange(id) {
    const update = {
        id,
        fields: {
            'Employee Number': changes[id]['Employee Number']
        }
    };

    console.log(`Submitting employee number update for record ID: ${id}`);

    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: [update] })
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Failed to submit employee number:', errorDetails);
            alert(`Failed to submit employee number: ${errorDetails.message || 'Unknown error'}`);
        } else {
            console.log('Employee number submitted successfully!');
            alert('Employee number submitted successfully!');
            fetchData(); // Refresh data to display the updated employee number
        }
    } catch (error) {
        console.error('Failed to submit employee number:', error);
        alert('Failed to submit employee number: ' + error.message);
    }
}

// Filter results based on search input
function filterResults() {
    const searchValue = document.getElementById('searchBar').value.toLowerCase();
    const filteredRecords = records.filter(record => {
        const fullName = record.fields['Full Name'] || ''; // Ensure Full Name is a string or empty string
        return fullName.toLowerCase().includes(searchValue);
    });

    // Activate search mode if the search value returns a result
    searchMode = filteredRecords.some(record => !record.fields['Employee Number']);
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
            removeHighlightsOnSubmit(); // Remove highlights after submission
            fetchData(); // Refresh data
        }
    } catch (error) {
        console.error('Failed to submit changes:', error);
        alert('Failed to submit changes: ' + error.message);
    }
}

// Remove the highlight when the user clicks the submit button
function removeHighlightsOnSubmit() {
    const inputs = document.querySelectorAll('input.time-input');
    inputs.forEach(input => {
        input.style.backgroundColor = ""; // Remove background color
    });
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
