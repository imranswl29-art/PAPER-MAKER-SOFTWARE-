import { GeneratedExamPaper } from '../types/paper';

/**
 * High-Precision MS Word (.doc) Exporter for Pakistani Board Exam Papers
 * Engineered specifically for Microsoft Word rendering engine (Word 2010 to 365)
 * - Employs strict HTML 4.0 / MSO-compliant XML tables
 * - Eliminates text overlapping and column squeezing
 * - Two-column option layout (2x2 grid) for MCQs so English and Urdu have abundant space
 * - Dedicated RTL support for Urdu Nastaleeq typography
 * - Prevents awkward page breaks inside questions
 */
export function exportPaperToWord(
  paper: GeneratedExamPaper,
  targetSection: 'all' | 'objective' | 'subjective' = 'all'
) {
  const { header, objectiveSection, subjectiveSection, languageMode } = paper;
  const paperCode = '50' + (Math.floor(Math.random() * 89) + 10);

  // Generate MCQs in a clean, non-overlapping format:
  // Generate MCQs in a clean, non-overlapping format:
  const mcqsRows = (objectiveSection.questions || [])
    .map((m) => {
      const isEnglishOnly = languageMode === 'english';
      const isUrduOnly = languageMode === 'urdu';
      const isBilingual = languageMode === 'bilingual';

      const optA = m.options.find((o) => o.key === 'A') || m.options[0] || { key: 'A', textEn: '', textUr: '' };
      const optB = m.options.find((o) => o.key === 'B') || m.options[1] || { key: 'B', textEn: '', textUr: '' };
      const optC = m.options.find((o) => o.key === 'C') || m.options[2] || { key: 'C', textEn: '', textUr: '' };
      const optD = m.options.find((o) => o.key === 'D') || m.options[3] || { key: 'D', textEn: '', textUr: '' };

      const renderOptionContent = (opt: { key: string; textEn: string; textUr?: string }) => {
        if (isEnglishOnly) {
          return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td width="22" valign="top" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10pt; color:#1e293b;">
                  (${opt.key})
                </td>
                <td valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10pt; color:#0f172a; padding-left:3pt;">
                  ${opt.textEn || ''}
                </td>
              </tr>
            </table>
          `;
        }

        if (isUrduOnly) {
          return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;" dir="rtl">
              <tr>
                <td width="22" valign="top" align="right" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10pt; color:#1e293b;">
                  (${opt.key})
                </td>
                <td valign="top" align="right" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:11.5pt; color:#0f172a; padding-right:4pt; text-align:right;">
                  ${opt.textUr || opt.textEn || ''}
                </td>
              </tr>
            </table>
          `;
        }

        // Bilingual
        const hasUrduOpt = opt.textUr && opt.textUr !== opt.textEn;
        return `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td width="18" valign="top" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10pt; color:#1e293b;">
                (${opt.key})
              </td>
              <td valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10pt; color:#0f172a; padding-left:3pt;">
                ${opt.textEn || ''}
              </td>
              ${
                hasUrduOpt
                  ? `<td width="42%" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:11pt; color:#0f172a; text-align:right;">
                      ${opt.textUr}
                    </td>`
                  : ''
              }
            </tr>
          </table>
        `;
      };

      const statementRow = isEnglishOnly
        ? `
          <tr style="background-color:#f8fafc;">
            <td colspan="2" valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10.5pt; font-weight:bold; color:#0f172a; border-left:3pt solid #1e293b; padding:5pt 8pt;">
              <span style="font-size:11pt; color:#1e3a8a;">Q.${m.qNo}.</span> ${m.statementEn}
            </td>
          </tr>
        `
        : isUrduOnly
        ? `
          <tr style="background-color:#f8fafc;">
            <td colspan="2" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12.5pt; font-weight:bold; color:#0f172a; text-align:right; border-right:3pt solid #1e293b; padding:5pt 8pt;">
              <span style="font-size:11pt; color:#1e3a8a; font-family:'Arial',sans-serif; direction:ltr;">Q.${m.qNo}.</span> ${m.statementUr || m.statementEn}
            </td>
          </tr>
        `
        : `
          <tr style="background-color:#f8fafc;">
            <td width="55%" valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10.5pt; font-weight:bold; color:#0f172a; border-left:3pt solid #1e293b; padding:5pt 8pt;">
              <span style="font-size:11pt; color:#1e3a8a;">Q.${m.qNo}.</span> ${m.statementEn}
            </td>
            <td width="45%" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#0f172a; text-align:right; border-right:3pt solid #1e293b; padding:5pt 8pt;">
              ${m.statementUr || ''}
            </td>
          </tr>
        `;

      return `
      <!-- MCQ ITEM Q.${m.qNo} -->
      <table width="100%" cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom:6pt; page-break-inside:avoid; border-bottom:1pt solid #cbd5e1;">
        <!-- Question Statement Row -->
        ${statementRow}

        <!-- Options Row 1 (A & B) -->
        <tr>
          <td width="50%" valign="top" style="padding:4pt 8pt; border-top:1pt dotted #e2e8f0; border-right:1pt dotted #e2e8f0;">
            ${renderOptionContent(optA)}
          </td>
          <td width="50%" valign="top" style="padding:4pt 8pt; border-top:1pt dotted #e2e8f0;">
            ${renderOptionContent(optB)}
          </td>
        </tr>

        <!-- Options Row 2 (C & D) -->
        <tr>
          <td width="50%" valign="top" style="padding:4pt 8pt; border-top:1pt dotted #e2e8f0; border-right:1pt dotted #e2e8f0;">
            ${renderOptionContent(optC)}
          </td>
          <td width="50%" valign="top" style="padding:4pt 8pt; border-top:1pt dotted #e2e8f0;">
            ${renderOptionContent(optD)}
          </td>
        </tr>
      </table>
      `;
    })
    .join('');

  // Short Question Groups
  const shortQuestionGroupsHtml = (subjectiveSection.part1_shortQuestions || [])
    .map((grp) => {
      const isEnglishOnly = languageMode === 'english';
      const isUrduOnly = languageMode === 'urdu';

      const questionsRows = (grp.questions || [])
        .map((q, idx) => {
          if (isEnglishOnly) {
            return `
            <tr style="page-break-inside:avoid; border-bottom:1pt dotted #cbd5e1;">
              <td width="5%" valign="top" align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10.5pt; color:#1e3a8a; padding:6pt 2pt;">
                (${idx + 1})
              </td>
              <td width="95%" valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10.5pt; color:#0f172a; padding:6pt 6pt; line-height:1.35;">
                ${q.statementEn}
              </td>
            </tr>`;
          }

          if (isUrduOnly) {
            return `
            <tr style="page-break-inside:avoid; border-bottom:1pt dotted #cbd5e1;" dir="rtl">
              <td width="5%" valign="top" align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10.5pt; color:#1e3a8a; padding:6pt 2pt;">
                (${idx + 1})
              </td>
              <td width="95%" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12.5pt; color:#0f172a; text-align:right; padding:6pt 6pt; line-height:1.5;">
                ${q.statementUr || q.statementEn}
              </td>
            </tr>`;
          }

          return `
          <tr style="page-break-inside:avoid; border-bottom:1pt dotted #cbd5e1;">
            <td width="4%" valign="top" align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10.5pt; color:#1e3a8a; padding:6pt 2pt;">
              (${idx + 1})
            </td>
            <td width="56%" valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10.5pt; color:#0f172a; padding:6pt 6pt; line-height:1.35;">
              ${q.statementEn}
            </td>
            <td width="40%" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; color:#0f172a; text-align:right; padding:6pt 6pt; line-height:1.45;">
              ${q.statementUr || ''}
            </td>
          </tr>`;
        })
        .join('');

      const groupHeader = isEnglishOnly
        ? `
        <tr style="background-color:#0f172a; color:#ffffff;">
          <td colspan="2" valign="middle" style="padding:6pt 10pt; font-family:'Calibri','Arial',sans-serif; font-size:11pt; font-weight:bold; color:#ffffff;">
            Q.${grp.qNo}: ${grp.instructionEn} (${grp.attemptCount} &times; ${grp.marksEach} = ${grp.attemptCount * grp.marksEach} Marks)
          </td>
        </tr>`
        : isUrduOnly
        ? `
        <tr style="background-color:#0f172a; color:#ffffff;">
          <td colspan="2" align="right" dir="rtl" valign="middle" style="padding:6pt 10pt; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#ffffff; text-align:right;">
            سوال نمبر ${grp.qNo}: ${grp.instructionUr} (${grp.attemptCount} &times; ${grp.marksEach} = ${grp.attemptCount * grp.marksEach} نمبر)
          </td>
        </tr>`
        : `
        <tr style="background-color:#0f172a; color:#ffffff;">
          <td width="60%" valign="middle" style="padding:6pt 10pt; font-family:'Calibri','Arial',sans-serif; font-size:11pt; font-weight:bold; color:#ffffff;">
            Q.${grp.qNo}: ${grp.instructionEn} (${grp.attemptCount} &times; ${grp.marksEach} = ${grp.attemptCount * grp.marksEach} Marks)
          </td>
          <td width="40%" align="right" dir="rtl" valign="middle" style="padding:6pt 10pt; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#ffffff; text-align:right;">
            ${grp.instructionUr}
          </td>
        </tr>`;

      return `
      <!-- SHORT QUESTIONS GROUP Q.${grp.qNo} -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom:12pt; page-break-inside:avoid; border:1pt solid #94a3b8;">
        <!-- Group Header Bar -->
        ${groupHeader}
        <tr>
          <td colspan="2" style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${questionsRows}
            </table>
          </td>
        </tr>
      </table>
      `;
    })
    .join('');

  // Long Questions
  const longQuestionsHtml = (subjectiveSection.part2_longQuestions?.questions || [])
    .map((lq) => {
      const isEnglishOnly = languageMode === 'english';
      const isUrduOnly = languageMode === 'urdu';

      const partsRows = (lq.parts || [])
        .map((p) => {
          if (isEnglishOnly) {
            return `
            <tr style="page-break-inside:avoid; border-top:1pt dotted #cbd5e1;">
              <td width="5%" valign="top" align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:11pt; color:#b91c1c; padding:6pt 2pt;">
                (${p.partLabel})
              </td>
              <td width="87%" valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10.5pt; color:#0f172a; padding:6pt 6pt; line-height:1.35;">
                ${p.statementEn}
              </td>
              <td width="8%" align="right" valign="top" style="font-weight:bold; font-family:'Calibri',sans-serif; font-size:10pt; color:#475569; padding:6pt 4pt; text-align:right;">
                [${p.marks} M]
              </td>
            </tr>`;
          }

          if (isUrduOnly) {
            return `
            <tr style="page-break-inside:avoid; border-top:1pt dotted #cbd5e1;" dir="rtl">
              <td width="5%" valign="top" align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:11pt; color:#b91c1c; padding:6pt 2pt;">
                (${p.partLabel})
              </td>
              <td width="87%" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12.5pt; color:#0f172a; text-align:right; padding:6pt 6pt; line-height:1.5;">
                ${p.statementUr || p.statementEn}
              </td>
              <td width="8%" align="right" valign="top" style="font-weight:bold; font-family:'Calibri',sans-serif; font-size:10pt; color:#475569; padding:6pt 4pt; text-align:right;">
                [${p.marks} M]
              </td>
            </tr>`;
          }

          return `
          <tr style="page-break-inside:avoid; border-top:1pt dotted #cbd5e1;">
            <td width="5%" valign="top" align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:11pt; color:#b91c1c; padding:6pt 2pt;">
              (${p.partLabel})
            </td>
            <td width="55%" valign="top" style="font-family:'Calibri','Arial',sans-serif; font-size:10.5pt; color:#0f172a; padding:6pt 6pt; line-height:1.35;">
              ${p.statementEn}
            </td>
            <td width="32%" align="right" dir="rtl" valign="top" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; color:#0f172a; text-align:right; padding:6pt 6pt; line-height:1.45;">
              ${p.statementUr || ''}
            </td>
            <td width="8%" align="right" valign="top" style="font-weight:bold; font-family:'Calibri',sans-serif; font-size:10pt; color:#475569; padding:6pt 4pt; text-align:right;">
              [${p.marks} M]
            </td>
          </tr>`;
        })
        .join('');

      return `
      <!-- LONG QUESTION ITEM Q.${lq.qNo} -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom:10pt; page-break-inside:avoid; border:1pt solid #cbd5e1; background-color:#ffffff;">
        <tr style="background-color:#f1f5f9;">
          <td colspan="4" style="padding:6pt 10pt; font-family:'Calibri','Arial',sans-serif; font-size:11pt; font-weight:bold; color:#0f172a; border-bottom:1.5pt solid #94a3b8;">
            Question #${lq.qNo} &nbsp;&mdash;&nbsp; (Total: ${lq.totalMarks} Marks)
          </td>
        </tr>
        <tr>
          <td colspan="4" style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              ${partsRows}
            </table>
          </td>
        </tr>
      </table>
      `;
    })
    .join('');

  const fullWordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>${header.instituteName} - ${header.classLevel} ${header.subjectName}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        <w:Compatibility>
          <w:UseWord2002TableStyleRules/>
        </w:Compatibility>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page Section1 {
        size: 595.3pt 841.9pt; /* A4 Portrait */
        margin: 32.0pt 32.0pt 32.0pt 32.0pt;
        mso-header-margin: 18.0pt;
        mso-footer-margin: 18.0pt;
        mso-paper-source: 0;
      }
      div.Section1 { page: Section1; }
      body {
        font-family: 'Calibri', 'Segoe UI', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.35;
        color: #0f172a;
        margin: 0;
        padding: 0;
      }
      table {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-collapse: collapse;
      }
      td {
        mso-line-height-rule: exactly;
      }
      .sec-banner {
        background-color: #0f172a;
        color: #ffffff;
        font-weight: bold;
        text-align: center;
        padding: 5pt;
        font-size: 11.5pt;
        font-family: 'Calibri', 'Arial', sans-serif;
        letter-spacing: 0.5pt;
        margin-top: 10pt;
        margin-bottom: 8pt;
      }
    </style>
  </head>
  <body>
    <div class="Section1">
      <!-- INSTITUTIONAL BOARD HEADER -->
      <table width="100%" cellpadding="6" cellspacing="0" border="1" style="border:2pt solid #0f172a; border-collapse:collapse; margin-bottom:12pt; background-color:#ffffff;">
        <tr>
          <td colspan="3" align="center" style="padding:10pt 6pt 6pt 6pt; border-bottom:1.5pt solid #0f172a; text-align:center;">
            <div style="font-size:18pt; font-weight:900; font-family:'Arial Black','Arial',sans-serif; text-transform:uppercase; color:#0f172a; letter-spacing:1pt;">
              ${header.instituteName}
            </div>
            ${
              header.campusName
                ? `<div style="font-size:10.5pt; font-weight:bold; color:#475569; margin-top:2pt;">${header.campusName}</div>`
                : ''
            }
            <div style="font-size:11pt; font-weight:bold; color:#1e293b; margin-top:4pt; text-transform:uppercase;">
              ${header.examTitle} &nbsp;&bull;&nbsp; ${header.boardPattern || 'BISE Punjab Curriculum'}
            </div>
          </td>
        </tr>

        <!-- Metadata Row 1 -->
        <tr style="background-color:#f8fafc; font-size:10pt;">
          <td width="33%" style="padding:4pt 8pt; border:1pt solid #cbd5e1;"><strong>Class:</strong> ${header.classLevel}</td>
          <td width="34%" align="center" style="padding:4pt 8pt; border:1pt solid #cbd5e1; text-align:center;"><strong>Subject:</strong> ${header.subjectName}</td>
          <td width="33%" align="right" style="padding:4pt 8pt; border:1pt solid #cbd5e1; text-align:right;"><strong>Date:</strong> ${header.dateStr}</td>
        </tr>

        <!-- Metadata Row 2 -->
        <tr style="background-color:#ffffff; font-size:10pt;">
          <td width="33%" style="padding:4pt 8pt; border:1pt solid #cbd5e1;"><strong>Total Marks:</strong> ${header.totalMarks}</td>
          <td width="34%" align="center" style="padding:4pt 8pt; border:1pt solid #cbd5e1; text-align:center;"><strong>Time Allowed:</strong> ${header.timeAllowed}</td>
          <td width="33%" align="right" style="padding:4pt 8pt; border:1pt solid #cbd5e1; text-align:right;"><strong>Group:</strong> Science Group</td>
        </tr>

        <!-- Syllabus Row -->
        <tr>
          <td colspan="3" style="padding:4pt 8pt; border:1pt solid #cbd5e1; font-size:9.5pt; color:#334155; background-color:#f8fafc;">
            <strong>Syllabus / Units Covered:</strong> ${header.syllabusCovered}
          </td>
        </tr>

        <!-- Student Signature Row -->
        <tr>
          <td colspan="3" style="padding:6pt 8pt; border-top:1.5pt dashed #94a3b8; font-size:9.5pt;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40%"><strong>Student Name:</strong> _______________________</td>
                <td width="35%"><strong>Roll No:</strong> _______________</td>
                <td width="25%" align="right"><strong>Section:</strong> ________</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${
        targetSection === 'all' || targetSection === 'objective'
          ? `
      <!-- OBJECTIVE SECTION BANNER -->
      <table width="100%" cellpadding="6" cellspacing="0" border="0" style="background-color:#0f172a; color:#ffffff; margin-top:10pt; margin-bottom:6pt;">
        <tr>
          <td align="center" style="font-family:'Calibri','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#ffffff; text-align:center;">
            ${languageMode === 'urdu' ? (objectiveSection.titleUr || 'حصہ اول (معروضی طرز)') : (objectiveSection.titleEn || 'SECTION - A (OBJECTIVE TYPE)')} &nbsp;&mdash;&nbsp; (${objectiveSection.totalMarks} ${languageMode === 'urdu' ? 'نمبر' : 'Marks'} &bull; ${objectiveSection.timeAllowed || '15 Minutes'})
          </td>
        </tr>
      </table>

      <!-- INSTRUCTIONS -->
      <div style="font-size:9.5pt; font-style:italic; margin-bottom:8pt; color:#334155; padding-left:4pt; ${languageMode === 'urdu' ? 'text-align:right; font-family:\'Jameel Noori Nastaleeq\',\'Arial\',sans-serif; direction:rtl;' : ''}">
        ${languageMode === 'urdu' ? (objectiveSection.instructionsUr || 'نوٹ: ہر سوال کے چار ممکنہ جوابات A, B, C اور D دیے گئے ہیں۔ درست جواب منتخب کریں۔') : languageMode === 'english' ? (objectiveSection.instructionsEn || 'Note: Four possible answers A, B, C and D to each question are given. Choose the correct answer.') : `${objectiveSection.instructionsEn || 'Note: Four possible answers A, B, C and D to each question are given. Choose the correct answer.'}<br><span dir="rtl" style="font-family:'Jameel Noori Nastaleeq','Arial',sans-serif; display:block; text-align:right;">${objectiveSection.instructionsUr || 'نوٹ: ہر سوال کے چار ممکنہ جوابات A, B, C اور D دیے گئے ہیں۔ درست جواب منتخب کریں۔'}</span>`}
      </div>

      <!-- OMR BUBBLE RESPONSE GRID (FRONT OF OBJECTIVE PAPER BEFORE MCQS) -->
      ${header.includeBubbleSheet !== false ? `
      <table width="100%" cellpadding="3" cellspacing="0" border="1" style="border-collapse:collapse; margin-bottom:10pt; border:1.5pt solid #0f172a; background-color:#f8fafc; page-break-inside:avoid;">
        <tr style="background-color:#e2e8f0;">
          <td colspan="4" align="center" style="font-size:9.5pt; font-weight:bold; color:#0f172a; padding:4pt;">
            OFFICIAL OMR BUBBLE RESPONSE GRID (امتحانی جوابی ببل شیٹ) &bull; Fill completely: &#9679; Correct | &#10006; Incorrect
          </td>
        </tr>
        <tr>
          <td colspan="4" style="padding:4pt 6pt;">
            <table width="100%" cellpadding="2" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                ${(objectiveSection.questions || []).map((m, i) => `
                  <td width="25%" style="font-size:8.5pt; font-family:'Calibri',sans-serif; font-weight:bold; padding:2pt 4pt; border:1pt solid #cbd5e1; background-color:#ffffff;">
                    Q.${m.qNo}: &nbsp; (A) &nbsp; (B) &nbsp; (C) &nbsp; (D)
                  </td>
                  ${(i + 1) % 4 === 0 && i + 1 < (objectiveSection.questions || []).length ? '</tr><tr>' : ''}
                `).join('')}
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- MCQS TABLE -->
      ${mcqsRows}
      `
          : ''
      }

      ${
        targetSection === 'all'
          ? `<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />`
          : ''
      }

      ${
        targetSection === 'all' || targetSection === 'subjective'
          ? `
      <!-- SUBJECTIVE SECTION BANNER -->
      <table width="100%" cellpadding="6" cellspacing="0" border="0" style="background-color:#0f172a; color:#ffffff; margin-top:14pt; margin-bottom:8pt;">
        <tr>
          <td align="center" style="font-family:'Calibri','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#ffffff; text-align:center;">
            ${languageMode === 'urdu' ? (subjectiveSection.titleUr || 'حصہ دوم و سوم (انشائی طرز)') : (subjectiveSection.titleEn || 'SECTION - B & C (SUBJECTIVE TYPE)')} &nbsp;&mdash;&nbsp; (${subjectiveSection.totalMarks} ${languageMode === 'urdu' ? 'نمبر' : 'Marks'} &bull; ${subjectiveSection.timeAllowed || '2:15 Hours'})
          </td>
        </tr>
      </table>

      <!-- PART 1: SHORT QUESTIONS -->
      ${shortQuestionGroupsHtml}

      <!-- PART 2: LONG QUESTIONS BANNER -->
      <table width="100%" cellpadding="5" cellspacing="0" border="0" style="background-color:#e2e8f0; border-left:4pt solid #0f172a; margin-top:14pt; margin-bottom:8pt;">
        <tr>
          ${languageMode === 'urdu'
            ? `<td width="100%" align="right" dir="rtl" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#0f172a; text-align:right; padding:6pt 10pt;">
                حصہ دوم (تفصیلی سوالات) &nbsp;&bull;&nbsp; ${subjectiveSection.part2_longQuestions?.instructionUr || 'کوئی سے دو (2) سوالات کے تفصیلی جوابات تحریر کریں۔'}
              </td>`
            : languageMode === 'english'
            ? `<td width="100%" style="font-family:'Calibri','Arial',sans-serif; font-size:11pt; font-weight:bold; color:#0f172a; padding:6pt 10pt;">
                SECTION - II (LONG QUESTIONS) &nbsp;&bull;&nbsp; ${subjectiveSection.part2_longQuestions?.instructionEn || 'Attempt any TWO (2) questions.'}
              </td>`
            : `<td width="60%" style="font-family:'Calibri','Arial',sans-serif; font-size:11pt; font-weight:bold; color:#0f172a; padding:6pt 10pt;">
                SECTION - II (LONG QUESTIONS) &nbsp;&bull;&nbsp; ${subjectiveSection.part2_longQuestions?.instructionEn || 'Attempt any TWO (2) questions.'}
              </td>
              <td width="40%" align="right" dir="rtl" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Arial',sans-serif; font-size:12pt; font-weight:bold; color:#0f172a; text-align:right; padding:6pt 10pt;">
                ${subjectiveSection.part2_longQuestions?.instructionUr || 'کوئی سے دو (2) سوالات کے تفصیلی جوابات تحریر کریں۔'}
              </td>`
          }
        </tr>
      </table>

      ${longQuestionsHtml}
      `
          : ''
      }

      <!-- Clean Footer -->
      <div style="margin-top:25pt; border-top:1pt solid #cbd5e1; padding-top:6pt; text-align:center; font-size:8.5pt; color:#64748b; font-family:'Calibri',sans-serif;">
        Generated via PTBB Automated Examination Paper Portal &bull; Standard Punjab Board Specification
      </div>
    </div>
  </body>
  </html>
  `;

  const blob = new Blob(['\uFEFF' + fullWordHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const cleanSubject = (header.subjectName || 'Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanClass = header.classLevel || '9th';
  const sectionTag = targetSection === 'objective' ? '_Objective' : targetSection === 'subjective' ? '_Subjective' : '';
  const fileName = `${cleanClass}_Class_${cleanSubject}${sectionTag}_Exam_Paper.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Solved Answer Key & Subjective Guidelines to Microsoft Word (.doc)
 */
export function exportAnswerKeyToWord(paper: GeneratedExamPaper) {
  const { header, objectiveSection, subjectiveSection } = paper;

  const mcqRowsHtml = (objectiveSection.questions || [])
    .map((q) => {
      const correctOpt = q.options.find((o) => o.key === q.correctOption) || q.options[0];
      const textEn = correctOpt?.textEn || '';
      const textUr = correctOpt?.textUr || '';

      return `
      <tr style="border-bottom:1pt solid #cbd5e1; page-break-inside:avoid;">
        <td align="center" style="font-weight:bold; font-family:'Arial',sans-serif; font-size:10pt; padding:6pt 4pt; color:#1e3a8a;">
          Q.${q.qNo}
        </td>
        <td align="center" style="font-weight:900; font-family:'Arial Black',sans-serif; font-size:11pt; padding:6pt 4pt; background-color:#ecfdf5; color:#065f46;">
          (${q.correctOption})
        </td>
        <td style="font-family:'Calibri','Arial',sans-serif; font-size:10pt; padding:6pt 8pt; color:#0f172a;">
          <strong>${textEn}</strong>
          ${textUr && textUr !== textEn ? `<div dir="rtl" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',sans-serif; font-size:11pt; color:#334155; margin-top:2pt;">${textUr}</div>` : ''}
        </td>
        <td style="font-family:'Calibri',sans-serif; font-size:9pt; font-style:italic; padding:6pt 8pt; color:#475569; background-color:#f8fafc;">
          ${q.explanationEn || 'Standard Punjab Textbook Board Syllabus Definition / Solution Step'}
        </td>
      </tr>
      `;
    })
    .join('');

  // Subjective Guidelines HTML
  const shortGuidelinesHtml = (subjectiveSection.part1_shortQuestions || [])
    .map((grp) => {
      const rows = (grp.questions || [])
        .map((q, idx) => `
        <tr style="border-bottom:1pt dotted #cbd5e1; page-break-inside:avoid;">
          <td width="8%" valign="top" style="font-weight:bold; padding:4pt 6pt; color:#1e3a8a;">(${idx + 1})</td>
          <td width="60%" valign="top" style="padding:4pt 6pt;">
            <div style="font-weight:bold; color:#0f172a;">${q.statementEn}</div>
            ${q.statementUr ? `<div dir="rtl" style="font-family:'Jameel Noori Nastaleeq',sans-serif; font-size:11pt; color:#334155;">${q.statementUr}</div>` : ''}
          </td>
          <td width="32%" valign="top" style="padding:4pt 6pt; background-color:#f8fafc; font-size:9.5pt; color:#334155;">
            <strong>Marking Scheme (${q.marks} Marks):</strong><br/>
            &bull; 1 Mark: Correct scientific definition/concept<br/>
            &bull; 1 Mark: Formula, standard SI unit or textbook example
          </td>
        </tr>
      `).join('');

      return `
      <div style="margin-top:10pt; font-weight:bold; font-size:10.5pt; background-color:#e2e8f0; padding:4pt 8pt;">
        Q.${grp.qNo}: ${grp.instructionEn} (Any ${grp.attemptCount} of ${grp.questions.length})
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="1" style="border-collapse:collapse; border:1pt solid #cbd5e1; margin-bottom:8pt;">
        ${rows}
      </table>
      `;
    }).join('');

  const longGuidelinesHtml = (subjectiveSection.part2_longQuestions?.questions || [])
    .map((lq) => {
      const partsHtml = (lq.parts || []).map((p) => `
        <div style="margin-top:4pt; padding-left:8pt; border-left:2pt solid #3b82f6;">
          <strong>Part (${p.partLabel}):</strong> ${p.statementEn}
          ${p.statementUr ? `<div dir="rtl" style="font-family:'Jameel Noori Nastaleeq',sans-serif; font-size:11pt; color:#334155;">${p.statementUr}</div>` : ''}
          <div style="font-size:9pt; color:#475569; font-style:italic; margin-top:2pt;">
            Marking Allocation (${p.marks} Marks): Step-by-step derivation / conceptual explanation (3 Marks) + mathematical formula / units / diagram (2 Marks)
          </div>
        </div>
      `).join('');

      return `
      <div style="margin-top:8pt; border:1pt solid #cbd5e1; padding:6pt 8pt; background-color:#f8fafc; page-break-inside:avoid;">
        <div style="font-weight:bold; color:#1e3a8a;">Question ${lq.qNo} &nbsp;&bull;&nbsp; Total: ${lq.totalMarks} Marks</div>
        ${partsHtml}
      </div>
      `;
    }).join('');

  const fullWordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${header.classLevel} ${header.subjectName} Answer Key</title>
    <style>
      @page Section1 { size: 595.3pt 841.9pt; margin: 36pt 36pt 36pt 36pt; mso-header-margin: 18pt; mso-footer-margin: 18pt; }
      div.Section1 { page: Section1; }
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.35; }
    </style>
  </head>
  <body>
    <div class="Section1">
      <!-- HEADER -->
      <table width="100%" cellpadding="6" cellspacing="0" border="1" style="border:2pt solid #0f172a; border-collapse:collapse; margin-bottom:12pt; background-color:#ffffff;">
        <tr>
          <td align="center" style="padding:10pt; border-bottom:1.5pt solid #0f172a; text-align:center;">
            <div style="font-size:16pt; font-weight:900; text-transform:uppercase; color:#0f172a;">${header.instituteName}</div>
            <div style="font-size:12pt; font-weight:bold; color:#1e3a8a; margin-top:3pt;">OFFICIAL ANSWER KEY & MARKING SCHEME (حل شدہ جوابی پرچہ)</div>
            <div style="font-size:10pt; color:#475569; margin-top:2pt;">${header.classLevel} Class &bull; ${header.subjectName} &bull; ${header.examTitle} &bull; Total Marks: ${header.totalMarks}</div>
          </td>
        </tr>
      </table>

      <!-- OBJECTIVE SECTION TABLE -->
      <div style="background-color:#0f172a; color:#ffffff; font-weight:bold; font-size:11pt; padding:4pt 8pt; margin-bottom:4pt;">
        SECTION - A: OBJECTIVE TYPE SOLVED ANSWER MATRIX
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="1" style="border-collapse:collapse; border:1pt solid #cbd5e1; margin-bottom:14pt;">
        <tr style="background-color:#f1f5f9; font-weight:bold; font-size:9.5pt;">
          <th width="8%" style="padding:5pt;">Q#</th>
          <th width="10%" style="padding:5pt;">Key</th>
          <th width="47%" style="padding:5pt; text-align:left;">Solved Option & Statement</th>
          <th width="35%" style="padding:5pt; text-align:left;">Textbook Guidance / Reference</th>
        </tr>
        ${mcqRowsHtml}
      </table>

      <!-- SUBJECTIVE SECTION GUIDELINES -->
      <div style="background-color:#0f172a; color:#ffffff; font-weight:bold; font-size:11pt; padding:4pt 8pt; margin-bottom:4pt; page-break-before:always;">
        SECTION - B: SUBJECTIVE TYPE EVALUATION RUBRICS & MARKING CRITERIA
      </div>
      ${shortGuidelinesHtml}
      ${longGuidelinesHtml}

      <div style="margin-top:20pt; border-top:1pt solid #cbd5e1; padding-top:6pt; text-align:center; font-size:8pt; color:#64748b;">
        Punjab Board Examination Automated Evaluation Portal &bull; Official Answer Key
      </div>
    </div>
  </body>
  </html>
  `;

  const blob = new Blob(['\uFEFF' + fullWordHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const cleanSubject = (header.subjectName || 'Paper').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanClass = header.classLevel || '9th';
  const fileName = `${cleanClass}_Class_${cleanSubject}_Answer_Key.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
