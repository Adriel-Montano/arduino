/*
 * API REST Completa para Proyecto EAI441
 * Sistema de Control de Motor con Sensor Ultrasónico
 * Compatible con Arduino R4 WiFi
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ========== CONFIGURACIÓN ==========
const ARDUINO_IP = '10.119.15.49'; // IP del Arduino
const ARDUINO_URL = `http://${ARDUINO_IP}`;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== API: OBTENER DISTANCIA ==========
app.get('/api/distance', async (req, res) => {
  console.log('\n📏 Solicitud: Obtener distancia');
  
  try {
    const url = `${ARDUINO_URL}/sensor`;
    console.log(`📡 GET ${url}`);
    
    const response = await axios.get(url, { timeout: 5000 });
    
    console.log(`✅ Distancia recibida: ${response.data.distancia} cm`);
    
    res.json({ 
      distance: response.data.distancia,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log(`❌ Error al obtener distancia: ${error.message}`);
    res.status(500).json({ 
      error: 'No se pudo obtener la distancia del sensor',
      details: error.message 
    });
  }
});

// ========== API: CONTROLAR MOTOR ==========
app.post('/api/motor', async (req, res) => {
  const { action } = req.body;
  
  console.log(`\n🎮 Solicitud: Control de motor - ${action}`);
  
  // Validar acción
  if (!['left', 'right', 'stop'].includes(action)) {
    console.log('❌ Acción inválida');
    return res.status(400).json({ 
      error: 'Acción inválida',
      valid_actions: ['left', 'right', 'stop']
    });
  }
  
  // Mapear acciones al formato del Arduino
  const accionArduino = {
    'left': 'izquierda',
    'right': 'derecha',
    'stop': 'detener'
  }[action];
  
  try {
    const url = `${ARDUINO_URL}/motor?accion=${accionArduino}`;
    console.log(`📡 GET ${url}`);
    
    const response = await axios.get(url, { timeout: 5000 });
    
    console.log(`✅ Motor ${action} - Comando enviado exitosamente`);
    
    res.json({ 
      status: 'success',
      action: action,
      message: `Motor ${accionArduino}`,
      arduino_response: response.data
    });
  } catch (error) {
    console.log(`❌ Error al controlar motor: ${error.message}`);
    res.status(500).json({ 
      error: 'No se pudo controlar el motor',
      details: error.message 
    });
  }
});

// ========== API: MODO AUTOMÁTICO ==========
app.post('/api/auto', async (req, res) => {
  const { enabled } = req.body;
  
  console.log(`\n🤖 Solicitud: Modo automático - ${enabled ? 'ON' : 'OFF'}`);
  
  // Validar parámetro
  if (typeof enabled !== 'boolean') {
    console.log('❌ Parámetro inválido');
    return res.status(400).json({ 
      error: 'El parámetro "enabled" debe ser booleano (true/false)'
    });
  }
  
  const estadoArduino = enabled ? 'activar' : 'desactivar';
  
  try {
    const url = `${ARDUINO_URL}/modo-automatico?estado=${estadoArduino}`;
    console.log(`📡 GET ${url}`);
    
    const response = await axios.get(url, { timeout: 5000 });
    
    console.log(`✅ Modo automático ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
    
    res.json({ 
      status: 'success',
      autoMode: enabled,
      message: `Modo automático ${estadoArduino}`,
      arduino_response: response.data
    });
  } catch (error) {
    console.log(`❌ Error al cambiar modo automático: ${error.message}`);
    res.status(500).json({ 
      error: 'No se pudo cambiar el modo automático',
      details: error.message 
    });
  }
});

// ========== API: ESTADO DEL SISTEMA ==========
app.get('/api/status', async (req, res) => {
  console.log('\n📊 Solicitud: Estado del sistema');
  
  try {
    const distResponse = await axios.get(`${ARDUINO_URL}/sensor`, { timeout: 5000 });
    
    console.log('✅ Estado recibido exitosamente');
    
    res.json({
      distance: distResponse.data.distancia,
      connected: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log(`❌ Error al obtener estado: ${error.message}`);
    res.status(500).json({ 
      error: 'No se pudo obtener el estado del sistema',
      details: error.message 
    });
  }
});

// ========== API: PING ==========
app.get('/api/ping', async (req, res) => {
  console.log('\n🔍 Verificando conexión con Arduino...');
  
  try {
    const response = await axios.get(`${ARDUINO_URL}/sensor`, { timeout: 5000 });
    
    console.log('✅ Arduino conectado y respondiendo');
    
    res.json({ 
      status: 'connected',
      arduino_ip: ARDUINO_IP,
      message: 'Arduino está respondiendo correctamente',
      current_distance: response.data.distancia,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log(`❌ Arduino no responde: ${error.message}`);
    
    res.status(503).json({ 
      status: 'disconnected',
      arduino_ip: ARDUINO_IP,
      error: 'No se puede conectar con el Arduino',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== RUTA NO ENCONTRADA ==========
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    available_endpoints: {
      'GET /': 'Página web principal',
      'GET /api/distance': 'Obtener distancia del sensor',
      'POST /api/motor': 'Controlar motor (body: {action: "left"|"right"|"stop"})',
      'POST /api/auto': 'Modo automático (body: {enabled: true|false})',
      'GET /api/status': 'Estado completo del sistema',
      'GET /api/ping': 'Verificar conexión con Arduino'
    }
  });
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   🚀 API REST - PROYECTO EAI441                  ║');
  console.log('║   Sistema de Control de Motor IoT                ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`\n✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📍 Arduino IP configurada: ${ARDUINO_IP}`);
  console.log('\n📚 Endpoints disponibles:');
  console.log('   GET  /                    → Página web principal');
  console.log('   GET  /api/distance        → Obtener distancia del sensor');
  console.log('   POST /api/motor           → Control manual del motor');
  console.log('   POST /api/auto            → Activar/desactivar modo automático');
  console.log('   GET  /api/status          → Estado del sistema');
  console.log('   GET  /api/ping            → Verificar conexión\n');
  console.log('⚙️  CONFIGURACIÓN DEL MODO AUTOMÁTICO:');
  console.log('   🟢 10-20 cm   → Motor gira DERECHA');
  console.log('   🟡 20-30 cm   → Motor gira IZQUIERDA');
  console.log('   🔴 Fuera rango → Motor DETENIDO\n');
  console.log('⚠️  IMPORTANTE:');
  console.log(`   • Arduino debe estar en: ${ARDUINO_IP}`);
  console.log('   • Sensor HC-SR04 conectado en pines 12 y 11');
  console.log('   • Motor conectado en pines 9 y 10');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Verificar conexión inicial
  console.log('🔍 Verificando conexión inicial con Arduino...');
  axios.get(`${ARDUINO_URL}/sensor`, { timeout: 5000 })
    .then(response => {
      console.log(`✅ Conexión exitosa! Distancia actual: ${response.data.distancia} cm\n`);
    })
    .catch(error => {
      console.log(`❌ No se pudo conectar con el Arduino`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Verifica que el Arduino esté encendido en: ${ARDUINO_IP}\n`);
    });
});

// ========== MANEJO DE ERRORES ==========
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promise rechazada no manejada:', error);
});
