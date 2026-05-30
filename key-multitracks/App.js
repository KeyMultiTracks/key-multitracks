import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { Play, Music, LogIn, Folder, Database, WifiOff, RefreshCw } from 'lucide-react-native';

export default function App() {
  // Mantenemos tus mismos estados cerebrales de la PWA
  const [view, setView] = useState('login'); 
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  // Perfil simulado con tus mismos datos para ver el diseño real
  const [userProfile, setUserProfile] = useState({
    name: "Kevin",
    picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  });

  // Tu lista de categorías idéntica para renderizar las tarjetas
  const [foldersList, setFoldersList] = useState([
    { id: '1', name: 'Alabanzas de Júbilo', hasContent: true },
    { id: '2', name: 'Adoración Intensa', hasContent: true },
    { id: '3', name: 'Especiales / Eventos', hasContent: false },
    { id: '4', name: 'Nuevos Lanzamientos', hasContent: true },
  ]);

  // Funciones de navegación rápidas para probar la interactividad en el iPad
  const handleLogin = () => setView('folders');
  const handleLogout = () => {
    setUserProfile(null);
    setView('login');
  };

  return (
    // SafeAreaView protege el notch y la cámara frontal en iPhone/iPad automáticamente
    <SafeAreaView className="flex-1 bg-gray-900">
      
      {/* ==========================================
          VISTA #1: LOGIN (DISEÑO VERTICAL FIJO)
          ========================================== */}
      {view === 'login' && (
        <View className="flex-1 flex-col items-center justify-center p-6">
          <View className="bg-gray-800 p-8 rounded-3xl border border-gray-700 w-full max-w-md items-center shadow-2xl relative overflow-hidden">
            
            {isOfflineMode && (
              <View className="absolute top-4 left-4 bg-orange-600/20 border border-orange-500/50 px-3 py-1 rounded-full flex row items-center gap-2">
                <WifiOff size={14} className="text-orange-400" />
                <Text className="text-orange-400 text-xs font-bold">Modo Offline</Text>
              </View>
            )}

            {userProfile ? (
              // Contenedor si el usuario ya está recordado (Tu misma lógica)
              <View className="flex-col items-center w-full gap-5 mt-4">
                <Image 
                  source={{ uri: userProfile.picture }} 
                  className="w-24 h-24 rounded-full border-4 border-cyan-500/30 shadow-xl" 
                />
                <View className="items-center">
                  <Text className="text-2xl font-black text-white text-center">¡Hola, {userProfile.name}!</Text>
                  <Text className="text-gray-400 text-sm mt-1 text-center">Listo para el ensayo</Text>
                </View>

                <TouchableOpacity 
                  onClick={handleLogin}
                  onPress={handleLogin}
                  className="w-full flex-row items-center justify-center bg-cyan-500 py-4 px-6 rounded-2xl shadow-lg active:scale-95 mt-2 gap-2"
                >
                  <Play size={18} fill="#111827" className="text-gray-900" />
                  <Text className="text-gray-900 font-bold text-base uppercase tracking-wider">Entrar a las pistas</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogout}>
                  <Text className="text-xs text-gray-500 hover:text-gray-300 underline mt-2">Ingresar con otra cuenta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Contenedor de inicio de sesión limpio
              <View className="items-center w-full gap-4">
                <View className="items-center group mb-4">
                  <View className="p-5 bg-cyan-500 rounded-3xl shadow-lg shadow-cyan-500/20">
                    <Music className="text-white w-12 h-12" />
                  </View>
                  <View className="items-center mt-3">
                    <Text className="text-3xl font-black tracking-tighter text-white">
                      ACTOS <Text className="text-cyan-400 font-light">Multitracks</Text>
                    </Text>
                    <Text className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-1">
                      Music Management
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={handleLogin}
                  className="w-full flex-row items-center justify-center bg-white py-4 px-6 rounded-2xl shadow-md active:scale-95 mt-4 gap-2"
                >
                  <LogIn size={18} className="text-gray-900" />
                  <Text className="text-gray-900 font-bold text-base">Continuar con Google</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      )}

      {/* ==========================================
          VISTA #2: CATEGORÍAS (DISEÑO VERTICAL FIJO)
          ========================================== */}
      {view === 'folders' && (
        <View className="flex-1 flex-col w-full max-w-md mx-auto px-4 pt-4">
          
          {/* Header Superior idéntico */}
          <View className="flex-row justify-between items-center mb-4 bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-xl">
            <View className="flex-row items-center gap-3">
              <View className="p-2.5 bg-cyan-500/20 rounded-xl">
                <Folder className="text-cyan-400 w-6 h-6" />
              </View>
              <View>
                <Text className="text-lg font-bold text-cyan-400 uppercase tracking-wider">Categorías</Text>
              </View>
            </View>
            
            {userProfile && (
              <View className="flex-row items-center gap-3">
                <TouchableOpacity 
                  onPress={() => setShowStorageModal(true)}
                  className="p-2 bg-gray-700 rounded-full"
                >
                  <Database className="w-5 h-5 text-gray-300" />
                </TouchableOpacity>
                <Image 
                  source={{ uri: userProfile.picture }} 
                  className="w-8 h-8 rounded-full border border-cyan-500/30" 
                />
              </View>
            )}
          </View>

          {/* Listado de Carpetas con Scroll Nativo y ligero */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="bg-gray-800/40 p-3 rounded-2xl border border-gray-700/50 flex-col gap-3 mb-4">
              {foldersList.map((folder) => (
                <TouchableOpacity 
                  key={folder.id} 
                  className={`flex-row items-center justify-between p-4 border rounded-2xl shadow-md ${
                    folder.hasContent ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-rose-900/10 border-rose-500/20'
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className={`p-3 rounded-xl ${folder.hasContent ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                      <Folder className={`w-6 h-6 ${folder.hasContent ? 'text-emerald-400' : 'text-rose-400'}`} />
                    </View>
                    <View className="flex-1 flex-col">
                      <Text className={`text-base font-bold ${folder.hasContent ? 'text-emerald-50' : 'text-rose-50'}`}>
                        {folder.name}
                      </Text>
                      <Text className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                        folder.hasContent ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {folder.hasContent ? 'REPERTORIO LISTO' : 'CARPETA VACÍA'}
                      </Text>
                    </View>
                  </View>
                  <View className={`w-2.5 h-2.5 rounded-full ${folder.hasContent ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Botón flotante temporal para regresar al Login y probar */}
          <TouchableOpacity 
            onPress={() => setView('login')}
            className="mb-4 bg-gray-800 p-3 rounded-xl border border-gray-700 items-center"
          >
            <Text className="text-gray-400 text-xs font-bold font-mono">← Cerrar Sesión (Simulado)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ==========================================
          MODAL DE ALMACENAMIENTO OFFLINE
          ========================================== */}
      {showStorageModal && (
        <View className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <View className="bg-gray-800 border border-cyan-500/30 rounded-3xl p-6 w-full max-w-sm items-center gap-4">
            <Database className="w-12 h-12 text-cyan-400" />
            <Text className="text-xl font-black text-white">Disco Duro Local</Text>
            <Text className="text-xs text-gray-400 text-center px-2">
              Tu repertorio se guardará en el almacenamiento del iPad para ensayar sin internet.
            </Text>
            <TouchableOpacity 
              onPress={() => setShowStorageModal(false)}
              className="w-full bg-cyan-500 py-3 rounded-xl items-center mt-2"
            >
              <Text className="text-gray-900 font-bold">Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
