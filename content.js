let selectedOption = '';
let button = null;
let activeElement = null;
let selection = {}
let selectedText = null;

// Function to load saved option
function loadSavedOption() {
  chrome.storage.sync.get(['selectedOption'], function (result) {
    // console.log('Loaded result:', result)
    if (result.selectedOption) {
      selectedOption = result.selectedOption;
    } else {
      selectedOption = 'replace'
    }
  });
};

// Load saved option once when content script runs
loadSavedOption();

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.selectedOption) {
    // console.log('Received selected option:', request.selectedOption)
    selectedOption = request.selectedOption;
  } else {
    selectedOption = 'replace'
  }
});

function replaceSelectedText(replacementText) {
  let sel, range, div;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.deleteContents();
      div = document.createElement("div");
      div.innerHTML = replacementText;
      range.insertNode(div);
    } else {
      activeElement.focus();
      setTimeout(() => {
        sel = window.getSelection();
        if (sel.rangeCount) {
          range = sel.getRangeAt(0);
          range.deleteContents();
          div = document.createElement("div");
          div.innerHTML = replacementText;
          range.insertNode(div);
        }
      }, 100)
    }
  } else if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    range.text = replacementText;
  }
}

function addSelectedText(replacementText) {
  let sel, range, div;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      let clonedSelection = range.cloneContents();
      range.deleteContents();
      div = document.createElement("div");
      div.innerHTML = replacementText;
      div.appendChild(clonedSelection);
      range.insertNode(div);
    } else {
      activeElement.focus();
      setTimeout(() => {
        sel = window.getSelection();
        if (sel.rangeCount) {
          range = sel.getRangeAt(0);
          let clonedSelection = range.cloneContents();
          range.deleteContents();
          div = document.createElement("div");
          div.innerHTML = replacementText;
          div.appendChild(clonedSelection);
          range.insertNode(div);
        }
      }, 100)
    }
  } else if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    range.text = replacementText;
  }
}

const handleSelection = () => {
  if (document.activeElement.id === 'improveButton') {
    return;
  }
  activeElement = document.activeElement;
  // console.log('activeElement', activeElement)
  if (activeElement.isContentEditable || (activeElement.tagName == 'INPUT' && activeElement.type === 'text') || activeElement.tagName == 'TEXTAREA') {
    // console.log('activeElement', window.getSelection().getRangeAt(0).toString())
    selection = window.getSelection();
    // console.log('selection', selection)
    if (selection.rangeCount > 0) {
      selectedText = selection.toString();
      if (selectedText) {
        // console.log('Text selected:', selectedText);
        buttonPositioning(activeElement);
      } else {
        button.style.display = 'none';
        // console.log('No text selected');
      }
    } else {
      // console.log('selection.rangeCount < 0')
      button.style.display = 'none';
      selectedText = null;
    }
  } else {
    // console.log('activeElement is not what we need', activeElement)
    button.style.display = 'none';
  }
};
document.addEventListener('selectionchange', handleSelection);

// Adjust the button position based on the element coordinates
buttonPositioning = (targetElement) => {
  const rect = targetElement.getBoundingClientRect();
  button.style.left = `${rect.left + window.scrollX + rect.width + 5}px`;
  button.style.top = `${rect.top + window.scrollY}px`;

  // Show the button
  button.style.display = 'block';
}

createButton = (targetElement) => {
  // Create the button if it doesn't exist
  if (!button) {
    button = document.createElement('button');
    button.id = 'improveButton';
    button.innerText = 'Improve Me';

    // Add an event listener to the button to handle clicks
    button.addEventListener('click', function() {
      // console.log("activeElement", activeElement)
      if (!activeElement)
        return;

      button.style.display = 'none';
      const isInputOrTextarea = typeof activeElement.setSelectionRange === 'function'
      // fetch("http://localhost:1337/api/improve-text", {
      fetch("https://math-arm-app.herokuapp.com/api/improve-text", {
        method: "POST",
        body: JSON.stringify({
          text: selectedText,
          notHTML: isInputOrTextarea
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      })
      .then((response) => response.json())
      .then((json) => {
        selectedOption ?? 'replace';
        if (isInputOrTextarea) {
          const lastSelectionStart = activeElement.selectionStart;
          const lastSelectionEnd = activeElement.selectionEnd;
          if (selectedOption === 'replace') {
            // console.log('inInputOrTextarea replace')
            // Replace the selected text with the improved text
            activeElement.value = activeElement.value.substring(0, lastSelectionStart) + json.text + activeElement.value.substring(lastSelectionEnd);
          } else if (selectedOption === 'add') {
            // console.log('inInputOrTextarea add')
            // Add the improved text after the selected text
            const newText = `\n\n\n${json.text}\n\n\n`;
            activeElement.value = activeElement.value.substring(0, lastSelectionEnd) + newText + activeElement.value.substring(lastSelectionEnd);
          }
        } else {
          if (selectedOption === 'replace') {
            // console.log('editable replace')
            replaceSelectedText(json.text);
          } else if (selectedOption === 'add') {
            // console.log('editable add')
            addSelectedText(json.text);
          }
        }
      });
    });

    // Add the button to the body of the page
    document.body.appendChild(button);
  }
}
createButton()
