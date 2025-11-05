/*
 * SCRIPT DE PRUEBAS - Proyecto EAI441
 * 
 * Este script prueba automáticamente todos los endpoints de la API
 * para verificar que el sistema funciona correctamente.
 * 
 * USO: node test.js
 */

const axios = require('axios');

// Configuración
const API_URL = 'http://localhost:3000/api';
const ARDUINO_IP = '192.168.1.100'; // Cambiar según tu configuración

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, colors.green);
}

function error(message) {
    log(`❌ ${message}`, colors.red);
}

function info(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

// Función para hacer espera
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== PRUEBAS ==========

async function testPing() {
    info('Probando conexión con API...');
    try {
        const response = await axios.get(`${API_URL}/ping`);
        if (response.data.status === 'connected') {
            success('API conectada correctamente');
            success(`Arduino IP: ${response.data.arduino_ip}`);
            return true;
        } else {
            error('Arduino no está respondiendo');
            return false;
        }
    } catch (err) {
        error('No se puede conectar con la API');
        error(`Asegúrate de que el servidor esté corriendo: npm start`);
        return false;
    }
}

async function testDistance() {
    info('Probando lectura del sensor ultrasónico...');
    try {
        const response = await axios.get(`${API_URL}/distance`);
        if (response.data.distance !== undefined) {
            success(`Distancia leída: ${response.data.distance} cm`);
            
            if (response.data.distance > 0 && response.data.distance < 400) {
                success('Lectura del sensor en rango válido');
                return true;
            } else if (response.data.distance === -1) {
                warning('Sensor reporta lectura inválida');
                warning('Verifica que haya un objeto frente al sensor');
                return false;
            } else {
                warning(`Distancia fuera de rango esperado: ${response.data.distance} cm`);
                return false;
            }
        } else {
            error('No se recibió dato de distancia');
            return false;
        }
    } catch (err) {
        error('Error al leer distancia');
        error(err.message);
        return false;
    }
}

async function testMotorControl() {
    info('Probando control del motor...');
    
    const actions = ['left', 'right', 'stop'];
    let allPassed = true;
    
    for (const action of actions) {
        try {
            info(`  Enviando comando: ${action}`);
            const response = await axios.post(`${API_URL}/motor`, { action });
            
            if (response.data.status === 'success') {
                success(`  Motor ${action} - OK`);
            } else {
                error(`  Motor ${action} - FALLÓ`);
                allPassed = false;
            }
            
            await sleep(2000); // Esperar 2 segundos entre comandos
        } catch (err) {
            error(`  Error al probar ${action}: ${err.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

async function testAutoMode() {
    info('Probando modo automático...');
    
    try {
        // Activar modo automático
        info('  Activando modo automático...');
        const enableResponse = await axios.post(`${API_URL}/auto`, { enabled: true });
        
        if (enableResponse.data.autoMode === true) {
            success('  Modo automático activado - OK');
        } else {
            error('  No se pudo activar modo automático');
            return false;
        }
        
        await sleep(3000); // Esperar 3 segundos para observar comportamiento
        
        // Desactivar modo automático
        info('  Desactivando modo automático...');
        const disableResponse = await axios.post(`${API_URL}/auto`, { enabled: false });
        
        if (disableResponse.data.autoMode === false) {
            success('  Modo automático desactivado - OK');
            return true;
        } else {
            error('  No se pudo desactivar modo automático');
            return false;
        }
    } catch (err) {
        error('  Error al probar modo automático');
        error(`  ${err.message}`);
        return false;
    }
}

async function testStatus() {
    info('Probando endpoint de estado...');
    try {
        const response = await axios.get(`${API_URL}/status`);
        
        if (response.data.autoMode !== undefined && 
            response.data.action !== undefined && 
            response.data.distance !== undefined) {
            success('Estado del sistema:');
            success(`  - Modo automático: ${response.data.autoMode ? 'Activado' : 'Desactivado'}`);
            success(`  - Acción actual: ${response.data.action}`);
            success(`  - Distancia: ${response.data.distance} cm`);
            return true;
        } else {
            error('Respuesta de estado incompleta');
            return false;
        }
    } catch (err) {
        error('Error al obtener estado del sistema');
        error(err.message);
        return false;
    }
}

// ========== EJECUTAR TODAS LAS PRUEBAS ==========

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    log('🧪 INICIANDO PRUEBAS DEL SISTEMA EAI441', colors.cyan);
    console.log('='.repeat(60) + '\n');
    
    const results = {
        ping: false,
        distance: false,
        motor: false,
        auto: false,
        status: false
    };
    
    // Prueba 1: Ping
    console.log('\n--- PRUEBA 1: CONEXIÓN ---');
    results.ping = await testPing();
    
    if (!results.ping) {
        error('\n❌ No se puede continuar sin conexión con la API');
        error('Verifica que:');
        error('1. El servidor Node.js esté corriendo (npm start)');
        error('2. El Arduino esté encendido y conectado a WiFi');
        error('3. La IP del Arduino sea correcta en server.js');
        return;
    }
    
    await sleep(1000);
    
    // Prueba 2: Sensor
    console.log('\n--- PRUEBA 2: SENSOR ULTRASÓNICO ---');
    results.distance = await testDistance();
    await sleep(1000);
    
    // Prueba 3: Control de Motor
    console.log('\n--- PRUEBA 3: CONTROL DE MOTOR ---');
    warning('El motor se moverá en las siguientes secuencias:');
    warning('Izquierda → Derecha → Detener');
    await sleep(2000);
    results.motor = await testMotorControl();
    
    // Prueba 4: Modo Automático
    console.log('\n--- PRUEBA 4: MODO AUTOMÁTICO ---');
    warning('Coloca un objeto frente al sensor para probar el modo automático');
    await sleep(3000);
    results.auto = await testAutoMode();
    
    await sleep(1000);
    
    // Prueba 5: Estado
    console.log('\n--- PRUEBA 5: ESTADO DEL SISTEMA ---');
    results.status = await testStatus();
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    log('📊 RESUMEN DE PRUEBAS', colors.cyan);
    console.log('='.repeat(60));
    
    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r === true).length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log('\nResultados:');
    for (const [test, result] of Object.entries(results)) {
        const icon = result ? '✅' : '❌';
        const color = result ? colors.green : colors.red;
        log(`  ${icon} ${test.toUpperCase()}: ${result ? 'PASÓ' : 'FALLÓ'}`, color);
    }
    
    console.log('\n' + '='.repeat(60));
    log(`Pruebas completadas: ${passed}/${total} (${percentage}%)`, 
        percentage === 100 ? colors.green : percentage >= 60 ? colors.yellow : colors.red);
    console.log('='.repeat(60) + '\n');
    
    if (percentage === 100) {
        success('🎉 ¡Todas las pruebas pasaron! El sistema está funcionando correctamente.');
    } else if (percentage >= 60) {
        warning('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.');
    } else {
        error('❌ Muchas pruebas fallaron. Verifica las conexiones y configuración.');
    }
    
    console.log('\n💡 Consejos:');
    console.log('  • Si el sensor falla: Verifica conexiones TRIG/ECHO');
    console.log('  • Si el motor falla: Verifica conexiones L298N y batería');
    console.log('  • Si la conexión falla: Verifica IP del Arduino en server.js');
    console.log('  • Revisa el Serial Monitor del Arduino para más detalles\n');
}

// Ejecutar pruebas
runAllTests().catch(err => {
    error('Error fatal en las pruebas:');
    console.error(err);
});
