import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const ErrorPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 px-6">
      <AlertCircle className="w-20 h-20 text-red-500 mb-4 animate-pulse" />
      <h1 className="text-5xl font-bold mb-2">404 - Página não encontrada</h1>
      <p className="text-lg text-center mb-4">Opa! Parece que a página que você está tentando acessar não existe ou foi movida.</p>
      <p className="text-sm text-center text-gray-500 max-w-md mb-6"> Verifique se o endereço está correto ou clique no botão abaixo para voltar à página inicial.</p>
      <Link to="/home" className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-all duration-200 ease-in-out">Voltar para a página inicial</Link>
    </div>
  );
};

export default ErrorPage;
