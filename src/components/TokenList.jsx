"use client"

import { useEffect, useState } from "react"
import { ref, onValue, set } from "firebase/database"
import { db } from "../../firebase"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend as PieLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mail, CheckCircle2, Clock, Send, Copy } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

// ------------------------------------
// 1️⃣ Modelos de mensagens formais
// ------------------------------------
const MESSAGE_TEMPLATES = {
  email: ({ name, token, formURL }) => `
Prezado(a) ${name},

Esperamos que esta mensagem o(a) encontre bem.

Conforme aprovado pelo Conselho de Administração e comunicado em nossa última reunião, encaminhamos o questionário de autoavaliação do conselho referente ao desempenho do ano de 2025.

O questionário é composto por quatro blocos temáticos. Em cada bloco, há uma série de afirmações com cinco opções de resposta, que indicam o grau de concordância ou discordância. Ao final de cada bloco, há um espaço destinado a comentários adicionais. Ao término do questionário, há ainda um campo opcional para sugestões relacionadas à eficiência do Conselho e sua atuação nos temas estratégicos.

Para acessar o formulário, utilize as informações abaixo:

🔗 Link de acesso:
${formURL}

🔑 Token individual de acesso:
${token}

Instruções para acesso:
1. Copie o token acima.
2. Clique no link do formulário.
3. Cole o token no campo indicado para iniciar o preenchimento.

O token é individual e poderá ser utilizado apenas uma única vez.

Após responder todas as questões, selecione o botão de envio ao final do formulário. As respostas serão registradas de forma anônima, garantindo a confidencialidade dos participantes. Posteriormente, os dados serão consolidados, analisados e apresentados ao Conselho.

Ressaltamos a importância da participação de todos. Solicitamos, por gentileza, que o preenchimento seja realizado até o dia 27/02.

Agradecemos desde já sua atenção e colaboração.

Atenciosamente,

Equipe Instituto Reciclar  
(11) 3768-3607
`,

  whatsapp: ({ name, formURL }) => `
Prezado(a) ${name},

Segue o link para acesso ao formulário de compliance:

${formURL}

O token de acesso será enviado na próxima mensagem. Por favor, aguarde o recebimento e utilize-o conforme as orientações para concluir o preenchimento.

Solicitamos a gentileza de responder ao formulário dentro do prazo estabelecido.

Agradecemos sua colaboração.

Instituto Reciclar
`,
};

// ------------------------------------
// 2️⃣ Função para gerar URL de envio
// ------------------------------------
function getSendURL(user, method, formURL) {
  if (!user || !method) return null

  const template = MESSAGE_TEMPLATES[method]?.({
    name: user.name || "Participante",
    token: user.token || "",
    formURL,
  })

  if (!template) return null

  if (method === "email") {
    if (!user.email) return null
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      user.email
    )}&su=Autoavaliação Conselho&body=${encodeURIComponent(template)}`
  }

  if (method === "whatsapp") {
    if (!user.phone) return null

    const phoneStr = String(user.phone)
    const cleanedPhone = phoneStr.replace(/\D/g, "")

    if (!cleanedPhone || cleanedPhone.length < 10) {
      console.warn("Telefone inválido:", user.phone)
      return null
    }

    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(template)}`
  }

  return null
}

// ------------------------------------
// 3️⃣ Componente principal
// ------------------------------------
export default function TokenList() {
  const [tokens, setTokens] = useState([])
  const [filterUsed, setFilterUsed] = useState("all")
  const [filterSent, setFilterSent] = useState("all")
  const [loading, setLoading] = useState(true)
  const [copiedToken, setCopiedToken] = useState(null)

  // ------------------------------------
  // 3.1 Carregar tokens do Firebase
  // ------------------------------------
  useEffect(() => {
    const tokensRef = ref(db, "tokens")
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const data = snapshot.val()
      const list = Object.entries(data || {}).map(([token, info]) => ({
        token,
        ...info,
        phone: info.phone ? String(info.phone) : "",
      }))
      setTokens(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ------------------------------------
  // 3.2 Envio de mensagem (Gmail ou WhatsApp)
  // ------------------------------------
  const handleSend = async (user, method) => {
    if (user.sent) return toast.error("Este token já foi enviado!")

    const formURL = "https://complianceperguntas20260223.vercel.app/"
    const url = getSendURL(user, method, formURL)

    if (!url) {
      return toast.error(
        method === "whatsapp"
          ? "Usuário sem número de WhatsApp válido!"
          : "Usuário sem email válido!"
      )
    }

    window.open(url, "_blank")

    setTokens((prev) =>
      prev.map((t) => (t.token === user.token ? { ...t, sent: true } : t))
    )

    try {
      await set(ref(db, `tokens/${user.token}/sent`), true)
      toast.success("Token enviado com sucesso!")
    } catch (err) {
      console.error("Erro ao atualizar status de envio:", err)
      toast.error("Erro ao atualizar status de envio")
    }
  }

  // ------------------------------------
  // 3.3 Copiar token
  // ------------------------------------
  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    toast.success("Token copiado!")
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // ------------------------------------
  // 3.4 Aplicar filtros
  // ------------------------------------
  const filteredTokens = tokens.filter((t) => {
    let usedCondition = true
    let sentCondition = true

    if (filterUsed === "used") usedCondition = t.used
    else if (filterUsed === "unused") usedCondition = !t.used

    if (filterSent === "sent") sentCondition = t.sent
    else if (filterSent === "notSent") sentCondition = !t.sent

    return usedCondition && sentCondition
  })

  // ------------------------------------
  // 3.5 Estatísticas
  // ------------------------------------
  const usedCount = filteredTokens.filter((t) => t.used).length
  const unusedCount = filteredTokens.length - usedCount
  const sentCount = filteredTokens.filter((t) => t.sent).length
  const notSentCount = filteredTokens.length - sentCount

  const pieData = [
    { name: "Preenchido", value: usedCount },
    { name: "Não preenchido", value: unusedCount },
  ]

  const barData = [
    { status: "Enviados", count: sentCount },
    { status: "Não enviados", count: notSentCount },
  ]

  const COLORS = ["#0b6be9ff", "#4a157aff"]

  // ------------------------------------
  // 3.6 Loading
  // ------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando tokens...</p>
        </div>
      </div>
    )
  }

  // ------------------------------------
  // 3.7 Render
  // ------------------------------------
  return (
    <div className="max-h-screen bg-background p-6 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Painel de Controle
          </h1>
          <p className="text-muted-foreground">
            Gerencie tokens de acesso e acompanhe o status dos envios
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Tokens</p>
                <p className="text-2xl font-bold text-foreground">
                  {tokens.length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold text-foreground">
                  {sentCount}
                </p>
              </div>
              <Send className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preenchidos</p>
                <p className="text-2xl font-bold text-foreground">
                  {usedCount}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">
                  {notSentCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status do Formulário
              </label>
              <select
                value={filterUsed}
                onChange={(e) => setFilterUsed(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                <option value="used">Preenchidos</option>
                <option value="unused">Não preenchidos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status de Envio
              </label>
              <select
                value={filterSent}
                onChange={(e) => setFilterSent(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                <option value="sent">Enviados</option>
                <option value="notSent">Não enviados</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Status dos Formulários
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <PieTooltip />
                <PieLegend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Status dos Envios
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="status" stroke="var(--foreground)" />
                <YAxis stroke="var(--foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Legend />
                <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tabela */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum token encontrado com os filtros aplicados.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Formulário
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Envio
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map((t) => (
                    <tr
                      key={t.token}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-foreground">
                        {t.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {t.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {t.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">
                            {t.token.substring(0, 8)}...
                          </code>
                          <button
                            onClick={() => handleCopyToken(t.token)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copiar token completo"
                          >
                            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            t.used
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {t.used ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Preenchido
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Pendente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            t.sent
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t.sent ? (
                            <>
                              <Send className="h-3 w-3" />
                              Enviado
                            </>
                          ) : (
                            <>
                              <Mail className="h-3 w-3" />
                              Não enviado
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {!t.sent && (
                            <>
                              <Button
                                onClick={() => handleSend(t, "email")}
                                className="text-xs"
                                size="sm"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Gmail
                              </Button>
                              <Button
                                onClick={() => handleSend(t, "whatsapp")}
                                className="text-xs"
                                size="sm"
                                variant="outline"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-4 w-4 mr-1 text-green-600"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.1-.472-.149-.672.15-.197.297-.771.966-.945 1.164-.173.198-.348.223-.645.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.173.198-.298.298-.497.1-.198.05-.372-.025-.521-.075-.149-.672-1.617-.921-2.217-.242-.58-.487-.502-.672-.512l-.573-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                </svg>
                                WhatsApp
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
