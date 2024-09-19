document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const statusDiv = document.getElementById("status");

  // Function to handle the file
  function handleFile(file) {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const jsonConfig = JSON.parse(e.target.result);
          chrome.runtime.sendMessage(
            { action: "importConfig", config: jsonConfig },
            function (response) {
              if (response.success) {
                statusDiv.textContent = "Configuration imported successfully!";
              } else {
                statusDiv.textContent = "Error importing configuration.";
              }
            }
          );
        } catch (error) {
          statusDiv.textContent = "Error parsing JSON file.";
        }
      };
      reader.readAsText(file);
    } else {
      statusDiv.textContent = "No file selected.";
    }
  }

  // Handle file selection
  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    handleFile(file);
  });

  // Handle drag and drop
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("highlight");
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("highlight");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("highlight");
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  // Handle click to select file
  dropzone.addEventListener("click", () => {
    fileInput.click();
  });
});
