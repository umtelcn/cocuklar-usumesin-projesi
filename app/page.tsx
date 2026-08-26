import InstagramGaleri from '@/components/InstagramGaleri';
import BagisFormu from '@/components/BagisFormu';
import BagisListesi from '@/components/BagisListesi';

export default function YardimSayfasi() {
  return (
    <div className="w-full space-y-2 pb-10">
      <InstagramGaleri />
      <BagisFormu />
      <BagisListesi />
    </div>
  );
}