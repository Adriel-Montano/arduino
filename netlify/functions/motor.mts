import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.json();
  const { action } = body;
  
  console.log(`\n🎮 Solicitud: Control de motor - ${action}`);
  
  if (!['left', 'right', 'stop'].includes(action)) {
    console.log('❌ Acción inválida');
    return new Response(JSON.stringify({ 
      error: 'Acción inválida',
      valid_actions: ['left', 'right', 'stop']
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const accionArduino = {
    'left': 'izquierda',
    'right': 'derecha',
    'stop': 'detener'
  }[action];
  
  const ARDUINO_IP = Netlify.env.get('ARDUINO_IP') || '10.119.15.49';
  const url = `http://${ARDUINO_IP}/motor?accion=${accionArduino}`;
  
  try {
    console.log(`📡 GET ${url}`);
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Arduino responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Motor ${action} - Comando enviado exitosamente`);
    
    return new Response(JSON.stringify({ 
      status: 'success',
      action: action,
      message: `Motor ${accionArduino}`,
      arduino_response: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.log(`❌ Error al controlar motor: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'No se pudo controlar el motor - Arduino no accesible desde Netlify',
      details: error.message,
      note: 'Netlify Functions se ejecutan en la nube y no pueden acceder a dispositivos en tu red local'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/motor"
};
