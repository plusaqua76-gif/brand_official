import React from 'react';
import { ArrowUpRight, Sparkles, Truck, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ASSET_IMAGES } from '../data/initialProducts';

export const Hero: React.FC = () => {
  const { setActiveCategory } = useStore();

  const handleExplore = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShopEnterizos = () => {
    setActiveCategory('enterizos');
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-[#FAF8F5] overflow-hidden border-b border-[#EDE4DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        {/* Editorial Split Screen Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Brand Statement & CTA */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C6A77D]">
              <span>Haute Couture 2026</span>
              <span aria-hidden="true">·</span>
              <span>Colección Oficial</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#171717] leading-[1.08] text-balance">
                CIRLENI HERNÁNDEZ
              </h1>
              <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-[#77716C] font-normal">
                Elegancia que inspira. Estilo que enamora.
              </p>
            </div>

            <p className="text-sm md:text-base text-[#77716C] max-w-xl leading-relaxed font-normal">
              Diseños exclusivos confeccionados en Colombia que realzan la silueta y celebran la sofisticación femenina. Explora nuestros enterizos, vestidos de gala y conjuntos sartoriales con pedidos directos vía WhatsApp.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleExplore}
                className="px-7 py-3.5 bg-[#171717] hover:bg-[#2A2A2A] text-white text-xs md:text-sm uppercase tracking-wider font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 group"
              >
                <span>Explorar Colección</span>
                <ArrowUpRight className="w-4 h-4 text-[#C6A77D] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={handleShopEnterizos}
                className="px-6 py-3.5 bg-white hover:bg-[#F8F5F0] text-[#171717] border border-[#EDE4DA] hover:border-[#C6A77D] text-xs md:text-sm uppercase tracking-wider font-semibold rounded-lg transition-all duration-200"
              >
                Ver Enterizos
              </button>
            </div>

            {/* Trust and Craftsmanship Badges */}
            <div className="pt-8 border-t border-[#EDE4DA] grid grid-cols-3 gap-4">
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-[#171717] tabular-nums">
                  100%
                </span>
                <span className="text-[11px] sm:text-xs text-[#77716C] uppercase tracking-wide">
                  Hecho en Colombia
                </span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-[#171717] tabular-nums">
                  Alta
                </span>
                <span className="text-[11px] sm:text-xs text-[#77716C] uppercase tracking-wide">
                  Confección & Caída
                </span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-[#171717] tabular-nums">
                  VIP
                </span>
                <span className="text-[11px] sm:text-xs text-[#77716C] uppercase tracking-wide">
                  Asesoría en Tallas
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero High-Resolution Fashion Editorial Image */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-2xl overflow-hidden shadow-2xl border border-[#EDE4DA] bg-[#EDE4DA]/40 group">
              <img
                src={ASSET_IMAGES.hero}
                alt="Colección Cirleni Hernández Brand Official"
                referrerPolicy="no-referrer"
                className="w-full h-[460px] sm:h-[540px] md:h-[600px] object-cover object-center transition-transform duration-700 group-hover:scale-102"
              />
              
              {/* Subtle Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating Editorial Label Tag */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 backdrop-blur-md rounded-xl border border-white/40 shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#C6A77D] font-bold block">
                    Nueva Colección
                  </span>
                  <p className="font-serif text-base sm:text-lg font-semibold text-[#171717]">
                    Enterizo Palazzo & Sastrería de Lujo
                  </p>
                </div>
                <button
                  onClick={handleShopEnterizos}
                  className="px-3.5 py-1.5 bg-[#171717] text-white text-xs uppercase tracking-wider font-medium rounded hover:bg-[#C6A77D] transition-colors"
                >
                  Ver
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Full-width 4-column trust strip below the hero split */}
      <div className="border-t border-[#EDE4DA] bg-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-[#77716C]">
            <Truck className="w-4 h-4 text-[#C6A77D]" />
            <span>Envíos a todo el país</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-[#77716C]">
            <Sparkles className="w-4 h-4 text-[#C6A77D]" />
            <span>Prendas exclusivas</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-[#77716C]">
            <HeartHandshake className="w-4 h-4 text-[#C6A77D]" />
            <span>Atención directa por WhatsApp</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-[#77716C]">
            <ShieldCheck className="w-4 h-4 text-[#C6A77D]" />
            <span>Compra 100% segura</span>
          </div>
        </div>
      </div>
    </section>
  );
};
