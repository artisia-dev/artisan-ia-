import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4">
        <CheckCircle className="text-green-500 mx-auto mb-6" size={80} />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Bienvenue sur ArtisIA. Votre abonnement est actif.
        </p>
        <p className="text-gray-400">
          Redirection vers votre tableau de bord...
        </p>
      </div>
    </div>
  );
}
