/**
 * Lista de folhetos da paróquia.
 * Padrão do nome: YYYYMMDD- nome do folheto.pdf
 * Você pode adicionar apenas o nome do arquivo como string - o script interpreta e extrai data e título.
 * Exemplo: "20250222- Folheto Domingo.pdf" ou { arquivo: "...", data: "2025-02-22", titulo: "Folheto Domingo" }
 */
(function () {
  const raw = [
    { arquivo: "20250201-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-01", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250202-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-02", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250208-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-08", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250209-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-09", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250215-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-15", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250216-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-16", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250222-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-22", titulo: "Solenidade da Santa Mãe de Deus" },
    { arquivo: "20250223-Solenidade-Santa-Mae-Deus.pdf", data: "2025-02-23", titulo: "Solenidade da Santa Mãe de Deus" }
  ];
  function parseFilename(arquivo) {
    const m = arquivo.match(/^(\d{4})(\d{2})(\d{2})\s*[-–]\s*(.+?)\.pdf$/i);
    if (m) return { arquivo, data: m[1] + "-" + m[2] + "-" + m[3], titulo: m[4].trim() };
    return { arquivo, data: "", titulo: arquivo.replace(/\.pdf$/i, "") };
  }
  window.LISTA_FOLHETOS = raw.map(r => typeof r === "string" ? parseFilename(r) : r);
})();
