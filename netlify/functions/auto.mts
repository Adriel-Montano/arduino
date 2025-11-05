import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.json();
  const { enabled } = body;
  
  console.log(`\n🤖 Solicitud: Modo automático - ${enabled ? 'ON' : 'OFF'}`);
  
  if (typeof enabled !== 'boolean') {
    console.log('❌ Parámetro inválido');
    return new Response(JSON.stringify({ 
      error: 'El parámetro "enabled" debe ser booleano (true/false)'
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const estadoArduino = enabled ? 'activar' : 'desactivar';
  
  const ARDUINO_IP = Netlify.env.get('ARDUINO_IP') || '10.119.15.49';
  const url = `http://${ARDUINO_IP}/modo-automatico?estado=${estadoArduino}`;
  
  try {
    console.log(`📡 GET ${url}`);
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Arduino responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Modo automático ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
    
    return new Response(JSON.stringify({ 
      status: 'success',
      autoMode: enabled,
      message: `Modo automático ${estadoArduino}`,
      arduino_response: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.log(`❌ Error al cambiar modo automático: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'No se pudo cambiar el modo automático - Arduino no accesible desde Netlify',
      details: error.message,
      note: 'Netlify Functions se ejecutan en la nube y no pueden acceder a dispositivos en tu red local'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/auto"
};
