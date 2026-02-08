// ============================================================
// PDF Export - Generate review report as PDF
// ============================================================
import jsPDF from 'jspdf';
import { AnalysisResult } from '@/types';

export function exportToPdf(analysis: AnalysisResult, scriptTitle: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper: add page if needed
  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper: add section title
  const addTitle = (text: string, fontSize: number = 14) => {
    checkPage(15);
    doc.setFontSize(fontSize);
    doc.setTextColor(59, 130, 246);
    doc.text(text, margin, y);
    y += fontSize * 0.5 + 2;
    doc.setDrawColor(59, 130, 246);
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;
    doc.setTextColor(30, 30, 30);
  };

  // Helper: add text
  const addText = (text: string, fontSize: number = 10, color: [number, number, number] = [30, 30, 30]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPage(lines.length * fontSize * 0.5 + 4);
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.5 + 4;
  };

  // ---- Title Page ----
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246);
  doc.text('Script Review Report', pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text(scriptTitle, pageWidth / 2, 65, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text(`Score: ${analysis.overallScore}/100`, pageWidth / 2, 80, { align: 'center' });
  doc.text(`Generated: ${new Date(analysis.createdAt).toLocaleDateString('ko-KR')}`, pageWidth / 2, 90, { align: 'center' });

  // Summary stats
  y = 110;
  const stats = [
    `Total Scenes: ${analysis.summary.totalScenes}`,
    `Total Characters: ${analysis.summary.totalCharacters}`,
    `Estimated Reading Time: ${analysis.summary.estimatedReadingTime}`,
    `Total Words: ${analysis.statistics.totalWords.toLocaleString()}`,
  ];
  stats.forEach(stat => {
    addText(stat, 11, [60, 60, 60]);
  });

  // ---- Issue Summary ----
  doc.addPage();
  y = margin;

  addTitle('Issue Summary', 16);

  const issueCounts = [
    { label: 'Structural Errors', count: analysis.structuralErrors.length, color: [239, 68, 68] as [number, number, number] },
    { label: 'Grammar Errors', count: analysis.grammarErrors.length, color: [234, 179, 8] as [number, number, number] },
    { label: 'Typos', count: analysis.typos.length, color: [249, 115, 22] as [number, number, number] },
    { label: 'Character Consistency Errors', count: analysis.characterErrors.length, color: [168, 85, 247] as [number, number, number] },
  ];

  issueCounts.forEach(issue => {
    addText(`${issue.label}: ${issue.count}`, 12, issue.color);
  });

  // ---- Structural Errors ----
  if (analysis.structuralErrors.length > 0) {
    y += 5;
    addTitle('Structural Errors (구조 오류)', 14);

    analysis.structuralErrors.forEach((err, i) => {
      checkPage(30);
      addText(`${i + 1}. [${err.severity.toUpperCase()}] ${err.location}`, 11, [200, 50, 50]);
      addText(`   ${err.description}`, 10);
      addText(`   Suggestion: ${err.suggestion}`, 10, [59, 130, 246]);
      y += 2;
    });
  }

  // ---- Grammar Errors ----
  if (analysis.grammarErrors.length > 0) {
    addTitle('Grammar Errors (문법 오류)', 14);

    analysis.grammarErrors.forEach((err, i) => {
      checkPage(25);
      addText(`${i + 1}. [${err.severity.toUpperCase()}] ${err.location}`, 11, [200, 150, 0]);
      addText(`   Original: ${err.original}`, 10);
      addText(`   Suggestion: ${err.suggestion}`, 10, [59, 130, 246]);
      y += 2;
    });
  }

  // ---- Typos ----
  if (analysis.typos.length > 0) {
    addTitle('Typos (오타)', 14);

    analysis.typos.forEach((typo, i) => {
      checkPage(20);
      addText(`${i + 1}. ${typo.location}: "${typo.original}" -> "${typo.correction}"`, 10, [200, 100, 0]);
      if (typo.context) {
        addText(`   Context: ${typo.context.slice(0, 80)}`, 9, [120, 120, 120]);
      }
      y += 2;
    });
  }

  // ---- Character Errors ----
  if (analysis.characterErrors.length > 0) {
    addTitle('Character Consistency Errors (인물 일관성 오류)', 14);

    analysis.characterErrors.forEach((err, i) => {
      checkPage(35);
      addText(`${i + 1}. [${err.severity.toUpperCase()}] ${err.characterName} - ${err.location}`, 11, [168, 85, 247]);
      addText(`   ${err.description}`, 10);
      addText(`   Evidence: ${err.evidence}`, 10, [120, 120, 120]);
      addText(`   Suggestion: ${err.suggestion}`, 10, [59, 130, 246]);
      y += 2;
    });
  }

  // ---- Scene Analysis ----
  if (analysis.sceneAnalysis.length > 0) {
    addTitle('Scene Analysis (씬 분석)', 14);

    analysis.sceneAnalysis.forEach((scene) => {
      checkPage(25);
      addText(`Scene ${scene.sceneNumber}: ${scene.title}`, 11, [59, 130, 246]);
      addText(`   Location: ${scene.location} | Characters: ${scene.characters.join(', ') || 'N/A'}`, 9, [120, 120, 120]);
      addText(`   Words: ${scene.wordCount} | Dialogue: ${scene.dialogueRatio}% | Action: ${scene.actionRatio}%`, 9, [120, 120, 120]);
      if (scene.issues.length > 0) {
        addText(`   Issues: ${scene.issues.join('; ')}`, 9, [200, 100, 0]);
      }
      y += 2;
    });
  }

  // ---- Statistics ----
  addTitle('Statistics (통계)', 14);

  addText(`Total Words: ${analysis.statistics.totalWords.toLocaleString()}`, 10);
  addText(`Total Lines: ${analysis.statistics.totalLines.toLocaleString()}`, 10);
  addText(`Dialogue: ${analysis.statistics.dialoguePercentage}% | Action: ${analysis.statistics.actionPercentage}%`, 10);
  addText(`Average Scene Length: ${analysis.statistics.averageSceneLength} words`, 10);

  if (analysis.statistics.characterDialogueDistribution.length > 0) {
    y += 3;
    addText('Character Dialogue Distribution:', 11, [59, 130, 246]);
    analysis.statistics.characterDialogueDistribution.slice(0, 10).forEach(char => {
      addText(`   ${char.character}: ${char.percentage}% (${char.lineCount} lines)`, 10);
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Script Review Agent - Page ${i}/${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`${scriptTitle}_review_report.pdf`);
}
