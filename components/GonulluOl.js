import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandshakeAngle } from '@fortawesome/free-solid-svg-icons';

export default function GonulluOl() {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg">
                <FontAwesomeIcon icon={faHandshakeAngle} className="text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Çok Yakında!</h2>
            <p className="text-gray-600 my-4 leading-relaxed">
                Gönüllülük programımız ve organizasyonlarımızla ilgili detayları çok yakında burada bulabileceksiniz.
                İlginiz için teşekkür ederiz!
            </p>
        </div>
    );
}