// PDF Generation utility for API execution reports with enhanced charts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateExecutionReportPDF = (groupName, nodes, latestRun) => {
  try {
    // Debug logging
    console.log('PDF Generator - Input Data:', {
      groupName,
      nodesCount: nodes?.length,
      latestRun: latestRun,
      hasApiRunResults: latestRun?.apiRunResults?.length
    });
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('API Execution Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;
    
    // Group Name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246);
    doc.text(`Group: ${groupName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    // Execution Date
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Draw separator line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;
    
    // Overall Performance Summary
    if (latestRun) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Overall Performance Summary', 20, yPosition);
      yPosition += 10;
      
      // Performance metrics in boxes
      const boxWidth = (pageWidth - 60) / 3;
      const boxHeight = 25;
      const boxY = yPosition;
      
      // Calculate success/failure counts from apiRunResults
      const apiResults = latestRun.apiRunResults || [];
      const successfulCount = apiResults.filter(r => r.status === 'SUCCESS').length;
      const failedCount = apiResults.filter(r => r.status === 'FAILED').length;
      const totalAPIs = apiResults.length;
      const successRate = totalAPIs > 0 ? (successfulCount / totalAPIs * 100) : 0;
      doc.setFillColor(16, 185, 129);
      doc.rect(20, boxY, boxWidth, boxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${successRate.toFixed(0)}%`, 20 + boxWidth / 2, boxY + 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Success Rate', 20 + boxWidth / 2, boxY + 19, { align: 'center' });
      
      // Total Duration Box - sum all durations
      const totalDuration = apiResults.reduce((sum, r) => sum + (r.duration || 0), 0);
      doc.setFillColor(59, 130, 246);
      doc.rect(30 + boxWidth, boxY, boxWidth, boxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalDuration}ms`, 30 + boxWidth + boxWidth / 2, boxY + 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Duration', 30 + boxWidth + boxWidth / 2, boxY + 19, { align: 'center' });
      
      // API Count Box
      doc.setFillColor(139, 92, 246);
      doc.rect(40 + boxWidth * 2, boxY, boxWidth, boxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${totalAPIs}`, 40 + boxWidth * 2 + boxWidth / 2, boxY + 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Total APIs', 40 + boxWidth * 2 + boxWidth / 2, boxY + 19, { align: 'center' });
      
      yPosition += boxHeight + 15;
      
      // Additional metrics
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${latestRun.status || 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Successful: ${successfulCount} | Failed: ${failedCount}`, 20, yPosition);
      yPosition += 6;
      const executionTime = latestRun.executedAt ? new Date(latestRun.executedAt).toLocaleString() : 'N/A';
      doc.text(`Execution Time: ${executionTime}`, 20, yPosition);
      yPosition += 15;
      
      // Performance Chart
      if (latestRun.apiRunResults && latestRun.apiRunResults.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Performance Timeline', 20, yPosition);
        yPosition += 10;
        
        // Draw enhanced bar chart
        const chartHeight = Math.min(latestRun.apiRunResults.length * 12, 80);
        const chartWidth = pageWidth - 100;
        const chartX = 70;
        const chartY = yPosition;
        
        // Draw chart background
        doc.setFillColor(249, 250, 251);
        doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
        
        // Draw grid lines
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        for (let i = 0; i <= 4; i++) {
          const x = chartX + (chartWidth / 4) * i;
          doc.line(x, chartY, x, chartY + chartHeight);
        }
        
        const maxDuration = Math.max(...latestRun.apiRunResults.map(r => r.duration || 0), 1);
        const barHeight = Math.min(chartHeight / latestRun.apiRunResults.length - 2, 8);
        
        latestRun.apiRunResults.forEach((result, index) => {
          const barY = chartY + (index * (chartHeight / latestRun.apiRunResults.length)) + 2;
          const duration = result.duration || 0;
          const barWidth = Math.max((duration / maxDuration) * (chartWidth - 10), 1);
          
          // Color based on status
          if (result.status === 'SUCCESS') {
            doc.setFillColor(16, 185, 129);
          } else {
            doc.setFillColor(239, 68, 68);
          }
          
          // Draw bar - ensure positive dimensions
          if (barWidth > 0 && barHeight > 0) {
            doc.rect(chartX + 5, barY, barWidth, barHeight, 'F');
          }
          
          // API name (truncated if too long)
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(31, 41, 55);
          const apiName = (result.apiNodeName || 'Unknown').length > 15 
            ? (result.apiNodeName || 'Unknown').substring(0, 15) + '...' 
            : (result.apiNodeName || 'Unknown');
          doc.text(apiName, 20, barY + barHeight - 1);
          
          // Duration label
          doc.setTextColor(107, 114, 128);
          doc.text(`${duration}ms`, chartX + barWidth + 8, barY + barHeight - 1);
        });
        
        // Chart legend
        yPosition = chartY + chartHeight + 8;
        doc.setFontSize(8);
        doc.setFillColor(16, 185, 129);
        doc.circle(20, yPosition - 1, 2, 'F');
        doc.setTextColor(107, 114, 128);
        doc.text('Success', 25, yPosition);
        
        doc.setFillColor(239, 68, 68);
        doc.circle(55, yPosition - 1, 2, 'F');
        doc.text('Failed', 60, yPosition);
        
        yPosition += 10;
      }
    }
    
    // Add new page for detailed results
    doc.addPage();
    yPosition = 20;
    
    // API Details Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('API Execution Details', 20, yPosition);
    yPosition += 10;
    
    // Detailed API Information
    if (latestRun && latestRun.apiRunResults) {
      latestRun.apiRunResults.forEach((result, index) => {
        const node = nodes.find(n => n.id === result.apiNodeId);
        if (!node) return;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }
        
        // API Header with colored background
        const headerColor = result.status === 'SUCCESS' ? [16, 185, 129] : [239, 68, 68];
        doc.setFillColor(...headerColor);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${index + 1}. ${result.apiNodeName || node.name}`, 25, yPosition + 2);
        yPosition += 12;
        
        // API Details Box
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.rect(20, yPosition, pageWidth - 40, 30, 'FD');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Method:', 25, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(59, 130, 246);
        doc.text(node.method, 50, yPosition + 6);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('URL:', 25, yPosition + 12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const urlText = node.url.length > 60 ? node.url.substring(0, 60) + '...' : node.url;
        doc.text(urlText, 50, yPosition + 12);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Duration:', 25, yPosition + 18);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(`${result.duration || 0} ms`, 50, yPosition + 18);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Status:', 25, yPosition + 24);
        doc.setFont('helvetica', 'normal');
        const statusColor = result.status === 'SUCCESS' ? [16, 185, 129] : [239, 68, 68];
        doc.setTextColor(...statusColor);
        doc.text(`${result.status} (${result.statusCode || 'N/A'})`, 50, yPosition + 24);
        
        yPosition += 35;
        
        // Request Body
        if (result.requestBody) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text('Request Body:', 25, yPosition);
          yPosition += 6;
          
          doc.setFontSize(8);
          doc.setFont('courier', 'normal');
          doc.setTextColor(107, 114, 128);
          
          const requestLines = doc.splitTextToSize(result.requestBody, pageWidth - 60);
          const maxLinesPerPage = 15; // Show more lines
          
          for (let i = 0; i < requestLines.length; i++) {
            // Check if we need a new page
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(31, 41, 55);
              doc.text('Request Body (continued):', 25, yPosition);
              yPosition += 6;
              doc.setFontSize(8);
              doc.setFont('courier', 'normal');
              doc.setTextColor(107, 114, 128);
            }
            
            doc.text(requestLines[i], 30, yPosition);
            yPosition += 4;
            
            // Limit to maxLinesPerPage to avoid extremely long outputs
            if (i >= maxLinesPerPage - 1 && requestLines.length > maxLinesPerPage) {
              doc.text(`... (${requestLines.length - maxLinesPerPage} more lines)`, 30, yPosition);
              yPosition += 4;
              break;
            }
          }
          
          yPosition += 5;
        }
        
        // Response
        if (result.response) {
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text('Response:', 25, yPosition);
          yPosition += 6;
          
          doc.setFontSize(8);
          doc.setFont('courier', 'normal');
          doc.setTextColor(107, 114, 128);
          
          const responseLines = doc.splitTextToSize(result.response, pageWidth - 60);
          const maxLinesPerPage = 15; // Show more lines
          
          for (let i = 0; i < responseLines.length; i++) {
            // Check if we need a new page
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(31, 41, 55);
              doc.text('Response (continued):', 25, yPosition);
              yPosition += 6;
              doc.setFontSize(8);
              doc.setFont('courier', 'normal');
              doc.setTextColor(107, 114, 128);
            }
            
            doc.text(responseLines[i], 30, yPosition);
            yPosition += 4;
            
            // Limit to maxLinesPerPage to avoid extremely long outputs
            if (i >= maxLinesPerPage - 1 && responseLines.length > maxLinesPerPage) {
              doc.text(`... (${responseLines.length - maxLinesPerPage} more lines)`, 30, yPosition);
              yPosition += 4;
              break;
            }
          }
          
          yPosition += 5;
        }
        
        // Error Message
        if (result.error) {
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(239, 68, 68);
          doc.rect(25, yPosition, pageWidth - 50, 15, 'FD');
          
          doc.setTextColor(239, 68, 68);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Error:', 30, yPosition + 6);
          doc.setFont('helvetica', 'normal');
          const errorText = result.error.length > 80 ? result.error.substring(0, 80) + '...' : result.error;
          doc.text(errorText, 30, yPosition + 11);
          yPosition += 20;
        }
        
        yPosition += 10;
      });
    }
    
    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Page ${i} of ${totalPages} | Generated by API Flow Orchestrator`,
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

// Fallback function if jsPDF fails
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