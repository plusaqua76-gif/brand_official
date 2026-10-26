import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  Save,
  Lock,
  ShieldCheck,
  Image as ImageIcon,
  Package,
  Settings,
  Upload,
  Film,
  Cloud,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, GarmentSize, GarmentColor, CategoryId } from '../types';
import { formatCOP } from '../utils/formatters';

export const AdminPanel: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    clearAllProducts,
    storeSettings,
    updateStoreSettings,
    showNotification,
    isSyncing,
  } = useStore();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'new-product' | 'settings'>('products');

  // Editing existing product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImageUrlInput, setEditImageUrlInput] = useState('');

  // New product form state
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '',
    category: 'enterizos',
    price: 150000,
    originalPrice: 180000,
    description: '',
    shortDescription: '',
    isNew: true,
    isExclusive: false,
    isSale: false,
    isBestseller: false,
    coverMediaType: 'image',
    primaryMediaUrl: '',
    images: [],
    colors: [{ name: 'Negro', hex: '#171717' }],
    sizes: ['S', 'M', 'L'],
    material: 'Satén y crepé de seda',
    composition: '95% Poliéster, 5% Spandex',
    careInstructions: ['Lavado delicado a mano con agua fría'],
    inventory: [
      { size: 'S', color: 'Negro', stock: 5 },
      { size: 'M', color: 'Negro', stock: 5 },
      { size: 'L', color: 'Negro', stock: 3 },
    ],
    videoUrl: undefined,
  });

  // Settings form
  const [tempSettings, setTempSettings] = useState(storeSettings);

  // Helper for uploading 1 or more photos
  const handleMultiImageFiles = (
    files: FileList | null,
    currentImages: string[],
    onUpdate: (updated: string[]) => void
  ) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const promises = fileList.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newUrls) => {
      onUpdate([...currentImages, ...newUrls]);
      showNotification(`${newUrls.length} foto(s) agregada(s) exitosamente`);
    });
  };

  // Helper for uploading video
  const handleVideoFile = (
    file: File | null,
    onUpdate: (url: string | undefined) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onUpdate(e.target.result as string);
        showNotification('Video de la prenda cargado exitosamente');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isAdminOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === storeSettings.adminPasscode || passcode === 'cirleni2026') {
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  const handleClearCatalog = async () => {
    const confirmed = window.confirm(
      '¿Deseas vaciar todas las prendas del catálogo de prueba? Esta acción borrará los registros de la base de datos en la nube para que puedas publicar únicamente tus prendas originales.'
    );
    if (confirmed) {
      await clearAllProducts();
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name?.trim()) {
      showNotification('Por favor asigna un nombre a la prenda.');
      return;
    }

    const isCoverVideo = newProd.coverMediaType === 'video';
    const videoUrl = newProd.videoUrl?.trim() || undefined;
    const imagesList = newProd.images && newProd.images.length > 0 ? newProd.images : [];

    if (!isCoverVideo && imagesList.length === 0) {
      showNotification('Por favor agrega al menos una foto de la prenda o selecciona video de portada.');
      return;
    }

    if (isCoverVideo && !videoUrl) {
      showNotification('Por favor sube o ingresa la URL del video para la portada.');
      return;
    }

    const created: Product = {
      id: `ch-prod-${Date.now()}`,
      name: newProd.name.trim(),
      slug: newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: (newProd.category as CategoryId) || 'enterizos',
      price: Number(newProd.price) || 120000,
      originalPrice: newProd.originalPrice ? Number(newProd.originalPrice) : undefined,
      description: newProd.description || 'Prenda exclusiva confeccionada con estándares de alta costura.',
      shortDescription: newProd.shortDescription || '',
      isNew: Boolean(newProd.isNew),
      isExclusive: Boolean(newProd.isExclusive),
      isSale: Boolean(newProd.isSale),
      isBestseller: Boolean(newProd.isBestseller),
      images: imagesList.length > 0 ? imagesList : (videoUrl ? [videoUrl] : []),
      colors: newProd.colors || [{ name: 'Negro', hex: '#171717' }],
      sizes: (newProd.sizes as GarmentSize[]) || ['S', 'M', 'L'],
      material: newProd.material || 'Tela premium',
      composition: newProd.composition || '100% Alta Calidad',
      careInstructions: newProd.careInstructions || ['Lavado delicado a mano'],
      inventory: newProd.inventory || [],
      videoUrl: videoUrl,
      coverMediaType: isCoverVideo ? 'video' : 'image',
      primaryMediaUrl: isCoverVideo ? videoUrl : (imagesList[0] || ''),
      createdAt: new Date().toISOString(),
    };

    addProduct(created);
    setActiveTab('products');
    setNewProd({
      name: '',
      category: 'enterizos',
      price: 150000,
      description: '',
      coverMediaType: 'image',
      primaryMediaUrl: '',
      images: [],
      colors: [{ name: 'Negro', hex: '#171717' }],
      sizes: ['S', 'M', 'L'],
      material: 'Satén y crepé de seda',
      composition: '95% Poliéster, 5% Spandex',
      careInstructions: ['Lavado delicado a mano con agua fría'],
      inventory: [
        { size: 'S', color: 'Negro', stock: 5 },
        { size: 'M', color: 'Negro', stock: 5 },
        { size: 'L', color: 'Negro', stock: 3 },
      ],
      videoUrl: undefined,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const isCoverVideo = editingProduct.coverMediaType === 'video';
    const videoUrl = editingProduct.videoUrl?.trim() || undefined;
    const imagesList = editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : [];

    const updated: Product = {
      ...editingProduct,
      coverMediaType: isCoverVideo ? 'video' : 'image',
      primaryMediaUrl: isCoverVideo ? (videoUrl || '') : (imagesList[0] || ''),
      videoUrl: videoUrl,
      images: imagesList.length > 0 ? imagesList : (videoUrl ? [videoUrl] : []),
    };

    updateProduct(updated);
    setEditingProduct(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(tempSettings);
  };

  // Handle local logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setTempSettings((prev) => ({ ...prev, logoUrl: dataUrl }));
          updateStoreSettings({ logoUrl: dataUrl });
          showNotification('Logo oficial actualizado exitosamente desde archivo local');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsAdminOpen(false)}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EDE4DA] my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EDE4DA] flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#171717] rounded-lg text-[#C6A77D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#171717]">
                Panel de Administración Boutique
              </h2>
              <p className="text-xs text-[#77716C]">
                Cirleni Hernández Brand Official
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-full border border-emerald-200">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Base de Datos en la Nube Conectada</span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 ml-1" />}
            </div>

            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 text-[#77716C] hover:text-[#171717] rounded-full hover:bg-[#FAF8F5]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Protection */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto w-full my-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#EDE4DA] flex items-center justify-center text-[#C6A77D]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-[#171717]">
                Acceso Administrativo Protegido
              </h3>
              <p className="text-xs text-[#77716C]">
                Ingresa tu clave de acceso para gestionar prendas, fotos, videos y WhatsApp.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError(false);
                  }}
                  placeholder="Ingresa tu clave de administrador"
                  className="w-full px-4 py-2.5 text-center text-sm border border-[#EDE4DA] rounded-lg focus:outline-hidden focus:border-[#C6A77D]"
                  autoFocus
                />
                {passcodeError && (
                  <span className="text-xs text-red-600 block mt-1.5">
                    Clave incorrecta. Intenta nuevamente.
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#171717] hover:bg-[#2A2A2A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col">
            {/* Nav Tabs */}
            <div className="flex items-center justify-between border-b border-[#EDE4DA] bg-[#FAF8F5] px-6 text-xs font-semibold">
              <div className="flex">
                <button
                  onClick={() => {
                    setActiveTab('products');
                    setEditingProduct(null);
                  }}
                  className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'products'
                      ? 'border-[#171717] text-[#171717]'
                      : 'border-transparent text-[#77716C] hover:text-[#171717]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Prendas en Catálogo ({products.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('new-product');
                    setEditingProduct(null);
                  }}
                  className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'new-product'
                      ? 'border-[#171717] text-[#171717]'
                      : 'border-transparent text-[#77716C] hover:text-[#171717]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Nueva Prenda</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setEditingProduct(null);
                  }}
                  className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'settings'
                      ? 'border-[#171717] text-[#171717]'
                      : 'border-transparent text-[#77716C] hover:text-[#171717]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>WhatsApp & Tienda</span>
                </button>
              </div>

              {products.length > 0 && (
                <button
                  onClick={handleClearCatalog}
                  className="text-[11px] text-[#77716C] hover:text-red-600 flex items-center gap-1 px-2.5 py-1 rounded hover:bg-red-50 transition-colors"
                  title="Vaciar prendas de prueba para dejar el catálogo limpio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vaciar Prendas de Prueba</span>
                </button>
              )}
            </div>

            {/* Tab 1: Product List & Stock */}
            {activeTab === 'products' && !editingProduct && (
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#171717]">
                      Prendas registradas en tu tienda oficial
                    </h3>
                    <p className="text-xs text-[#77716C]">
                      Aquí puedes editar precios, tallas, fotos o videos de portada de cada prenda.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('new-product')}
                    className="px-3.5 py-2 bg-[#171717] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-[#C6A77D] self-start sm:self-auto transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Nueva Prenda</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="bg-[#FAF8F5] rounded-xl border border-dashed border-[#EDE4DA] p-10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center text-[#C6A77D] border border-[#EDE4DA]">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-base font-bold text-[#171717]">
                        No hay prendas en el catálogo todavía
                      </h4>
                      <p className="text-xs text-[#77716C] max-w-md mx-auto">
                        Tu tienda está limpia y conectada a la base de datos en la nube. Comienza agregando tus vestidos, enterizos o conjuntos originales.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('new-product')}
                      className="px-5 py-2.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Primera Prenda</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#EDE4DA] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF8F5] text-[#171717] uppercase tracking-wider text-[11px] font-semibold border-b border-[#EDE4DA]">
                        <tr>
                          <th className="py-3 px-4">Prenda & Portada</th>
                          <th className="py-3 px-4">Categoría</th>
                          <th className="py-3 px-4">Precio COP</th>
                          <th className="py-3 px-4">Tallas</th>
                          <th className="py-3 px-4">Multimedia</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDE4DA]">
                        {products.map((p) => {
                          const isCoverVid = p.coverMediaType === 'video' && (p.primaryMediaUrl || p.videoUrl);
                          return (
                            <tr key={p.id} className="hover:bg-[#FAF8F5]/50">
                              <td className="py-3 px-4 flex items-center gap-3">
                                {isCoverVid ? (
                                  <div className="relative w-11 h-14 rounded-md border border-[#EDE4DA] bg-black overflow-hidden flex items-center justify-center shrink-0">
                                    <video
                                      src={p.primaryMediaUrl || p.videoUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                    <span className="absolute bottom-0.5 right-0.5 bg-[#C6A77D] text-[#171717] text-[7px] font-extrabold px-1 py-0.5 rounded uppercase">
                                      VIDEO
                                    </span>
                                  </div>
                                ) : (
                                  <img
                                    src={p.images[0] || '/src/assets/images/fashion_enterizo_black_1792782858876.jpg'}
                                    alt={p.name}
                                    referrerPolicy="no-referrer"
                                    className="w-11 h-14 object-cover rounded-md border border-[#EDE4DA] shrink-0"
                                  />
                                )}
                                <div>
                                  <span className="font-semibold text-[#171717] block">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-[#77716C]">
                                    {p.colors.map((c) => c.name).join(', ')}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[#77716C] uppercase text-[11px]">
                                {p.category}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#171717] tabular-nums">
                                {formatCOP(p.price)}
                              </td>
                              <td className="py-3 px-4 text-[#77716C]">
                                {p.sizes.join(', ')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {p.coverMediaType === 'video' ? (
                                    <span className="text-[10px] font-bold text-[#171717] bg-[#C6A77D]/30 px-2 py-0.5 rounded border border-[#C6A77D]/60 flex items-center gap-1">
                                      <Film className="w-3 h-3 text-[#171717]" />
                                      Portada Video
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[#171717] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EDE4DA] flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3 text-[#C6A77D]" />
                                      Portada Foto
                                    </span>
                                  )}

                                  {p.images.length > 0 && (
                                    <span className="text-[10px] text-[#77716C] bg-white px-1.5 py-0.5 rounded border border-[#EDE4DA]">
                                      {p.images.length} {p.images.length === 1 ? 'foto' : 'fotos'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setEditingProduct(p)}
                                  className="p-1.5 text-[#171717] hover:text-[#C6A77D] hover:bg-[#FAF8F5] rounded transition-colors"
                                  title="Editar prenda"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteProduct(p.id)}
                                  className="p-1.5 text-[#77716C] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar de la tienda"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Edit Product */}
            {editingProduct && (
              <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#EDE4DA]">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A77D]">
                      Modo Edición
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#171717]">
                      {editingProduct.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-[#77716C] hover:text-[#171717] underline"
                  >
                    Volver al listado
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Nombre de la Prenda *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Categoría *</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as CategoryId,
                        })
                      }
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    >
                      <option value="enterizos">Enterizos</option>
                      <option value="vestidos">Vestidos</option>
                      <option value="conjuntos">Conjuntos</option>
                      <option value="blusas">Blusas</option>
                      <option value="pantalones">Pantalones</option>
                      <option value="accesorios">Accesorios</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Precio COP *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg tabular-nums font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Precio Anterior (Descuento)</label>
                    <input
                      type="number"
                      value={editingProduct.originalPrice || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          originalPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="Ej. 180000 para indicar oferta"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg tabular-nums"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Descripción de la Prenda</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>

                  {/* Multimedia: Portada Principal Selector (Foto o Video) */}
                  <div className="sm:col-span-2 p-4 bg-[#FAF8F5] rounded-xl border border-[#EDE4DA] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE4DA] pb-3">
                      <div>
                        <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-[#C6A77D]" />
                          <span>Primer Elemento Visual / Portada de la Prenda</span>
                        </span>
                        <p className="text-[11px] text-[#77716C]">
                          Selecciona si deseas que la primera vista sea una Foto o un Video de la prenda.
                        </p>
                      </div>

                      {/* Selector de tipo de medio */}
                      <div className="flex bg-white p-1 rounded-lg border border-[#EDE4DA] self-start sm:self-auto shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              coverMediaType: 'image',
                              primaryMediaUrl: editingProduct.images[0] || '',
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            editingProduct.coverMediaType !== 'video'
                              ? 'bg-[#171717] text-white'
                              : 'text-[#77716C] hover:text-[#171717]'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#C6A77D]" />
                          <span>Foto de Portada</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              coverMediaType: 'video',
                              primaryMediaUrl: editingProduct.videoUrl || '',
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            editingProduct.coverMediaType === 'video'
                              ? 'bg-[#C6A77D] text-[#171717]'
                              : 'text-[#77716C] hover:text-[#171717]'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5 text-[#171717]" />
                          <span>Video de Portada</span>
                        </button>
                      </div>
                    </div>

                    {/* Si la portada es Video */}
                    {editingProduct.coverMediaType === 'video' && (
                      <div className="space-y-3 p-3.5 bg-white rounded-lg border border-[#C6A77D]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                              <Film className="w-3.5 h-3.5 text-[#C6A77D]" />
                              <span>Video Asignado como Primera Vista</span>
                            </span>
                            <p className="text-[11px] text-[#77716C]">
                              Carga un video en MP4/WebM desde tu dispositivo o ingresa un enlace directo.
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5 text-[#C6A77D]" />
                            <span>Subir video</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleVideoFile(file, (url) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      videoUrl: url,
                                      primaryMediaUrl: url,
                                    })
                                  );
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingProduct.videoUrl || ''}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                videoUrl: e.target.value,
                                primaryMediaUrl: e.target.value,
                              })
                            }
                            placeholder="O escribe una URL directa de video (MP4 / WebM)"
                            className="flex-1 px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                          />
                          {editingProduct.videoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  videoUrl: undefined,
                                  primaryMediaUrl: editingProduct.images[0] || '',
                                  coverMediaType: 'image',
                                })
                              }
                              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                            >
                              Quitar
                            </button>
                          )}
                        </div>

                        {editingProduct.videoUrl && (
                          <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden border border-[#EDE4DA] bg-black">
                            <video
                              src={editingProduct.videoUrl}
                              controls
                              muted
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fotografías Adicionales / Galería */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-[#C6A77D]" />
                            <span>Galería de Fotos ({editingProduct.images.length})</span>
                          </span>
                          <p className="text-[11px] text-[#77716C]">
                            {editingProduct.coverMediaType === 'video'
                              ? 'Fotos complementarias para el visor y la galería de la prenda.'
                              : 'La primera foto de la lista se muestra como la portada principal.'}
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors self-start sm:self-auto">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir fotos</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              handleMultiImageFiles(e.target.files, editingProduct.images, (updated) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  images: updated,
                                  primaryMediaUrl:
                                    editingProduct.coverMediaType === 'image'
                                      ? updated[0] || ''
                                      : editingProduct.primaryMediaUrl,
                                })
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editImageUrlInput}
                          onChange={(e) => setEditImageUrlInput(e.target.value)}
                          placeholder="O agrega una URL de imagen (/src/assets/... o https://...)"
                          className="flex-1 px-3 py-1.5 bg-white border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editImageUrlInput.trim()) {
                              const updated = [...editingProduct.images, editImageUrlInput.trim()];
                              setEditingProduct({
                                ...editingProduct,
                                images: updated,
                                primaryMediaUrl:
                                  editingProduct.coverMediaType === 'image'
                                    ? updated[0]
                                    : editingProduct.primaryMediaUrl,
                              });
                              setEditImageUrlInput('');
                              showNotification('Foto agregada a la prenda');
                            }
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#EDE4DA] rounded-lg text-xs font-semibold text-[#171717]"
                        >
                          Añadir URL
                        </button>
                      </div>

                      {/* Miniaturas de Fotos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                        {editingProduct.images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#EDE4DA] bg-white group shadow-2xs"
                          >
                            <img
                              src={imgUrl}
                              alt={`Foto ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && editingProduct.coverMediaType !== 'video' ? (
                              <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold bg-[#171717] text-[#C6A77D] px-1.5 py-0.5 rounded shadow-xs">
                                Portada
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newImgs = [...editingProduct.images];
                                  const [selected] = newImgs.splice(idx, 1);
                                  newImgs.unshift(selected);
                                  setEditingProduct({
                                    ...editingProduct,
                                    images: newImgs,
                                    coverMediaType: 'image',
                                    primaryMediaUrl: selected,
                                  });
                                  showNotification('Foto establecida como portada principal');
                                }}
                                className="absolute top-1.5 left-1.5 z-10 text-[9px] font-medium bg-black/70 hover:bg-[#171717] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Hacer Portada
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const filtered = editingProduct.images.filter((_, i) => i !== idx);
                                setEditingProduct({ ...editingProduct, images: filtered });
                              }}
                              className="absolute top-1.5 right-1.5 z-10 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Si la portada es foto, permitir video secundario opcional */}
                    {editingProduct.coverMediaType !== 'video' && (
                      <div className="pt-3 border-t border-[#EDE4DA]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                              <Film className="w-3.5 h-3.5 text-[#C6A77D]" />
                              <span>Video de Pasarela Opcional</span>
                            </span>
                            <p className="text-[11px] text-[#77716C]">
                              Puedes incluir un video para que las clientas vean la caída de la tela en el detalle.
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#171717] border border-[#EDE4DA] text-xs font-semibold rounded-lg cursor-pointer transition-colors self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5 text-[#C6A77D]" />
                            <span>Subir video</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleVideoFile(file, (url) =>
                                    setEditingProduct({ ...editingProduct, videoUrl: url })
                                  );
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={editingProduct.videoUrl || ''}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, videoUrl: e.target.value })
                            }
                            placeholder="O pega URL de video secundario"
                            className="flex-1 px-3 py-1.5 bg-white border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Etiquetas / Badges */}
                  <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isSale)}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, isSale: e.target.checked })
                        }
                      />
                      <span>En Oferta</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isExclusive)}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, isExclusive: e.target.checked })
                        }
                      />
                      <span>Exclusivo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.isNew)}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, isNew: e.target.checked })
                        }
                      />
                      <span>Nueva Colección</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EDE4DA]">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-[#EDE4DA] rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#171717] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#C6A77D] transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Create New Product */}
            {activeTab === 'new-product' && (
              <form onSubmit={handleCreateProduct} className="p-6 space-y-5">
                <div className="pb-2 border-b border-[#EDE4DA]">
                  <h3 className="font-serif text-base font-bold text-[#171717]">
                    Publicar Nueva Prenda en tu Tienda
                  </h3>
                  <p className="text-xs text-[#77716C]">
                    La información y fotos/videos se guardarán directamente en tu base de datos en la nube.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Nombre de la Prenda *</label>
                    <input
                      type="text"
                      required
                      value={newProd.name || ''}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      placeholder="Ej. Enterizo Gala Esmeralda"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Categoría *</label>
                    <select
                      value={newProd.category}
                      onChange={(e) =>
                        setNewProd({ ...newProd, category: e.target.value as CategoryId })
                      }
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    >
                      <option value="enterizos">Enterizos</option>
                      <option value="vestidos">Vestidos</option>
                      <option value="conjuntos">Conjuntos</option>
                      <option value="blusas">Blusas</option>
                      <option value="pantalones">Pantalones</option>
                      <option value="accesorios">Accesorios</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Precio en COP *</label>
                    <input
                      type="number"
                      required
                      value={newProd.price || ''}
                      onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                      placeholder="185000"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg tabular-nums font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Precio Anterior (Opcional)</label>
                    <input
                      type="number"
                      value={newProd.originalPrice || ''}
                      onChange={(e) =>
                        setNewProd({
                          ...newProd,
                          originalPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="210000"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg tabular-nums"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Descripción Detallada</label>
                    <textarea
                      value={newProd.description || ''}
                      onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      placeholder="Detalles de corte, tela, ocasiones de uso y detalles de confección..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>

                  {/* Multimedia: Portada Principal Selector (Foto o Video) */}
                  <div className="sm:col-span-2 p-4 bg-[#FAF8F5] rounded-xl border border-[#EDE4DA] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE4DA] pb-3">
                      <div>
                        <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-[#C6A77D]" />
                          <span>Primer Elemento Visual / Portada Principal</span>
                        </span>
                        <p className="text-[11px] text-[#77716C]">
                          ¿Qué deseas mostrar en la primera vista de la prenda? Puedes elegir Foto o Video.
                        </p>
                      </div>

                      {/* Selector de Foto o Video */}
                      <div className="flex bg-white p-1 rounded-lg border border-[#EDE4DA] self-start sm:self-auto shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            setNewProd({
                              ...newProd,
                              coverMediaType: 'image',
                              primaryMediaUrl: newProd.images?.[0] || '',
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            newProd.coverMediaType !== 'video'
                              ? 'bg-[#171717] text-white'
                              : 'text-[#77716C] hover:text-[#171717]'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#C6A77D]" />
                          <span>Foto de Portada</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setNewProd({
                              ...newProd,
                              coverMediaType: 'video',
                              primaryMediaUrl: newProd.videoUrl || '',
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                            newProd.coverMediaType === 'video'
                              ? 'bg-[#C6A77D] text-[#171717]'
                              : 'text-[#77716C] hover:text-[#171717]'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5 text-[#171717]" />
                          <span>Video de Portada</span>
                        </button>
                      </div>
                    </div>

                    {/* Si la portada es Video */}
                    {newProd.coverMediaType === 'video' && (
                      <div className="space-y-3 p-3.5 bg-white rounded-lg border border-[#C6A77D]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                              <Film className="w-3.5 h-3.5 text-[#C6A77D]" />
                              <span>Cargar Video para la Portada</span>
                            </span>
                            <p className="text-[11px] text-[#77716C]">
                              Este video aparecerá en la primera vista de la tarjeta de la prenda en la tienda.
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5 text-[#C6A77D]" />
                            <span>Subir archivo de video</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleVideoFile(file, (url) =>
                                    setNewProd({
                                      ...newProd,
                                      videoUrl: url,
                                      primaryMediaUrl: url,
                                    })
                                  );
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newProd.videoUrl || ''}
                            onChange={(e) =>
                              setNewProd({
                                ...newProd,
                                videoUrl: e.target.value,
                                primaryMediaUrl: e.target.value,
                              })
                            }
                            placeholder="O escribe una URL directa de video (MP4 / WebM)"
                            className="flex-1 px-3 py-1.5 bg-[#FAF8F5] border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                          />
                          {newProd.videoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewProd({
                                  ...newProd,
                                  videoUrl: undefined,
                                  primaryMediaUrl: newProd.images?.[0] || '',
                                  coverMediaType: 'image',
                                })
                              }
                              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                            >
                              Quitar
                            </button>
                          )}
                        </div>

                        {newProd.videoUrl && (
                          <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden border border-[#EDE4DA] bg-black">
                            <video
                              src={newProd.videoUrl}
                              controls
                              muted
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Galería de Fotos */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-[#C6A77D]" />
                            <span>Fotografías de la Prenda ({newProd.images?.length || 0})</span>
                          </span>
                          <p className="text-[11px] text-[#77716C]">
                            {newProd.coverMediaType === 'video'
                              ? 'Fotos complementarias para la vista de detalle.'
                              : 'La primera foto de la lista será la portada oficial.'}
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors self-start sm:self-auto">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir fotos</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              handleMultiImageFiles(e.target.files, newProd.images || [], (updated) =>
                                setNewProd({
                                  ...newProd,
                                  images: updated,
                                  primaryMediaUrl:
                                    newProd.coverMediaType === 'image'
                                      ? updated[0] || ''
                                      : newProd.primaryMediaUrl,
                                })
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrlInput}
                          onChange={(e) => setNewImageUrlInput(e.target.value)}
                          placeholder="O escribe una URL de imagen (/src/assets/... o https://...)"
                          className="flex-1 px-3 py-1.5 bg-white border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newImageUrlInput.trim()) {
                              const list = [...(newProd.images || []), newImageUrlInput.trim()];
                              setNewProd({
                                ...newProd,
                                images: list,
                                primaryMediaUrl:
                                  newProd.coverMediaType === 'image'
                                    ? list[0]
                                    : newProd.primaryMediaUrl,
                              });
                              setNewImageUrlInput('');
                              showNotification('Foto agregada a la nueva prenda');
                            }
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#EDE4DA] rounded-lg text-xs font-semibold text-[#171717]"
                        >
                          Añadir URL
                        </button>
                      </div>

                      {/* Miniaturas */}
                      {newProd.images && newProd.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                          {newProd.images.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#EDE4DA] bg-white group shadow-2xs"
                            >
                              <img
                                src={imgUrl}
                                alt={`Foto ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              {idx === 0 && newProd.coverMediaType !== 'video' ? (
                                <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold bg-[#171717] text-[#C6A77D] px-1.5 py-0.5 rounded shadow-xs">
                                  Portada
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...(newProd.images || [])];
                                    const [picked] = list.splice(idx, 1);
                                    list.unshift(picked);
                                    setNewProd({
                                      ...newProd,
                                      images: list,
                                      coverMediaType: 'image',
                                      primaryMediaUrl: picked,
                                    });
                                    showNotification('Foto definida como portada');
                                  }}
                                  className="absolute top-1.5 left-1.5 z-10 text-[9px] font-medium bg-black/70 hover:bg-[#171717] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Hacer Portada
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  const list = (newProd.images || []).filter((_, i) => i !== idx);
                                  setNewProd({ ...newProd, images: list });
                                }}
                                className="absolute top-1.5 right-1.5 z-10 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                                title="Eliminar foto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Video secundario opcional si la portada es foto */}
                    {newProd.coverMediaType !== 'video' && (
                      <div className="pt-3 border-t border-[#EDE4DA]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-xs text-[#171717] flex items-center gap-1.5">
                              <Film className="w-3.5 h-3.5 text-[#C6A77D]" />
                              <span>Video de Pasarela Opcional</span>
                            </span>
                            <p className="text-[11px] text-[#77716C]">
                              Muestra la caída y el movimiento de la prenda.
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#171717] border border-[#EDE4DA] text-xs font-semibold rounded-lg cursor-pointer transition-colors self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5 text-[#C6A77D]" />
                            <span>Subir video</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleVideoFile(file, (url) =>
                                    setNewProd({ ...newProd, videoUrl: url })
                                  );
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newProd.videoUrl || ''}
                            onChange={(e) => setNewProd({ ...newProd, videoUrl: e.target.value })}
                            placeholder="O escribe URL de video secundario"
                            className="flex-1 px-3 py-1.5 bg-white border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Etiquetas / Badges */}
                  <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(newProd.isNew)}
                        onChange={(e) => setNewProd({ ...newProd, isNew: e.target.checked })}
                      />
                      <span>Etiqueta Nueva Colección</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(newProd.isExclusive)}
                        onChange={(e) => setNewProd({ ...newProd, isExclusive: e.target.checked })}
                      />
                      <span>Exclusivo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(newProd.isSale)}
                        onChange={(e) => setNewProd({ ...newProd, isSale: e.target.checked })}
                      />
                      <span>En Oferta</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EDE4DA]">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publicar Prenda en la Tienda</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 4: Store & WhatsApp Settings */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                <div className="space-y-1 pb-3 border-b border-[#EDE4DA]">
                  <h3 className="font-serif text-base font-bold text-[#171717]">
                    Ajustes de la Tienda & WhatsApp de Pedidos
                  </h3>
                  <p className="text-xs text-[#77716C]">
                    Configura el número oficial de WhatsApp para pedidos directos y el enlace oficial de Instagram.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Nombre Oficial de la Marca</label>
                    <input
                      type="text"
                      value={tempSettings.brandName}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, brandName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Número de WhatsApp (con código de país 57)</label>
                    <input
                      type="text"
                      value={tempSettings.whatsappNumber}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, whatsappNumber: e.target.value })
                      }
                      placeholder="573213490850"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Texto Visible del WhatsApp</label>
                    <input
                      type="text"
                      value={tempSettings.whatsappDisplay}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, whatsappDisplay: e.target.value })
                      }
                      placeholder="+57 321 349 0850"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Enlace de Instagram Oficial</label>
                    <input
                      type="url"
                      value={tempSettings.instagramUrl}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, instagramUrl: e.target.value })
                      }
                      placeholder="https://www.instagram.com/cirlenihernandez"
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg font-mono text-[11px]"
                    />
                  </div>

                  {/* Logo Management */}
                  <div className="sm:col-span-2 p-4 bg-[#FAF8F5] rounded-xl border border-[#EDE4DA] space-y-3">
                    <span className="font-semibold block text-[#171717]">
                      Logo Oficial de la Marca
                    </span>
                    <div className="flex items-center gap-4">
                      {tempSettings.logoUrl ? (
                        <img
                          src={tempSettings.logoUrl}
                          alt="Logo actual"
                          className="w-14 h-14 rounded-full object-cover border border-[#C6A77D]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#171717] text-[#C6A77D] flex items-center justify-center font-bold">
                          CH
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={tempSettings.logoUrl}
                          onChange={(e) =>
                            setTempSettings({ ...tempSettings, logoUrl: e.target.value })
                          }
                          placeholder="URL del logo"
                          className="w-full px-3 py-1.5 border border-[#EDE4DA] rounded bg-white text-[11px] font-mono"
                        />
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#EDE4DA] hover:border-[#171717] rounded text-[11px] font-semibold cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#C6A77D]" />
                          <span>Subir logo desde archivo local</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Barra de Anuncios Superior</label>
                    <input
                      type="text"
                      value={tempSettings.announcementText}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, announcementText: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#EDE4DA] rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#EDE4DA]">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#171717] hover:bg-[#C6A77D] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Ajustes de la Tienda</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
