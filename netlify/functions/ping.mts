import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  console.log('\n🔍 Verificando conexión con Arduino...');
  
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
    console.log('✅ Arduino conectado y respondiendo');
    
    return new Response(JSON.stringify({ 
      status: 'connected',
      arduino_ip: ARDUINO_IP,
      message: 'Arduino está respondiendo correctamente',
      current_distance: data.distancia,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.log(`❌ Arduino no responde: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      status: 'disconnected',
      arduino_ip: ARDUINO_IP,
      error: 'No se puede conectar con el Arduino - Netlify Functions no puede acceder a redes locales',
      details: error.message,
      timestamp: new Date().toISOString(),
      note: 'Las Netlify Functions se ejecutan en servidores en la nube y no tienen acceso a dispositivos en tu red local (10.119.15.49)'
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/ping"
};
