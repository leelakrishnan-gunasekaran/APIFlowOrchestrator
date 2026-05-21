// PDF Generation utility for API execution reports
// Note: Install jspdf and jspdf-autotable: npm install jspdf jspdf-autotable

export const generateExecutionReportPDF = async (groupName, nodes, latestRun) => {
  try {
    // Dynamic import to avoid bundling if not used
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('API Execution Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Group Name
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`Group: ${groupName}`, 20, yPosition);
    yPosition += 8;
    
    // Execution Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;
    
    // Overall Performance Summary
    if (latestRun) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Overall Performance', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Status: ${latestRun.status}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total Duration: ${latestRun.totalDurationMs} ms`, 20, yPosition);
      yPosition += 6;
      doc.text(`Successful: ${latestRun.successfulCount} | Failed: ${latestRun.failedCount}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Execution Time: ${new Date(latestRun.startTime).toLocaleString()}`, 20, yPosition);
      yPosition += 15;
      
      // Performance Graph (Simple bar representation)
      if (latestRun.apiRunResults && latestRun.apiRunResults.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Performance Timeline', 20, yPosition);
        yPosition += 10;
        
        // Draw simple bar chart
        const maxDuration = Math.max(...latestRun.apiRunResults.map(r => r.durationMs || 0));
        const barHeight = 8;
        const maxBarWidth = pageWidth - 100;
        
        latestRun.apiRunResults.forEach((result, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          
          const barWidth = (result.durationMs / maxDuration) * maxBarWidth;
          const color = result.status === 'SUCCESS' ? [34, 197, 94] : [239, 68, 68];
          
          doc.setFillColor(...color);
          doc.rect(70, yPosition - 5, barWidth, barHeight, 'F');
          
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(`${result.apiNodeName}`, 20, yPosition);
          doc.text(`${result.durationMs} ms`, 75 + barWidth, yPosition);
          
          yPosition += barHeight + 4;
        });
        
        yPosition += 10;
      }
    }
    
    // API Details Table
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('API Details', 20, yPosition);
    yPosition += 10;
    
    // Prepare table data
    const tableData = [];
    
    if (latestRun && latestRun.apiRunResults) {
      latestRun.apiRunResults.forEach((result) => {
        const node = nodes.find(n => n.id === result.apiNodeId);
        if (node) {
          tableData.push([
            result.apiNodeName || node.name,
            node.method,
            node.url,
            `${result.durationMs} ms`,
            result.status,
            result.statusCode || 'N/A'
          ]);
        }
      });
    } else {
      // If no execution results, show configured APIs
      nodes.forEach((node) => {
        tableData.push([
          node.name,
          node.method,
          node.url,
          'Not executed',
          'N/A',
          'N/A'
        ]);
      });
    }
    
    autoTable(doc, {
      startY: yPosition,
      head: [['API Name', 'Method', 'URL', 'Duration', 'Status', 'Code']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15 }
      }
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
    
    // Detailed API Information
    if (latestRun && latestRun.apiRunResults) {
      latestRun.apiRunResults.forEach((result, index) => {
        const node = nodes.find(n => n.id === result.apiNodeId);
        if (!node) return;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }
        
        // API Header
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${result.apiNodeName || node.name}`, 20, yPosition);
        yPosition += 8;
        
        // API Details
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Method: ${node.method}`, 25, yPosition);
        yPosition += 5;
        doc.text(`URL: ${node.url}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Duration: ${result.durationMs} ms`, 25, yPosition);
        yPosition += 5;
        doc.text(`Status: ${result.status} (${result.statusCode || 'N/A'})`, 25, yPosition);
        yPosition += 8;
        
        // Request Body
        if (result.request) {
          doc.setFont(undefined, 'bold');
          doc.text('Request Body:', 25, yPosition);
          yPosition += 5;
          doc.setFont(undefined, 'normal');
          
          const requestLines = doc.splitTextToSize(result.request, pageWidth - 50);
          requestLines.slice(0, 5).forEach(line => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 30, yPosition);
            yPosition += 4;
          });
          yPosition += 3;
        }
        
        // Response
        if (result.response) {
          doc.setFont(undefined, 'bold');
          doc.text('Response:', 25, yPosition);
          yPosition += 5;
          doc.setFont(undefined, 'normal');
          
          const responseLines = doc.splitTextToSize(result.response, pageWidth - 50);
          responseLines.slice(0, 5).forEach(line => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 30, yPosition);
            yPosition += 4;
          });
          yPosition += 3;
        }
        
        // Error Message
        if (result.errorMessage) {
          doc.setTextColor(239, 68, 68);
          doc.setFont(undefined, 'bold');
          doc.text('Error:', 25, yPosition);
          yPosition += 5;
          doc.setFont(undefined, 'normal');
          doc.text(result.errorMessage, 30, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 5;
        }
        
        yPosition += 10;
      });
    }
    
    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const fileName = `${groupName.replace(/[^a-z0-9]/gi, '_')}_execution_report_${Date.now()}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

// Fallback function if jsPDF is not installed
export const generateSimpleReport = (groupName, nodes, latestRun) => {
  let report = `API Execution Report\n`;
  report += `======================\n\n`;
  report += `Group: ${groupName}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (latestRun) {
    report += `Overall Performance:\n`;
    report += `- Status: ${latestRun.status}\n`;
    report += `- Total Duration: ${latestRun.totalDurationMs} ms\n`;
    report += `- Successful: ${latestRun.successfulCount} | Failed: ${latestRun.failedCount}\n\n`;
    
    if (latestRun.apiRunResults) {
      report += `API Details:\n`;
      report += `------------\n\n`;
      
      latestRun.apiRunResults.forEach((result, index) => {
        const node = nodes.find(n => n.id === result.apiNodeId);
        if (node) {
          report += `${index + 1}. ${result.apiNodeName || node.name}\n`;
          report += `   Method: ${node.method}\n`;
          report += `   URL: ${node.url}\n`;
          report += `   Duration: ${result.durationMs} ms\n`;
          report += `   Status: ${result.status}\n`;
          if (result.request) report += `   Request: ${result.request.substring(0, 100)}...\n`;
          if (result.response) report += `   Response: ${result.response.substring(0, 100)}...\n`;
          report += `\n`;
        }
      });
    }
  }
  
  // Download as text file
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${groupName.replace(/[^a-z0-9]/gi, '_')}_report_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { success: true, fileName: a.download };
};

// Made with Bob