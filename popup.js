function saveCheckboxState() {
    const checkbox = document.getElementById('splitTable');
    chrome.storage.local.set({ 'splitTable': checkbox.checked }, function () {
        console.log('Checkbox state saved:', checkbox.checked);
    });
}

function loadCheckboxState() {
    const checkbox = document.getElementById('splitTable');
    chrome.storage.local.get('splitTable', function (data) {
        checkbox.checked = !!data.splitTable;
        console.log('Checkbox state loaded:', data.tableSplit);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadCheckboxState();
    document.getElementById('splitTable').addEventListener('change', saveCheckboxState);
});