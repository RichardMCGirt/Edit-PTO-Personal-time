const apiKey1 = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId1 = 'app9gw2qxhGCmtJvW';
const tableId1 = 'tbljmLpqXScwhiWTt'; // Table for PTO/Personal time

const apiKey2 = 'patk8XGTUEck2nwg3.785361d5efcf3e7ad4305cd5d47e8fc08029043abe81d6997112f4024ce2afb9';
const baseId2 = 'appehs4OWDzGWYCrP';
const tableId2 = 'tblwtpHlA3CYpa02W'; // Table for Employee Number

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

// Function to filter results based on the search input
function filterResults() {
    const searchValue = document.getElementById('searchBar').value.toLowerCase();
    searchMode = searchValue !== ''; // Enable search mode if there is a search value
    const filteredRecords = records.filter(record => {
        const fullName = record.fields['Full Name'] || ''; // Ensure Full Name is a string or empty string
        return fullName.toLowerCase().includes(searchValue); // Check if the Full Name contains the search value
    });

    console.log(`Filtered results: ${filteredRecords.length} records based on search value: ${searchValue}`);
    displayData(filteredRecords); // Display only the filtered records
}

// Hide loading message
function hideLoadingMessage() {
    loadingMessage.classList.add('d-none');
    content.classList.remove('d-none');
}

async function fetchEmployeeNumbers() {
    let employeeRecords = [];
    let offset = '';

    do {
        const response = await fetch(`https://api.airtable.com/v0/${baseId2}/${tableId2}?${offset}`, {
            headers: {
                Authorization: `Bearer ${apiKey2}`
            }
        });
        const data = await response.json();
        employeeRecords = employeeRecords.concat(data.records);
        offset = data.offset ? `&offset=${data.offset}` : '';
    } while (offset);

    console.log("Fetched Employee Records:", employeeRecords); // Log fetched records
    return employeeRecords;
}

async function fetchData() {
    let offset = '';
    records = []; // Reset the records array
    let totalFetched = 0; // To keep track of the number of records fetched

    showLoadingMessage(); // Show loading message

    do {
        console.log(`Fetching data with offset: ${offset}`);
        const response = await fetch(`https://api.airtable.com/v0/${baseId1}/${tableId1}?${offset}`, {
            headers: {
                Authorization: `Bearer ${apiKey1}`
            }
        });
        const data = await response.json();
        records = records.concat(data.records); // Append new records to the existing array
        offset = data.offset ? `&offset=${data.offset}` : ''; // Get the offset for the next set of records
        totalFetched += data.records.length; // Update the total number of records fetched
        console.log(`Fetched ${data.records.length} records, total fetched so far: ${totalFetched}`);
    } while (offset);

    console.log(`Total records fetched: ${totalFetched}`, records);
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
                <th>Full Name</th>
                <th>Personaltime</th>
                <th>PTO Total</th>
                <th>PTO</th>
                <th>Employee Number</th> <!-- Display employee number header -->
            </tr>
        `;
    } else {
        tableBody.innerHTML = `
            <tr>
                <th>Full Name</th>
                <th>Personaltime</th>
                <th>PTO Total</th>
                <th>PTO</th>
            </tr>
        `;
    }

    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.fields['Full Name']}</td>
            <td><input type="number" value="${record.fields['Personaltime'] || 0}" data-id="${record.id}" data-field="Personaltime" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
            <td><input type="number" value="${record.fields['PTO Total'] || 0}" data-id="${record.id}" data-field="PTO Total" class="form-control time-input" min="0" step="1" oninput="storeChange(this)" disabled></td>
            <td><input type="number" value="${record.fields['PTO'] || 0}" data-id="${record.id}" data-field="PTO" class="form-control time-input" min="0" step="1" oninput="storeChange(this)"></td>
            ${searchMode ? `<td><input type="number" value="${record.fields['Employee Number'] || ''}" data-id="${record.id}" data-field="Employee Number" class="form-control employee-input" oninput="storeChange(this)"></td>` : ''}
        `;
        tableBody.appendChild(row);
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
    let value = input.value;

    if (field === 'Employee Number') {
        value = parseInt(value, 10);
        if (isNaN(value)) {
            alert("Employee Number must be a valid number.");
            return;
        }
    }

    input.style.backgroundColor = "lightblue"; // Set background color to indicate change

    // Ensure Personaltime is a valid number
    if (field === 'Personaltime') {
        value = parseFloat(value); // Convert to a number
        if (isNaN(value) || value < 0) {
            alert('Personaltime must be a valid positive number.');
            input.value = 0; // Reset the value to 0 or another default
            value = 0;
        }
    }

    // Ensure PTO is a valid number (assuming PTO should be a number field)
    if (field === 'PTO') {
        value = parseFloat(value); // Convert to a number
        if (isNaN(value) || value < 0) {
            alert('PTO must be a valid positive number.');
            input.value = 0; // Reset to 0 or another default
            value = 0;
        }
    }


    if (!changes[id]) {
        changes[id] = {};
    }
    changes[id][field] = value; // Store changes for Employee Number and other fields

    // Log the change
    console.log(`Stored change for record ${id}:`, changes[id]);
}

async function submitChanges() {
    const updatesPTO = [];
    const updatesEmployee = [];
    const employeeData = await fetchEmployeeNumbers(); // Fetch employee numbers

    console.log("Fetched Employee Data:", employeeData);

    for (const id in changes) {
        if (changes.hasOwnProperty(id)) {
            const fields = { ...changes[id] }; // Clone the fields to modify without affecting the original

            // Check if there is an Employee Number field and handle it separately
            if (fields.hasOwnProperty('Employee Number')) {
                const employeeNumber = fields['Employee Number'];
                delete fields['Employee Number']; // Remove Employee Number from the PTO/Personal time table update

                const fullName = records.find(record => record.id === id)?.fields['Full Name']; // Get the Full Name from the PTO records

                if (fullName) {
                    const matchingEmployee = employeeData.find(emp => {
                        const employeeFullName = emp.fields['Full Name'] ? emp.fields['Full Name'].trim().toLowerCase() : null;
                        return employeeFullName === fullName.toLowerCase(); // Match by Full Name
                    });

                    if (matchingEmployee) {
                        updatesEmployee.push({
                            id: matchingEmployee.id, // Update using the correct record ID in the Employee table
                            fields: { 'Employee Number': employeeNumber } // Update Employee Number in the Employee table only
                        });
                    } else {
                        console.warn(`No matching employee found for Full Name: ${fullName}`);
                    }
                }
            }

            // If there are other fields to update in the PTO/Personal time table, add them to updatesPTO
            if (Object.keys(fields).length > 0) {
                updatesPTO.push({ id, fields });
            }
        }
    }

    // Log final payloads before sending
    console.log("Final payload for PTO/Personal Time Table PATCH request:", updatesPTO);
    console.log("Final payload for Employee Number PATCH request:", updatesEmployee);

    // Submit changes for PTO/Personal Time (excluding Employee Number)
    if (updatesPTO.length > 0) {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${baseId1}/${tableId1}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${apiKey1}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records: updatesPTO })
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(JSON.stringify(responseData, null, 2));
            }
            console.log('PTO/Personal Time changes submitted successfully!', responseData);
        } catch (error) {
            console.error('Error submitting PTO/Personal Time changes:', error.message);
        }
    }

// Submit changes for Employee Number (in the Employee table)
if (updatesEmployee.length > 0) {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId2}/${tableId2}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey2}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: updatesEmployee })
        });

        const responseData = await response.json();

        // Check if the response is not ok and log detailed error if it failed
        if (!response.ok) {
            console.error('Failed to submit Employee Number changes:', responseData);
            throw new Error(`Failed to update Employee Number. Status: ${response.status}. Message: ${responseData.error?.message || 'Unknown error'}`);
        }

        console.log('Employee Number changes submitted successfully!', responseData);
    } catch (error) {
        console.error('Error submitting Employee Number changes:', error.message);
    }
}


    // Refresh data after submission
    await fetchData();

    // Clear the search bar and reset search mode
    document.getElementById('searchBar').value = ''; // Clear the search bar
    searchMode = false; // Reset search mode
}







// Initial fetch
fetchData();
