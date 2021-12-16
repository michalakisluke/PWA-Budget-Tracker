let db;
const request = indexedDB.open('budget-tracker', 1);

request.onopgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true} )
};

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    //checking if app is online
    if (navigator.onLine) {
        updateBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open a new transaction with read/write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite');
    //access the object store for new_budget
    const budgetObjectStore = transaction.objectStore('new_budget');
    // add record to store
    budgetObjectStore.add(record);
};

function updateBudget() {
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget')

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_budget'], 'readwrite');
                // access the object store
                const budgetObjectStore = transaction.objectStore('new_budget');
                // clear all items
                budgetObjectStore.clear();

                alert('Budget updated');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

window.addEventListener('online', updateBudget);
