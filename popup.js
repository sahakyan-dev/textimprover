document.addEventListener('DOMContentLoaded', function () {

  // Load the saved option on popup load
  chrome.storage.sync.get(['selectedOption'], function (result) {
    if (result.selectedOption) {
      const radio = document.querySelector(`input[value="${result.selectedOption}"]`);
      if (radio) {
        radio.checked = true;
      }
    } else {
      // If no option is saved, default to 'capitalize'
      const radio = document.querySelector(`input[value="replace"]`);
      if (radio) {
        radio.checked = true;
      }
    }
  });

  // Save option whenever it's changed
  const radios = document.querySelectorAll('input[name="option"]');
  radios.forEach(radio => {
    radio.addEventListener('change', function () {
      const selectedOption = this.value;
      chrome.storage.sync.set({ selectedOption: selectedOption }, function () {
      });

      // Send the selected option to the content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { selectedOption: selectedOption });
      });
    });
  });

  // Add a click event listener to the save button to close the popup
  document.getElementById('close').addEventListener('click', function () {
    // Close the popup window
    window.close();
  });
});
