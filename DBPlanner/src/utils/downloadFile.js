/**
 * Triggers a download of a file with the given content and name.
 * 
 * @param {string} content - The file content as a string.
 * @param {string} fileName - The desired filename for the download.
 * @param {string} [mimeType='text/plain'] - The MIME type of the file.
 */
export function downloadFile(content, fileName, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}