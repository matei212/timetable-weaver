/**
 * Web-compatible replacement for the Electron backend API
 */

/**
 * Export timetable HTML to PDF using browser capabilities
 * @param html - HTML content to convert to PDF
 * @param filename - Output filename
 * @returns Promise that resolves to the filename when complete
 */
export async function exportTimetablePdf(
  html: string,
  filename: string,
): Promise<string> {
  return new Promise(resolve => {
    // Create a blob from the HTML content
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Create an invisible iframe to trigger the print dialog
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";

    printFrame.onload = () => {
      if (printFrame.contentWindow) {
        // Add event listener to clean up after printing
        printFrame.contentWindow.onafterprint = () => {
          URL.revokeObjectURL(url);
          if (printFrame.parentNode) {
            printFrame.parentNode.removeChild(printFrame);
          }
          resolve(filename);
        };

        // Trigger print dialog
        printFrame.contentWindow.print();

        // Fallback for browsers that don't support onafterprint
        setTimeout(() => {
          if (printFrame.parentNode) {
            URL.revokeObjectURL(url);
            printFrame.parentNode.removeChild(printFrame);
            resolve(filename);
          }
        }, 2000);
      }
    };

    // Set the iframe source to the HTML content
    printFrame.src = url;
    document.body.appendChild(printFrame);
  });
}

/**
 * Download the timetable HTML as a file
 * @param html - HTML content to download
 * @param filename - Output filename
 * @returns Promise that resolves to the filename when complete
 */
export async function downloadTimetableHtml(
  html: string,
  filename: string,
): Promise<string> {
  // Create a blob from the HTML content
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Create a download link and trigger it
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);

  return filename;
}

// Export the backend API
const backend = {
  exportTimetablePdf,
  downloadTimetableHtml,
};

export default backend;
