import GenerateToken from "../components/GenerateToken";
import TokenList from "../components/TokenList";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GenerateToken />
      <TokenList />
    </div>
  );
}
