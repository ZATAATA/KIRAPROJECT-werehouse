import React, { useState, useCallback, useEffect } from 'react';
import HomeScreen from './screens/HomeScreen';
import ItemListScreen from './screens/ItemListScreen';
import FormScreen from './screens/FormScreen';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import { getItems } from './store/db';

async function getItemCounts(gudangList) {
  const counts = {};
  for (const g of gudangList) {
    try {
      const items = await getItems(g.id);
      counts[g.id] = items.length;
    } catch (error) {
      counts[g.id] = 0;
    }
  }
  return counts;
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [gudang, setGudang] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [itemCounts, setItemCounts] = useState({ basah: 0, kering: 0, dapur: 0, kimia: 0 });
  const [gudangList, setGudangList] = useState([
    { id: 'basah',  label: 'Gudang Basah',  icon: '💧', cls: 'card-basah'  },
    { id: 'kering', label: 'Gudang Kering', icon: '📦', cls: 'card-kering' },
    { id: 'dapur',  label: 'Gudang Dapur',  icon: '🍳', cls: 'card-dapur'  },
    { id: 'kimia',  label: 'Gudang Kimia',  icon: '🧪', cls: 'card-kimia'  },
  ]);
  const { toast, showToast } = useToast();

  // ── Theme ──────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('zata_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zata_theme', theme);
  }, [theme]);

  // Load gudang list and item counts on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { getGudangList } = await import('./store/db');
        const list = await getGudangList();
        
        // Fallback to hardcoded list if API fails or returns empty
        if (!list || list.length === 0) {
          console.log('API returned empty list, using fallback');
          const fallbackList = [
            { id: 'basah',  label: 'Gudang Basah',  icon: '💧', cls: 'card-basah'  },
            { id: 'kering', label: 'Gudang Kering', icon: '📦', cls: 'card-kering' },
            { id: 'dapur',  label: 'Gudang Dapur',  icon: '🍳', cls: 'card-dapur'  },
            { id: 'kimia',  label: 'Gudang Kimia',  icon: '🧪', cls: 'card-kimia'  },
          ];
          setGudangList(fallbackList);
          setItemCounts({ basah: 0, kering: 0, dapur: 0, kimia: 0 });
        } else {
          console.log('Loaded gudang list from API:', list);
          setGudangList(list);
          const counts = await getItemCounts(list);
          setItemCounts(counts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to hardcoded list on error
        const fallbackList = [
          { id: 'basah',  label: 'Gudang Basah',  icon: '💧', cls: 'card-basah'  },
          { id: 'kering', label: 'Gudang Kering', icon: '📦', cls: 'card-kering' },
          { id: 'dapur',  label: 'Gudang Dapur',  icon: '🍳', cls: 'card-dapur'  },
          { id: 'kimia',  label: 'Gudang Kimia',  icon: '🧪', cls: 'card-kimia'  },
        ];
        setGudangList(fallbackList);
        setItemCounts({ basah: 0, kering: 0, dapur: 0, kimia: 0 });
      }
    };
    loadData();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // ── Navigation ─────────────────────────────────────────────────
  const goHome = useCallback(async () => {
    setScreen('home');
    setGudang(null);
    setEditItem(null);
    const counts = await getItemCounts(gudangList);
    setItemCounts(counts);
  }, [gudangList]);

  const goList = useCallback((g) => {
    setGudang(g);
    setEditItem(null);
    setScreen('list');
  }, []);

  const goAdd = useCallback(() => {
    setEditItem(null);
    setScreen('form');
  }, []);

  const goEdit = useCallback((item) => {
    setEditItem(item);
    setScreen('form');
  }, []);

  const handleSaved = useCallback(async (item) => {
    setListRefreshKey(k => k + 1);
    const counts = await getItemCounts(gudangList);
    setItemCounts(counts);
    setScreen('list');
    showToast(`"${item.namaBarang}" berhasil disimpan!`);
  }, [showToast, gudangList]);

  const handleBackFromForm = useCallback(() => {
    setScreen('list');
    setEditItem(null);
  }, []);

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          gudangList={gudangList}
          onSelect={goList}
          itemCounts={itemCounts}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {screen === 'list' && gudang && (
        <ItemListScreen
          gudang={gudang}
          onBack={goHome}
          onAdd={goAdd}
          onEdit={goEdit}
          refreshKey={listRefreshKey}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {screen === 'form' && gudang && (
        <FormScreen
          gudang={gudang}
          editItem={editItem}
          onBack={handleBackFromForm}
          onSaved={handleSaved}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
