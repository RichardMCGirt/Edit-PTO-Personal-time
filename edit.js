const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
const baseId = 'app9gw2qxhGCmtJvW';
const tableId = 'tbljmLpqXScwhiWTt';
const tableBody = document.getElementById('tableBody');
let records = [];

// Fetch data from Airtable
async function fetchData() {
    let offset = '';
    records = []; // Reset the records array
    let totalFetched = 0; // To keep track of the number of records fetched

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
    displayData(records);
}

// Display data in the table
function displayData(records) {
    tableBody.innerHTML = '';
    records.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.fields['Full Name']}</td>
            <td><input type="number" value="${record.fields['Personaltime'] || 0}" data-id="${record.id}" data-field="Personaltime" class="time-input" min="0" step="1"></td>
            <td><input type="number" value="${record.fields['PTO Hours'] || 0}" data-id="${record.id}" data-field="PTO Hours" class="time-input" min="0" step="1"></td>
        `;
        tableBody.appendChild(row);
    });
    console.log(`Displayed ${records.length} records in the table`);
}

// Check if Quarter Start date is today
function checkQuarterStart() {
    const today = new Date().toISOString().split('T')[0];
    const quarterStart = document.getElementById('quarter-start').value;

    if (quarterStart === today) {
        console.log("Quarter Start date is today. Updating Personaltime values to 8.");
        const inputs = document.querySelectorAll('input[data-field="Personaltime"]');
        inputs.forEach(input => {
            input.value = 8;
        });
    }
}

// Filter results based on search input
function filterResults() {
    const searchValue = document.getElementById('searchBar').value.toLowerCase();
    const filteredRecords = records.filter(record =>
        record.fields['Full Name'].toLowerCase().includes(searchValue)
    );
    console.log(`Filtered results to ${filteredRecords.length} records based on search value: ${searchValue}`);
    displayData(filteredRecords);
}

// Submit changes to Airtable
async function submitChanges() {
    const inputs = document.querySelectorAll('input[type="number"]');
    const updates = [];
    inputs.forEach(input => {
        const id = input.dataset.id;
        const field = input.dataset.field;
        const value = parseInt(input.value, 10); // Ensure the value is an integer
        updates.push({
            id,
            fields: {
                [field]: value
            }
        });
    });

    console.log(`Submitting ${updates.length} updates to Airtable`);
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: updates })
    });

    if (response.ok) {
        console.log('Changes submitted successfully!');
        alert('Changes submitted successfully!');
        fetchData(); // Refresh data
    } else {
        console.error('Failed to submit changes.');
        alert('Failed to submit changes.');
    }
}

// Initial fetch
fetchData();
