"use client";

import { useEffect, useState } from "react";
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
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const OPCOES = [
  "1 – Muito Baixo",
  "2 – Baixo",
  "3 – Moderado",
  "4 – Alto",
  "5 – Muito Alto",
];

export default function BlockReport() {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(db, "responses"); // 🔥 corrigido aqui

    onValue(dbRef, (snapshot) => {
      setResponses(snapshot.val() || {});
      setLoading(false);
    });
  }, []);

  if (loading)
    return <p className="text-center mt-10">Carregando dados...</p>;

  // 🔥 Conta respostas baseado na estrutura blocos → perguntas
  const countResponses = (blocoKey, perguntaKey) => {
    const contagem = [0, 0, 0, 0, 0];

    Object.values(responses).forEach((user) => {
      const resposta =
        user?.blocos?.[blocoKey]?.perguntas?.[perguntaKey]?.resposta;

      const valor = parseInt(resposta);
      if (valor >= 1 && valor <= 5) {
        contagem[valor - 1]++;
      }
    });

    return contagem;
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Relatório Consolidado
      </h1>

      {Object.entries(responses).length === 0 && (
        <p className="text-center">Nenhuma resposta encontrada.</p>
      )}

      {/* Pega estrutura dinamicamente do primeiro registro */}
      {Object.values(responses)[0]?.blocos &&
        Object.entries(
          Object.values(responses)[0].blocos
        ).map(([blocoKey, bloco]) => (
          <div key={blocoKey} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">
              {bloco.titulo}
            </h2>

            {Object.entries(bloco.perguntas).map(
              ([perguntaKey, pergunta]) => {
                const contagem = countResponses(
                  blocoKey,
                  perguntaKey
                );

                const total = contagem.reduce((a, b) => a + b, 0);

                const pieData = {
                  labels: OPCOES,
                  datasets: [
                    {
                      data: contagem,
                      backgroundColor: [
                        "#ef4444",
                        "#f59e0b",
                        "#fbbf24",
                        "#3b82f6",
                        "#10b981",
                      ],
                    },
                  ],
                };

                const barData = {
                  labels: OPCOES,
                  datasets: [
                    {
                      data: contagem,
                      backgroundColor: [
                        "#ef4444",
                        "#f59e0b",
                        "#fbbf24",
                        "#3b82f6",
                        "#10b981",
                      ],
                    },
                  ],
                };

                return (
                  <div
                    key={perguntaKey}
                    className="border rounded-lg shadow-md p-6 mb-6 bg-white"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      {pergunta.texto}
                    </h3>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/2">
                        <Pie data={pieData} />
                      </div>
                      <div className="md:w-1/2">
                        <Bar
                          data={barData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { display: false },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ))}
    </div>
  );
}