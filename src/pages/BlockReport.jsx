"use client";

import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie, Bar } from "react-chartjs-2";
import jsPDF from "jspdf";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  ChartDataLabels
);

const OPCOES = [
  "1 – Muito Baixo",
  "2 – Baixo",
  "3 – Moderado",
  "4 – Alto",
  "5 – Muito Alto",
];

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

export default function BlockReport() {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const chartRefs = useRef({});

  useEffect(() => {
    const dbRef = ref(db, "responses");
    onValue(dbRef, (snapshot) => {
      setResponses(snapshot.val() || {});
      setLoading(false);
    });
  }, []);

  const countResponses = (blocoKey, perguntaKey) => {
    const contagem = [0, 0, 0, 0, 0];
    Object.values(responses).forEach((user) => {
      const resposta =
        user?.blocos?.[blocoKey]?.perguntas?.[perguntaKey]?.resposta;
      const valor = parseInt(resposta);
      if (valor >= 1 && valor <= 5) contagem[valor - 1]++;
    });
    return contagem;
  };

  const exportBlockPDF = async (blocoKey) => {
    const bloco = Object.values(responses)[0]?.blocos?.[blocoKey];
    if (!bloco) return;

    const pdf = new jsPDF("p", "mm", "a4");
    let y = 15;

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(bloco.titulo, 105, y, { align: "center" });
    y += 10;

    for (const [perguntaKey, pergunta] of Object.entries(bloco.perguntas)) {
      const contagem = countResponses(blocoKey, perguntaKey);
      const total = contagem.reduce((a, b) => a + b, 0);
      if (total === 0) continue;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(pergunta.texto, 10, y);
      y += 5;

      const pieChart = chartRefs.current[`${blocoKey}-${perguntaKey}-pie`];
      const barChart = chartRefs.current[`${blocoKey}-${perguntaKey}-bar`];

      if (pieChart) pdf.addImage(pieChart.toBase64Image(), "PNG", 10, y, 80, 80);
      if (barChart) pdf.addImage(barChart.toBase64Image(), "PNG", 110, y, 80, 80);

      y += 90;
      if (y > 250) {
        pdf.addPage();
        y = 15;
      }
    }

    if (bloco.comentario?.resposta) {
      if (y > 260) {
        pdf.addPage();
        y = 15;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Comentários finais:", 10, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(bloco.comentario.resposta, 180);
      pdf.text(lines, 10, y);
    }

    pdf.save(`bloco_${blocoKey}.pdf`);
  };

  if (loading) return <p className="text-center mt-10">Carregando dados...</p>;

  const blocosData = Object.values(responses)[0]?.blocos || {};

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Relatório por Blocos
      </h1>

      {Object.entries(blocosData).map(([blocoKey, bloco]) => (
        <div
          key={blocoKey}
          className="mb-12 border rounded-xl shadow-md p-6 bg-white"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{bloco.titulo}</h2>
            <button
              onClick={() => exportBlockPDF(blocoKey)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Exportar PDF deste bloco
            </button>
          </div>

          {Object.entries(bloco.perguntas).map(([perguntaKey, pergunta]) => {
            const contagem = countResponses(blocoKey, perguntaKey);
            const total = contagem.reduce((a, b) => a + b, 0);
            if (total === 0) return null;

            const filteredOptions = OPCOES.filter((_, idx) => contagem[idx] > 0);
            const filteredData = contagem.filter((v) => v > 0);

            const pieData = {
              labels: filteredOptions,
              datasets: [
                {
                  data: filteredData,
                  backgroundColor: COLORS.slice(0, filteredOptions.length),
                },
              ],
            };

            const barData = {
              labels: filteredOptions,
              datasets: [
                {
                  data: filteredData,
                  backgroundColor: COLORS.slice(0, filteredOptions.length),
                },
              ],
            };

            const datalabelsOptions = {
              color: "#fff",
              font: { weight: "bold", size: 12 },
              formatter: (value) =>
                total ? Math.round((value / total) * 100) + "%" : "",
            };

            return (
              <div key={perguntaKey} className="mb-8">
                <h3 className="font-semibold">{pergunta.texto}</h3>
                <div className="flex gap-6 mt-4 flex-col md:flex-row">
                  <div className="md:w-1/2">
                    <Pie
                      data={pieData}
                      options={{
                        plugins: {
                          datalabels: datalabelsOptions,
                          legend: { display: true },
                        },
                        responsive: true,
                      }}
                      ref={(chart) =>
                        (chartRefs.current[`${blocoKey}-${perguntaKey}-pie`] =
                          chart)
                      }
                    />
                  </div>
                  <div className="md:w-1/2">
                    <Bar
                      data={barData}
                      options={{
                        plugins: {
                          datalabels: datalabelsOptions,
                          legend: { display: false },
                        },
                        responsive: true,
                        scales: { y: { beginAtZero: true } },
                      }}
                      ref={(chart) =>
                        (chartRefs.current[`${blocoKey}-${perguntaKey}-bar`] =
                          chart)
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {bloco.comentario?.resposta && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h4 className="font-semibold">Comentários finais:</h4>
              <p>{bloco.comentario.resposta}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}