import React from 'react';
import { X, ArrowRight, ShoppingBag, Eye, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCOP } from '../utils/formatters';

export const ProductQuickView: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    setSelectedProduct,
    isInWishlist,
    toggleWishlist,
  } = useStore();

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isFavorite = isInWishlist(product.id);

  const handleOpenFull = () => {
    setSelectedProduct(product);
    setQuickViewProduct(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#EDE4DA] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white text-[#171717] rounded-full shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="aspect-[3/4] bg-[#FAF8F5] relative overflow-hidden">
            {product.coverMediaType === 'video' && (product.primaryMediaUrl || product.videoUrl) ? (
              <video
                src={product.primaryMediaUrl || product.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={product.images?.[0] || '/src/assets/images/fashion_enterizo_black_1792782858876.jpg'}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#C6A77D] font-bold block mb-1">
                {product.category}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#171717] leading-snug">
                {product.name}
              </h3>
              <p className="text-base font-bold text-[#171717] mt-2 tabular-nums">
                {formatCOP(product.price)}
              </p>
              <p className="text-xs text-[#77716C] mt-2 line-clamp-3">
                {product.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#EDE4DA]">
                <span className="text-[11px] font-semibold text-[#171717] block mb-1.5">
                  Tallas disponibles:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-[#FAF8F5] text-[#171717] text-[11px] font-bold rounded border border-[#EDE4DA]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={handleOpenFull}
                className="w-full py-2.5 bg-[#171717] hover:bg-[#2A2A2A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Ver Detalles & Comprar</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A77D]" />
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className="w-full py-2 bg-[#FAF8F5] hover:bg-[#EDE4DA]/60 text-[#171717] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
                <span>{isFavorite ? 'En tus favoritos' : 'Añadir a favoritos'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
