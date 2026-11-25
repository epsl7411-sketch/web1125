const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const SHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE_NS = "http://schemas.openxmlformats.org/package/2006";

function xmlText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function expenseWorksheet(result) {
  const records = [
    [{ text: "국내 출장 여비 계산 결과", style: 1 }],
    [{ text: "출장일" }, { text: result.departure }],
    [{ text: "복귀일" }, { text: result.returnDate }],
    [{ text: "출장 구분" }, { text: result.status }]
  ];
  if (result.grade) records.push([{ text: "지급 구분" }, { text: result.grade }]);
  records.push([], ["항목", "예상 지급액 (원)", "산출 내역"].map((text) => ({ text, style: 2 })));
  const firstAmountRow = records.length + 1;
  for (const { label, amount, note } of result.rows) {
    records.push([{ text: label }, { number: amount, style: 3 }, { text: note }]);
  }
  const lastAmountRow = records.length;
  records.push([
    { text: "예상 합계", style: 2 },
    { number: result.subtotal, formula: "SUM(B" + firstAmountRow + ":B" + lastAmountRow + ")", style: 4 }
  ]);
  records.push([], [{ text: "적용 기준" }, { text: "공무원 여비 규정 " + EFFECTIVE_DATE + " 시행본 · 별표 2" }]);

  const rows = records.map((cells, index) => {
    const row = index + 1;
    const content = cells.map((cell, column) => {
      const ref = "ABC"[column] + row;
      const style = cell.style ? ' s="' + cell.style + '"' : "";
      if ("text" in cell) {
        return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t>' + xmlText(cell.text) + '</t></is></c>';
      }
      const formula = cell.formula ? "<f>" + cell.formula + "</f>" : "";
      return '<c r="' + ref + '"' + style + '>' + formula + "<v>" + cell.number + "</v></c>";
    }).join("");
    return '<row r="' + row + '">' + content + "</row>";
  }).join("");

  const merges = [1, 4, records.length]
    .map((row) => '<mergeCell ref="' + (row === 1 ? "A" : "B") + row + ":C" + row + '"/>').join("");
  return '<worksheet xmlns="' + SHEET_NS + '">' +
    '<cols><col min="1" max="1" width="31" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/>' +
    '<col min="3" max="3" width="72" customWidth="1"/></cols><sheetData>' + rows +
    '</sheetData><mergeCells count="3">' + merges + '</mergeCells></worksheet>';
}

async function createExpenseWorkbook(result) {
  const zip = new JSZip();
  const workbookContent = "application/vnd.openxmlformats-officedocument.spreadsheetml";
  const parts = {
    "[Content_Types].xml": `<Types xmlns="${PACKAGE_NS}/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="${workbookContent}.sheet.main+xml"/>
      <Override PartName="/xl/worksheets/sheet1.xml" ContentType="${workbookContent}.worksheet+xml"/>
      <Override PartName="/xl/styles.xml" ContentType="${workbookContent}.styles+xml"/>
    </Types>`,
    "_rels/.rels": `<Relationships xmlns="${PACKAGE_NS}/relationships">
      <Relationship Id="rId1" Type="${OFFICE_REL_NS}/officeDocument" Target="xl/workbook.xml"/>
    </Relationships>`,
    "xl/workbook.xml": `<workbook xmlns="${SHEET_NS}" xmlns:r="${OFFICE_REL_NS}">
      <sheets><sheet name="출장 여비" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="${PACKAGE_NS}/relationships">
      <Relationship Id="rId1" Type="${OFFICE_REL_NS}/worksheet" Target="worksheets/sheet1.xml"/>
      <Relationship Id="rId2" Type="${OFFICE_REL_NS}/styles" Target="styles.xml"/>
    </Relationships>`,
    "xl/styles.xml": `<styleSheet xmlns="${SHEET_NS}">
      <fonts count="3">
        <font><sz val="11"/><name val="맑은 고딕"/></font>
        <font><b/><sz val="14"/><name val="맑은 고딕"/></font>
        <font><b/><sz val="11"/><name val="맑은 고딕"/></font>
      </fonts>
      <fills count="3">
        <fill><patternFill patternType="none"/></fill>
        <fill><patternFill patternType="gray125"/></fill>
        <fill><patternFill patternType="solid"><fgColor rgb="FFE8EFFC"/><bgColor indexed="64"/></patternFill></fill>
      </fills>
      <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
      <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
      <cellXfs count="5">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
        <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
        <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
        <xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
        <xf numFmtId="3" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/>
      </cellXfs>
      <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
    </styleSheet>`,
    "xl/worksheets/sheet1.xml": expenseWorksheet(result)
  };
  for (const [filename, xml] of Object.entries(parts)) {
    zip.file(filename, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + xml);
  }
  return zip.generateAsync({ type: "blob", mimeType: XLSX_MIME, compression: "DEFLATE" });
}

function downloadExpenseWorkbook(workbook, { departure, returnDate }) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(workbook);
  link.href = url;
  link.download = "출장여비_" + departure + "_" + returnDate + ".xlsx";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
