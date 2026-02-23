"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const escala = [
  "1 – Muito Baixo",
  "2 – Baixo",
  "3 – Moderado",
  "4 – Alto",
  "5 – Muito Alto",
];

const blocos = [
  {
    titulo: "Bloco 1 – Estrutura, Organização e Dinâmica das Reuniões",
    perguntas: [
      "O calendário anual de reuniões é definido com antecedência e seguido adequadamente.",
      "A pauta das reuniões é relevante, clara e bem organizada.",
      "Os materiais de suporte são enviados com antecedência e em tempo hábil para análise.",
      "A qualidade da informação recebida permite entendimento e decisões fundamentadas.",
      "As reuniões têm duração adequada para os temas discutidos.",
      "O tempo é bem gerido durante as reuniões, evitando dispersões.",
      "O ambiente das reuniões estimula o diálogo aberto e construtivo entre os membros.",
      "Há espaço para a expressão de opiniões divergentes.",
    ],
  },
  {
    titulo: "Bloco 2 – Desempenho e Eficiência do Conselho",
    perguntas: [
      "O Conselho cumpre adequadamente suas responsabilidades legais e fiduciárias.",
      "O Conselho acompanha adequadamente o desempenho/resultados do Instituto em seus diferentes aspectos.",
      "O Conselho contribui de forma efetiva para a definição da estratégia da organização.",
      "O acompanhamento dos aspectos estratégicos e sua evolução é sistemático e eficaz.",
      "O Conselho supervisiona adequadamente os principais riscos enfrentados.",
      "Há uma boa articulação entre o Conselho e a alta administração.",
      "O Conselho atua de forma independente, sem sofrer influências indevidas.",
    ],
  },
  {
    titulo: "Bloco 3 – Autoavaliação Individual dos Conselheiros",
    perguntas: [
      "Participo ativamente das reuniões, estando presente e preparado.",
      "Contribuo com ideias e opiniões de forma estruturada e relevante.",
      "Tenho disponibilidade para apoiar a gestão em temas específicos.",
      "Atualizo-me continuamente sobre os temas importantes para a organização.",
      "Tenho clareza sobre minhas responsabilidades como conselheiro.",
      "Busco agir com independência, ética e compromisso institucional.",
      "Cumpro os prazos e compromissos assumidos no âmbito do Conselho.",
    ],
  },
  {
    titulo: "Bloco 4 – Composição e Funcionamento do Conselho",
    perguntas: [
      "A composição do Conselho é adequada quanto à diversidade de perfis e competências.",
      "Os membros do Conselho possuem conhecimento suficiente sobre a atuação do Instituto.",
      "A presidência do Conselho exerce papel de liderança efetiva e equilibrada.",
      "A atuação dos comitês de assessoramento é eficiente e relevante.",
      "As decisões são tomadas com base no interesse da organização e seus stakeholders.",
      "O Conselho estimula a cultura de inovação e melhoria contínua.",
    ],
  },
];

export default function RelatorioPerguntas() {
  const [responses, setResponses] = useState([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(0);
  const [perguntaSelecionada, setPerguntaSelecionada] = useState(0);
  const [estatisticas, setEstatisticas] = useState({});

  // 🔹 Buscar respostas do Firebase
  useEffect(() => {
    const responsesRef = ref(db, "responses");
    onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.values(data).map((r) => r.blocos);
        setResponses(lista);
      } else {
        setResponses([]);
      }
    });
  }, []);

  // 🔹 Calcular quantidade e porcentagem quando mudar pergunta ou respostas
  useEffect(() => {
    if (responses.length === 0) return;

    const contagem = [0, 0, 0, 0, 0]; // índices 0..4 correspondem a escala 1..5
    responses.forEach((respostaPorBloco) => {
      const bloco = respostaPorBloco[`bloco_${blocoSelecionado + 1}`];
      if (!bloco) return;
      const pergunta = bloco.perguntas[`pergunta_${perguntaSelecionada + 1}`];
      if (!pergunta) return;
      const resposta = pergunta.resposta;
      const index = escala.indexOf(resposta);
      if (index !== -1) contagem[index]++;
    });

    const total = contagem.reduce((a, b) => a + b, 0);
    const porcentagem = contagem.map((c) => (total > 0 ? ((c / total) * 100).toFixed(1) : 0));

    setEstatisticas({
      quantidade: contagem,
      porcentagem,
      total,
    });
  }, [responses, blocoSelecionado, perguntaSelecionada]);

  // 🔹 Dados para gráficos
  const dadosBarra = {
    labels: escala,
    datasets: [
      {
        label: "Quantidade",
        data: estatisticas.quantidade || [],
        backgroundColor: "rgba(99, 102, 241, 0.7)",
      },
    ],
  };

  const dadosPizza = {
    labels: escala,
    datasets: [
      {
        label: "Porcentagem",
        data: estatisticas.quantidade || [],
        backgroundColor: [
          "#f87171",
          "#fb923c",
          "#facc15",
          "#34d399",
          "#60a5fa",
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-indigo-800">Relatório por Pergunta</h1>

      {/* Seleção do bloco */}
      <div className="mb-4 flex gap-4">
        <label className="font-semibold">Bloco:</label>
        <select
          className="border px-3 py-1 rounded"
          value={blocoSelecionado}
          onChange={(e) => {
            setBlocoSelecionado(Number(e.target.value));
            setPerguntaSelecionada(0);
          }}
        >
          {blocos.map((b, i) => (
            <option key={i} value={i}>
              {b.titulo}
            </option>
          ))}
        </select>
      </div>

      {/* Seleção da pergunta */}
      <div className="mb-8 flex gap-4">
        <label className="font-semibold">Pergunta:</label>
        <select
          className="border px-3 py-1 rounded"
          value={perguntaSelecionada}
          onChange={(e) => setPerguntaSelecionada(Number(e.target.value))}
        >
          {blocos[blocoSelecionado].perguntas.map((p, i) => (
            <option key={i} value={i}>
              {i + 1}. {p}
            </option>
          ))}
        </select>
      </div>

      {/* Estatísticas */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">
          {blocos[blocoSelecionado].perguntas[perguntaSelecionada]}
        </h2>
        <ul className="mb-6">
          {escala.map((opcao, i) => (
            <li key={i} className="mb-1">
              {opcao}: {estatisticas.quantidade ? estatisticas.quantidade[i] : 0} respostas (
              {estatisticas.porcentagem ? estatisticas.porcentagem[i] : 0}%)
            </li>
          ))}
          <li className="mt-2 font-semibold">Total: {estatisticas.total || 0} respostas</li>
        </ul>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Gráfico de Barras</h3>
            <Bar data={dadosBarra} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Gráfico de Pizza</h3>
            <Pie data={dadosPizza} />
          </div>
        </div>
      </div>
    </div>
  );
}