"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../../firebase";
import jsPDF from "jspdf";
import { FileText, X } from "lucide-react";

const header1 = "/cabecalho-logo.png";
const header2 = "/cabecalho-logo2.png";
const footer = "/rodape.png";

export default function ResponsesPage() {
  const [responses, setResponses] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState(null);

  const pageSize = 5;

  useEffect(() => {
    const responsesRef = ref(db, "responses");

    onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.entries(data).map(([token, value]) => ({
          token,
          ...value,
        }));

        // Ordena por data mais recente
        list.sort(
          (a, b) =>
            new Date(b.dataEnvio || 0) - new Date(a.dataEnvio || 0)
        );

        setResponses(list);
      } else {
        setResponses([]);
      }
    });

    return () => off(responsesRef);
  }, []);

  const totalPages = Math.ceil(responses.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginated = responses.slice(startIndex, startIndex + pageSize);

  const closeModal = () => setSelectedResponse(null);

  const getBase64FromUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const exportSinglePDF = async (response) => {
    if (!response) return;

    const [header1Base64, header2Base64, footerBase64] =
      await Promise.all([
        getBase64FromUrl(header1),
        getBase64FromUrl(header2),
        getBase64FromUrl(footer),
      ]);

    const doc = new jsPDF("p", "pt", "a4");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 40;

    doc.addImage(header1Base64, "PNG", M, 28, 150, 40);
    doc.addImage(header2Base64, "PNG", pageW - M - 100, 28, 100, 34);

    let y = 100;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO INDIVIDUAL DE RESPOSTAS", pageW / 2, y, {
      align: "center",
    });

    y += 30;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      `Data de envio: ${new Date(
        response.dataEnvio || ""
      ).toLocaleString("pt-BR")}`,
      M,
      y
    );

    y += 30;

    Object.entries(response.blocos || {}).forEach(([_, bloco]) => {
      if (y > pageH - 140) {
        doc.addPage();
        y = 60;
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 40, 120);
      doc.text(bloco.titulo || "", M, y);
      y += 18;

      Object.entries(bloco.perguntas || {}).forEach(([__, pergunta]) => {
        if (y > pageH - 140) {
          doc.addPage();
          y = 60;
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);

        const perguntaLines = doc.splitTextToSize(
          pergunta.texto || "",
          pageW - 2 * M
        );
        doc.text(perguntaLines, M, y);
        y += perguntaLines.length * 14 + 6;

        doc.setFont("helvetica", "normal");
        const respostaLines = doc.splitTextToSize(
          pergunta.resposta || "",
          pageW - 2 * M
        );
        doc.text(respostaLines, M + 10, y);
        y += respostaLines.length * 14 + 14;
      });

      if (bloco.comentario?.resposta) {
        doc.setFont("helvetica", "bold");
        doc.text(bloco.comentario.pergunta || "", M, y);
        y += 14;

        doc.setFont("helvetica", "normal");
        const comentarioLines = doc.splitTextToSize(
          bloco.comentario.resposta,
          pageW - 2 * M
        );
        doc.text(comentarioLines, M + 10, y);
        y += comentarioLines.length * 14 + 20;
      }
    });

    if (response.comentariosFinais) {
      if (y > pageH - 140) {
        doc.addPage();
        y = 60;
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 40, 120);
      doc.text("COMENTÁRIOS FINAIS", M, y);
      y += 20;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const finais = response.comentariosFinais;

      if (finais.resposta_eficiencia) {
        doc.setFont("helvetica", "bold");
        doc.text(finais.pergunta_eficiencia || "", M, y);
        y += 14;

        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(
          finais.resposta_eficiencia,
          pageW - 2 * M
        );
        doc.text(lines, M + 10, y);
        y += lines.length * 14 + 18;
      }

      if (finais.resposta_estrategico) {
        doc.setFont("helvetica", "bold");
        doc.text(finais.pergunta_estrategico || "", M, y);
        y += 14;

        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(
          finais.resposta_estrategico,
          pageW - 2 * M
        );
        doc.text(lines, M + 10, y);
        y += lines.length * 14 + 18;
      }
    }

    const footerY = pageH - 120;
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.addImage(footerBase64, "PNG", M, footerY, 250, 80);
      doc.setFontSize(9);
      doc.text(`Página ${i} de ${pageCount}`, pageW - 70, pageH - 10);
    }

    doc.save("resposta_forms_Compliance.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h2 className="text-3xl font-bold mb-8 text-indigo-800 flex items-center gap-2">
        <FileText className="w-7 h-7" /> Respostas Coletadas
      </h2>

      {responses.length === 0 ? (
        <p>Nenhuma resposta registrada.</p>
      ) : (
        <>
          <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((r, i) => (
              <div
                key={r.token}
                onClick={() => setSelectedResponse(r)}
                className="cursor-pointer border rounded-xl p-5 bg-white shadow hover:bg-indigo-50"
              >
                <p className="font-semibold text-indigo-700">
                  Resposta #{i + startIndex + 1}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(r.dataEnvio).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="font-semibold">
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </>
      )}

      {selectedResponse && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>

            <h3 className="text-xl font-bold mb-6 text-indigo-800">
              Relatório de Resposta
            </h3>

            {Object.entries(selectedResponse.blocos || {}).map(
              ([key, bloco]) => (
                <div key={key} className="mb-8">
                  <h4 className="text-lg font-bold text-indigo-700 mb-4">
                    {bloco.titulo}
                  </h4>

                  {Object.entries(bloco.perguntas || {}).map(
                    ([pKey, pergunta]) => (
                      <div key={pKey} className="mb-4">
                        <p className="font-semibold">{pergunta.texto}</p>
                        <p className="text-gray-700">{pergunta.resposta}</p>
                      </div>
                    )
                  )}

                  {bloco.comentario?.resposta && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded">
                      <p className="font-semibold">
                        {bloco.comentario.pergunta}
                      </p>
                      <p>{bloco.comentario.resposta}</p>
                    </div>
                  )}
                </div>
              )
            )}

            {selectedResponse.comentariosFinais && (
              <div className="mt-6 border-t pt-6">
                <h4 className="text-lg font-bold text-indigo-700 mb-4">
                  Comentários Finais
                </h4>

                {selectedResponse.comentariosFinais.resposta_eficiencia && (
                  <>
                    <p className="font-semibold">
                      {
                        selectedResponse.comentariosFinais
                          .pergunta_eficiencia
                      }
                    </p>
                    <p className="mb-4">
                      {
                        selectedResponse.comentariosFinais
                          .resposta_eficiencia
                      }
                    </p>
                  </>
                )}

                {selectedResponse.comentariosFinais.resposta_estrategico && (
                  <>
                    <p className="font-semibold">
                      {
                        selectedResponse.comentariosFinais
                          .pergunta_estrategico
                      }
                    </p>
                    <p>
                      {
                        selectedResponse.comentariosFinais
                          .resposta_estrategico
                      }
                    </p>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => exportSinglePDF(selectedResponse)}
              className="mt-6 px-6 py-3 bg-green-600 text-white rounded"
            >
              Exportar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}