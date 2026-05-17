import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean)
}));
app.use(express.json({ limit: '5mb' }));

// Konfigurasi Supabase Client
const supabaseUrl = 'https://nglxaddnwsnhyrbmlvll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbHhhZGRud3NuaHlyYm1sdmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTgzMTEsImV4cCI6MjA5NDQ3NDMxMX0.O9Za7jkVULVIOqUC0f4qHyHtsG9bZD69epjW99u5CV8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Start server first
const server = app.listen(port, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${port}`);
  console.log('Server is listening and will keep running...');
});

// Prevent server from exiting
server.on('close', () => {
  console.log('Server closed unexpectedly');
});

// Keep process alive
process.stdin.resume();

// Test koneksi setelah server start
supabase.from('gudang').select('*').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('❌ Gagal terhubung ke Supabase:', error.message);
  } else {
    console.log('✅ Berhasil terhubung ke Supabase!');
  }
}).catch(err => {
  console.error('Error testing connection:', err);
});

// API endpoint untuk mengetes koneksi database
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase.from('gudang').select('*').limit(1);
    if (error) throw error;
    res.json({ status: 'success', data: { message: 'Koneksi Vite dan Supabase Berhasil!' } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET semua gudang
app.get('/api/gudang', async (req, res) => {
  console.log('GET /api/gudang called');
  try {
    const { data, error } = await supabase.from('gudang').select('*');
    if (error) throw error;
    console.log('Gudang data:', data);
    res.json({ status: 'success', data: data });
  } catch (err) {
    console.error('Error fetching gudang:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET items berdasarkan gudang_id
app.get('/api/items/:gudangId', async (req, res) => {
  const { gudangId } = req.params;
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('gudang_id', gudangId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ status: 'success', data: data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST item baru
app.post('/api/items', async (req, res) => {
  console.log('POST /api/items called');
  const { id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location } = req.body;
  
  console.log('Photo length:', photo ? photo.length : 'null');
  console.log('Signature length:', signature ? signature.length : 'null');
  console.log('Inserting item into gudang:', gudang_id, 'with data:', {
    id, nama_barang, stok_awal, stok_datang, satuan
  });
  
  try {
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location
        }
      ]);
    
    if (error) throw error;
    
    console.log('Item inserted successfully into items table');
    
    // Update suggestions (separate table for autocomplete)
    await updateSuggestions(nama_barang);
    
    res.json({ status: 'success', data: { id, gudang_id, nama_barang, stok_awal, stok_datang, satuan, total_stok: stok_awal + stok_datang } });
  } catch (err) {
    console.error('Error inserting item:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
  console.log('PUT /api/items/:id called with body:', req.body);
  const { id } = req.params;
  const { nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .update({
        nama_barang, stok_awal, stok_datang, satuan, catatan, photo, signature, location
      })
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('Item updated successfully');
    
    // Update suggestions
    await updateSuggestions(nama_barang);
    
    res.json({ status: 'success', data: { id, ...req.body } });
  } catch (err) {
    console.error('Error updating item:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  console.log('DELETE /api/items/:id called with id:', req.params.id);
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('Item deleted successfully');
    res.json({ status: 'success', message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET suggestions
app.get('/api/suggestions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('nama_barang')
      .order('usage_count', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    const suggestions = data.map(r => r.nama_barang);
    res.json({ status: 'success', data: suggestions });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Helper function untuk update suggestions
async function updateSuggestions(namaBarang) {
  if (!namaBarang) return;
  
  try {
    // Check if suggestion exists
    const { data: existing } = await supabase
      .from('suggestions')
      .select('*')
      .eq('nama_barang', namaBarang)
      .single();
    
    if (existing) {
      // Update existing
      await supabase
        .from('suggestions')
        .update({ 
          usage_count: existing.usage_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('nama_barang', namaBarang);
    } else {
      // Insert new
      await supabase
        .from('suggestions')
        .insert([
          {
            nama_barang: namaBarang,
            usage_count: 1,
            last_used: new Date().toISOString()
          }
        ]);
    }
  } catch (err) {
    console.error('Error updating suggestions:', err);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
