'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

export default function SikcaSorulanSorular() {
    const [sorular, setSorular] = useState<any[]>([]);
    const [acikIndex, setAcikIndex] = useState<number | null>(null);
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        async function ssslariGetir() {
            try {
                const { data, error } = await supabase
                    .from('sikca_sorulan_sorular')
                    .select('*')
                    .order('sira', { ascending: true });

                if (error) throw error;
                if (data) setSorular(data);
            } catch (error) {
                console.error("SSS verileri alınamadı:", error);
            } finally {
                setYukleniyor(false);
            }
        }
        ssslariGetir();
    }, []);

    const toggleAccordion = (index: number) => {
        setAcikIndex(acikIndex === index ? null : index);
    };

    if (yukleniyor || sorular.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Sıkça Sorulan Sorular</h2>
            <div className="space-y-3">
                {sorular.map((item, index) => {
                    const isOpen = acikIndex === index;
                    return (
                        <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden transition-all">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between p-4 text-left font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                            >
                                <span>{item.soru}</span>
                                <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="text-xs text-gray-500" />
                            </button>
                            {isOpen && (
                                <div className="p-4 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                                    {item.cevap}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}