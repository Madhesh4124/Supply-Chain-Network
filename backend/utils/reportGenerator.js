const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF Report
 */
const generatePDFReport = async (data, filename = 'supply-chain-report.pdf') => {
  try {
    const doc = new jsPDF();
    const reportPath = path.join('backend/reports', filename);

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Supply Chain Network Analysis Report', 105, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

    let yPosition = 40;

    // Network Statistics
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Network Statistics', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (data.networkStats) {
      const stats = [
        ['Total Nodes', data.networkStats.totalNodes || 0],
        ['Total Routes', data.networkStats.totalEdges || 0],
        ['Network Density', (data.networkStats.density || 0).toFixed(4)],
        ['Average Degree', (data.networkStats.averageDegree || 0).toFixed(2)],
        ['Clustering Coefficient', (data.networkStats.globalClusteringCoefficient || 0).toFixed(4)]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: stats,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Health Score
    if (data.healthScore !== undefined) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Network Health', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Health Score: ${data.healthScore}/100 - ${data.healthStatus || 'N/A'}`, 14, yPosition);
      yPosition += 10;
    }

    // Critical Nodes
    if (data.criticalNodes && data.criticalNodes.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Critical Nodes', 14, yPosition);
      yPosition += 10;

      const criticalNodesData = data.criticalNodes.slice(0, 10).map(node => [
        node.nodeId,
        node.criticalityScore.toFixed(4),
        node.degreeScore,
        node.betweennessScore.toFixed(4)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Node ID', 'Criticality Score', 'Degree', 'Betweenness']],
        body: criticalNodesData,
        theme: 'striped',
        headStyles: { fillColor: [217, 83, 79] }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Bottlenecks
    if (data.bottlenecks && data.bottlenecks.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Bottleneck Nodes', 14, yPosition);
      yPosition += 10;

      const bottlenecksData = data.bottlenecks.slice(0, 10).map(node => [
        node.nodeId,
        node.betweennessScore.toFixed(4),
        node.totalDegree,
        node.normalizedScore.toFixed(4)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Node ID', 'Betweenness', 'Total Degree', 'Normalized Score']],
        body: bottlenecksData,
        theme: 'striped',
        headStyles: { fillColor: [240, 173, 78] }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Recommendations', 14, yPosition);
      yPosition += 10;

      const recommendationsData = data.recommendations.map(rec => [
        rec.priority.toUpperCase(),
        rec.issue,
        rec.action
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Priority', 'Issue', 'Action']],
        body: recommendationsData,
        theme: 'grid',
        headStyles: { fillColor: [92, 184, 92] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 60 },
          2: { cellWidth: 95 }
        }
      });
    }

    // Save PDF
    doc.save(reportPath);
    
    return reportPath;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

/**
 * Generate Excel Report
 */
const generateExcelReport = async (data, filename = 'supply-chain-report.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const reportPath = path.join('backend/reports', filename);

    // Worksheet 1: Network Statistics
    const statsSheet = workbook.addWorksheet('Network Statistics');
    
    statsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    // Style header
    statsSheet.getRow(1).font = { bold: true, size: 12 };
    statsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF428BCA' }
    };

    if (data.networkStats) {
      statsSheet.addRows([
        { metric: 'Total Nodes', value: data.networkStats.totalNodes || 0 },
        { metric: 'Total Routes', value: data.networkStats.totalEdges || 0 },
        { metric: 'Network Density', value: (data.networkStats.density || 0).toFixed(4) },
        { metric: 'Average Degree', value: (data.networkStats.averageDegree || 0).toFixed(2) },
        { metric: 'Clustering Coefficient', value: (data.networkStats.globalClusteringCoefficient || 0).toFixed(4) }
      ]);
    }

    if (data.healthScore !== undefined) {
      statsSheet.addRow({ metric: 'Health Score', value: `${data.healthScore}/100` });
      statsSheet.addRow({ metric: 'Health Status', value: data.healthStatus || 'N/A' });
    }

    // Worksheet 2: Node Metrics
    if (data.nodeMetrics) {
      const metricsSheet = workbook.addWorksheet('Node Metrics');
      
      metricsSheet.columns = [
        { header: 'Node ID', key: 'nodeId', width: 15 },
        { header: 'Degree Centrality', key: 'degree', width: 18 },
        { header: 'Betweenness', key: 'betweenness', width: 15 },
        { header: 'Closeness', key: 'closeness', width: 15 },
        { header: 'Clustering', key: 'clustering', width: 15 },
        { header: 'In Degree', key: 'inDegree', width: 12 },
        { header: 'Out Degree', key: 'outDegree', width: 12 },
        { header: 'Is Bottleneck', key: 'isBottleneck', width: 15 },
        { header: 'Is Critical', key: 'isCritical', width: 12 }
      ];

      metricsSheet.getRow(1).font = { bold: true, size: 11 };
      metricsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5CB85C' }
      };

      Object.entries(data.nodeMetrics).forEach(([nodeId, metrics]) => {
        metricsSheet.addRow({
          nodeId,
          degree: metrics.degreeCentrality.toFixed(4),
          betweenness: metrics.betweennessCentrality.toFixed(4),
          closeness: metrics.closenessCentrality.toFixed(4),
          clustering: metrics.clusteringCoefficient.toFixed(4),
          inDegree: metrics.inDegree,
          outDegree: metrics.outDegree,
          isBottleneck: metrics.isBottleneck ? 'Yes' : 'No',
          isCritical: metrics.isCritical ? 'Yes' : 'No'
        });
      });
    }

    // Worksheet 3: Critical Nodes
    if (data.criticalNodes && data.criticalNodes.length > 0) {
      const criticalSheet = workbook.addWorksheet('Critical Nodes');
      
      criticalSheet.columns = [
        { header: 'Node ID', key: 'nodeId', width: 15 },
        { header: 'Criticality Score', key: 'criticalityScore', width: 18 },
        { header: 'Degree Score', key: 'degreeScore', width: 15 },
        { header: 'Betweenness Score', key: 'betweennessScore', width: 20 },
        { header: 'In Degree', key: 'inDegree', width: 12 },
        { header: 'Out Degree', key: 'outDegree', width: 12 }
      ];

      criticalSheet.getRow(1).font = { bold: true, size: 11 };
      criticalSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9534F' }
      };

      data.criticalNodes.forEach(node => {
        criticalSheet.addRow({
          nodeId: node.nodeId,
          criticalityScore: node.criticalityScore.toFixed(4),
          degreeScore: node.degreeScore,
          betweennessScore: node.betweennessScore.toFixed(4),
          inDegree: node.inDegree,
          outDegree: node.outDegree
        });
      });
    }

    // Worksheet 4: Bottlenecks
    if (data.bottlenecks && data.bottlenecks.length > 0) {
      const bottleneckSheet = workbook.addWorksheet('Bottlenecks');
      
      bottleneckSheet.columns = [
        { header: 'Node ID', key: 'nodeId', width: 15 },
        { header: 'Betweenness Score', key: 'betweennessScore', width: 20 },
        { header: 'Normalized Score', key: 'normalizedScore', width: 18 },
        { header: 'Total Degree', key: 'totalDegree', width: 15 },
        { header: 'In Degree', key: 'inDegree', width: 12 },
        { header: 'Out Degree', key: 'outDegree', width: 12 }
      ];

      bottleneckSheet.getRow(1).font = { bold: true, size: 11 };
      bottleneckSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0AD4E' }
      };

      data.bottlenecks.forEach(node => {
        bottleneckSheet.addRow({
          nodeId: node.nodeId,
          betweennessScore: node.betweennessScore.toFixed(4),
          normalizedScore: node.normalizedScore.toFixed(4),
          totalDegree: node.totalDegree,
          inDegree: node.inDegree,
          outDegree: node.outDegree
        });
      });
    }

    // Worksheet 5: Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      const recSheet = workbook.addWorksheet('Recommendations');
      
      recSheet.columns = [
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Issue', key: 'issue', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Action', key: 'action', width: 50 }
      ];

      recSheet.getRow(1).font = { bold: true, size: 11 };
      recSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5BC0DE' }
      };

      data.recommendations.forEach(rec => {
        recSheet.addRow({
          priority: rec.priority.toUpperCase(),
          issue: rec.issue,
          description: rec.description,
          action: rec.action
        });
      });
    }

    // Save Excel file
    await workbook.xlsx.writeFile(reportPath);
    
    return reportPath;
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
};

/**
 * Delete report file
 */
const deleteReport = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting report:', error);
    return false;
  }
};

module.exports = {
  generatePDFReport,
  generateExcelReport,
  deleteReport
};
