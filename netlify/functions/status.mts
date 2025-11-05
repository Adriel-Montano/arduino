import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  console.log('\n📊 Solicitud: Estado del sistema');
  
  const ARDUINO_IP = Netlify.env.get('ARDUINO_IP') || '10.119.15.49';
  const url = `http://${ARDUINO_IP}/sensor`;
  
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Arduino responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Estado recibido exitosamente');
    
    return new Response(JSON.stringify({
      distance: data.distancia,
      connected: true,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.log(`❌ Error al obtener estado: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'No se pudo obtener el estado del sistema - Arduino no accesible desde Netlify',
      details: error.message,
      note: 'Netlify Functions se ejecutan en la nube y no pueden acceder a dispositivos en tu red local'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/status"
};
