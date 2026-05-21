import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';

const GOOGLE_API_KEY = 'AIzaSyArrPjIf-DeFJq_wzjr8-G84I1JfG6EDH4'; 
const SETLIST_FOLDER_ID = '1Evv0Su6w9jcXFR7EX1f9mL4GXaOmvCO0'; 

const generateRealisticWaveform = () => {
  return Array.from({ length: 150 }, () => {
    return Math.floor(Math.random() * 70) + 25; 
  });
};

const TrackControl = ({ track, globalVolume, isGlobalMuted, isAnySoloed, onToggleMute, onToggleSolo }) => {
  const [localVolume, setLocalVolume] = useState(track.volume);

  useEffect(() => {
    const updateAudioHardware = async () => {
      if (track.sound) {
        try {
          const isEffectivelyMuted = track.isMuted || isGlobalMuted || (isAnySoloed && !track.isSoloed);
          const targetVolume = isEffectivelyMuted ? 0 : localVolume * globalVolume;
          await track.sound.setVolumeAsync(targetVolume);
        } catch (e) { console.log(e); }
      }
    };
    updateAudioHardware();
  }, [localVolume, track.isMuted, track.isSoloed, isGlobalMuted, globalVolume, isAnySoloed]);

  return (
    <View style={[styles.dawChannelStrip, track.isGuide && styles.stripChannelGuide]}>
      <View style={styles.activeIndicatorRow}>
        <View style={styles.greenDotSignal} />
        <Text style={styles.activeTagText}>ACTIVE</Text>
      </View>

      <Text style={styles.dawTrackLabel} numberOfLines={1}>{track.name}</Text>

      <View style={styles.miniVuMeterSlot}>
        <View style={[styles.vuGreenBar, { opacity: localVolume > 0.1 ? 1 : 0.2 }]} />
        <View style={[styles.vuGreenBar, { opacity: localVolume > 0.3 ? 0.8 : 0.2 }]} />
        <View style={[styles.vuGreenBar, { opacity: localVolume > 0.5 ? 0.6 : 0.2 }]} />
        <View style={[styles.vuGreenBar, { opacity: localVolume > 0.7 ? 0.4 : 0.2 }]} />
        <View style={[styles.vuOrangeBar, { opacity: localVolume > 0.9 ? 0.8 : 0.1 }]} />
      </View>

      <View style={styles.channelActionRow}>
        <TouchableOpacity style={[styles.actionRoundBtn, track.isMuted && styles.btnMuteOn]} onPress={() => onToggleMute(track.id)}>
          <Text style={[styles.actionBtnText, track.isMuted && {color: '#FFF'}]}>M</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionRoundBtn, track.isSoloed && styles.btnSoloOn]} onPress={() => onToggleSolo(track.id)}>
          <Text style={[styles.actionBtnText, track.isSoloed && {color: '#000'}]}>Solo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panDialContainer}>
        <Entypo name="vimeo" size={10} color="#9CA3AF" style={{ transform: [{ rotate: track.isGuide ? '-45deg' : '45deg' }] }} />
        <Text style={[styles.panDialText, track.isGuide ? styles.panL : styles.panR]}>{track.isGuide ? 'L' : 'R'}</Text>
      </View>

      <View style={styles.faderHardwareContainer}>
        <Slider
          style={styles.faderHardwareComponent}
          minimumValue={0}
          maximumValue={1}
          value={localVolume}
          onValueChange={setLocalVolume}
          minimumTrackTintColor="#10B981"
          maximumTrackTintColor="#1F2937"
          thumbTintColor="#E5E7EB"
        />
      </View>
    </View>
  );
};

export default function App() {
  const [view, setView] = useState('categories');
  const [categoriesList, setCategoriesList] = useState([]);
  const [songsList, setSongsList] = useState([]);
  const [tracks, setTracks] = useState([]);
  
  const [currentCategoryName, setCurrentCategoryName] = useState("");
  const [currentSongName, setCurrentSongName] = useState("");
  const [currentBPM, setCurrentBPM] = useState(124);
  const [currentKey, setCurrentKey] = useState("G#");

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingStems, setIsDownloadingStems] = useState(false); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); 
  const [duration, setDuration] = useState(240); 
  const [waveData, setWaveData] = useState([]);

  const [masterVolume, setMasterVolume] = useState(0.85);
  const [isMasterMuted, setIsMasterMuted] = useState(false);

  const isAnySoloed = tracks.some(t => t.isSoloed);
  const timerRef = useRef(null);

  useEffect(() => {
    async function initApp() {
      await ScreenOrientation.unlockAsync();
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    }
    initApp();
    setWaveData(generateRealisticWaveform());
  }, []);

  useEffect(() => {
    if (isPlaying && !isDownloadingStems) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, duration, isDownloadingStems]);

  const togglePlay = async () => {
    if (isDownloadingStems) return; 

    setIsPlaying(!isPlaying);
    try {
      if (!isPlaying) {
        tracks.forEach(t => t.sound && t.sound.playAsync());
      } else {
        tracks.forEach(t => t.sound && t.sound.pauseAsync());
      }
    } catch (e) { console.log(e); }
  };

  const toggleTrackMute = (id) => setTracks(prev => prev.map(t => t.id === id ? { ...t, isMuted: !t.isMuted } : t));
  const toggleTrackSolo = (id) => setTracks(prev => prev.map(t => t.id === id ? { ...t, isSoloed: !t.isSoloed } : t));

  const parseSongMetadata = (name) => {
    let cleanName = name.replace(/\.[^/.]+$/, ""); 
    let bpm = 120; let key = "N/A";
    const parts = name.split('-');
    if (parts.length >= 2) {
      cleanName = parts[0].trim(); 
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        const bpmMatch = part.match(/(\d+)/);
        if (bpmMatch) bpm = parseInt(bpmMatch[1]);
        else if (part.length > 0 && part.toLowerCase() !== 'bpm') key = part.toUpperCase();
      }
    }
    return { cleanName, bpm, key };
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${SETLIST_FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files) {
          const checkedFolders = await Promise.all(data.files.map(async (folder) => {
            const checkUrl = `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+trashed=false&pageSize=1&fields=files(id)&key=${GOOGLE_API_KEY}`;
            const checkRes = await fetch(checkUrl);
            const checkData = await checkRes.json();
            return { ...folder, hasFiles: checkData.files && checkData.files.length > 0 };
          }));
          setCategoriesList(checkedFolders.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    };
    fetchCategories();
  }, []);

  const openCategory = async (folderId, folderName) => {
    setCurrentCategoryName(folderName);
    setView('songs');
    setIsLoading(true);
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.files) setSongsList(data.files.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  const loadStudioMixer = async (songFile) => {
    setIsDownloadingStems(true);
    setView('studio_mixer'); 
    setIsPlaying(false);
    setCurrentTime(0);
    setWaveData(generateRealisticWaveform());
    
    const meta = parseSongMetadata(songFile.name);
    setCurrentSongName(meta.cleanName);
    setCurrentBPM(meta.bpm);
    setCurrentKey(meta.key);

    try {
      tracks.forEach(t => { if(t.sound) t.sound.unloadAsync(); });

      const url = `https://www.googleapis.com/drive/v3/files?q='${songFile.id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      let audioFiles = [];
      if (data.files && data.files.length > 0) {
        audioFiles = data.files.filter(f => f.mimeType.includes('audio/') || f.name.toLowerCase().match(/\.(wav|mp3|m4a|aac)$/));
      }

      if (audioFiles.length === 0) {
        audioFiles = [{ name: 'CLICK' }, { name: 'GUÍA' }, { name: 'PIANO' }, { name: 'BAJO' }];
      }

      const readyTracks = await Promise.all(audioFiles.map(async (file, idx) => {
        const trackName = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
        const nameLower = trackName.toLowerCase();
        
        const isGuide = ['click', 'guia', 'guide', 'reference', 'voice'].some(word => nameLower.includes(word));
        const autoPanValue = isGuide ? -1.0 : 1.0; 

        let soundObj = null;
        if (file.id) {
          try {
            const directDownloadUrl = `https://docs.google.com/uc?export=download&id=${file.id}`;
            const { sound } = await Audio.Sound.createAsync(
              { uri: directDownloadUrl }, 
              { shouldPlay: false, volume: 0.75 }
            );
            await sound.setStatusAsync({ pan: autoPanValue }); 
            soundObj = sound;
          } catch (e) { 
            console.log(`Error de audio en ${trackName}:`, e); 
          }
        }

        return {
          id: `track-${idx}`,
          name: trackName,
          isGuide: isGuide,
          volume: 0.75,
          pan: autoPanValue, 
          isSoloed: false,
          isMuted: false,
          sound: soundObj
        };
      }));

      setTracks(readyTracks);
      setDuration(240); 
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsDownloadingStems(false); 
    }
  };

  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `00:00:${m}:${s}`;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar hidden={view === 'studio_mixer'} barStyle="light-content" />

        {view !== 'studio_mixer' && (
          <View style={styles.header}>
            <Text style={styles.brandText}>KEY<Text style={styles.goldText}>MULTITRACKS</Text></Text>
          </View>
        )}

        {isLoading && view !== 'studio_mixer' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>SINCRONIZANDO DRIVE...</Text>
          </View>
        )}

        {view === 'categories' && (
          <ScrollView style={styles.bodyScroll}>
            <Text style={styles.sectionTitle}>MIS REPERTORIOS</Text>
            {categoriesList.map((folder) => (
              <TouchableOpacity 
                key={folder.id} 
                style={[styles.categoryCard, folder.hasFiles ? styles.folderAvailable : styles.folderEmpty]} 
                onPress={() => { if(folder.hasFiles) openCategory(folder.id, folder.name); }}
              >
                <View style={styles.cardLeft}>
                  <Ionicons name={folder.hasFiles ? "folder" : "folder-open-outline"} size={20} color={folder.hasFiles ? "#10B981" : "#EF4444"} style={{ marginRight: 12 }} />
                  <Text style={styles.categoryNameText}>{folder.name}</Text>
                </View>
                <Text style={[styles.statusTagText, { color: folder.hasFiles ? "#10B981" : "#EF4444" }]}>
                  {folder.hasFiles ? "DISPONIBLE" : "VACÍO"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {view === 'songs' && (
          <ScrollView style={styles.bodyScroll}>
            <TouchableOpacity style={styles.backButtonRow} onPress={() => setView('categories')}>
              <Ionicons name="arrow-back" size={14} color="#D4AF37" />
              <Text style={styles.backButtonText}>VOLVER A REPERTORIOS</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{currentCategoryName.toUpperCase()}</Text>
            {songsList.map((song) => (
              <TouchableOpacity key={song.id} style={styles.songCard} onPress={() => loadStudioMixer(song)}>
                <View style={styles.cardLeft}>
                  <FontAwesome5 name="music" size={12} color="#D4AF37" style={{ marginRight: 12 }} />
                  <Text style={styles.songNameText}>{parseSongMetadata(song.name).cleanName}</Text>
                </View>
                <Ionicons name="equalizer" size={14} color="#D4AF37" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {view === 'studio_mixer' && (
          <View style={styles.studioContainer}>
            
            <View style={styles.studioTopBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => { setIsPlaying(false); tracks.forEach(t=>t.sound&&t.sound.unloadAsync()); setView('songs'); }} style={styles.studioBackBtn}>
                  <Ionicons name="chevron-back" size={16} color="#D4AF37" />
                </TouchableOpacity>
                <Text style={styles.studioLogoText}>KEY <Text style={{fontWeight:'300', color:'#D4AF37'}}>MULTITRACKS</Text></Text>
                <Text style={styles.studioSongDetails}>
                  Canción: <Text style={styles.whiteTxt}>{currentSongName}</Text>  |  Tono: <Text style={styles.whiteTxt}>{currentKey}</Text>  |  BPM: <Text style={styles.whiteTxt}>{currentBPM}</Text>
                </Text>
              </View>
              <Text style={styles.studioTimeClock}>{formatTime(currentTime)}</Text>
            </View>

            <View style={styles.dawWaveformWrapper}>
              {isDownloadingStems ? (
                <View style={styles.timelineLoaderBox}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.timelineLoaderText}>CARGANDO MULTITRACKS Y PREPARANDO AUDIO...</Text>
                </View>
              ) : (
                <View style={styles.dawWaveDisplay}>
                  {waveData.map((h, i) => {
                    const isPlayed = i <= (currentTime / duration) * waveData.length;
                    return (
                      <View key={i} style={styles.dawWaveColumn}>
                        <View style={[styles.dawWaveBarTop, { height: `${h/2}%`, backgroundColor: isPlayed ? '#10B981' : '#4B5563' }]} />
                        <View style={[styles.dawWaveBarBottom, { height: `${h/2}%`, backgroundColor: isPlayed ? '#059669' : '#374151' }]} />
                      </View>
                    );
                  })}
                  <View style={[styles.dawTimelineCursor, { left: `${(currentTime/duration)*100}%` }]} />
                </View>
              )}
            </View>

            <View style={styles.studioConsoleSurface}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelsScrollArea}>
                {tracks.map((track) => (
                  <TrackControl 
                    key={track.id} track={track} globalVolume={masterVolume}
                    isGlobalMuted={isMasterMuted} isAnySoloed={isAnySoloed}
                    onToggleMute={toggleTrackMute} onToggleSolo={toggleTrackSolo}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity style={[styles.floatingPlayHardware, isDownloadingStems && {opacity: 0.5}]} onPress={togglePlay} disabled={isDownloadingStems}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="#090D16" style={{ marginLeft: isPlaying ? 0 : 2 }} />
              </TouchableOpacity>

              <View style={styles.masterHardwareStrip}>
                <Text style={styles.masterLabelTitle}>MASTER</Text>
                <View style={styles.vuMeterAnalogBox}>
                  <View style={styles.analogScaleLine} />
                  <View style={[styles.analogNeedleIndicator, { transform: [{ rotate: isPlaying && !isMasterMuted ? '15deg' : '-30deg' }] }]} />
                  <Text style={styles.vuMeterLabelTxt}>VU</Text>
                </View>

                <TouchableOpacity style={[styles.masterMuteBtn, isMasterMuted && styles.masterMuteOn]} onPress={() => setIsMasterMuted(!isMasterMuted)}>
                  <Text style={[styles.masterMuteText, isMasterMuted && {color: '#FFF'}]}>M</Text>
                </TouchableOpacity>

                <View style={styles.masterFaderHardwareSlot}>
                  <Slider
                    style={styles.faderHardwareComponent}
                    minimumValue={0} maximumValue={1} value={masterVolume} onValueChange={setMasterVolume}
                    minimumTrackTintColor="#D4AF37" maximumTrackTintColor="#1F2937" thumbTintColor="#D4AF37"
                  />
                </View>
                <Text style={styles.masterFaderBottomTag}>MASTER FADER</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#090D16' },
  header: { paddingVertical: 12, backgroundColor: '#111827', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  brandText: { fontSize: 16, fontWeight: '900', color: '#E5E7EB', letterSpacing: 2 },
  goldText: { color: '#D4AF37', fontWeight: '300' },
  bodyScroll: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 9, fontWeight: '800', color: '#6B7280', marginBottom: 12, letterSpacing: 1 },
  
  categoryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 8, marginBottom: 8, borderWidth: 1 },
  folderAvailable: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  folderEmpty: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' },
  categoryNameText: { fontSize: 13, fontWeight: '700', color: '#E5E7EB' },
  statusTagText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  backButtonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButtonText: { color: '#D4AF37', fontSize: 9, fontWeight: '700', marginLeft: 6 },
  songCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', padding: 14, borderRadius: 8, marginBottom: 6 },
  songNameText: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 13, 22, 0.98)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  loadingText: { color: '#D4AF37', fontSize: 10, marginTop: 12, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },

  studioContainer: { flex: 1, backgroundColor: '#0B0F19' },
  studioTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  studioBackBtn: { padding: 4, marginRight: 8 },
  studioLogoText: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  studioSongDetails: { fontSize: 10, color: '#6B7280', marginLeft: 15, fontWeight: '500' },
  whiteTxt: { color: '#E5E7EB', fontWeight: '700' },
  studioTimeClock: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: '#D4AF37', fontWeight: '700' },

  dawWaveformWrapper: { height: 60, backgroundColor: '#090D16', borderBottomWidth: 1, borderBottomColor: '#1F2937', position: 'relative', justifyContent: 'center' },
  timelineLoaderBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  timelineLoaderText: { color: '#D4AF37', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  
  dawWaveDisplay: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  dawWaveColumn: { width: 3, marginHorizontal: 0.5, height: '90%', justifyContent: 'center', alignItems: 'center', gap: 1 },
  dawWaveBarTop: { width: '100%', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  dawWaveBarBottom: { width: '100%', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  dawTimelineCursor: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#D4AF37', zIndex: 10 },

  studioConsoleSurface: { flex: 1, flexDirection: 'row', backgroundColor: '#0E1322' },
  channelsScrollArea: { paddingLeft: 10, paddingRight: 95, alignItems: 'center', flexDirection: 'row', gap: 6 },
  
  dawChannelStrip: { backgroundColor: '#141B2D', width: 66, height: '96%', borderRadius: 6, alignItems: 'center', paddingVertical: 6, borderWidth: 1, borderColor: '#1F2937', justifyContent: 'space-between' },
  activeIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  greenDotSignal: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#10B981' },
  activeTagText: { fontSize: 7, fontWeight: '900', color: '#10B981' },
  dawTrackLabel: { fontSize: 9, fontWeight: '800', color: '#F5F5DC', textAlign: 'center', width: '90%' },
  
  miniVuMeterSlot: { flexDirection: 'row', gap: 1, height: 6, width: '70%', backgroundColor: '#090D16', borderRadius: 1, padding: 1, alignItems: 'center' },
  vuGreenBar: { flex: 1, height: '100%', backgroundColor: '#10B981' },
  vuOrangeBar: { flex: 1, height: '100%', backgroundColor: '#F59E0B' },

  channelActionRow: { flexDirection: 'row', gap: 3 },
  actionRoundBtn: { width: 22, height: 16, borderRadius: 3, backgroundColor: '#242F48', justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { color: '#9CA3AF', fontSize: 7, fontWeight: '900' },
  btnMuteOn: { backgroundColor: '#EF4444' },
  btnSoloOn: { backgroundColor: '#FBBF24' },

  panDialContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  panDialText: { fontSize: 7, fontWeight: '700' },
  panL: { color: '#3B82F6' },
  panR: { color: '#10B981' },

  faderHardwareContainer: { width: 22, height: '48%', backgroundColor: '#090D16', borderRadius: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  faderHardwareComponent: { width: 105, height: 20, transform: [{ rotate: '-90deg' }] },

  floatingPlayHardware: { position: 'absolute', bottom: 15, right: 100, width: 48, height: 48, borderRadius: 24, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', zIndex: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 6 },

  masterHardwareStrip: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 85, backgroundColor: '#1A2333', borderLeftWidth: 2, borderLeftColor: '#D4AF37', alignItems: 'center', paddingVertical: 8, justifyContent: 'space-between', zIndex: 40 },
  masterLabelTitle: { fontSize: 11, fontWeight: '900', color: '#D4AF37', letterSpacing: 1 },
  
  vuMeterAnalogBox: { width: 64, height: 32, backgroundColor: '#2C1A1A', borderRadius: 4, borderWidth: 1, borderColor: '#D4AF37', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  analogScaleLine: { width: '80%', height: 2, backgroundColor: '#4A2F2F', position: 'absolute', top: 6 },
  analogNeedleIndicator: { width: 2, height: 20, backgroundColor: '#EF4444', position: 'absolute', bottom: 2, originY: 20 },
  vuMeterLabelTxt: { fontSize: 7, color: '#10B981', position: 'absolute', bottom: 2, fontWeight: '900' },

  masterMuteBtn: { width: 28, height: 20, borderRadius: 3, backgroundColor: '#242F48', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' },
  masterMuteText: { color: '#EF4444', fontSize: 8, fontWeight: '900' },
  masterMuteOn: { backgroundColor: '#EF4444' },
  masterFaderHardwareSlot: { width: 26, height: '44%', backgroundColor: '#090D16', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  masterFaderBottomTag: { fontSize: 7, fontWeight: '800', color: '#9CA3AF' }
});