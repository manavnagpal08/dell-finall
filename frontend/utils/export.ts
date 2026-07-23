type CsvCell = string | number | boolean | Date | null | undefined

export function downloadBlob(filename: string, blob: Blob) {
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadCSV(filename: string, rows: CsvCell[][]) {
  const processRow = (row: CsvCell[]) => {
    return row.map(val => {
      let innerValue = val == null ? '' : val.toString()
      if (val instanceof Date) {
        innerValue = val.toLocaleString()
      }
      let result = innerValue.replace(/"/g, '""')
      if (result.search(/("|,|\n)/g) >= 0) {
        result = `"${result}"`
      }
      return result
    }).join(',')
  }

  const csvContent = rows.map(processRow).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  downloadBlob(filename, blob)
}

export function downloadExcel(filename: string, sheets: { name: string; rows: CsvCell[][] }[]) {
  const escapeHtml = (value: CsvCell) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")

  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        ${sheets.map(sheet => `
          <h2>${escapeHtml(sheet.name)}</h2>
          <table border="1">
            ${sheet.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell instanceof Date ? cell.toLocaleString() : cell)}</td>`).join("")}</tr>`).join("")}
          </table>
        `).join("<br />")}
      </body>
    </html>
  `

  downloadBlob(filename, new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }))
}

export function downloadTextPDF(filename: string, title: string, lines: string[]) {
  const clean = (value: string) =>
    value
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "-")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")

  const wrappedLines = [title, "", ...lines].flatMap((line) => {
    const text = clean(line)
    if (text.length <= 88) return [text]
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += 88) chunks.push(text.slice(i, i + 88))
    return chunks
  }).slice(0, 44)

  const content = [
    "BT",
    "/F1 11 Tf",
    "50 780 Td",
    "14 TL",
    ...wrappedLines.map((line, index) => `${index === 0 ? "/F1 16 Tf " : index === 1 ? "/F1 11 Tf " : ""}(${line}) Tj T*`),
    "ET",
  ].join("\n")

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((obj, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  downloadBlob(filename, new Blob([pdf], { type: "application/pdf" }))
}
