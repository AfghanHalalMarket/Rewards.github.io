const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const messageDiv = document.getElementById('message');
const fileTable = document.getElementById('fileTable');
const fileTableBody = document.getElementById('fileTableBody');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData();
  for (const file of fileInput.files) {
    formData.append('files', file);
  }

  try {
    messageDiv.textContent = "Uploading and zipping files...";

    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();

    // Show success message and create download link
    messageDiv.textContent = "Files uploaded and zipped successfully!";

    const downloadLink = document.createElement('a');
    downloadLink.href = `/download/${data.zipFile}`;
    downloadLink.textContent = `Download ZIP: ${data.zipFile}`;
    downloadLink.classList.add('download-btn');

    // Display the link to download the zip file
    fileTable.style.display = 'block';
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = data.zipFile;
    row.appendChild(nameCell);

    const actionCell = document.createElement('td');
    actionCell.appendChild(downloadLink);
    row.appendChild(actionCell);

    fileTableBody.appendChild(row);
  } catch (error) {
    messageDiv.textContent = `Error: ${error.message}`;
  }
});
