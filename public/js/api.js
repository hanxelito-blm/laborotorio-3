// Servicios de API
const API_URL = '/api/solicitudes';

export const api = {
    async getSolicitudes() {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Error al cargar las solicitudes');
        }
        return response.json();
    },

    async createSolicitud(data) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Error al enviar la solicitud');
        }
        return response.json();
    }
};
