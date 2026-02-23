"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const opcoesPadrao = [
  "1 – Discordo totalmente",
  "2 – Discordo parcialmente",
  "3 – Neutro",
  "4 – Concordo parcialmente",
  "5 – Concordo totalmente",
];

export default function DashboardPage() {
  const [dadosAgrupados, setDadosAgrupados] = useState({});

  useEffect(() => {
    const responsesRef = ref(db, "responses");

    onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const agrupado = {};

      Object.values(data).forEach((resposta) => {
        Object.values(resposta.blocos || {}).forEach((bloco) => {
          Object.values(bloco.perguntas || {}).forEach((pergunta) => {
            if (!agrupado[pergunta.texto]) {
              agrupado[pergunta.texto] = {};
              opcoesPadrao.forEach((op) => {
                agrupado[pergunta.texto][op] = 0;
              });
            }

            if (pergunta.resposta) {
              agrupado[pergunta.texto][pergunta.resposta]++;
            }
          });
        });
      });

      setDadosAgrupados(agrupado);
    });
  }, []);

  const gerarPDF = async () => {
    const input = document.getElementById("dashboard-area");
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "pt", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("dashboard_relatorio.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-indigo-800">
          Dashboard Analítico
        </h1>

        <button
          onClick={gerarPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          Exportar PDF
        </button>
      </div>

      <div id="dashboard-area" className="space-y-16">
        {Object.entries(dadosAgrupados).map(([pergunta, valores]) => {
          const total = Object.values(valores).reduce(
            (acc, val) => acc + val,
            0
          );

          const data = {
            labels: opcoesPadrao,
            datasets: [
              {
                label: "Respostas",
                data: opcoesPadrao.map((op) => valores[op]),
                backgroundColor: [
                  "#ef4444",
                  "#f97316",
                  "#eab308",
                  "#3b82f6",
                  "#16a34a",
                ],
              },
            ],
          };

          return (
            <div
              key={pergunta}
              className="bg-white p-6 rounded-2xl shadow"
            >
              <h2 className="text-lg font-bold mb-6">{pergunta}</h2>

              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <Pie data={data} />
                </div>

                <div>
                  <Bar data={data} />
                </div>
              </div>

              <div className="mt-6">
                {opcoesPadrao.map((op) => {
                  const qtd = valores[op];
                  const porcentagem =
                    total > 0
                      ? ((qtd / total) * 100).toFixed(1)
                      : 0;

                  return (
                    <p key={op} className="text-sm">
                      {op} — {qtd} respostas ({porcentagem}%)
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}