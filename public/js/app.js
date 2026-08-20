import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // ==== LÓGICA DE FORMULARIO (index.html) ====
    const form = document.getElementById('installationForm');
    if (form) {
        const submitBtn = document.getElementById('submitBtn');
        const submitSpinner = document.getElementById('submitSpinner');
        const btnText = submitBtn.querySelector('.btn-text') || submitBtn.querySelector('span');
        const formAlert = document.getElementById('formAlert');

        let selectedFiles = [];

        // Lógica de Drag & Drop
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');

        if (dropZone && fileInput) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, e => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'));
            });
            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'));
            });
            dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', function() { handleFiles(this.files); });

            function handleFiles(files) {
                Array.from(files).forEach(file => {
                    selectedFiles.push(file);
                    const fileItem = document.createElement('div');
                    fileItem.className = 'flex items-center justify-between p-3 glass-panel rounded-lg mt-2';
                    fileItem.innerHTML = `
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-electric-indigo">draft</span>
                            <div>
                                <p class="font-body-md text-sm text-on-surface line-clamp-1">${file.name}</p>
                                <p class="font-label-sm text-xs text-on-surface-variant">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button type="button" class="delete-btn text-on-surface-variant hover:text-error transition-colors p-1">
                            <span class="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    `;
                    fileItem.querySelector('.delete-btn').addEventListener('click', () => {
                        fileItem.remove();
                        selectedFiles = selectedFiles.filter(f => f !== file);
                    });
                    fileList.appendChild(fileItem);
                });
            }
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (selectedFiles.length === 0) {
                if(formAlert) {
                    formAlert.textContent = 'Error: Debe adjuntar al menos un documento de respaldo.';
                    formAlert.className = 'mb-4 p-4 rounded-lg text-white font-bold text-center bg-red-600/80 border border-red-500 backdrop-blur-md';
                    formAlert.classList.remove('hidden');
                }
                return;
            }

            const formData = {
                empresa: document.getElementById('companyName').value,
                sector: document.getElementById('sector').value,
                inversion: document.getElementById('investment').value,
                empleos: document.getElementById('jobs').value,
                documentos: selectedFiles.map(f => ({ nombre: f.name, tamaño: f.size })),
                fecha: new Date().toISOString()
            };

            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
            if(btnText) btnText.textContent = 'Evaluando IA...';
            if(submitSpinner) submitSpinner.classList.remove('hidden');
            if(formAlert) formAlert.classList.add('hidden');

            try {
                const result = await api.createSolicitud(formData);
                if(formAlert) {
                    formAlert.textContent = `Éxito: IA clasificó como ${result.evaluacion.clasificacion} (${result.evaluacion.puntaje}/100)`;
                    formAlert.className = 'mb-4 p-4 rounded-lg text-white font-bold text-center bg-emerald-600/80 border border-emerald-500 backdrop-blur-md';
                    formAlert.classList.remove('hidden');
                }
                form.reset();
                selectedFiles = [];
                if(fileList) fileList.innerHTML = '';
            } catch (error) {
                if(formAlert) {
                    formAlert.textContent = 'Error al enviar la solicitud';
                    formAlert.className = 'mb-4 p-4 rounded-lg text-white font-bold text-center bg-red-600/80 border border-red-500 backdrop-blur-md';
                    formAlert.classList.remove('hidden');
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
                if(btnText) btnText.textContent = 'Enviar Solicitud';
                if(submitSpinner) submitSpinner.classList.add('hidden');
            }
        });
    }

    // ==== LÓGICA DE LISTA (analista.html) ====
    const solicitudesContainer = document.getElementById('solicitudesContainer');
    if (solicitudesContainer) {
        loadSolicitudes();
    }

    async function loadSolicitudes() {
        try {
            const solicitudes = await api.getSolicitudes();
            solicitudesContainer.innerHTML = ''; 
            
            solicitudes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            if (solicitudes.length === 0) {
                solicitudesContainer.innerHTML = '<div class="col-span-2 text-center text-on-surface-variant py-8">No hay solicitudes pendientes.</div>';
                return;
            }

            solicitudes.forEach(sol => {
                let badgeClass = '';
                let badgeIcon = '';
                let badgeText = sol.evaluacion.clasificacion;

                if (badgeText === 'Recomendada') {
                    badgeClass = 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/30';
                    badgeIcon = 'check_circle';
                } else if (badgeText === 'Revisar') {
                    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                    badgeIcon = 'pending_actions';
                } else {
                    badgeClass = 'bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30';
                    badgeIcon = 'cancel';
                }

                const card = document.createElement('article');
                card.className = 'bg-surface-container-lowest/40 backdrop-blur-xl rounded-xl p-5 border border-glass-stroke hover:border-outline-variant/50 hover:bg-surface-container-lowest/60 transition-all cursor-pointer flex flex-col justify-between h-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]';
                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="flex justify-between items-start gap-4">
                            <h3 class="font-body-lg text-on-surface font-medium leading-tight">${sol.empresa}</h3>
                            <span class="px-2.5 py-1 rounded-full ${badgeClass} text-xs flex items-center gap-1.5 border whitespace-nowrap">
                                <span class="material-symbols-outlined text-[14px]">${badgeIcon}</span> ${badgeText}
                            </span>
                        </div>
                        <div class="flex items-center gap-2.5 text-on-surface-variant text-sm">
                            <span class="material-symbols-outlined text-[18px] opacity-70">domain</span>
                            <span>${sol.sector}</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-on-surface-variant text-sm">
                            <span class="material-symbols-outlined text-[18px] opacity-70">calendar_today</span>
                            <span>${new Date(sol.fecha).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-[rgba(255,255,255,0.15)] flex justify-between items-center">
                        <span class="text-[#6366F1] font-bold">${sol.evaluacion.puntaje}/100 IA Score</span>
                        <a href="detalle.html" class="material-symbols-outlined text-on-surface-variant hover:text-[#22D3EE] transition-colors">chevron_right</a>
                    </div>
                `;
                solicitudesContainer.appendChild(card);
            });
        } catch (error) {
            solicitudesContainer.innerHTML = '<div class="col-span-2 text-[#ffb4ab] text-center py-8">Error cargando solicitudes</div>';
        }
    }
});
