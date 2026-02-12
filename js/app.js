(function () {
    const { Data } = window.SmartCampus;
    const appContainer = document.getElementById('app');
    const modalContainer = document.getElementById('modal-container');

    // --- UTILITIES ---
    window.compressImage = (file, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };



    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function createModal(htmlContent) {
        // Find the modal container inside the current view if possible
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            // Fallback for landing page or other views
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }

        modalContainer.innerHTML = htmlContent;
        modalContainer.style.display = 'block'; // Block to fill absolute parent
        modalContainer.scrollTop = 0;
    }

    window.closeModal = () => {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
            modalContainer.style.display = 'none';
        }
    };

    window.downloadFile = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.viewPaymentQR = (qrUrl) => {
        if (!qrUrl) return;
        const modalHtml = `
            <div onclick="window.closeModal()" style="display: flex; align-items: center; justify-content: center; height: 100vh; padding: 1rem;">
                <div style="background: white; padding: 1rem; border-radius: 12px; max-width: 90%; max-height: 90vh; position: relative; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" onclick="event.stopPropagation()">
                    <button onclick="window.closeModal()" style="position: absolute; top: -15px; right: -15px; background: white; color: #1e293b; border: none; width: 36px; height: 36px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${qrUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 8px; object-fit: contain;">
                    <div style="text-align: center; margin-top: 1rem; font-weight: 600; color: #1e293b;">
                        Scan to Pay
                    </div>
                </div>
            </div>
        `;
        createModal(modalHtml);
    };

    window.viewRegistrationQR = (regId, eventTitle) => {
        const modalHtml = `
            <div class="modal-content" style="max-width: 400px; padding: 2.5rem; background: white; border-radius: 20px; text-align: center; position: relative;">
                <button onclick="window.closeModal()" style="position: absolute; top: 15px; right: 15px; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: #64748b;">
                    <i class="fas fa-times"></i>
                </button>
                <h3 style="margin-bottom: 0.5rem; color: #1e293b;">Entry Ticket</h3>
                <p style="font-size: 0.9rem; color: #6366f1; font-weight: 700; margin-bottom: 1.5rem;">${eventTitle}</p>
                
                <div style="background: white; padding: 20px; border-radius: 16px; border: 3px dashed #e2e8f0; display: inline-block; margin-bottom: 1.5rem; position: relative;">
                     <div id="ticket-qr-container"></div>
                </div>
                
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem;">Show this QR code at the event entrance for scanning.</p>
                <div style="font-family: monospace; background: #f8fafc; padding: 8px; border-radius: 8px; font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem;">ID: ${regId}</div>
                
                <button onclick="window.closeModal()" class="btn btn-primary" style="width: 100%;">Done</button>
            </div>
        `;
        createModal(modalHtml);
        setTimeout(() => {
            window.generateQR('ticket-qr-container', regId, 200);
        }, 100);
    };

    window.openCertificateUploadModal = async (regId) => {
        const data = await Data.get();
        const reg = data.registrations.find(r => r.id == regId);
        const currentUrl = reg ? (reg.certificateUrl || '') : '';
        const currentType = reg ? (reg.certificateType || 'Participation') : 'Participation';

        const modalHtml = `
            <div class="modal-content" style="max-width: 500px; padding: 2.5rem; background: white; border-radius: 20px; text-align: left; position: relative;">
                <button onclick="window.closeModal()" style="position: absolute; top: 15px; right: 15px; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: #64748b;">
                    <i class="fas fa-times"></i>
                </button>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                    <div style="width: 50px; height: 50px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                        <i class="fas fa-file-pdf" style="font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0; color: #1e293b; font-weight: 800;">Upload PDF Certificate</h3>
                        <p style="margin: 0; font-size: 0.85rem; color: #64748b;">Select or drop a PDF file for this student</p>
                    </div>
                </div>

                <form onsubmit="event.preventDefault();">
                    <div class="input-group">
                        <label class="input-label">Select PDF Certificate</label>
                        <input type="file" id="cert-file-input" class="smart-input" accept=".pdf" style="padding: 10px;">
                        <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Or provide a certificate URL below:</p>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Certificate URL (Manual Link)</label>
                        <input type="text" id="cert-url-input" class="smart-input" placeholder="https://example.com/certificate.pdf" value="${currentUrl.startsWith('data:') ? '' : currentUrl}">
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Achievement / Type</label>
                        <select id="cert-type-input" class="smart-input">
                            <option value="Participation" ${currentType === 'Participation' ? 'selected' : ''}>Participation Certificate</option>
                            <option value="Winner" ${currentType === 'Winner' ? 'selected' : ''}>Winner Certificate</option>
                            <option value="Runner Up" ${currentType === 'Runner Up' ? 'selected' : ''}>Runner Up Certificate</option>
                            <option value="Speaker" ${currentType === 'Speaker' ? 'selected' : ''}>Speaker / Presenter</option>
                            <option value="Excellence" ${currentType === 'Excellence' ? 'selected' : ''}>Certificate of Excellence</option>
                        </select>
                    </div>

                    ${currentUrl ? `
                    <div style="margin-bottom: 1.5rem; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.8rem; color: #64748b;"><i class="fas fa-check-circle"></i> Certificate already issued</span>
                        <a href="${currentUrl}" target="_blank" style="color: var(--primary); font-size: 0.8rem; font-weight: 600;">View Current</a>
                    </div>
                    ` : ''}

                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button type="button" onclick="window.closeModal()" class="btn" style="flex: 1; background: #f1f5f9; color: #64748b; border: none;">Cancel</button>
                        <button type="button" onclick="window.handleCertificateUpload('${regId}')" class="btn btn-primary" style="flex: 2;">Confirm & Upload</button>
                    </div>
                </form>
            </div>
        `;
        createModal(modalHtml);
    };

    window.handleCertificateUpload = async (regId) => {
        const fileInput = document.getElementById('cert-file-input');
        const urlInput = document.getElementById('cert-url-input');
        const typeSelect = document.getElementById('cert-type-input');

        let finalUrl = urlInput.value;

        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.type !== 'application/pdf') {
                showToast('Please select a valid PDF file', 'error');
                return;
            }

            showToast('Processing PDF...', 'info');
            finalUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        if (!finalUrl) {
            showToast('Please provide a file or a URL', 'error');
            return;
        }

        console.log('Starting certificate upload for:', regId);
        try {
            await Data.updateCertificate(regId, finalUrl, typeSelect.value);
            console.log('Upload successful');
            showToast('Certificate uploaded successfully!', 'success');
            window.closeModal();
            handleRoute();
        } catch (e) {
            console.error('Upload failed:', e);
            showToast('Failed to upload certificate: ' + (e.message || ''), 'error');
        }
    };

    // --- QR SCANNER UTILITIES (Global) ---
    window.html5QrcodeScanner = null;
    window.flashState = false;
    window.scanHistory = [];
    window.calendarDate = new Date();

    window.generateQR = (containerId, text, size = 128) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<div style="font-size: 0.7rem; color: #94a3b8;">Generating...</div>';

        // Use QRCode.toDataURL for better compatibility and to avoid canvas issues
        if (typeof QRCode !== 'undefined' && QRCode.toDataURL) {
            QRCode.toDataURL(text, {
                width: size,
                margin: 2,
                color: {
                    dark: '#1e293b',
                    light: '#ffffff'
                }
            }, function (err, url) {
                if (err) {
                    console.error('QR Generation Error:', err);
                    container.innerHTML = '<div style="color:#ef4444; font-size:0.7rem;">QR Error</div>';
                    return;
                }
                container.innerHTML = `<img src="${url}" style="width: ${size}px; height: ${size}px; display: block; margin: 0 auto; border-radius: 4px;" />`;
            });
        } else {
            console.error('QRCode library not loaded correctly');
            container.innerHTML = '<div style="color:#ef4444; font-size:0.7rem;">Library Error</div>';
        }
    };

    window.addToScanHistory = (item) => {
        window.scanHistory.unshift(item);
        if (window.scanHistory.length > 50) window.scanHistory.pop();

        const badge = document.getElementById('history-badge');
        if (badge) {
            badge.innerText = window.scanHistory.length;
            badge.style.display = 'block';
        }
    };

    window.showScanHistory = () => {
        const panel = document.getElementById('scan-history-panel');
        if (!panel) return;

        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            const list = document.getElementById('history-list');
            if (list) {
                if (window.scanHistory.length === 0) {
                    list.innerHTML = '<p style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem;">No check-ins recorded.</p>';
                } else {
                    list.innerHTML = window.scanHistory.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${item.success ? '#f0fdf4' : '#fef2f2'}; border-radius: 12px; border: 1px solid ${item.success ? '#dcfce7' : '#fee2e2'};">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${item.success ? '#22c55e' : '#ef4444'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
                                    <i class="fas fa-${item.success ? 'check' : 'times'}"></i>
                                </div>
                                <div style="text-align: left;">
                                    <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b;">${item.name}</div>
                                    <div style="font-size: 0.7rem; color: #64748b;">${item.time}</div>
                                </div>
                            </div>
                            <div style="font-size: 0.65rem; color: #94a3b8; font-family: monospace;">${item.id.substring(0, 8)}...</div>
                        </div>
                    `).join('');
                }
            }
        }
    };

    window.toggleFlash = () => {
        if (!window.html5QrcodeScanner) return;
        window.flashState = !window.flashState;
        const btn = document.getElementById('btn-flash-toggle');
        if (btn) {
            btn.style.color = window.flashState ? '#f59e0b' : '#64748b';
            btn.style.background = window.flashState ? '#fef3c7' : '#f1f5f9';
        }

        // This is a browser-specific feature that requires camera stream access
        // It may not work on all browsers/devices
        try {
            const track = window.html5QrcodeScanner.getRunningTrack();
            if (track && track.getCapabilities().torch) {
                track.applyConstraints({
                    advanced: [{ torch: window.flashState }]
                });
            }
        } catch (e) {
            console.log('Flash control not supported', e);
            if (window.flashState) showToast('Flashlight not supported on this device', 'info');
        }
    };

    window.onScanSuccess = async (decodedText, decodedResult) => {
        try {
            const isJson = decodedText.startsWith('{');
            const resultEl = document.getElementById('qr-result');
            const overlayContainer = document.getElementById('scanner-overlay');

            // play beep sound
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(e => console.log('Audio play failed', e));

            // Mark attendance
            const result = await Data.markAttendance(decodedText);

            if (result) {
                const name = (typeof result === 'object') ? result.userName : decodedText;

                // Visual feedback on the viewfinder
                if (resultEl) {
                    resultEl.innerHTML = `
                        <div class="scan-success-popup" style="background: #10b981; color: white; padding: 1.5rem 2.5rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(16, 185, 129, 0.4); text-align: center; animation: scanSuccessBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <div style="font-size: 3rem; margin-bottom: 0.5rem;"><i class="fas fa-check-circle"></i></div>
                            <div style="font-weight: 800; font-size: 1.2rem;">Attendance Marked!</div>
                            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 4px;">Welcome, ${name}</div>
                        </div>
                    `;
                }

                showToast(`Attendance marked for ${name}`, 'success');
                window.addToScanHistory({
                    id: (result && result.id) ? result.id : decodedText,
                    name: (result && result.userName) ? result.userName : 'Student',
                    time: new Date().toLocaleTimeString(),
                    success: true
                });

                if (window.html5QrcodeScanner) window.html5QrcodeScanner.pause();

                // Temporary pause for feedback
                setTimeout(() => {
                    if (resultEl) resultEl.innerHTML = '';
                    if (window.html5QrcodeScanner) window.html5QrcodeScanner.resume();
                }, 3000);
            } else {
                if (resultEl) {
                    resultEl.innerHTML = `
                        <div class="scan-error-popup" style="background: #ef4444; color: white; padding: 1.5rem 2.5rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(239, 68, 68, 0.4); text-align: center; animation: scanSuccessBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <div style="font-size: 3rem; margin-bottom: 0.5rem;"><i class="fas fa-times-circle"></i></div>
                            <div style="font-weight: 800; font-size: 1.2rem;">Invalid QR</div>
                            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 4px;">Not registered or wrong event</div>
                        </div>
                    `;
                }

                showToast(`Invalid scan or not registered`, 'error');
                window.addToScanHistory({
                    id: decodedText,
                    name: 'Unknown',
                    time: new Date().toLocaleTimeString(),
                    success: false
                });

                if (window.html5QrcodeScanner) window.html5QrcodeScanner.pause();
                setTimeout(() => {
                    if (resultEl) resultEl.innerHTML = '';
                    if (window.html5QrcodeScanner) window.html5QrcodeScanner.resume();
                }, 2500);
            }
        } catch (e) {
            console.error(e);
            showToast('Error processing QR code', 'error');
        }
    };



    window.initQRScanner = () => {
        if (window.html5QrcodeScanner) return;

        window.html5QrcodeScanner = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        window.html5QrcodeScanner.start({ facingMode: "environment" }, config, window.onScanSuccess, (err) => { })
            .then(() => {
                document.getElementById('scanner-placeholder').style.display = 'none';
                document.getElementById('scanner-overlay').style.display = 'flex';
                document.getElementById('active-controls').style.display = 'flex';

                try {
                    const capabilities = window.html5QrcodeScanner.getRunningTrackCameraCapabilities()[0];
                    if (capabilities.torch) {
                        const flashBtn = document.getElementById('btn-flash-toggle');
                        if (flashBtn) flashBtn.style.display = 'flex';
                    }
                } catch (e) { console.log("Flash check failed", e); }
            })
            .catch(err => {
                console.error("Scanner start error:", err);
                const reader = document.getElementById('qr-reader');
                if (reader) reader.innerHTML = `<div style="color:#ef4444; padding:2rem; text-align:center;">Camera failed: ${err}</div>`;
                window.html5QrcodeScanner = null;
            });
    };

    window.toggleFlash = () => {
        if (window.html5QrcodeScanner) {
            window.flashState = !window.flashState;
            window.html5QrcodeScanner.applyVideoConstraints({ advanced: [{ torch: window.flashState }] })
                .then(() => {
                    const btn = document.getElementById('btn-flash-toggle');
                    if (btn) {
                        btn.classList.toggle('active', window.flashState);
                        btn.style.background = window.flashState ? '#fde68a' : '#f8fafc';
                        btn.style.color = window.flashState ? '#92400e' : '#64748b';
                    }
                }).catch(err => console.error(err));
        }
    };

    window.stopQRScanner = () => {
        if (window.html5QrcodeScanner) {
            window.html5QrcodeScanner.stop().then(() => {
                return window.html5QrcodeScanner.clear();
            }).finally(() => {
                window.html5QrcodeScanner = null;
                const resultEl = document.getElementById('qr-result');
                if (resultEl) resultEl.innerHTML = '';
                const placeholder = document.getElementById('scanner-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                const overlay = document.getElementById('scanner-overlay');
                if (overlay) overlay.style.display = 'none';
                const controls = document.getElementById('active-controls');
                if (controls) controls.style.display = 'none';
            });
        }
    };

    window.addToScanHistory = (item) => {
        window.scanHistory.unshift(item);
        if (window.scanHistory.length > 20) window.scanHistory.pop();
        const badge = document.getElementById('history-badge');
        if (badge) { badge.innerText = window.scanHistory.length; badge.style.display = 'block'; }
        const list = document.getElementById('history-list');
        if (list) {
            list.innerHTML = window.scanHistory.map(h => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f8fafc; border-radius: 8px; font-size: 0.8rem; border-left: 3px solid ${h.success ? '#10b981' : '#ef4444'};">
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <div style="font-weight: 700; color: #1e293b;">${h.name}</div>
                        <div style="font-size: 0.7rem; color: #64748b;">${h.time} - ID: ${h.id.substring(0, 8)}...</div>
                    </div>
                    <i class="fas ${h.success ? 'fa-check-circle' : 'fa-times-circle'}" style="color: ${h.success ? '#10b981' : '#ef4444'};"></i>
                </div>
            `).join('');
        }
    };

    window.showScanHistory = () => {
        const panel = document.getElementById('scan-history-panel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };

    window.handleGalleryScan = (input) => {
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        showToast('Processing image...', 'info');
        const tempScanner = new Html5Qrcode("qr-reader");
        tempScanner.scanFile(file, true)
            .then(decodedText => {
                showToast('QR Code Detected!', 'success');
                window.onScanSuccess(decodedText);
            })
            .catch(err => showToast('No QR code found in image.', 'error'))
            .finally(() => { tempScanner.clear(); input.value = ''; });
    };

    window.handleCertificateUpload = (regId, input, currentQuery) => {
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        const reader = new FileReader();
        showToast('Uploading certificate...', 'info');
        reader.onload = (e) => {
            const base64 = e.target.result;
            const result = Data.updateRegistration(regId, {
                certificateUrl: base64,
                certificateType: 'Participation',
                attendance: 'Present'
            });
            if (result.success) {
                showToast('Certificate issued successfully!', 'success');
                if (window.manualSearchAttendance) window.manualSearchAttendance(currentQuery);
            } else {
                showToast('Failed to upload certificate.', 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    // --- VIEWS ---

    async function renderLanding() {
        const data = await Data.get();
        const upcomingEvents = data.events
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3); // Show top 3

        appContainer.innerHTML = `
            <div style="background:var(--bg-dark); min-height:100vh; color:white; font-family: 'Outfit', sans-serif;">
                <!-- Navbar -->
                <nav class="navbar" style="background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); padding: 1.2rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div class="container nav-content">
                        <div class="innovative-logo">
                            <div class="logo-icon-wrapper">
                                <div class="logo-glow"></div>
                                <i class="fas fa-hubspot"></i>
                            </div>
                            <span class="logo-text-main">Event</span><span class="logo-text-sub">Hub</span>
                        </div>
                        <div class="nav-links">
                            <a href="#login" class="btn btn-primary" style="padding: 0.8rem 2rem; border-radius: 50px; font-weight: 700; text-decoration:none; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); transition: transform 0.2s;">Login <i class="fas fa-arrow-right" style="margin-left: 8px;"></i></a>
                        </div>
                    </div>
                </nav>

                <!-- Hero Section -->
                <header style="padding: 8rem 0 6rem; text-align: center; position: relative; overflow: hidden;">
                    <!-- Background Glow -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 70%); border-radius: 50%; filter: blur(60px); z-index: 0;"></div>
                    
                    <div class="container" style="position: relative; z-index: 1;">
                        <span style="display: inline-block; padding: 6px 16px; background: rgba(99, 102, 241, 0.1); color: #818cf8; border-radius: 50px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1.5rem; border: 1px solid rgba(99, 102, 241, 0.2);">
                            <i class="fas fa-sparkles" style="margin-right: 6px;"></i> The Future of Campus Events
                        </span>
                        <h1 style="font-size: 4.5rem; font-weight: 800; margin-bottom: 1.5rem; line-height: 1.1; letter-spacing: -2px; background: linear-gradient(to right, white, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            Discover & Experience <br/>
                            <span style="background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Your Campus Life</span>
                        </h1>
                        <p style="font-size: 1.25rem; color: #94a3b8; max-width: 700px; margin: 0 auto 3rem; line-height: 1.6;">
                            Join thousands of students in the ultimate platform for managing events, registrations, and attendance. Your digital campus pass starts here.
                        </p>
                        <div class="flex gap-4 justify-center">
                            <a href="#login" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem; text-decoration:none; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 10px;">
                                Get Started <i class="fas fa-rocket"></i>
                            </a>
                            <a href="#login" class="btn" style="padding: 1rem 3rem; font-size: 1.1rem; text-decoration:none; border-radius: 12px; font-weight: 700; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1);">
                                Learn More
                            </a>
                        </div>
                    </div>
                </header>

                <!-- Featured Events Section -->
                <section style="padding: 4rem 0 8rem; background: linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.5));">
                    <div class="container">
                        <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 3rem;">
                            <div>
                                <h2 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">Trending Events</h2>
                                <p style="color: #94a3b8;">Don't miss out on what's happening around you.</p>
                            </div>
                            <a href="#login" style="color: var(--primary); font-weight: 600; font-size: 1.1rem;">View All <i class="fas fa-arrow-right"></i></a>
                        </div>

                        ${upcomingEvents.length > 0 ? `
                        <div class="grid-layout" style="grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem;">
                            ${upcomingEvents.map(evt => `
                                <div onclick="window.location.hash='#login'" style="background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; group" onmouseover="this.style.transform='translateY(-10px)'; this.style.boxShadow='0 20px 40px -5px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                    <div style="height: 220px; position: relative;">
                                        <img src="${evt.image}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;">
                                        <div style="position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); color: white; padding: 6px 12px; border-radius: 30px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.1);">
                                            <i class="fas fa-university" style="color: var(--secondary); margin-right: 6px;"></i> ${evt.venue}
                                        </div>
                                        <div style="position: absolute; top: 15px; right: 15px; background: white; color: #0f172a; width: 50px; height: 50px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                                            <span style="font-size: 1.2rem; line-height: 1;">${new Date(evt.date).getDate()}</span>
                                            <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--primary);">${new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                    </div>
                                    <div style="padding: 1.5rem;">
                                        <div style="font-size: 0.8rem; color: var(--secondary); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 0.5rem;">${evt.type}</div>
                                        <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.75rem; color: white;">${evt.title}</h3>
                                        <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${evt.description}</p>
                                        
                                        <div style="display: flex; items-center; justify-content: space-between; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                                            <div style="color: #cbd5e1; font-size: 0.9rem;">
                                                <i class="far fa-clock" style="margin-right: 6px; color: var(--primary);"></i> ${evt.time || '10:00 AM'}
                                            </div>
                                            <div style="color: #cbd5e1; font-size: 0.9rem;">
                                                <i class="fas fa-user-friends" style="margin-right: 6px; color: var(--secondary);"></i> ${evt.capacity}+ Joiners
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ` : `
                        <div style="text-align: center; padding: 4rem; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);">
                            <div style="font-size: 3rem; color: #334155; margin-bottom: 1rem;"><i class="far fa-calendar-times"></i></div>
                            <h3 style="color: #94a3b8; font-weight: 500;">No upcoming events at the moment.</h3>
                        </div>
                        `}
                    </div>
                </section>
            </div>
        `;
    }

    function renderLogin() {
        // Internal renderer for the form to allow switching
        const renderForm = (role, mode = 'login') => {
            const isStudent = role === 'student';
            const isSignup = mode === 'signup';

            if (isSignup) {
                return `
                <div class="fade-in" style="min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; padding: 2rem 0;">
                    <div class="card" style="width: 100%; max-width: 500px; padding: 2.5rem; border-top: 5px solid var(--primary); position: relative;">
                        <button onclick="window.switchLogin('student')" style="position: absolute; top: 20px; left: 20px; background: transparent; color: var(--text-muted); font-size: 1.2rem; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        
                        <div class="text-center" style="margin-bottom: 2rem;">
                            <div style="width: 60px; height: 60px; background: #eff6ff; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem;">
                                <i class="fas fa-user-plus"></i>
                            </div>
                            <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Create Student Account</h2>
                            <p style="color: var(--text-muted);">Join the Smart Campus community today</p>
                        </div>

                        <form id="signup-form">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="input-group">
                                    <label class="input-label">Full Name</label>
                                    <input type="text" id="signup-name" class="smart-input" placeholder="John Doe" required>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Email Address</label>
                                    <input type="email" id="signup-email" class="smart-input" placeholder="john@student.edu" required>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="input-group">
                                    <label class="input-label">Department</label>
                                    <select id="signup-dept" class="smart-input" required>
                                        <option value="">Select Dept</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Information Tech">Information Tech</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Business">Business</option>
                                        <option value="Physics">Physics</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Year</label>
                                    <select id="signup-year" class="smart-input" required>
                                        <option value="">Select Year</option>
                                        <option value="1st">1st Year</option>
                                        <option value="2nd">2nd Year</option>
                                        <option value="3rd">3rd Year</option>
                                        <option value="4th">4th Year</option>
                                    </select>
                                </div>
                            </div>

                            <div class="input-group">
                                <label class="input-label">College Name</label>
                                <input type="text" id="signup-college" class="smart-input" value="Smart Campus University" required>
                            </div>

                            <div class="input-group">
                                <label class="input-label">Phone Number</label>
                                <input type="tel" id="signup-phone" class="smart-input" placeholder="+1-555-0000" required>
                            </div>

                            <div class="input-group">
                                <label class="input-label">Create Password</label>
                                <div style="position: relative;">
                                    <input type="password" id="signup-password" class="smart-input" placeholder="Minimum 6 characters" required>
                                    <i class="fas fa-eye" id="toggle-signup-pwd" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;"></i>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding: 0.8rem; font-size: 1rem; margin-top: 1rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                                Create Account
                            </button>
                            
                            <div style="text-center; margin-top: 1.5rem; text-align: center; font-size: 0.9rem;">
                                Already have an account? <a href="javascript:void(0)" onclick="window.switchLogin('student')" style="color: var(--primary); font-weight: 600;">Sign In</a>
                            </div>
                        </form>
                    </div>
                </div>`;
            }

            return `
            <div class="fade-in" style="min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9;">
                <div class="card" style="width: 100%; max-width: 440px; padding: 2.5rem; border-top: 5px solid ${isStudent ? 'var(--primary)' : 'var(--secondary)'}; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);">
                    
                    <!-- Role Switcher -->
                    <div class="flex p-1 mb-8" style="background: #e2e8f0; border-radius: 1rem; padding: 0.4rem;">
                        <button onclick="window.switchLogin('student')" class="full-w" style="padding: 0.75rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.3s; ${isStudent ? 'background: white; color: var(--primary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : 'color: var(--text-muted); background: transparent;'}">
                            <i class="fas fa-user-graduate" style="margin-right: 8px;"></i> Student
                        </button>
                        <button onclick="window.switchLogin('admin')" class="full-w" style="padding: 0.75rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.3s; ${!isStudent ? 'background: white; color: var(--secondary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);' : 'color: var(--text-muted); background: transparent;'}">
                            <i class="fas fa-user-shield" style="margin-right: 8px;"></i> Admin
                        </button>
                    </div>

                    <div class="text-center" style="margin-bottom: 2rem;">
                        <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">
                            ${isStudent ? 'Student Login' : 'Admin Portal'}
                        </h2>
                        <p style="color: var(--text-muted);">Sign in to access the ${isStudent ? 'campus events' : 'management dashboard'}</p>
                    </div>

                    <form id="login-form">
                        <div class="input-group">
                            <label class="input-label">Email Address</label>
                            <input type="email" id="email" class="smart-input" 
                                placeholder="name@college.edu"
                                value="${isStudent ? 'john@student.edu' : 'admin@campus.edu'}" required style="border-radius: 10px;">
                        </div>
                        <div class="input-group" style="margin-bottom: 0.5rem;">
                            <label class="input-label">Password</label>
                            <div style="position: relative;">
                                <input type="password" id="password" class="smart-input" 
                                    value="${isStudent ? 'user' : 'admin'}" required style="border-radius: 10px;">
                                <i class="fas fa-eye" id="toggle-pwd" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;"></i>
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-center" style="margin-bottom: 2rem; font-size: 0.85rem;">
                            <label class="flex items-center gap-2" style="cursor: pointer; color: var(--text-muted);">
                                <input type="checkbox" checked style="accent-color: var(--primary);"> Remember me
                            </label>
                            <a href="#" style="color: var(--primary); font-weight: 500;">Forgot Password?</a>
                        </div>

                        <button type="submit" class="btn ${isStudent ? 'btn-primary' : ''}" style="width:100%; justify-content:center; padding: 0.8rem; font-size: 1rem; border-radius: 12px; font-weight: 600; ${!isStudent ? 'background:var(--secondary); color:white; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);' : 'box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);'}">
                            Sign In
                        </button>
                    </form>
                    
                    ${isStudent ? `
                    <div style="margin-top: 2rem; text-align: center; font-size: 0.9rem; color: var(--text-muted);">
                        Don't have an account? <a href="javascript:void(0)" onclick="window.switchLogin('student', 'signup')" style="color: var(--primary); font-weight: 700;">Sign Up Now</a>
                    </div>
                    ` : ''}

                    <div style="margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
                        <i class="fas fa-shield-alt" style="margin-right: 5px;"></i> Secure Login • Smart Campus System
                    </div>
                </div>
            </div>`;
        };

        // Define global switcher function attached to window so creating new HTML doesn't break it
        window.switchLogin = (role, mode = 'login') => {
            appContainer.innerHTML = renderForm(role, mode);

            if (mode === 'signup') {
                document.getElementById('signup-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const userData = {
                        name: document.getElementById('signup-name').value,
                        email: document.getElementById('signup-email').value,
                        password: document.getElementById('signup-password').value,
                        department: document.getElementById('signup-dept').value,
                        year: document.getElementById('signup-year').value,
                        college: document.getElementById('signup-college').value,
                        phone: document.getElementById('signup-phone').value,
                        role: 'student'
                    };

                    const result = await Data.addUser(userData);
                    if (result.success) {
                        showToast(`Account created! Please login.`, 'success');
                        window.switchLogin('student', 'login');
                        // Auto-fill login
                        document.getElementById('email').value = userData.email;
                        document.getElementById('password').value = userData.password;
                    } else {
                        showToast(result.message, 'error');
                    }
                });

                document.getElementById('toggle-signup-pwd').addEventListener('click', function () {
                    const p = document.getElementById('signup-password');
                    const type = p.getAttribute('type') === 'password' ? 'text' : 'password';
                    p.setAttribute('type', type);
                    this.classList.toggle('fa-eye');
                    this.classList.toggle('fa-eye-slash');
                });

                return;
            }

            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                const result = await Data.login(email, password);
                if (result.success) {
                    showToast(`Welcome back, ${result.user.name}!`);
                    if (result.user.role === 'super') window.location.hash = '#super/overview';
                    else if (result.user.role === 'admin') window.location.hash = '#admin/overview';
                    else window.location.hash = '#student/overview';
                } else {
                    showToast(result.message, 'error');
                }
            });

            document.getElementById('toggle-pwd').addEventListener('click', function () {
                const p = document.getElementById('password');
                const type = p.getAttribute('type') === 'password' ? 'text' : 'password';
                p.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });
        };

        // Initial Render (Standard View)
        window.switchLogin('student');
    }

    function renderDashboardLayout(user, contentHtml, activeTab) {
        // Base path for links
        let basePath = '#student';
        if (user.role === 'admin') basePath = '#admin';
        else if (user.role === 'super') basePath = '#super';

        // Sidebar Links based on Role
        // Student Links match User's request: Dashboard, Events, My Registrations, Profile, Settings, Help
        let sidebarLinks = '';

        if (user.role === 'student') {
            sidebarLinks = `
                <a href="${basePath}/profile" onclick="window.resetEventForm()" class="${activeTab === 'profile' ? 'active' : ''}">
                    <i class="fas fa-home"></i> Home
                </a>
                <a href="${basePath}/overview" onclick="window.resetEventForm()" class="${activeTab === 'overview' ? 'active' : ''}">
                    <i class="fas fa-columns"></i> Dashboard
                </a>
                <a href="${basePath}/events" onclick="window.resetEventForm()" class="${activeTab === 'events' ? 'active' : ''}">
                    <i class="fas fa-calendar-alt"></i> Events
                </a>
                <a href="${basePath}/my-registrations" onclick="window.resetEventForm()" class="${activeTab === 'my-registrations' ? 'active' : ''}">
                    <i class="fas fa-clipboard-list"></i> My Registrations
                </a>
                <a href="${basePath}/messages" onclick="window.resetEventForm()" class="${activeTab === 'messages' ? 'active' : ''}">
                    <i class="fas fa-comments"></i> Messages
                </a>
                <a href="${basePath}/scanner" onclick="window.resetEventForm()" class="${activeTab === 'scanner' ? 'active' : ''}">
                    <i class="fas fa-camera"></i> Attendance Scanner
                </a>
                <a href="${basePath}/attendance" onclick="window.resetEventForm()" class="${activeTab === 'attendance' ? 'active' : ''}">
                    <i class="fas fa-award"></i> Attendance & Certificates
                </a>
                <div class="divider"></div>
                <a href="${basePath}/settings" onclick="window.resetEventForm()" class="${activeTab === 'settings' ? 'active' : ''}">
                    <i class="fas fa-cog"></i> Settings
                </a>
                <a href="${basePath}/help" onclick="window.resetEventForm()" class="${activeTab === 'help' ? 'active' : ''}">
                    <i class="fas fa-question-circle"></i> Help & Support
                </a>
            `;
        } else if (user.role === 'admin') {
            // Admin Links
            sidebarLinks = `
                <a href="${basePath}/profile" onclick="window.resetEventForm()" class="${activeTab === 'profile' ? 'active' : ''}">
                    <i class="fas fa-home"></i> Home
                </a>
                <a href="${basePath}/overview" onclick="window.resetEventForm()" class="${activeTab === 'overview' ? 'active' : ''}">
                    <i class="fas fa-tachometer-alt"></i> Admin Dashboard
                </a>
                <a href="${basePath}/add-event" onclick="window.resetEventForm()" class="${activeTab === 'add-event' ? 'active' : ''}">
                    <i class="fas fa-plus-circle"></i> Add New Event
                </a>
                <a href="${basePath}/my-events" onclick="window.resetEventForm()" class="${activeTab === 'my-events' ? 'active' : ''}">
                    <i class="fas fa-user-edit"></i> My Official Events
                </a>
                <a href="${basePath}/events-feed" onclick="window.resetEventForm()" class="${activeTab === 'events-feed' ? 'active' : ''}">
                    <i class="fas fa-rss"></i> Events Feed
                </a>
                <a href="${basePath}/registrations" onclick="window.resetEventForm()" class="${activeTab === 'registrations' ? 'active' : ''}">
                    <i class="fas fa-users-cog"></i> Manage Registrations
                </a>
                <a href="${basePath}/scan-qr" onclick="window.resetEventForm()" class="${activeTab === 'scan-qr' ? 'active' : ''}">
                    <i class="fas fa-qrcode"></i> Attendance & Certificates
                </a>
                 <a href="${basePath}/messages" onclick="window.resetEventForm()" class="${activeTab === 'messages' ? 'active' : ''}">
                    <i class="fas fa-comments"></i> Campus Chat
                </a>
                <div class="divider"></div>
                <a href="${basePath}/settings" onclick="window.resetEventForm()" class="${activeTab === 'settings' ? 'active' : ''}">
                    <i class="fas fa-cog"></i> Settings
                </a>
             `;
        } else if (user.role === 'super') {
            // Super Admin Links
            sidebarLinks = `
                <a href="${basePath}/overview" onclick="window.resetEventForm()" class="${activeTab === 'overview' ? 'active' : ''}">
                    <i class="fas fa-home"></i> System Overview
                </a>
                <a href="${basePath}/users" onclick="window.resetEventForm()" class="${activeTab === 'users' ? 'active' : ''}">
                    <i class="fas fa-user-shield"></i> User Management
                </a>
                <a href="${basePath}/events" onclick="window.resetEventForm()" class="${activeTab === 'events' ? 'active' : ''}">
                    <i class="fas fa-calendar-alt"></i> Event Oversight
                </a>
                <div class="divider"></div>
                <a href="#admin/overview">
                    <i class="fas fa-tachometer-alt"></i> Go to Admin Panel
                </a>
                <a href="#student/overview">
                    <i class="fas fa-graduation-cap"></i> Go to Student Portal
                </a>
                <div class="divider"></div>
                <a href="${basePath}/settings" onclick="window.resetEventForm()" class="${activeTab === 'settings' ? 'active' : ''}">
                    <i class="fas fa-cog"></i> Settings
                </a>
            `;
        }

        appContainer.innerHTML = `
            <div class="layout">
                <!-- SIDEBAR -->
                <div class="sidebar">
                    <div class="innovative-logo">
                        <div class="logo-icon-wrapper">
                            <div class="logo-glow"></div>
                            <i class="fas fa-hubspot"></i>
                        </div>
                        <span class="logo-text-main">Event</span><span class="logo-text-sub">Hub</span>
                    </div>
                    
                    <div class="sidebar-menu" style="flex: 1; display: flex; flex-direction: column; overflow-y: auto;">
                        ${sidebarLinks}
                    </div>

                    <!-- Pinned Logout at Bottom -->
                    <div style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); margin-top: auto;">
                        <a href="javascript:void(0)" class="logout" onclick="window.handleLogout()" style="display: flex; align-items: center; gap: 10px; color: #ffb3b3; text-decoration: none; padding: 0.5rem; border-radius: 4px; transition: background 0.3s;">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </div>
                </div>

                <!-- RIGHT PANEL -->
                <div class="main" style="position: relative;">
                    <!-- MODAL AREA (Rendered here to keep Sidebar visible) -->
                    <div id="modal-container"></div>

                    <div class="topbar">
                        <div style="font-weight: bold; font-size: 1.2rem;">College Event Management</div>
                        <div class="flex items-center gap-4">
                            <!-- Admin Notifications Bell -->
                             ${user.role === 'admin' ? `
                            <div style="position: relative; cursor: pointer;" onclick="window.toggleAdminNotifications()">
                                <i class="fas fa-bell" style="font-size: 1.2rem; color: #f1f5f9;"></i>
                                <span id="admin-notif-badge" style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 5px; border-radius: 50%; display: none;">0</span>
                                
                                <!-- Dropdown (hidden by default) -->
                                <div id="admin-notif-dropdown" style="display: none; position: absolute; top: 35px; right: 0; width: 320px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 1000; border: 1px solid #e2e8f0;">
                                    <div style="padding: 1rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                        <h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Recent Alerts</h3>
                                        <button onclick="event.stopPropagation(); window.clearAdminNotifs()" style="background: none; border: none; color: var(--primary); font-size: 0.8rem; cursor: pointer; font-weight: 600;">Clear All</button>
                                    </div>
                                    <div id="admin-notif-list" style="max-height: 400px; overflow-y: auto; padding: 0.5rem;">
                                        <!-- Notifications injected here -->
                                    </div>
                                    <div style="padding: 0.75rem; border-top: 1px solid #f1f5f9; text-align: center;">
                                        <a href="#admin/overview" onclick="window.toggleAdminNotifications()" style="color: #64748b; font-size: 0.8rem; text-decoration: none; font-weight: 600;">View All Activity</a>
                                    </div>
                                </div>
                            </div>
                            ` : ''}

                            <div style="font-size: 0.9rem; opacity: 0.9; text-align: right;">
                                Welcome, <strong>${user.name}</strong><br>
                                <span style="font-size: 0.75rem; opacity: 0.8;">${user.college || 'Smart Campus'}</span>
                            </div>
                            <!-- Added Topbar Logout for Visibility -->
                            <button onclick="window.handleLogout()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s;">
                                <i class="fas fa-power-off"></i> Logout
                            </button>
                        </div>
                    </div>

                    <div class="content fade-in" style="height: calc(100% - 60px); overflow-y: auto;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        // Re-reference the modal container which is now newly created in DOM
        // We attach this to window scope for createModal to protect it across renders? 
        // No, createModal relies on getting element by ID. Since innerHTML rewritten, we are good.

        if (activeTab === 'add-event' && typeof window.checkCapacity === 'function') {
            setTimeout(window.checkCapacity, 100);
        }

        if (activeTab === 'scanner' && typeof window.initQRScanner === 'function') {
            setTimeout(window.initQRScanner, 100);
        }

        if (activeTab === 'scan-qr' && typeof window.initQRScanner === 'function') {
            setTimeout(window.initQRScanner, 100);
        }
    }

    // --- HELPERS ---
    window.openStory = async (eventId) => {
        const data = await Data.get();
        const evt = data.events.find(e => e.id == eventId);
        const creator = data.users.find(u => u.id === evt.adminId);

        const overlay = document.getElementById('story-overlay');
        if (!overlay) return;

        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="story-window">
                <div class="story-progress-strip">
                    <div class="story-progress-bar"><div class="story-progress-fill"></div></div>
                </div>
                <div class="story-top-info">
                    <div class="story-creator">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(creator ? (creator.college || creator.name) : 'Campus')}&background=6366f1&color=fff">
                        <span class="story-creator-name">${creator ? (creator.college || creator.name) : 'Campus'}</span>
                    </div>
                    <div class="story-close-btn" onclick="window.closeStory()"><i class="fas fa-times"></i></div>
                </div>
                <img src="${evt.image}" class="story-image-canvas">
                <div class="story-bottom-content">
                    <div class="story-event-title">${evt.title}</div>
                    <a href="javascript:void(0)" onclick="window.closeStory(); window.showEventDetails('${evt.id}')" class="story-action-btn">View Full Poster</a>
                </div>
            </div>
        `;

        const fill = overlay.querySelector('.story-progress-fill');
        fill.style.width = '0%';
        setTimeout(() => {
            fill.style.transition = 'width 5s linear';
            fill.style.width = '100%';
        }, 50);

        window.storyTimeout = setTimeout(window.closeStory, 5000);
    };

    window.closeStory = () => {
        const overlay = document.getElementById('story-overlay');
        if (overlay) overlay.style.display = 'none';
        if (window.storyTimeout) clearTimeout(window.storyTimeout);
    };

    const renderStoryProfile = (user, data) => {
        const myRegs = data.registrations.filter(r => r.userId === user.id);
        const myEvents = data.events.filter(e => (e.adminId || e.admin_id) == user.id);
        const recentEvents = data.events.filter(e => e.status !== 'draft').reverse().slice(0, 10);

        // Personalized Feed
        let feedEvents = [];
        let feedTitle = "My Feed";
        if (user.role === 'student') {
            feedEvents = myRegs.map(reg => data.events.find(e => e.id === reg.eventId)).filter(e => e && e.status !== 'draft');
            feedTitle = "My Registrations";
        } else {
            feedEvents = myEvents;
            feedTitle = "My Posted Events";
        }

        return `
            <div id="story-overlay" class="story-overlay"></div>

            <div style="max-width: 1000px; margin: 0 auto; padding: 1.5rem 1rem;">
                <!-- Modern Top Header -->
                <div style="max-width: 1000px; margin: 0 auto; padding: 1.5rem 1rem;">
                    <!-- Modern Top Header -->
                    <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem; animation: fadeInDown 0.6s ease-out;">
                        <!-- Mini Profile (Minimized and Relocated) -->
                        <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="window.location.hash='#${user.role}/settings'">
                            <div class="profile-ring" style="width: 48px; height: 48px; padding: 2px;">
                                <div style="width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; overflow: hidden; background: #f8fafc;">
                                    <img src="${user.profilePic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" style="width:100%; height:100%; object-fit: cover;">
                                </div>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1rem; color: #1e293b; font-weight: 800;">${user.name}</h3>
                                <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 600;">@${user.name.toLowerCase().replace(/\s+/g, '')}</p>
                            </div>
                        </div>

                        <!-- Search Bar (In middle) -->
                        <div style="position: relative; flex: 1; max-width: 400px;">
                            <i class="fas fa-search" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.9rem;"></i>
                            <input type="text" id="profile-event-search" oninput="window.filterProfileFeed(this.value)" placeholder="Search your events..." 
                                   style="width: 100%; background: white; border: 1px solid #e2e8f0; padding: 12px 20px 12px 48px; border-radius: 16px; font-size: 0.9rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); outline: none; transition: all 0.3s; color: #1e293b;"
                                   onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 10px 15px -3px rgba(99, 102, 241, 0.1)'"
                                   onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.02)'">
                        </div>

                        <!-- Icons and Dropdown container -->
                        <div style="display: flex; gap: 1rem; align-items: center; position: relative;">
                            <div class="glass-icon-btn" onclick="window.toggleStudentNotifications()">
                                <i class="far fa-bell"></i>
                                <span id="student-notif-badge" class="pulse-dot" style="display: none;"></span>
                                
                                <!-- Student Notif Dropdown -->
                                <div id="student-notif-dropdown" style="display: none; position: absolute; top: 55px; right: 0; width: 300px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 1000; border: 1px solid #e2e8f0;">
                                    <div style="padding: 1rem; border-bottom: 3px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                        <h3 style="margin: 0; font-size: 0.9rem; color: #1e293b; font-weight: 700;">Notifications</h3>
                                        <button onclick="event.stopPropagation(); window.clearStudentNotifs()" style="background: none; border: none; color: var(--primary); font-size: 0.75rem; cursor: pointer; font-weight: 700;">Clear</button>
                                    </div>
                                    <div id="student-notif-list" style="max-height: 350px; overflow-y: auto;">
                                        <!-- Notifications injected here -->
                                    </div>
                                </div>
                            </div>
                            <div class="glass-icon-btn" onclick="window.location.hash='#${user.role}/messages'">
                                <i class="far fa-envelope"></i>
                            </div>
                            <button onclick="window.location.hash='#${user.role}/settings'" class="btn" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); display: flex; align-items: center; gap: 10px; transition: transform 0.2s;">
                                <i class="fas fa-user-edit"></i> Edit Profile
                            </button>
                        </div>
                    </div>

                    <div class="profile-layout-grid" style="display: block;">
                        <!-- Content Area -->
                        <div style="animation: fadeInUp 0.8s ease-out;">
                        <!-- Gallery/Feed Section -->
                        <div class="modern-layout">
                            <div class="feed-nav-header">
                                <div class="feed-nav-title">${feedTitle}</div>
                            </div>
                            
                            <div class="modern-masonry" id="profile-feed-grid">
                                ${feedEvents.length === 0 ? `
                                    <div style="grid-column: 1/-1; padding: 4rem; text-align: center; background: white; border-radius: 24px; border: 2px dashed #e2e8f0; color: #94a3b8;">
                                        <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                                        <p style="font-size: 1.1rem;">No events to display yet.</p>
                                        <button class="btn btn-primary" onclick="window.location.hash='#${user.role}/events'" style="margin-top: 1rem;">Explore Campus</button>
                                    </div>
                                ` : feedEvents.map((evt, idx) => `
                                    <div class="masonry-item profile-feed-item" data-title="${evt.title.toLowerCase()}" onclick="window.showEventDetails('${evt.id}')" style="height: ${idx % 3 === 0 ? '400px' : '320px'}; animation: fadeInUp 0.5s ease forwards; animation-delay: ${idx * 0.1}s;">
                                        <img src="${evt.image}" style="height: 100%; object-fit: cover;">
                                        <div class="masonry-overlay">
                                            <div style="font-weight: 800; font-size: 1.25rem; margin-bottom: 8px;">${evt.title}</div>
                                            <div style="font-size: 0.85rem; opacity: 0.9; display: flex; align-items: center; gap: 10px;">
                                                <span><i class="fas fa-calendar-alt"></i> ${new Date(evt.date).toLocaleDateString()}</span>
                                                <span><i class="fas fa-map-marker-alt"></i> ${evt.venue}</span>
                                            </div>
                                            <div style="margin-top: 1rem; display: flex; gap: 8px;">
                                                <span class="badge" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; font-size: 0.7rem;">${evt.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .glass-icon-btn {
                    width: 48px;
                    height: 48px;
                    background: white;
                    border: 1px solid #f1f5f9;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: #64748b;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .glass-icon-btn:hover {
                    background: #f8fafc;
                    color: var(--primary);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }
                .pulse-dot {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    border: 2px solid white;
                }
                .profile-ring {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    padding: 4px;
                    background: linear-gradient(45deg, #6366f1, #a855f7, #ec4899);
                    transition: transform 0.3s;
                }
                .profile-ring:hover {
                    transform: rotate(15deg);
                }
                .profile-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 2rem;
                    background: #f8fafc;
                    padding: 12px;
                    border-radius: 20px;
                }
                .stat-box {
                    display: flex;
                    flex-direction: column;
                    padding: 10px 0;
                }
                .stat-num {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #1e293b;
                }
                .stat-label {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .masonry-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 30px 25px 25px;
                    background: linear-gradient(transparent, rgba(0,0,0,0.9));
                    color: white;
                    transform: translateY(20px);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .masonry-item:hover .masonry-overlay {
                    transform: translateY(0);
                    opacity: 1;
                }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            </style>

            <script>
                window.filterProfileFeed = (query) => {
                    const q = query.toLowerCase();
                    const items = document.querySelectorAll('.profile-feed-item');
                    items.forEach(item => {
                        const title = item.getAttribute('data-title');
                        item.style.display = title.includes(q) ? 'block' : 'none';
                    });
                };
            </script>
        `;
    };

    // --- STUDENT VIEWS ---
    async function renderStudentDashboard(subView = 'overview') {
        const user = Data.getCurrentUser();
        if (!user || (user.role !== 'student' && user.role !== 'super')) { window.location.hash = '#login'; return; }
        const data = await Data.get();
        const myRegistrations = data.registrations
            .filter(r => r.userId === user.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        let content = '';


        if (subView === 'overview') {
            // --- Data Calculation ---
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const publishedEvents = data.events.filter(e => e.status !== 'draft');

            // 1. Stats
            const upcomingEventsCount = publishedEvents.filter(e => new Date(e.date) >= today).length;
            const myRegCount = myRegistrations.length;
            const todaysEventsCount = publishedEvents.filter(e => {
                const d = new Date(e.date);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            }).length;

            // 2. Notifications (Alerts)
            const upcomingRegs = myRegistrations.filter(reg => {
                const evt = data.events.find(e => e.id === reg.eventId);
                if (!evt || evt.status === 'draft') return false; // Hide if event became draft
                let eventDate = new Date(evt.date);
                eventDate.setHours(0, 0, 0, 0);
                const diffTime = eventDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 3;
            });
            const newEvents = publishedEvents.filter(evt => {
                const eventDate = new Date(evt.date);
                eventDate.setHours(0, 0, 0, 0);
                const diffTime = eventDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isRegistered = myRegistrations.some(r => r.eventId === evt.id);
                return !isRegistered && diffDays >= 0 && diffDays <= 7;
            });
            const alertsCount = upcomingRegs.length + newEvents.length;

            // 3. Lists
            const upcomingList = publishedEvents
                .filter(e => new Date(e.date) >= today)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3); // Top 3

            const recentRegs = myRegistrations.slice(0, 3); // Top 3

            content = `
                <!-- Stats Row -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="card clickable-card" onclick="window.location.hash='#student/events'" style="padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #3b82f6; cursor: pointer;">
                        <div style="font-size: 2rem; color: #3b82f6; background: #eff6ff; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"><i class="fas fa-calendar-alt" style="font-size: 1.2rem;"></i></div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; line-height: 1;">${upcomingEventsCount}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">Upcoming Events</div>
                        </div>
                    </div>
                    <div class="card clickable-card" onclick="window.location.hash='#student/my-registrations'" style="padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #8b5cf6; cursor: pointer;">
                        <div style="font-size: 2rem; color: #8b5cf6; background: #f5f3ff; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"><i class="fas fa-ticket-alt" style="font-size: 1.2rem;"></i></div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; line-height: 1;">${myRegCount}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">My Registrations</div>
                        </div>
                    </div>
                    <div class="card clickable-card" onclick="window.location.hash='#student/events'" style="padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f59e0b; cursor: pointer;">
                        <div style="font-size: 2rem; color: #f59e0b; background: #fffbeb; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"><i class="fas fa-star" style="font-size: 1.2rem;"></i></div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; line-height: 1;">${todaysEventsCount}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">Today's Events</div>
                        </div>
                    </div>
                    <div class="card clickable-card" style="padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid #ef4444;">
                        <div style="font-size: 2rem; color: #ef4444; background: #fef2f2; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"><i class="fas fa-bell" style="font-size: 1.2rem;"></i></div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; line-height: 1;">${alertsCount}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">Alerts</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start;">
                    
                    <!-- Left Column -->
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <!-- Upcoming Events List -->
                        <div class="card" style="padding: 1.5rem;">
                            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: #1e293b;"><i class="far fa-calendar" style="color: #3b82f6; margin-right: 8px;"></i> Upcoming Events</h3>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                ${upcomingList.map(evt => {
                const isReg = myRegistrations.some(r => r.eventId === evt.id);
                return `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                                        <div onclick="window.showEventDetails('${evt.id}', true)" style="cursor: pointer;">
                                            <div style="font-weight: 600; color: var(--primary);">${evt.title}</div>
                                            <div style="font-size: 0.85rem; color: #64748b;">${new Date(evt.date).toLocaleDateString()}</div>
                                        </div>
                                        ${isReg ?
                        `<button onclick="window.showEventDetails('${evt.id}', true)" style="background: #dcfce7; color: #16a34a; border: none; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">View</button>` :
                        `<button onclick="window.showEventDetails('${evt.id}', true)" style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">Register</button>`
                    }
                                    </div>
                                    `;
            }).join('')}
                                ${upcomingList.length === 0 ? '<div style="color:var(--text-muted); font-style:italic;">No upcoming events.</div>' : ''}
                            </div>
                        </div>

                        <!-- My Registrations List -->
                        <div class="card" style="padding: 1.5rem;">
                            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: #1e293b;"><i class="fas fa-clipboard-list" style="color: #8b5cf6; margin-right: 8px;"></i> My Registrations</h3>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                ${recentRegs.map(reg => {
                const evt = data.events.find(e => e.id === reg.eventId);
                return `
                                    <div onclick="window.showEventDetails('${evt ? evt.id : ''}', true)" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; cursor: pointer;">
                                        <div style="font-weight: 600; color: var(--primary);">${evt ? evt.title : 'Unknown Event'}</div>
                                        <span class="badge badge-${reg.status}" style="font-size: 0.8rem;">${reg.status}</span>
                                    </div>
                                    `;
            }).join('')}
                                ${recentRegs.length === 0 ? '<div style="color:var(--text-muted); font-style:italic;">No active registrations.</div>' : ''}
                            </div>
                        </div>

                    </div>

                    <!-- Right Column (Expanded with Global Events) -->
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <!-- NEW: All Colleges Events Section -->
                        <div class="card" style="padding: 1.5rem; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
                            <h3 style="margin-bottom: 1.25rem; font-size: 1.1rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-compass" style="color: #6366f1;"></i> Campus Discoveries
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                ${data.events.filter(e => e.status !== 'draft' && !upcomingList.some(ue => ue.id === e.id)).slice(0, 3).map(evt => `
                                    <div onclick="window.showEventDetails('${evt.id}', true)" style="display: flex; gap: 12px; cursor: pointer; padding: 8px; border-radius: 10px; transition: 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                                        <img src="${evt.image}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                                        <div style="flex: 1; overflow: hidden;">
                                            <div style="font-weight: 600; font-size: 0.85rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${evt.title}</div>
                                            <div style="font-size: 0.75rem; color: #64748b;">${evt.venue || 'Campus'}</div>
                                            <div style="font-size: 0.7rem; color: var(--primary); margin-top: 2px; font-weight: 600;">${new Date(evt.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                `).join('')}
                                <button onclick="window.location.hash='#student/events'" style="width: 100%; padding: 8px; background: #eef2ff; color: #6366f1; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-top: 5px;">View All College Events</button>
                            </div>
                        </div>
                        
                        <!-- Notifications -->
                        <div class="card" style="padding: 1.5rem;">
                            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: #1e293b;"><i class="fas fa-bell" style="color: #f59e0b; margin-right: 8px;"></i> Notifications</h3>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${alertsCount === 0 ? '<div style="color:var(--text-muted); font-size:0.9rem;">No new alerts.</div>' : ''}
                                ${upcomingRegs.map(reg => {
                const evt = data.events.find(e => e.id === reg.eventId);
                return `
                                        <div onclick="window.showEventDetails('${evt.id}', true)" style="padding: 0.75rem; background: #fff1f2; border-left: 3px solid #f43f5e; border-radius: 4px; font-size: 0.85rem; cursor: pointer;">
                                            Reminder: <strong>${evt.title}</strong> is soon!
                                        </div>
                                    `;
            }).join('')}
                                ${newEvents.map(evt => `
                                    <div onclick="window.showEventDetails('${evt.id}', true)" style="padding: 0.75rem; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 4px; font-size: 0.85rem; cursor: pointer;">
                                        New: <strong>${evt.title}</strong> added.
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Calendar Widget -->
                        <div class="card" style="padding: 1.5rem;">
                            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: #1e293b;"><i class="fas fa-calendar-day" style="color: #6366f1; margin-right: 8px;"></i> Calendar</h3>
                            ${renderCalendarHTML(publishedEvents, myRegistrations, false)}
                        </div>

                    </div>
                </div>
            `;
        } else if (subView === 'events') {
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <h2 style="color: #1e293b; font-size: 2.25rem; font-weight: 800; margin: 0;">Trending Now</h2>
                    <div style="position: relative; width: 100%; max-width: 400px;">
                        <input type="text" id="event-search" oninput="window.filterStudentEvents(this.value)" placeholder="Search events, topics, or departments..." 
                            style="width: 100%; padding: 0.9rem 1.25rem 0.9rem 3rem; border-radius: 99px; border: 2px solid #e2e8f0; background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); font-size: 1rem; outline: none; transition: all 0.3s; color: #1e293b;">
                        <i class="fas fa-search" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.1rem;"></i>
                    </div>
                </div>

                <div class="ott-grid" id="student-events-grid">
                    ${data.events.filter(e => e.status !== 'draft').reverse().map(evt => {
                const isMyEvent = (evt.adminId || evt.admin_id) == user.id;
                // Check if created within last 2 hours for my events
                let canManage = false;
                let diffHrs = 0;
                if (isMyEvent) {
                    const created = new Date(evt.createdAt || evt.date);
                    const now = new Date();
                    const diffMs = now - created;
                    diffHrs = diffMs / (1000 * 60 * 60);
                    canManage = diffHrs < 2;
                }

                return `
                        <div class="ott-card event-item" ${!isMyEvent ? `onclick="window.showEventDetails('${evt.id}', true)"` : ''} style="${isMyEvent ? 'cursor: default;' : ''}">
                            <img src="${evt.image}" alt="${evt.title}" class="ott-card-image">
                            <span class="ott-category-badge">${evt.type}</span>
                            
                            ${isMyEvent && canManage ? `
                                <div style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; gap: 5px;">
                                    <button onclick="window.editEvent('${evt.id}')" style="background: var(--primary); color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button onclick="window.deleteEvent('${evt.id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>` : ''
                    }

                            <div class="ott-card-overlay" ${isMyEvent ? `onclick="window.showEventDetails('${evt.id}', true)" style="cursor: pointer;"` : ''}>
                                <div class="ott-title">${evt.title}</div>
                                <div class="ott-dept">${evt.department || (evt.subEvents && evt.subEvents.length > 0 ? evt.subEvents[0].department : 'General')}</div>
                                <div class="ott-meta">
                                    <span><i class="fas fa-calendar-alt" style="color:var(--primary);"></i> ${new Date(evt.date).toLocaleDateString()}</span>
                                    <span><i class="fas fa-map-marker-alt" style="color:var(--secondary);"></i> ${evt.venue}</span>
                                </div>
                                ${isMyEvent ? `
                                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.85rem; color: #cbd5e1; display: flex; justify-content: space-between;">
                                    <span><i class="fas fa-users"></i> ${evt.capacity}</span>
                                    ${canManage ? `<span style="color: #fbbf24; font-size: 0.75rem;">Editable for ${(2 - diffHrs).toFixed(1)}h</span>` : '<span style="color: #94a3b8; font-size: 0.75rem;">Locked</span>'}
                                </div>` : ''}
                            </div>
                        </div>
                    `;
            }).join('')}
                </div>

                <script>
                    window.filterStudentEvents = (query) => {
                        const q = query.toLowerCase();
                        const cards = document.querySelectorAll('#student-events-grid .event-item');
                        let count = 0;
                        cards.forEach(card => {
                            const title = card.querySelector('.ott-title').innerText.toLowerCase();
                            const dept = card.querySelector('.ott-dept').innerText.toLowerCase();
                            const type = card.querySelector('.ott-category-badge').innerText.toLowerCase();
                            
                            if (title.includes(q) || dept.includes(q) || type.includes(q)) {
                                card.style.display = '';
                                count++;
                            } else {
                                card.style.display = 'none';
                            }
                        });
                        
                        // Handle no results
                        let noResults = document.getElementById('no-results-msg');
                        if (count === 0) {
                            if (!noResults) {
                                noResults = document.createElement('div');
                                noResults.id = 'no-results-msg';
                                noResults.style = 'grid-column: 1/-1; text-align: center; padding: 4rem; color: #64748b; font-size: 1.1rem;';
                                noResults.innerHTML = '<i class="fas fa-search" style="font-size: 3rem; display: block; margin-bottom: 1rem; opacity: 0.3;"></i> No events match your search.';
                                document.getElementById('student-events-grid').appendChild(noResults);
                            }
                        } else if (noResults) {
                            noResults.remove();
                        }
                    };
                </script>
            `;
        } else if (subView === 'calendar') {
            const publishedEvents = data.events.filter(e => e.status !== 'draft');
            content = `
                <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h2 style="margin:0; font-size: 2rem; color: #1e293b;">Event Calendar</h2>
                        <p style="margin:5px 0 0 0; color: #64748b;">Browse all upcoming campus activities</p>
                    </div>
                </div>
                
                <div class="calendar-wrapper">
                    ${renderCalendarHTML(publishedEvents, myRegistrations, true)}
                </div>
                
                <style>
                    .calendar-wrapper > div {
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
                        border: none !important;
                        background: rgba(255, 255, 255, 0.9) !important;
                        backdrop-filter: blur(10px);
                    }
                </style>
            `;
        } else if (subView === 'my-registrations') {
            content = `
                <h2 style="margin-bottom:1.5rem; color: #1e293b; font-size: 2rem;">My Event Registrations</h2>
                <div class="ott-grid">
                    ${myRegistrations.length === 0 ? '<div style="color: #94a3b8; grid-column: 1/-1; text-align: center; padding: 4rem;">No registrations found. Explore events to register!</div>' :
                    myRegistrations.map(reg => {
                        const evt = data.events.find(e => e.id === reg.eventId);
                        if (!evt) return '';
                        const sub = evt.subEvents ? evt.subEvents.find(s => s.id === reg.subEventId) : null;
                        const title = sub ? sub.name : evt.title;
                        const displayTitle = sub ? `${evt.title}: ${sub.name}` : evt.title;

                        return `
                        <div class="ott-card" onclick="window.showEventDetails('${evt.id}', true)">
                            <img src="${evt.image}" alt="${evt.title}" class="ott-card-image" style="height: 250px;">
                            <span class="ott-category-badge" style="background: ${reg.status === 'Approved' ? '#10b981' : (reg.status === 'Rejected' ? '#ef4444' : '#f59e0b')}; color: white; border: none;">
                                ${reg.status.toUpperCase()}
                            </span>
                            
                            <div class="ott-card-overlay">
                                <div class="ott-title" style="font-size: 1.1rem;">${title}</div>
                                <div class="ott-dept" style="color: #94a3b8;">${evt.title}</div>
                                <div class="ott-meta">
                                    <span><i class="fas fa-university"></i> ${evt.venue || 'Host Campus'}</span>
                                    <span style="color: var(--primary); font-weight: 600;">• ${evt.type}</span>
                                </div>
                                <div style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                                    <span style="color: ${reg.attendance === 'Present' ? '#10b981' : '#cbd5e1'}; display:flex; align-items:center; gap:8px;">
                                        <i class="fas fa-user-check"></i> ${reg.attendance || 'Punctuality Pending'}
                                        <button onclick="event.stopPropagation(); window.viewRegistrationQR('${reg.id}', '${displayTitle.replace(/'/g, "\\'")}')" 
                                            style="background: #e0e7ff; color: #4338ca; border: none; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                                            <i class="fas fa-qrcode"></i> Ticket
                                        </button>
                                    </span>
                                    ${reg.certificateUrl ? `
                                        <span onclick="event.stopPropagation(); window.downloadFile('${reg.certificateUrl}', '${title.replace(/\s+/g, '_')}_Certificate.pdf')" 
                                              style="color: var(--primary); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                                              onmouseover="this.style.textDecoration='underline'"
                                              onmouseout="this.style.textDecoration='none'">
                                            <i class="fas fa-download"></i> Get Cert
                                        </span>` : ''}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (subView === 'profile') {
            content = renderStoryProfile(user, data);
        } else if (subView === 'settings') {
            content = `
                <h2 style="margin-bottom:1.5rem;">Account Settings</h2>
                <div class="grid-layout" style="grid-template-columns: 1fr; max-width: 800px; gap: 2rem;">
                    
                    <!-- Profile Update -->
                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-user-circle" style="color: var(--primary);"></i> Personal Information
                        </h3>
                        <form onsubmit="window.handleUpdateProfile(event)">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="input-group">
                                    <label class="input-label">Full Name</label>
                                    <input type="text" name="userName" class="smart-input" value="${user.name}" required>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Phone Number</label>
                                    <input type="tel" name="userPhone" class="smart-input" value="${user.phone || ''}" placeholder="+1-555-0199">
                                </div>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Email Address (Read-only)</label>
                                <input type="email" class="smart-input" value="${user.email}" readonly style="background: #f1f5f9; color: #64748b;">
                            </div>
                            <button type="submit" class="btn btn-primary">Update Profile</button>
                        </form>
                    </div>

                    <!-- Theme Preferences -->
                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-palette" style="color: #8b5cf6;"></i> Theme Preferences
                        </h3>
                        <form onsubmit="window.handleUpdateTheme(event)">
                            <div class="input-group">
                                <label class="input-label">Display Theme</label>
                                <select name="userTheme" class="smart-input" onchange="window.applyTheme(this.value)">
                                    <option value="light" ${user.theme === 'light' || !user.theme ? 'selected' : ''}>Light Mode</option>
                                    <option value="dark" ${user.theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
                                </select>
                                <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Choose your preferred color scheme. Changes apply immediately.</p>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Theme Preference</button>
                        </form>
                    </div>

                    <!-- Password Update -->
                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-key" style="color: #f59e0b;"></i> Security & Password
                        </h3>
                        <form onsubmit="window.handleChangePassword(event)">
                            <div class="input-group">
                                <label class="input-label">Current Password</label>
                                <input type="password" name="currentPassword" class="smart-input" required>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="input-group">
                                    <label class="input-label">New Password</label>
                                    <input type="password" name="newPassword" class="smart-input" minlength="4" required>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Confirm New Password</label>
                                    <input type="password" name="confirmPassword" class="smart-input" minlength="4" required>
                                </div>
                            </div>
                            <button type="submit" class="btn" style="background: #f59e0b; color: white;">Change Password</button>
                        </form>
                    </div>

                </div>
            `;
        } else if (subView === 'add-event') {
            if (!window.editingEventId) {
                window.location.hash = '#student/overview';
                return;
            }
            content = renderEventForm(user, data, subView);
        } else if (subView === 'messages') {
            let chatHtml = '<div class="card">Chat module loading...</div>';
            try {
                if (typeof renderChatView === 'function') {
                    chatHtml = await renderChatView(user, window.activeConversationId);
                }
            } catch (e) {
                console.error("Chat Error:", e);
                chatHtml = `<div class="card">Error loading chat. Please try again later. <br><small>${e.message}</small></div>`;
            }
            content = `
                <h2 style="margin-bottom:1.5rem;">Messages</h2>
                ${chatHtml}
            `;
        } else if (subView === 'attendance') {
            const myRegs = data.registrations.filter(r => r.userId == user.id);
            const attendanceStats = {
                present: myRegs.filter(r => r.attendance === 'Present').length,
                total: myRegs.length,
                pending: myRegs.filter(r => r.status === 'pending').length
            };

            content = `
                <div style="margin-bottom: 2rem;">
                    <h2 style="margin:0; font-size: 2rem; color: #1e293b;">Attendance & Certificates</h2>
                    <p style="margin:5px 0 0 0; color: #64748b;">Track your participation and claim your certificates</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="card" style="padding: 1.5rem; border-left: 4px solid #10b981;">
                        <div style="color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Attended Events</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b;">${attendanceStats.present} <span style="font-size: 1rem; color: #94a3b8; font-weight: 400;">/ ${attendanceStats.total}</span></div>
                    </div>
                    <div class="card" style="padding: 1.5rem; border-left: 4px solid #f59e0b;">
                        <div style="color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Pending Approval</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b;">${attendanceStats.pending}</div>
                    </div>
                    <div class="card" style="padding: 1.5rem; background: var(--primary); color: white;">
                        <div style="font-size:0.85rem; opacity: 0.8; margin-bottom: 8px;">QUICK ACTION</div>
                        <button onclick="window.location.hash='#student/scanner'" class="btn" style="background: white; color: var(--primary); border: none; width: 100%; font-weight: 700;">
                            <i class="fas fa-qrcode"></i> Open Scanner
                        </button>
                    </div>
                </div>

                <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
                    <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
                        <h3 style="margin:0; font-size: 1.1rem; color: #1e293b;">My Participation Record</h3>
                        <div style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.8rem;"></i>
                            <input type="text" placeholder="Search events..." onkeyup="window.filterAttendanceList(this.value)" style="padding: 6px 12px 6px 32px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; outline: none;">
                        </div>
                    </div>
                    <div id="attendance-list" style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <tr>
                                    <th style="padding: 1rem 1.5rem; color: #64748b; font-size: 0.8rem; text-transform: uppercase;">Event Name</th>
                                    <th style="padding: 1rem 1.5rem; color: #64748b; font-size: 0.8rem; text-transform: uppercase;">Status</th>
                                    <th style="padding: 1rem 1.5rem; color: #64748b; font-size: 0.8rem; text-transform: uppercase;">Attendance</th>
                                    <th style="padding: 1rem 1.5rem; color: #64748b; font-size: 0.8rem; text-transform: uppercase; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${myRegs.length === 0 ? `
                                    <tr>
                                        <td colspan="4" style="padding: 3rem; text-align: center; color: #94a3b8;">
                                            <i class="fas fa-calendar-times" style="font-size: 2rem; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
                                            No registrations found.
                                        </td>
                                    </tr>
                                ` : myRegs.map(reg => {
                const evt = data.events.find(e => e.id == reg.eventId);
                if (!evt) return '';
                const displayTitle = reg.subEventId ? `${evt.title}: ${evt.subEvents.find(s => s.id == reg.subEventId).name}` : evt.title;

                return `
                                    <tr class="attendance-row" style="border-bottom: 1px solid #f8fafc;">
                                        <td style="padding: 1.25rem 1.5rem;">
                                            <div style="font-weight: 700; color: #1e293b;">${displayTitle}</div>
                                            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">${new Date(evt.date).toLocaleDateString()} • ${evt.venue}</div>
                                        </td>
                                        <td style="padding: 1.25rem 1.5rem;">
                                            <span class="badge badge-${reg.status.toLowerCase()}" style="font-size: 0.7rem;">${reg.status}</span>
                                        </td>
                                        <td style="padding: 1.25rem 1.5rem;">
                                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: ${reg.attendance === 'Present' ? '#10b981' : '#94a3b8'};">
                                                <i class="fas ${reg.attendance === 'Present' ? 'fa-check-circle' : 'fa-clock'}"></i>
                                                ${reg.attendance || 'Pending'}
                                            </div>
                                        </td>
                                        <td style="padding: 1.25rem 1.5rem; text-align: right;">
                                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                                <button onclick="window.viewRegistrationQR('${reg.id}', '${displayTitle.replace(/'/g, "\\'")}')" class="btn btn-sm" style="background: #f1f5f9; color: #475569; padding: 6px 10px; border-radius: 8px;" title="My ID QR">
                                                    <i class="fas fa-qrcode"></i>
                                                </button>

                                                ${reg.attendance === 'Present' && reg.certificateUrl ? `
                                                    <button onclick="window.downloadFile('${reg.certificateUrl}', '${displayTitle.replace(/\s+/g, '_')}_Certificate.png')" class="btn btn-sm" style="background: #eff6ff; color: #3b82f6; padding: 6px 10px; border-radius: 8px;" title="Download Certificate">
                                                        <i class="fas fa-download"></i> Cert
                                                    </button>
                                                ` : ''}
                                                ${reg.status === 'Approved' && reg.attendance !== 'Present' ? `
                                                    <button onclick="window.location.hash='#student/scanner'" class="btn btn-sm btn-primary" style="padding: 6px 10px; border-radius: 8px;" title="Scan to Mark Attendance">
                                                        <i class="fas fa-camera"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <script>
                    window.filterAttendanceList = (query) => {
                        const q = query.toLowerCase();
                        const rows = document.querySelectorAll('.attendance-row');
                        rows.forEach(row => {
                            const text = row.innerText.toLowerCase();
                            row.style.display = text.includes(q) ? '' : 'none';
                        });
                    };
                </script>
            `;
        } else if (subView === 'scanner') {
            const myApprovedRegs = data.registrations.filter(r => r.userId === user.id && r.status === 'Approved');
            content = `
                <div style="margin-bottom: 2rem; animation: fadeInDown 0.6s ease-out;">
                    <h2 style="margin:0; font-size: 2.2rem; font-weight: 800; color: #1e293b; letter-spacing: -1px;">Check-in Scanner</h2>
                    <p style="margin:5px 0 0 0; color: #64748b; font-weight: 500;">Scan the event QR code to mark your attendance</p>
                </div>

                <div class="lens-container" style="height: 70vh; animation: zoomIn 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);">
                    <div class="lens-camera-view">
                        <div id="qr-reader" style="width: 100%; height: 100%;"></div>
                        
                        <!-- Placeholder State -->
                        <div id="scanner-placeholder" style="position: absolute; inset: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 15; color: white;">
                             <div class="pulse-ring" style="margin-bottom: 2.5rem;">
                                 <div style="width: 90px; height: 90px; background: rgba(99, 102, 241, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
                                    <i class="fas fa-camera" style="font-size: 2rem; color: #818cf8;"></i>
                                </div>
                            </div>
                            <h3 style="margin-bottom: 0.75rem; font-weight: 700; font-size: 1.25rem;">Camera Access Required</h3>
                            <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 2.5rem; max-width: 250px; text-align: center; line-height: 1.5;">Grant permission to start scanning event QR codes</p>
                            <button onclick="window.initQRScanner()" class="btn" style="background: white; color: #1e293b; padding: 1rem 3rem; border-radius: 50px; font-weight: 800; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: none; transition: 0.3s; transform-origin: center;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-power-off" style="margin-right: 10px; color: #6366f1;"></i> Activate Scanner
                            </button>
                        </div>

                        <!-- Active Viewfinder Overlay -->
                        <div id="scanner-overlay" style="display: none; position: absolute; inset: 0; pointer-events: none; z-index: 10;">
                            <div class="lens-viewfinder">
                                <div class="lens-corner top-left"></div>
                                <div class="lens-corner top-right"></div>
                                <div class="lens-corner bottom-left"></div>
                                <div class="lens-corner bottom-right"></div>
                                
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;">
                                    <div class="scan-line-anim"></div>
                                </div>
                            </div>
                            <div style="position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 12px 24px; border-radius: 12px; color: white; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.1);">
                                <i class="fas fa-expand" style="color: #818cf8;"></i> Align QR within frame
                            </div>
                        </div>

                        <!-- Result Popup Target -->
                        <div id="qr-result" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 30; pointer-events: none; width: 80%;"></div>

                        <!-- Scan History Popup (Overlay style for mobile) -->
                        <div id="scan-history-panel" style="display: none; position: absolute; bottom: 0; left: 0; width: 100%; background: white; border-top: 1px solid #e2e8f0; border-radius: 24px 24px 0 0; box-shadow: 0 -20px 40px rgba(0,0,0,0.15); padding: 1.5rem; z-index: 40; max-height: 60vh; overflow-y: auto;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; position: sticky; top: 0; background: white; padding-bottom: 10px; z-index: 1;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-history" style="color: #6366f1;"></i>
                                    <h4 style="margin:0; color: #1e293b; font-weight: 800;">Recent Scans</h4>
                                </div>
                                <button onclick="window.showScanHistory()" style="background: #f1f5f9; border: none; color: #64748b; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fas fa-times"></i></button>
                            </div>
                            <div id="history-list" style="display: flex; flex-direction: column; gap: 10px;">
                                <p style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 2rem;">No recent activities found.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Glass Control Bar -->
                    <div class="lens-controls" style="background: #f8fafc; padding: 1.25rem 2rem; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #eef2ff;">
                        <button class="lens-action-btn" title="Flashlight" id="btn-flash-toggle" onclick="window.toggleFlash()">
                            <i class="fas fa-bolt"></i>
                            <span>Flash</span>
                        </button>
                        
                        <label class="lens-action-btn" title="From Gallery">
                            <i class="fas fa-images"></i>
                            <span>Gallery</span>
                            <input type="file" accept="image/*" style="display: none;" onchange="window.handleGalleryScan(this)">
                        </label>

                        <div class="lens-main-scan-btn" onclick="window.initQRScanner()" id="btn-main-trigger">
                            <i class="fas fa-expand"></i>
                        </div>

                        <button class="lens-action-btn" id="btn-show-history" title="History" onclick="window.showScanHistory()">
                            <i class="fas fa-list-ul"></i>
                            <span>History</span>
                            <span id="history-badge" style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; display: none; font-weight: 700;">0</span>
                        </button>

                        <button class="lens-action-btn" title="Help" onclick="showToast('Point your camera at an event QR code', 'info')">
                            <i class="fas fa-info-circle"></i>
                            <span>Help</span>
                        </button>
                    </div>

                    <!-- Active Mode Stop Button -->
                    <div id="active-controls" style="position: absolute; bottom: 120px; width: 100%; display: none; justify-content: center; z-index: 20;">
                        <button onclick="window.stopQRScanner()" class="btn" style="background: rgba(239, 68, 68, 0.9); backdrop-filter: blur(10px); color: white; padding: 0.8rem 2.5rem; border-radius: 50px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3); font-weight: 700;">
                            <i class="fas fa-stop-circle" style="margin-right: 8px;"></i> Stop Camera
                        </button>
                    </div>
                </div>

                <!-- My Check-in Tickets Section -->
                <div style="margin-top: 3rem; animation: fadeInUp 0.8s ease-out;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                         <h3 style="font-size: 1.5rem; color: #1e293b; font-weight: 700;">My Check-in Tickets</h3>
                         <div style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 0.8rem;">${myApprovedRegs.length} Available</div>
                    </div>

                    ${myApprovedRegs.length === 0 ?
                    '<div class="card" style="text-align: center; color: #94a3b8; padding: 2rem;">No approved tickets to show. Register for events first!</div>' :
                    `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; justify-content: start;">
                              ${myApprovedRegs.map(reg => {
                        let evt = data.events.find(e => e.id === reg.eventId);
                        if (!evt) return '';
                        // Find sub event if applicable
                        let displayTitle = evt.title;
                        let venue = evt.venue;
                        let date = evt.date;

                        if (reg.subEventId) {
                            const sub = evt.subEvents ? evt.subEvents.find(s => s.id === reg.subEventId) : null;
                            if (sub) {
                                displayTitle = `${evt.title}: ${sub.name}`;
                                if (sub.venue) venue = sub.venue;
                                if (sub.startTime) date = evt.date; // Or handle time
                            }
                        }

                        return `
                                      <div class="card" onclick="window.viewRegistrationQR('${reg.id}', '${displayTitle.replace(/'/g, "\\'")}')" style="cursor: pointer; padding: 1.25rem; border-left: 4px solid #10b981; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                                           <div style="flex: 1; margin-right: 15px;">
                                               <h4 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${displayTitle}">${displayTitle}</h4>
                                               <div style="color: #64748b; font-size: 0.8rem; display: flex; gap: 10px;">
                                                   <span><i class="fas fa-university"></i> ${venue || 'Host Campus'}</span>
                                                   <span><i class="fas fa-calendar-alt"></i> ${new Date(date).toLocaleDateString()}</span>
                                               </div>
                                           </div>
                                           <div style="background: rgba(16, 185, 129, 0.1); width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981;">
                                               <i class="fas fa-qrcode" style="font-size: 1.2rem;"></i>
                                           </div>
                                      </div>
                                  `;
                    }).join('')}
                        </div>
                        `
                }
                </div>

                <style>
                    .lens-main-scan-btn {
                        width: 70px;
                        height: 70px;
                        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 1.75rem;
                        cursor: pointer;
                        box-shadow: 0 12px 24px rgba(99, 102, 241, 0.3);
                        border: 4px solid white;
                        margin-top: -35px;
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .lens-main-scan-btn:hover {
                        transform: scale(1.1) translateY(-5px);
                        box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4);
                    }
                    .lens-action-btn {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 6px;
                        background: none;
                        border: none;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                        position: relative;
                        padding: 10px;
                        border-radius: 12px;
                    }
                    .lens-action-btn:hover {
                        color: #6366f1;
                        background: #f1f5f9;
                    }
                    .lens-action-btn i { font-size: 1.25rem; }
                    .lens-action-btn span { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .scan-line-anim {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 2px;
                        background: linear-gradient(to right, transparent, #818cf8, transparent);
                        box-shadow: 0 0 15px #818cf8;
                        animation: scanLine 2s infinite linear;
                    }
                    @keyframes scanLine {
                        0% { top: 10%; }
                        50% { top: 90%; }
                        100% { top: 10%; }
                    }
                    .pulse-ring {
                        position: relative;
                    }
                    .pulse-ring::before {
                        content: '';
                        position: absolute;
                        inset: -10px;
                        border: 2px solid rgba(99, 102, 241, 0.4);
                        border-radius: 50%;
                        animation: ringPulse 2s infinite;
                    }
                    @keyframes ringPulse {
                        0% { transform: scale(0.95); opacity: 1; }
                        100% { transform: scale(1.4); opacity: 0; }
                    }
                    @keyframes scanSuccessBounce {
                        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    }
                </style>
            `;


        } else {
            content = `<div class="card"><h2>${subView.charAt(0).toUpperCase() + subView.slice(1)} Setup</h2><p>This module is under development.</p></div>`;
        }

        renderDashboardLayout(user, content, subView);
    }

    // --- ADMIN VIEWS ---
    async function renderAdminDashboard(subView = 'overview') {
        const user = Data.getCurrentUser();
        if (!user || (user.role !== 'admin' && user.role !== 'super')) { window.location.hash = '#login'; return; }
        const data = await Data.get();
        const myEventIds = data.events.filter(e => (e.adminId || e.admin_id) == user.id).map(e => e.id);
        const pendingRegs = data.registrations.filter(r => r.status === 'pending' && myEventIds.includes(r.eventId));
        const registrations = data.registrations.filter(r => myEventIds.includes(r.eventId));
        const notifications = await Data.getNotifications('student');
        let content = '';

        if (subView === 'overview') {
            const allEvents = data.events;
            const myEvents = allEvents.filter(e => (e.adminId || e.admin_id) == user.id);
            const today = new Date();
            const inactiveEvents = allEvents.filter(e => new Date(e.date) < today);
            const activeCount = allEvents.length - inactiveEvents.length;

            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">Campus Intelligence</h2>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.location.hash='#admin/events-feed'" class="btn" style="background: var(--primary); color: white;">
                            <i class="fas fa-search"></i> All College Events
                        </button>
                        <button onclick="window.location.hash='#admin/add-event'; setTimeout(() => { const cb = document.getElementById('is_story'); if(cb) cb.checked = true; }, 500);" class="btn" style="background: #8b5cf6; color: white;">
                            <i class="fas fa-magic"></i> Upload as Story
                        </button>
                    </div>
                </div>
                <div class="grid-layout" style="margin-bottom:2rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="card" style="border-left: 4px solid var(--primary);">
                        <div style="font-size:2rem; font-weight:700;">${allEvents.length}</div>
                        <div style="color:var(--text-muted);">Campus Total Events</div>
                    </div>
                    <div class="card" style="border-left: 4px solid #10b981;">
                        <div style="font-size:2rem; font-weight:700;">${activeCount}</div>
                        <div style="color:var(--text-muted);">Active Upcoming</div>
                    </div>
                    <div class="card" style="border-left: 4px solid #94a3b8;">
                        <div style="font-size:2rem; font-weight:700;">${myEvents.length}</div>
                        <div style="color:var(--text-muted);">My Uploaded Events</div>
                    </div>
                    <div class="card" style="border-left: 4px solid var(--warning);">
                        <div style="font-size:2rem; font-weight:700;">${pendingRegs.length}</div>
                        <div style="color:var(--text-muted);">Pending Review</div>
                    </div>
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Student Participation Analytics</h3>
                    <div style="display: flex; align-items: flex-end; gap: 1rem; height: 250px; padding-bottom: 2rem; border-bottom: 1px solid #e2e8f0; overflow-x: auto;">
                        ${myEvents.length === 0 ? '<p style="color: var(--text-muted); width: 100%; text-align: center; margin-top: auto;">No events data available for visualization.</p>' :
                    myEvents.map(evt => {
                        const eventRegs = data.registrations.filter(r => r.eventId === evt.id).length;
                        // Calculate percentage relative to capacity or max possible height (e.g. 200px)
                        // Let's assume max expected is capacity, but use a safe max for bar height scaling
                        const maxScale = Math.max(...myEvents.map(e => data.registrations.filter(r => r.eventId === e.id).length), 10); // Find max regs among all events to normalize
                        const heightPercentage = Math.min((eventRegs / maxScale) * 100, 100);

                        return `
                            <div style="display: flex; flex-direction: column; align-items: center; width: 60px; flex-shrink: 0;">
                                <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; color: var(--primary);">${eventRegs}</div>
                                <div style="width: 100%; height: 200px; display: flex; align-items: flex-end; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                                    <div style="width: 100%; height: ${heightPercentage}%; background: var(--primary); transition: height 0.5s ease;"></div>
                                </div>
                                <div style="margin-top: 10px; font-size: 0.75rem; color: var(--text-muted); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;" title="${evt.title}">
                                    ${evt.title.substring(0, 6)}...
                                </div>
                            </div>
                            `;
                    }).join('')}
                    </div>
                    <div style="margin-top: 1rem; text-align: center; font-size: 0.9rem; color: var(--text-muted);">
                        Total Registrations per Event
                    </div>
                </div>

                <div class="grid-layout" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Real-time Admin Notifications -->
                    <div class="card" style="padding: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h3 style="margin: 0; font-size: 1.1rem; color: #1e293b;"><i class="fas fa-bell" style="color: #f59e0b; margin-right: 8px;"></i> Activity Feed</h3>
                            <button onclick="window.clearAdminNotifs()" class="btn" style="padding: 4px 10px; font-size: 0.75rem; background: #f1f5f9; color: #64748b;">Clear Feed</button>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 5px;">
                            ${notifications.length === 0 ? '<div style="color: #94a3b8; font-style: italic; padding: 2rem; text-align: center;">No activity recorded yet.</div>' :
                    notifications.map(n => `
                                    <div style="padding: 1rem; background: ${n.read ? '#f8fafc' : '#f0f9ff'}; border-left: 4px solid ${n.type === 'success' ? '#10b981' : (n.type === 'danger' ? '#ef4444' : '#3b82f6')}; border-radius: 8px; font-size: 0.9rem; position: relative;">
                                        <div style="font-weight: 500; color: #1e293b; margin-bottom: 4px;">${n.text}</div>
                                        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 2px;">From: <strong>${n.from || 'System'}</strong></div>
                                        <div style="font-size: 0.75rem; color: #94a3b8; display: flex; justify-content: space-between;">
                                            <span>${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(n.timestamp).toLocaleDateString()}</span>
                                            ${!n.read ? '<span style="color: var(--primary); font-weight: 600;">NEW</span>' : ''}
                                        </div>
                                    </div>
                                `).join('')
                }
                        </div>
                    </div>

                    <!-- Pending Quick Actions -->
                    <div class="card" style="padding: 1.5rem;">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.1rem; color: #1e293b;"><i class="fas fa-clock" style="color: #ef4444; margin-right: 8px;"></i> Awaiting Review</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${pendingRegs.length === 0 ? '<div style="color: #94a3b8; font-style: italic; padding: 2rem; text-align: center;">All clear! No pending registrations.</div>' :
                    pendingRegs.slice(0, 5).map(reg => {
                        const student = data.users.find(u => u.id === reg.userId);
                        const evt = data.events.find(e => e.id === reg.eventId);
                        return `
                                        <div onclick="window.showAdminRegistrationDetails('${reg.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='#e2e8f0'">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 32px; height: 32px; background: #eef2ff; color: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">${student ? student.name.charAt(0) : '?'}</div>
                                                <div>
                                                    <div style="font-weight: 600; font-size: 0.85rem;">${student ? student.name : 'Unknown User'}</div>
                                                    <div style="font-size: 0.7rem; color: #64748b;">${evt ? evt.title : 'Deleted Event'}</div>
                                                </div>
                                            </div>
                                            <i class="fas fa-chevron-right" style="color: #cbd5e1; font-size: 0.8rem;"></i>
                                        </div>
                                    `;
                    }).join('')
                }
                            ${pendingRegs.length > 5 ? `<div style="text-align: center; margin-top: 10px;"><a href="#admin/registrations" style="color: var(--primary); font-size: 0.85rem; font-weight: 600;">View ${pendingRegs.length - 5} more...</a></div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Global Event Discoveries Section -->
                <div class="card" style="margin-top: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: #1e293b;">
                            <i class="fas fa-globe" style="color: #6366f1; margin-right: 8px;"></i> All Colleges Events Discoveries
                        </h3>
                        <a href="#admin/events-feed" style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">View All</a>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                        ${data.events.filter(e => e.status !== 'draft').slice(0, 4).map(evt => `
                            <div onclick="window.showEventDetails('${evt.id}', true)" style="border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.3s; background: #fff;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.boxShadow='none'">
                                <img src="${evt.image}" style="width: 100%; height: 120px; object-fit: cover;">
                                <div style="padding: 1rem;">
                                    <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${evt.title}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 8px;">
                                        <i class="fas fa-university" style="margin-right: 4px;"></i> ${evt.venue || 'Campus'}
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-size: 0.7rem; color: #94a3b8;">${new Date(evt.date).toLocaleDateString()}</span>
                                        <span class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); font-size: 0.65rem;">${evt.type}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (subView === 'add-event') {
            content = renderEventForm(user, data, subView);
        } else if (subView === 'my-events') {
            const myEvents = data.events.filter(e => (e.adminId || e.admin_id) == user.id);

            content = `
                <div class="flex justify-between items-center" style="margin-bottom:2rem;">
                    <div>
                        <h2 style="font-size: 1.5rem; color: #1e293b; margin: 0;">My Official Events</h2>
                        <p style="color: #64748b; margin-top: 4px;">Manage events created by you. Note: 2-hour edit/delete window applies.</p>
                    </div>
                    <a href="#admin/add-event" class="btn btn-primary"><i class="fas fa-plus"></i> Create New</a>
                </div>

                ${myEvents.length === 0 ? `
                    <div class="card" style="text-align: center; padding: 4rem 2rem;">
                        <i class="fas fa-calendar-plus" style="font-size: 3rem; color: #e2e8f0; margin-bottom: 1rem;"></i>
                        <h3 style="color: #1e293b;">No Events Created Yet</h3>
                        <p style="color: #64748b;">Start by creating your first official campus event.</p>
                        <a href="#admin/add-event" class="btn btn-primary" style="margin-top: 1.5rem;">Create Event Now</a>
                    </div>
                ` : `
                <div class="ott-grid">
                    ${[...myEvents].reverse().map(evt => {
                const created = new Date(evt.createdAt || evt.date);
                const now = new Date();
                const diffHrs = (now - created) / (1000 * 60 * 60);
                const isDraft = evt.status === 'draft';
                const canManage = isDraft || diffHrs < 2;

                return `
                        <div class="ott-card" onclick="window.showEventDetails('${evt.id}', true)" style="cursor: pointer; position: relative;">
                            <img src="${evt.image}" alt="${evt.title}" class="ott-card-image">
                            <span class="ott-category-badge">
                                ${isDraft ? 'DRAFT' : evt.type}
                            </span>
                            ${evt.is_story || evt.isStory ? `
                                <span style="position: absolute; top: 12px; left: 12px; background: #8b5cf6; color: white; padding: 4px 10px; border-radius: 50px; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; gap: 4px; z-index: 10;">
                                    <i class="fas fa-star" style="font-size: 0.6rem;"></i> STORY
                                </span>` : ''}
                            
                            <div class="ott-card-overlay">
                                <div class="ott-title">${evt.title}</div>
                                <div class="ott-meta">
                                    <span><i class="fas fa-calendar-alt"></i> ${new Date(evt.date).toLocaleDateString()}</span>
                                    <span><i class="fas fa-users"></i> ${evt.capacity}</span>
                                </div>
                                
                                <div style="margin-top: 1rem; display: flex; gap: 8px;">
                                    ${canManage ? `
                                        <button onclick="event.stopPropagation(); window.editEvent('${evt.id}')" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button onclick="event.stopPropagation(); window.deleteEvent('${evt.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    ` : `
                                        <div style="background: rgba(0,0,0,0.5); color: #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem;">
                                            <i class="fas fa-lock"></i> Locked (2h passed)
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
            }).join('')}
                </div>
                `}
            `;
        } else if (subView === 'events-feed') {
            const otherEvents = data.events.filter(e => (e.adminId || e.admin_id) != user.id);

            content = `
                <div class="flex justify-between items-center" style="margin-bottom:2rem;">
                    <div>
                        <h2 style="font-size: 1.5rem; color: #1e293b; margin: 0;">Global Events Feed</h2>
                        <p style="color: #64748b; margin-top: 4px;">Explore events organized by other campus administrators.</p>
                    </div>
                    <div style="color: #64748b;"><i class="fas fa-rss"></i> All Campus Updates</div>
                </div>

                <!-- External Events Section -->
                <div class="ott-grid">
                    ${[...otherEvents].reverse().map(evt => `
                        <div class="ott-card" onclick="window.showEventDetails('${evt.id}', true)" style="cursor: pointer;">
                             <img src="${evt.image}" alt="${evt.title}" class="ott-card-image">
                            <span class="ott-category-badge">${evt.type}</span>
                            <div class="ott-card-overlay">
                                <div class="ott-title">${evt.title}</div>
                                <div class="ott-meta">
                                    <span><i class="fas fa-calendar-alt"></i> ${new Date(evt.date).toLocaleDateString()}</span>
                                    <span><i class="fas fa-map-marker-alt"></i> ${evt.venue}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (subView === 'registrations') {
            content = `

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="margin: 0;">Manage Registrations</h2>
                    <div style="position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                        <input type="text" placeholder="Search student or event..." onkeyup="window.filterRegGird(this.value)" style="padding: 8px 12px 8px 35px; border-radius: 20px; border: 1px solid #e2e8f0; width: 250px; outline: none; font-size: 0.9rem;">
                    </div>
                </div>
                <div class="registration-grid" id="reg-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
                    ${registrations.length === 0 ? '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">No registrations found.</div>' :
                    registrations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(reg => {
                        const student = data.users.find(u => u.id === reg.userId);
                        const evt = data.events.find(e => e.id === reg.eventId);

                        if (!student || !evt) return '';

                        let eventName = evt.title;
                        if (reg.subEventId && evt.subEvents) {
                            const sub = evt.subEvents.find(s => s.id === reg.subEventId);
                            if (sub) eventName += ` - ${sub.name}`;
                        }

                        return `
                            <div class="reg-pill" onclick="window.showAdminRegistrationDetails('${reg.id}')" style="
                                background: white; 
                                padding: 0.85rem 1.5rem; 
                                border-radius: 16px; 
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); 
                                cursor: pointer; 
                                transition: 0.2s; 
                                display: flex; 
                                align-items: center; 
                                justify-content: space-between; 
                                border: 1px solid #e2e8f0;
                            " 
                            onmouseover="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.1)';"
                            onmouseout="this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.05)';"
                            >
                                <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                                    <div onclick="event.stopPropagation(); window.showChatUserProfile('${student.id}')" style="width: 42px; height: 42px; border-radius: 12px; background: #eef2ff; color: #6366f1; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; cursor: pointer;" title="View Student Profile">
                                        ${student.name.charAt(0)}
                                    </div>
                                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${student.name}</div>
                                        <div style="font-size: 0.75rem; color: #64748b;">${eventName}</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    ${reg.certificateUrl ? '<i class="fas fa-certificate" style="color: #f59e0b;" title="Certificate Issued"></i>' : ''}
                                    <button onclick="event.stopPropagation(); window.openCertificateUploadModal('${reg.id}')" style="background: #fdf2f8; border: none; width: 32px; height: 32px; border-radius: 8px; color: #ec4899; cursor: pointer;" title="Upload Certificate">
                                        <i class="fas fa-file-upload"></i>
                                    </button>
                                    <span class="badge badge-${reg.status}" style="font-size: 0.7rem; padding: 4px 8px;">${reg.status}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            // Define the modal function immediately within scope or attach to window
            window.showAdminRegistrationDetails = async (regId) => {
                const data = await Data.get();
                const reg = data.registrations.find(r => r.id == regId);
                if (!reg) return;
                const student = data.users.find(u => u.id == reg.userId);
                const evt = data.events.find(e => e.id == reg.eventId);

                if (!reg || !student || !evt) return;

                let subDetails = null;
                let eventName = evt.title;
                let isPaid = false;
                let amount = 0;

                if (reg.subEventId && evt.subEvents) {
                    subDetails = evt.subEvents.find(s => s.id === reg.subEventId);
                    if (subDetails) {
                        eventName += ` - ${subDetails.name}`;
                        isPaid = subDetails.isPaid;
                        amount = subDetails.amount;
                    }
                }

                const modalHtml = `
                    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem;">
                        <div class="modal-card" style="width: 100%; max-width: 480px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative; animation: slideUp 0.3s ease-out;">
                            
                            <!-- Close Button -->
                            <button onclick="window.closeModal()" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: 0.3s;">
                                <i class="fas fa-times"></i>
                            </button>

                            <!-- Header Section -->
                            <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 2rem 1.5rem 1.5rem; color: white; text-align: center;">
                                <div style="position: relative; width: 80px; height: 80px; margin: 0 auto 1rem;">
                                    <div style="width: 100%; height: 100%; background: white; color: #6366f1; border-radius: 24px; font-size: 2rem; display: flex; align-items: center; justify-content: center; font-weight: 800; transform: rotate(-5deg); box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
                                        ${student.name.charAt(0)}
                                    </div>
                                    <div style="position: absolute; bottom: -3px; right: -3px; width: 28px; height: 28px; background: #10b981; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">
                                        <i class="fas fa-check"></i>
                                    </div>
                                </div>
                                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">${student.name}</h2>
                                <div style="display: flex; justify-content: center; gap: 8px; margin-top: 8px;">
                                    <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">#${String(reg.id).substring(0, 6).toUpperCase()}</span>
                                    <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${student.department || 'Student'}</span>
                                </div>
                            </div>
                            
                            <!-- Body Section -->
                            <div style="padding: 1.5rem; background: #f8fafc;">
                                
                                <!-- Event Info Card -->
                                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                    <div style="width: 45px; height: 45px; background: #eef2ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #6366f1; font-size: 1.2rem; flex-shrink: 0;">
                                        <i class="fas fa-calendar-star"></i>
                                    </div>
                                    <div style="flex: 1; overflow: hidden;">
                                        <label style="display: block; color: #94a3b8; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 2px;">Enrolled Event</label>
                                        <h3 style="margin: 0; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${eventName}</h3>
                                        <p style="margin: 2px 0 0; color: #64748b; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                                            <i class="far fa-clock"></i> ${new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <!-- Grid Info -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                                    <div style="background: ${isPaid ? '#fff7ed' : '#ecfdf5'}; border: 1px solid ${isPaid ? '#fed7aa' : '#a7f3d0'}; padding: 1rem; border-radius: 16px;">
                                        <label style="display: block; color: ${isPaid ? '#9a3412' : '#065f46'}; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Status</label>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 800; font-size: 1rem; color: #111827;">${isPaid ? '₹' + amount : 'Free'}</span>
                                            ${isPaid && reg.paymentScreenshot ?
                        `<button onclick="const win = window.open(); win.document.write('<img src=\\'${reg.paymentScreenshot}\\' style=\\'max-width:100%;\\'>');" style="background: white; border: 1px solid #fdba74; color: ea580c; padding: 4px 8px; border-radius: 8px; cursor: pointer; font-size: 0.7rem; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                                    Proof
                                                </button>` : ''}
                                        </div>
                                    </div>
                                    <div style="background: white; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 16px;">
                                        <label style="display: block; color: #64748b; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Contact</label>
                                        <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            <i class="fas fa-phone-alt" style="color: #10b981; margin-right: 4px; font-size: 0.75rem;"></i> ${student.phone || 'No Phone'}
                                        </p>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                                    <button onclick="window.updateStatusAndClose('${reg.id}', 'approved')" style="padding: 0.8rem; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);">
                                        Approve
                                    </button>
                                    <button onclick="window.updateStatusAndClose('${reg.id}', 'rejected')" style="padding: 0.8rem; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15);">
                                        Reject
                                    </button>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                                    <button onclick="window.selectConversation('${student.id}'); window.location.hash='#admin/messages'; document.getElementById('modal-container').innerHTML='';" style="padding: 0.8rem; background: #eef2ff; color: #6366f1; border: 1px solid #c7d2fe; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
                                        <i class="fas fa-comment-dots"></i> Message
                                    </button>
                                    <button onclick="window.openCertificateUploadModal('${reg.id}')" style="padding: 0.8rem; background: #fdf2f8; color: #ec4899; border: 1px solid #fbcfe8; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
                                        <i class="fas fa-file-upload"></i> Certificate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style>
                        @keyframes slideUp {
                            from { opacity: 0; transform: translateY(30px) scale(0.97); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    </style>
                `;
                createModal(modalHtml);
            };

            window.updateStatusAndClose = (regId, status) => {
                window.handleApproval(regId, status);

                document.getElementById('modal-container').innerHTML = '';
            };
        } else if (subView === 'settings') {
            content = `
                <h2 style="margin-bottom:1.5rem;">Admin Settings</h2>
                <div class="grid-layout" style="grid-template-columns: 1fr; max-width: 800px; gap: 2rem;">
                    
                    <!-- Profile Update -->
                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-user-shield" style="color: var(--primary);"></i> Admin Information
                        </h3>
                        <form onsubmit="window.handleUpdateProfile(event)">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="input-group">
                                    <label class="input-label">Admin Display Name</label>
                                    <input type="text" name="userName" class="smart-input" value="${user.name}" required>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Phone Number</label>
                                    <input type="tel" name="userPhone" class="smart-input" value="${user.phone || ''}" placeholder="+1-555-0101">
                                </div>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Email Address (Read-only)</label>
                                <input type="email" class="smart-input" value="${user.email}" readonly style="background: #f1f5f9; color: #64748b;">
                            </div>
                            <button type="submit" class="btn btn-primary">Update Admin Profile</button>
                        </form>
                    </div>

                    <!-- Theme Preferences -->
                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-palette" style="color: #8b5cf6;"></i> Theme Preferences
                        </h3>
                        <form onsubmit="window.handleUpdateTheme(event)">
                            <div class="input-group">
                                <label class="input-label">Display Theme</label>
                                <select name="userTheme" class="smart-input" onchange="window.applyTheme(this.value)">
                                    <option value="light" ${user.theme === 'light' || !user.theme ? 'selected' : ''}>Light Mode</option>
                                    <option value="dark" ${user.theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
                                </select>
                                <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Choose your preferred color scheme. Changes apply immediately.</p>
                            </div>
                            <button type="submit" class="btn btn-primary">Save Theme Preference</button>
                        </form>
                    </div>

                    <!-- Password Update -->
                    <div class="card">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-lock" style="color: #f59e0b;"></i> Security & Password
                        </h3>
                        <form onsubmit="window.handleChangePassword(event)">
                            <div class="input-group">
                                <label class="input-label">Current Password</label>
                                <input type="password" name="currentPassword" class="smart-input" required>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="input-group">
                                    <label class="input-label">New Password</label>
                                    <input type="password" name="newPassword" class="smart-input" minlength="4" required>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Confirm New Password</label>
                                    <input type="password" name="confirmPassword" class="smart-input" minlength="4" required>
                                </div>
                            </div>
                            <button type="submit" class="btn" style="background: #f59e0b; color: white;">Change Password</button>
                        </form>
                    </div>

                </div>
            `;
        } else if (subView === 'profile') {
            content = renderStoryProfile(user, data);
        } else if (subView === 'messages') {
            // Ensure renderChatView exists
            let chatHtml = '<div class="card">Chat module loading...</div>';
            try {
                if (typeof renderChatView === 'function') {
                    chatHtml = await renderChatView(user, window.activeConversationId);
                }
            } catch (e) {
                console.error("Chat Error:", e);
                chatHtml = `<div class="card">Error loading chat. Is the backend running? <br><small>${e.message}</small></div>`;
            }

            content = `
                <h2 style="margin-bottom:1.5rem;">Campus Chat Inbox</h2>
                ${chatHtml}
            `;
        } else if (subView === 'scan-qr') {
            const allEvents = data.events.filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)));

            content = `
                <div style="max-width: 800px; margin: 0 auto; animation: customFadeIn 0.5s;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                         <div style="width: 60px; height: 60px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: var(--primary);">
                            <i class="fas fa-qrcode" style="font-size: 1.8rem;"></i>
                        </div>
                        <h2 style="font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; font-weight: 800;">Attendance Scanner</h2>
                        <p style="color: #64748b;">Select an event and scan student QR codes to verify attendance.</p>
                    </div>

                    <!-- Event Selector -->
                    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid var(--primary); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
                        <label style="display: block; font-weight: 700; color: #475569; margin-bottom: 0.8rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Active Event Session</label>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="position: relative; flex: 1;">
                                <i class="fas fa-calendar-alt" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                                <select id="scan-event-select" class="smart-input" onchange="window.handleScanEventChange(this.value)" style="width: 100%; padding-left: 40px; font-weight: 600; cursor: pointer;">
                                    <option value="">-- Select Event to Start Scanning --</option>
                                    ${allEvents.map(e => `<option value="${e.id}" ${window.selectedQrEventId == e.id ? 'selected' : ''}>${e.title} (${new Date(e.date).toLocaleDateString()})</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Scanner Area -->
                    <div id="scanner-container-wrapper" style="display: ${window.selectedQrEventId ? 'block' : 'none'}; animation: slideUp 0.5s;">
                        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem;">
                            <!-- Camera View -->
                            <div class="card" style="padding: 0; overflow: hidden; position: relative; background: #0f172a; border-radius: 20px; box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.3);">
                                <div style="padding: 1rem; background: rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                    <span style="color: white; font-weight: 600; font-size: 0.9rem;"><i class="fas fa-circle" style="color: #10b981; font-size: 0.6rem; margin-right: 6px;"></i> Scan Student ID</span>
                                    <button onclick="window.stopQRScanner(); window.selectedQrEventId = null; handleRoute();" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">Stop</button>
                                </div>
                                <div id="qr-reader" style="width: 100%; min-height: 350px; background: black;"></div>
                            </div>

                            <!-- Student View (Self-Scan QR) -->
                            <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: white; border: 2px solid #e2e8f0;">
                                <div style="color: #1e293b; font-weight: 800; margin-bottom: 1rem; font-size: 1.1rem;">Event Check-in QR</div>
                                <div id="event-attendance-qr" style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 1.25rem;">
                                    ${(() => {
                    const selEvt = allEvents.find(e => e.id == window.selectedQrEventId);
                    const qrData = JSON.stringify({ type: 'event_attendance', eventId: window.selectedQrEventId, code: selEvt?.attendanceCode || 'ATTEND' });
                    return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}" style="width: 180px; height: 180px; display: block;">`;
                })()}
                                </div>
                                <p style="color: #64748b; font-size: 0.85rem; line-height: 1.5;">Students scan this with their <strong>Attendance Scanner</strong> to mark themselves present.</p>
                                <div style="margin-top: 1rem; padding: 8px 16px; background: #f0fdf4; color: #16a34a; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                                    <i class="fas fa-shield-alt"></i> Secure Session Active
                                </div>
                            </div>
                        </div>
                        
                        <!-- Manual Search & List -->
                        <div class="card" style="margin-top: 2rem; padding: 0; overflow: hidden;">
                            <div style="padding: 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                                <h4 style="margin:0; color: #1e293b; font-weight: 800;">Registration & Attendance List</h4>
                                <div style="display: flex; gap: 10px;">
                                    <input type="text" id="manual-scan-input" onkeyup="window.filterManualList(this.value)" placeholder="Search Name or Reg ID..." class="smart-input" style="padding: 6px 12px; width: 220px; font-size: 0.85rem;">
                                    <button onclick="window.handleManualScan()" class="btn btn-primary" style="padding: 0 1rem; border-radius: 8px; font-size: 0.85rem;">Mark Check-In</button>
                                </div>
                            </div>
                            <div style="max-height: 300px; overflow-y: auto;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead style="background: #f8fafc; position: sticky; top: 0; z-index: 5;">
                                        <tr>
                                            <th style="padding: 10px 1.25rem; text-align: left; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Student</th>
                                            <th style="padding: 10px 1.25rem; text-align: left; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Reg ID</th>
                                            <th style="padding: 10px 1.25rem; text-align: center; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Status</th>
                                            <th style="padding: 10px 1.25rem; text-align: right; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="manual-attendance-record-body">
                                        ${(() => {
                    const eventRegs = data.registrations.filter(r => r.eventId == window.selectedQrEventId);
                    if (eventRegs.length === 0) return '<tr><td colspan="4" style="padding: 2rem; text-align: center; color: #94a3b8;">No registrations found for this event.</td></tr>';
                    return eventRegs.map(reg => {
                        const student = data.users.find(u => u.id == reg.userId) || { name: 'Unknown Student' };
                        const isPresent = reg.attendance === 'Present';
                        return `
                                                <tr style="border-bottom: 1px solid #f8fafc;">
                                                    <td style="padding: 12px 1.25rem; font-weight: 600; color: #1e293b;">${student.name}</td>
                                                    <td style="padding: 12px 1.25rem; color: #64748b; font-family: monospace;">#REG-${reg.id}</td>
                                                    <td style="padding: 12px 1.25rem; text-align: center;">
                                                        <span class="badge" style="background: ${isPresent ? '#dcfce7' : '#f1f5f9'}; color: ${isPresent ? '#16a34a' : '#94a3b8'}; font-size: 0.7rem;">
                                                            ${isPresent ? 'Present' : 'Absent'}
                                                        </span>
                                                    </td>
                                                    <td style="padding: 12px 1.25rem; text-align: right;">
                                                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                                            <button onclick="window.toggleManualAttendance('${reg.id}', '${isPresent ? 'Absent' : 'Present'}')" 
                                                                    style="background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; cursor: pointer; color: ${isPresent ? '#ef4444' : '#10b981'}; font-size: 0.75rem; font-weight: 700;">
                                                                ${isPresent ? 'Mark Absent' : 'Mark Present'}
                                                            </button>
                                                            <button onclick="window.openCertificateUploadModal('${reg.id}')" 
                                                                    style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 6px; padding: 4px 8px; cursor: pointer; color: #ec4899; font-size: 0.75rem;" title="Upload Certificate">
                                                                <i class="fas fa-file-upload"></i> Cert
                                                            </button>
                                                            ${reg.certificateUrl ? `
                                                                <a href="${reg.certificateUrl}" target="_blank" style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 4px 8px; cursor: pointer; color: #3b82f6; font-size: 0.75rem; text-decoration: none;" title="View Certificate">
                                                                    <i class="fas fa-external-link-alt"></i> View
                                                                </a>
                                                            ` : ''}
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                    }).join('');
                })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div id="scanner-placeholder" style="display: ${window.selectedQrEventId ? 'none' : 'block'}; text-align: center; padding: 4rem 2rem; background: #f8fafc; border-radius: 20px; border: 2px dashed #cbd5e1; margin-top: 2rem;">
                        <div style="width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                            <i class="fas fa-camera" style="font-size: 2rem; color: #cbd5e1;"></i>
                        </div>
                        <h3 style="color: #475569; font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: 700;">Waiting for Selection</h3>
                        <p style="color: #94a3b8; max-width: 300px; margin: 0 auto;">Please select an upcoming event from the dropdown above to activate the specific attendance register.</p>
                    </div>
                </div>
                <style>
                    @keyframes customFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                </style>
            `;

        } else {
            content = `<div class="card"><h2>${subView.charAt(0).toUpperCase() + subView.slice(1)}</h2><p>Select an option from the sidebar.</p></div>`;
        }

        renderDashboardLayout(user, content, subView);

        if (subView === 'scan-qr' && window.selectedQrEventId) {
            setTimeout(() => window.initQRScanner(), 500);
        }
    }

    async function renderSuperDashboard(subView = 'overview') {
        const user = Data.getCurrentUser();
        if (!user || user.role !== 'super') { window.location.hash = '#login'; return; }

        let content = '';

        if (subView === 'overview') {
            const stats = await Data.getSystemStats();

            content = `
                <div style="margin-bottom: 2rem;">
                    <h2 style="margin:0; font-size: 2rem; color: #1e293b;">System Overview</h2>
                    <p style="margin:5px 0 0 0; color: #64748b;">Global platform analytics and recent activity</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
                    <div class="card" style="padding: 1.5rem; border-left: 4px solid #6366f1;">
                        <div style="color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Active Admins</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b;">${stats.total_active_admins} <span style="font-size: 1rem; color: #94a3b8; font-weight: 400;">/ ${stats.total_admins}</span></div>
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #94a3b8;">
                            Total system administrators
                        </div>
                    </div>
                    <div class="card" style="padding: 1.5rem; border-left: 4px solid #10b981;">
                        <div style="color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Student Base</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b;">${stats.total_students}</div>
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #94a3b8;">Across all institutions</div>
                    </div>
                    <div class="card" style="padding: 1.5rem; border-left: 4px solid #f59e0b;">
                        <div style="color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Platform Growth</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b;">${stats.total_registrations}</div>
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #94a3b8;">Total event registrations</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                    <!-- Recent Activity -->
                    <div class="card" style="padding: 0;">
                        <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin:0; font-size: 1.1rem; color: #1e293b;">Recent System Activity</h3>
                            <i class="fas fa-history" style="color: #94a3b8;"></i>
                        </div>
                        <div style="padding: 1rem;">
                            ${stats.recent_activity.length === 0 ? `
                                <div style="text-align: center; padding: 3rem; color: #94a3b8;">No recent activity found</div>
                            ` : stats.recent_activity.map(n => `
                                <div style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #f8fafc; align-items: flex-start;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${n.type === 'error' ? '#fee2e2' : '#eff6ff'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas ${n.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}" style="color: ${n.type === 'error' ? '#ef4444' : '#3b82f6'}; font-size: 0.9rem;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.9rem; color: #1e293b; font-weight: 500;">${n.text}</div>
                                        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                                            By ${n.sender_name} • ${new Date(n.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div>
                        <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white;">
                            <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem;">Super Actions</h3>
                            <button onclick="window.showAnnouncementModal()" class="btn" style="width: 100%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; margin-bottom: 0.75rem;">
                                <i class="fas fa-bullhorn"></i> Send Global Announcement
                            </button>
                            <button onclick="window.showAddUserModal()" class="btn" style="width: 100%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; margin-bottom: 0.75rem;">
                                <i class="fas fa-user-plus"></i> Add New User
                            </button>
                            <button onclick="showToast('Backup feature coming soon', 'info')" class="btn" style="width: 100%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
                                <i class="fas fa-database"></i> Database Backup
                            </button>
                        </div>
                        
                        <div class="card" style="padding: 1.25rem;">
                            <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #64748b; text-transform: uppercase;">System Health</h4>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.85rem; color: #1e293b;">API Status</span>
                                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.85rem; color: #1e293b;">Database</span>
                                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.85rem; color: #1e293b;">Storage</span>
                                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (subView === 'users') {
            const users = await Data.getUsers();
            const adminCount = users.filter(u => u.role === 'admin').length;
            const studentCount = users.filter(u => u.role === 'student').length;

            content = `
                <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h2 style="margin:0; font-size: 2rem; color: #1e293b;">User Management</h2>
                        <p style="margin:5px 0 0 0; color: #64748b;">Manage system administrators and students</p>
                    </div>
                    <button onclick="window.showAddUserModal()" class="btn btn-primary" style="padding: 0.8rem 2rem; border-radius: 50px;">
                        <i class="fas fa-user-plus"></i> Add New User
                    </button>
                </div>

                <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">User Details</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Role</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Institution</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Status</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr style="border-bottom: 1px solid #f8fafc; transition: background 0.2s;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='white'">
                                    <td style="padding: 1.25rem 1.5rem;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <img src="${u.profile_pic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name)}" style="width: 40px; height: 40px; border-radius: 12px; object-fit: cover;">
                                            <div>
                                                <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${u.name}</div>
                                                <div style="font-size: 0.8rem; color: #94a3b8;">${u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem;">
                                        <span class="badge ${u.role === 'admin' ? 'badge-primary' : (u.role === 'super' ? 'badge-danger' : 'badge-pending')}" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 6px;">
                                            ${u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; color: #64748b; font-size: 0.9rem;">
                                        ${u.college || 'Smart Campus System'}
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem;">
                                        <span style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: ${u.is_active ? '#10b981' : '#ef4444'}; font-weight: 600;">
                                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${u.is_active ? '#10b981' : '#ef4444'};"></span>
                                            ${u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; text-align: right;">
                                        ${u.role !== 'super' ? `
                                            <button onclick="window.handleDeleteUser('${u.id}', '${u.name}')" style="background: #fff1f1; border: 1px solid #fee2e2; color: #ef4444; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Delete User" onmouseover="this.style.background='#ef4444'; this.style.color='white'">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        ` : '<span style="color: #cbd5e1; font-size: 0.8rem; font-style: italic;">System Root</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (subView === 'events') {
            const data = await Data.get();
            const events = data.events;

            content = `
                <div style="margin-bottom: 2rem;">
                    <h2 style="margin:0; font-size: 2rem; color: #1e293b;">Event Oversight</h2>
                    <p style="margin:5px 0 0 0; color: #64748b;">Monitor and manage all campus events globally</p>
                </div>

                <div class="card" style="padding: 0; overflow: hidden; border-radius: 16px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Event Title</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Campus/Admin</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Date</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem;">Status</th>
                                <th style="padding: 1.25rem 1.5rem; color: #64748b; font-weight: 600; font-size: 0.85rem; text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${events.map(e => {
                const admin = data.users.find(u => u.id == (e.adminId || e.admin_id)) || { name: 'Unknown', college: 'Unknown' };
                return `
                                <tr style="border-bottom: 1px solid #f8fafc; transition: background 0.2s;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='white'">
                                    <td style="padding: 1.25rem 1.5rem;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <img src="${e.image || 'https://via.placeholder.com/40'}" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover;">
                                            <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${e.title}</div>
                                        </div>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem;">
                                        <div style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">${admin.college || 'Universal'}</div>
                                        <div style="font-size: 0.8rem; color: #94a3b8;">by ${admin.name}</div>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; color: #1e293b; font-size: 0.9rem;">
                                        ${new Date(e.date).toLocaleDateString()}
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem;">
                                        <span class="badge ${e.status === 'published' ? 'badge-primary' : 'badge-pending'}" style="font-size: 0.7rem;">
                                            ${e.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; text-align: right;">
                                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                            <button onclick="window.showEventDetails('${e.id}')" style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;" title="View Details">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="window.deleteEvent('${e.id}')" style="background: #fff1f1; border: 1px solid #fee2e2; color: #ef4444; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;" title="Delete Event">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (subView === 'settings') {
            content = `
                <div style="margin-bottom: 2rem;">
                    <h2 style="margin:0; font-size: 2rem; color: #1e293b;" class="theme-text">System Settings</h2>
                    <p style="margin:5px 0 0 0; color: #64748b;">Configure your super admin profile and platform preferences</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
                    <!-- Profile Settings -->
                    <div class="card">
                        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-user-shield" style="color: var(--primary);"></i> General Profile
                        </h3>
                        <form id="super-settings-form" onsubmit="window.handleSuperUpdateSettings(event)">
                            <div class="input-group">
                                <label class="input-label">Full Name</label>
                                <input type="text" id="settings-name" class="smart-input" value="${user.name}" required>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Email Address (Login ID)</label>
                                <input type="email" id="settings-email" class="smart-input" value="${user.email}" required>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <!-- Theme Preferences -->
                    <div class="card">
                        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-palette" style="color: #8b5cf6;"></i> Theme Preferences
                        </h3>
                        <form id="super-theme-form" onsubmit="window.handleSuperUpdateTheme(event)">
                            <div class="input-group">
                                <label class="input-label">Display Theme</label>
                                <select id="settings-theme" class="smart-input" onchange="window.applyTheme(this.value)">
                                    <option value="light" ${user.theme === 'light' ? 'selected' : ''}>Light Mode</option>
                                    <option value="dark" ${user.theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
                                </select>
                                <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Choose your preferred color scheme. Changes apply immediately.</p>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                                Save Theme Preference
                            </button>
                        </form>
                    </div>

                    <!-- Security Settings -->
                    <div class="card">
                        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-lock" style="color: #f59e0b;"></i> Security & Password
                        </h3>
                        <form id="super-password-form" onsubmit="window.handleSuperChangePassword(event)">
                            <div class="input-group">
                                <label class="input-label">Current Password</label>
                                <input type="password" id="settings-curr-pass" class="smart-input" placeholder="••••••••" required>
                            </div>
                            <div class="input-group">
                                <label class="input-label">New Password</label>
                                <input type="password" id="settings-new-pass" class="smart-input" placeholder="••••••••" required>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Confirm New Password</label>
                                <input type="password" id="settings-conf-pass" class="smart-input" placeholder="••••••••" required>
                            </div>
                            <button type="submit" class="btn btn-secondary" style="width: 100%; justify-content: center; margin-top: 1rem; border-color: #fee2e2; color: #ef4444;">
                                Update Password
                            </button>
                        </form>
                    </div>

                </div>
            `;
        }

        renderDashboardLayout(user, content, subView);
    }

    // --- SUPER ADMIN HANDLERS ---
    window.showAddUserModal = () => {
        const modalHtml = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem; background: white; border-radius: 20px;">
                <h3 style="margin-bottom: 1.5rem;">Add New User</h3>
                <form id="add-user-form" onsubmit="window.handleAddUser(event)">
                    <div class="input-group">
                        <label class="input-label">Full Name</label>
                        <input type="text" name="name" class="smart-input" required placeholder="Enter full name">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Email Address</label>
                        <input type="email" name="email" class="smart-input" required placeholder="email@campus.edu">
                    </div>
                    <div class="input-group">
                        <label class="input-label">College / Institution Name</label>
                        <input type="text" name="college" class="smart-input" required placeholder="e.g. Stanford University">
                    </div>
                    <div class="grid-layout" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="input-group">
                            <label class="input-label">Role</label>
                            <select name="role" class="smart-input" required>
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="input-label">Password</label>
                            <input type="password" name="password" class="smart-input" required placeholder="Minimum 4 chars">
                        </div>
                    </div>
                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button type="button" onclick="window.closeModal()" class="btn" style="flex: 1; border: 1px solid #e2e8f0;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="flex: 2;">Create User</button>
                    </div>
                </form>
            </div>
        `;
        createModal(modalHtml);
    };

    window.handleAddUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());

        try {
            await Data.addUser(userData);
            showToast('User created successfully!');
            window.closeModal();
            await handleRoute();
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
        }
    };

    window.showAnnouncementModal = () => {
        const modalHtml = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem; background: white; border-radius: 20px;">
                <h3 style="margin-bottom: 1.5rem;">Global Announcement</h3>
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">This message will be sent as a notification to all users across the platform.</p>
                <form id="announcement-form" onsubmit="window.handleSendAnnouncement(event)">
                    <div class="input-group">
                        <label class="input-label">Announcement Content</label>
                        <textarea name="text" class="smart-input" required placeholder="Type your message here..." style="min-height: 120px;"></textarea>
                    </div>
                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button type="button" onclick="window.closeModal()" class="btn" style="flex: 1; border: 1px solid #e2e8f0;">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="flex: 2;">
                            <i class="fas fa-paper-plane"></i> Send to All
                        </button>
                    </div>
                </form>
            </div>
        `;
        createModal(modalHtml);
    };

    window.handleSendAnnouncement = async (e) => {
        e.preventDefault();
        const text = new FormData(e.target).get('text');

        try {
            await Data.sendSystemAnnouncement(text);
            showToast('Announcement sent successfully!');
            window.closeModal();
            await handleRoute();
        } catch (err) {
            showToast('Failed to send announcement: ' + err.message, 'error');
        }
    };

    window.handleDeleteUser = async (userId, name) => {
        if (confirm(`Are you sure you want to delete user: ${name}?`)) {
            await Data.deleteUser(userId);
            showToast('User deleted successfully.');
            await handleRoute();
        }
    };

    window.handleSuperUpdateSettings = async (e) => {
        e.preventDefault();
        const user = Data.getCurrentUser();
        const updateData = {
            name: document.getElementById('settings-name').value,
            email: document.getElementById('settings-email').value,
            theme: document.getElementById('settings-theme').value
        };

        try {
            const result = await Data.updateUser(user.id, updateData);
            if (result.success) {
                // The updateUser function already updates localStorage with 'smart_campus_user'
                // Just apply the theme and refresh
                window.applyTheme(result.user.theme);
                showToast('Settings updated successfully!');
                await handleRoute();
            } else {
                showToast('Update failed: ' + result.message, 'error');
            }
        } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
        }
    };

    window.handleSuperChangePassword = async (e) => {
        e.preventDefault();
        const user = Data.getCurrentUser();
        const currentPassword = document.getElementById('settings-curr-pass').value;
        const newPassword = document.getElementById('settings-new-pass').value;
        const confPassword = document.getElementById('settings-conf-pass').value;

        if (newPassword !== confPassword) {
            return showToast('Passwords do not match.', 'error');
        }

        try {
            await Data.updatePassword(user.id, currentPassword, newPassword);
            showToast('Password updated successfully!');
            e.target.reset();
        } catch (err) {
            showToast('Failed to update password: ' + err.message, 'error');
        }
    };

    function renderEventForm(user, data, subView) {
        const isEditing = !!window.editingEventId;
        let event = isEditing ? data.events.find(e => e.id === window.editingEventId) : null;

        // Restore form data if available (fixes data loss on sub-event add/remove)
        // Restore form data if available (fixes data loss on sub-event add/remove)
        if (window.tempEventData) {
            console.log("Restoring Form Data...", window.tempEventData);
            // Merge temp data, BUT ensure we don't overwrite if temp data is somehow empty/corrupt
            // Also ensure we handle array-like inputs if any (FormData handles simple fields)
            event = { ...(event || {}), ...window.tempEventData };
        }

        // Initialize subEvents from the event if editing
        if (!window.currentSubEvents) {
            const subs = (event && (event.sub_events || event.subEvents)) || [];
            window.currentSubEvents = subs.map(s => ({
                id: s.id || 'sub' + Date.now() + Math.random().toString(36).substr(2, 4),
                name: s.name,
                startTime: s.start_time || s.startTime || '10:00',
                endTime: s.end_time || s.endTime || '11:00',
                venue: s.venue,
                capacity: s.capacity,
                department: s.department,
                isPaid: s.is_paid !== undefined ? s.is_paid : (s.isPaid || false),
                amount: s.amount,
                feeType: s.fee_type || s.feeType || 'per_person',
                teamSize: s.team_size || s.teamSize || 1
            }));
        }

        const cancelAction = `window.tempEventData = null; window.currentSubEvents = null; window.location.hash = '${user.role === 'admin' ? '#admin' : '#student'}/overview'`;

        return `
            <div class="flex justify-between items-center" style="margin-bottom:2rem;">
                <h2 style="font-size: 2rem; color: var(--text-main); font-weight: 800;">${isEditing ? 'Edit Event' : 'Create New Event'}</h2>
                <button onclick="${cancelAction}" class="btn" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>

                        <form id="event-form" onsubmit="window.handleEventSubmit(event)" class="card" style="max-width: 900px;">
                            <h3 style="margin-bottom: 2rem; color: var(--primary);">Event Details</h3>

                            <!-- Event Poster Upload -->
                            <div class="input-group">
                                <label class="input-label">Event Poster / Cover Image</label>
                                <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
                                    <div style="flex: 1;">
                                        <input type="file" id="poster-upload" accept="image/*" class="smart-input" style="padding: 0.5rem;" onchange="window.handlePosterUpload(event)">
                                            <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Upload an image file (JPG, PNG, etc.) for your event poster</p>
                                    </div>
                                    <div id="poster-preview" style="width: 200px; height: 120px; border: 2px dashed #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
                                        ${event && event.image ? `<img src="${event.image}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 1rem;">Preview</span>'}
                                    </div>
                                </div>
                                <input type="hidden" id="poster-data" name="image" value="${event ? event.image : 'https://images.unsplash.com/photo-1540575467063-178a50935339?auto=format&fit=crop&w=1000&q=80'}">
                            </div>

                            <div class="input-group">
                                <label class="input-label">Event Title</label>
                                <input type="text" name="title" class="smart-input" value="${event ? event.title : ''}" required placeholder="Enter event title">
                            </div>

                            <div class="input-group" style="display: flex; flex-direction: row; align-items: center; gap: 10px; background: rgba(139, 92, 246, 0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.1); margin-bottom: 1.5rem;">
                                <input type="checkbox" name="is_story" id="is_story" ${event && (event.is_story || event.isStory) ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                                <label for="is_story" style="margin: 0; cursor: pointer; font-weight: 600; color: #6d28d9; font-size: 0.9rem;">
                                    <i class="fas fa-star" style="margin-right: 5px;"></i> Post as Story (Feature this event as a highlight)
                                </label>
                            </div>

                            <div class="input-group">
                                <label class="input-label">Description</label>
                                <textarea name="description" class="smart-input" style="height: 120px; resize: vertical;" required placeholder="Describe your event">${event ? event.description : ''}</textarea>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
                                <div class="input-group">
                                    <label class="input-label">Event Type</label>
                                    <select name="type" class="smart-input">
                                        <option value="Academic" ${event && event.type === 'Academic' ? 'selected' : ''}>Academic</option>
                                        <option value="Cultural" ${event && event.type === 'Cultural' ? 'selected' : ''}>Cultural</option>
                                        <option value="Competition" ${event && event.type === 'Competition' ? 'selected' : ''}>Competition</option>
                                        <option value="Workshop" ${event && event.type === 'Workshop' ? 'selected' : ''}>Workshop</option>
                                        <option value="Sports" ${event && event.type === 'Sports' ? 'selected' : ''}>Sports</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                <div class="input-group">
                                    <label class="input-label">Event Date</label>
                                    <input type="date" name="date" class="smart-input" value="${event ? event.date : ''}" required>
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Start Time</label>
                                    <input type="time" name="time" class="smart-input" value="${event ? event.time : '10:00'}" required>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                <div class="input-group">
                                    <label class="input-label">College Name</label>
                                    <input type="text" name="venue" class="smart-input" value="${event ? event.venue : ''}" required placeholder="Name of the college hosting this event">
                                </div>
                                <div class="input-group">
                                    <label class="input-label">Total Event Capacity</label>
                                    <input type="number" id="main-capacity" name="capacity" class="smart-input" value="${event ? event.capacity : '100'}" required min="1" oninput="window.checkCapacity()">
                                        <div id="capacity-warning" style="display:none; color:#ef4444; font-size:0.85rem; margin-top:0.5rem; font-weight:600;">
                                            <i class="fas fa-exclamation-circle"></i> Sub-events total capacity exceeds main capacity!
                                        </div>
                                </div>
                            </div>

                            <div class="input-group" style="margin-top: 1.5rem;">
                                <label class="input-label">Event Rules (PDF)</label>
                                <div style="display: flex; gap: 1rem; align-items: center;">
                                    <input type="file" id="rules-pdf-input" class="smart-input" accept="application/pdf" onchange="window.handleRulesUpload(event)">
                                        <input type="hidden" name="rulesPdfUrl" id="rules-pdf-url" value="${event ? (event.rules_pdf_url || event.rulesPdfUrl || '') : ''}">
                                            ${event && (event.rules_pdf_url || event.rulesPdfUrl) ? `<a href="${event.rules_pdf_url || event.rulesPdfUrl}" target="_blank" style="color: var(--primary); text-decoration: underline; font-size: 0.9rem;"><i class="fas fa-file-pdf"></i> View Current Rules</a>` : ''}
                                            <span id="rules-upload-status" style="font-size: 0.85rem; color: #10b981; display: none;"><i class="fas fa-check-circle"></i> Uploaded</span>
                                        </div>
                                        <p style="color: #64748b; font-size: 0.8rem; margin-top: 5px;">Upload a PDF document containing detailed rules and regulations for the event.</p>
                                </div>

                                <!-- Payment QR Upload -->
                                <div class="input-group" style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; paddingTop: 1.5rem;">
                                    <label class="input-label">Payment QR Code (For Paid Events)</label>
                                    <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
                                        <div style="flex: 1;">
                                            <input type="file" id="payment-qr-upload" accept="image/*" class="smart-input" style="padding: 0.5rem;" onchange="window.handlePaymentQRUpload(event)">
                                                <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Upload the UPI QR Code image that students should scan for payment.</p>
                                                <input type="hidden" id="payment-qr-data" name="paymentQrUrl" value="${event ? (event.payment_qr_url || event.paymentQrUrl || '') : ''}">
                                                </div>
                                                <div id="payment-qr-preview" style="width: 150px; height: 150px; border: 2px dashed #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
                                                    ${event && (event.payment_qr_url || event.paymentQrUrl) ? `<img src="${event.payment_qr_url || event.paymentQrUrl}" style="width: 100%; height: 100%; object-fit: contain;">` : '<span style="color: #94a3b8; font-size: 0.8rem; text-align: center; padding: 1rem;">No Payment QR</span>'}
                                                </div>
                                        </div>
                                    </div>

                                    <div style="margin-top: 3rem; background: rgba(99,102,241,0.05); padding: 2rem; border-radius: 12px; border: 1px solid rgba(99,102,241,0.1);">
                                        <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
                                            <div>
                                                <h3 style="margin: 0; color: var(--primary);"><i class="fas fa-layer-group"></i> Sub-Events / Sessions</h3>
                                                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 0.9rem;">Add multiple sessions or tracks for this event</p>
                                            </div>
                                            <button type="button" onclick="window.addSubEventField()" class="btn btn-primary" style="padding: 0.6rem 1.2rem;">
                                                <i class="fas fa-plus"></i> Add Session
                                            </button>
                                        </div>

                                        <div id="sub-events-container" style="display: flex; flex-direction: column; gap: 1rem;">
                                            ${window.renderSubEventsHtml(window.currentSubEvents || [])}
                                        </div>
                                    </div>

                                    <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                        <button type="button" onclick="window.location.hash='${user.role === 'admin' ? '#admin' : '#student'}/overview'" class="btn">Cancel</button>
                                        <button type="button" onclick="window.handleSaveDraft()" class="btn" style="background: #64748b; color: white;">
                                            <i class="fas fa-save"></i> Save Draft
                                        </button>
                                        <button type="submit" class="btn btn-primary" style="padding: 0.8rem 2rem;">
                                            ${isEditing ? '<i class="fas fa-save"></i> Update Event' : '<i class="fas fa-plus-circle"></i> Create Event'}
                                        </button>
                                    </div>
                                </form>
                                `;
    }

    window.handlePosterUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please upload a valid image file.', 'error');
            return;
        }

        try {
            showToast('Processing image...', 'info');
            const compressed = await window.compressImage(file, 800, 0.7); // Compress to max 800px width, 70% quality

            // Update hidden input
            const hiddenInput = document.getElementById('poster-data');
            if (hiddenInput) hiddenInput.value = compressed;

            // Update preview
            const preview = document.getElementById('poster-preview');
            if (preview) {
                preview.innerHTML = `<img src="${compressed}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            showToast('Poster uploaded successfully!');
        } catch (err) {
            console.error("Compression Error:", err);
            showToast('Failed to process image.', 'error');
        }
    };

    window.handlePaymentQRUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please upload a valid image file.', 'error');
            return;
        }

        try {
            showToast('Processing QR code...', 'info');
            const compressed = await window.compressImage(file, 600, 0.6); // Smaller for QRs

            const hidden = document.getElementById('payment-qr-data');
            if (hidden) hidden.value = compressed;

            const preview = document.getElementById('payment-qr-preview');
            if (preview) preview.innerHTML = `<img src="${compressed}" style="width: 100%; height: 100%; object-fit: contain;">`;

            showToast('Payment QR uploaded!');
        } catch (err) {
            console.error("Compression Error:", err);
            showToast('Failed to process image.', 'error');
        }
    };

    window.captureFormState = () => {
        const form = document.getElementById('event-form');
        if (!form) {
            console.error("captureFormState: Form named 'event-form' not found in DOM");
            return;
        }

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());

        // Explicitly capture hidden inputs that might be tricky or file-related
        if (document.getElementById('poster-data')) data.image = document.getElementById('poster-data').value;
        if (document.getElementById('rules-pdf-url')) data.rulesPdfUrl = document.getElementById('rules-pdf-url').value;
        if (document.getElementById('payment-qr-data')) data.paymentQrUrl = document.getElementById('payment-qr-data').value;
        data.is_story = !!document.getElementById('is_story')?.checked;

        // Ensure we don't accidentally save 'undefined' keys
        window.tempEventData = data;
        console.log("Form State Captured:", window.tempEventData);
    };

    // Ensure reset utility exists for navigation
    window.resetEventForm = () => {
        window.tempEventData = null;
        window.currentSubEvents = null;
        window.editingEventId = null;
    };

    // --- CALENDAR UTILITIES ---
    window.changeCalendarMonth = (diff) => {
        const d = new Date(window.calendarDate);
        d.setMonth(d.getMonth() + diff);
        window.calendarDate = d;
        handleRoute();
    };

    function getCalendarDays(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Pad previous month days
        const prevMonthDate = new Date(year, month, 0);
        const prevMonthLastDay = prevMonthDate.getDate();
        const prevMonth = prevMonthDate.getMonth();
        const prevMonthYear = prevMonthDate.getFullYear();

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(prevMonthYear, prevMonth, prevMonthLastDay - i) });
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }
        // Pad next month days
        const nextMonthDate = new Date(year, month + 1, 1);
        const nextMonth = nextMonthDate.getMonth();
        const nextMonthYear = nextMonthDate.getFullYear();

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(nextMonthYear, nextMonth, i) });
        }
        return days;
    }

    function renderCalendarHTML(events, registrations, isFullPage = false) {
        const today = new Date();
        const year = window.calendarDate.getFullYear();
        const month = window.calendarDate.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const days = getCalendarDays(window.calendarDate);

        const daysHtml = days.map(d => {
            const isToday = d.currentMonth && d.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            // Format date string carefully to match stored format YYYY-MM-DD
            const y = d.date.getFullYear();
            const m = String(d.date.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.date.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayNum}`;

            const dayEvents = events.filter(e => e.date === dateStr);
            const isRegistered = registrations.some(r => {
                const evt = events.find(e => e.id === r.eventId);
                return evt && evt.date === dateStr;
            });

            let eventIndicators = '';
            if (isFullPage) {
                eventIndicators = dayEvents.map(e => `
                    <div style="font-size: 0.7rem; padding: 2px 6px; background: ${registrations.some(r => r.eventId === e.id) ? '#8b5cf6' : '#3b82f6'}; color: white; border-radius: 4px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${e.title}
                    </div>
                `).join('');
            } else {
                if (isRegistered) eventIndicators = '<div style="width: 4px; height: 4px; background: #8b5cf6; border-radius: 50%; margin: 2px auto 0;"></div>';
                else if (dayEvents.length > 0) eventIndicators = '<div style="width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin: 2px auto 0;"></div>';
            }

            const activeStyle = isToday ? 'background: #eff6ff; border: 1px solid #3b82f6;' : '';
            const opacityStyle = d.currentMonth ? 'color: #1e293b;' : 'color: #cbd5e1;';
            const cellHeight = isFullPage ? 'min-height: 100px;' : 'height: 40px;';

            return `
                <div style="padding: 8px; border-radius: 8px; font-size: 0.85rem; ${cellHeight} ${activeStyle} ${opacityStyle} cursor: pointer; border: 1px solid #f1f5f9; transition: transform 0.1s;" 
                     onclick="window.showCalendarDayEvents('${dateStr}')"
                     onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" 
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                    <div style="font-weight: ${isToday ? '700' : '400'};">${d.day}</div>
                    ${eventIndicators}
                </div>
            `;
        }).join('');

        return `
            <div style="background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="margin:0; font-size: 1.25rem; color: #1e293b;">${monthNames[month]} <span style="color: #64748b; font-weight: 400;">${year}</span></h3>
                    </div>
                    <div style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px;">
                        <button onclick="window.changeCalendarMonth(-1)" style="background: white; border: none; color: #1e293b; cursor: pointer; padding: 6px 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"><i class="fas fa-chevron-left"></i></button>
                        <button onclick="window.calendarDate = new Date(); handleRoute();" style="background: transparent; border: none; color: #64748b; cursor: pointer; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">Today</button>
                        <button onclick="window.changeCalendarMonth(1)" style="background: white; border: none; color: #1e293b; cursor: pointer; padding: 6px 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; gap: 8px; margin-bottom: 0.5rem; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                    ${daysHtml}
                </div>
                ${!isFullPage ? `
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; font-size: 0.75rem; color: #64748b; justify-content: center; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></div> Upcoming</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><div style="width: 8px; height: 8px; background: #8b5cf6; border-radius: 50%;"></div> Registered</div>
                </div>` : ''}
            </div>
        `;
    }

    window.showCalendarDayEvents = (dateStr) => {
        const data = Data.get();
        const events = data.events.filter(e => e.date === dateStr && e.status !== 'draft');

        if (events.length === 0) {
            showToast('No events scheduled for this day', 'info');
            return;
        }

        const date = new Date(dateStr);
        const modalHtml = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem; background: white; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="margin:0; color: #1e293b; font-size: 1.25rem;">Events</h3>
                        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.85rem;">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onclick="window.closeModal()" style="background:#f1f5f9; border:none; width: 32px; height: 32px; border-radius: 50%; font-size:1rem; color:#64748b; cursor:pointer; display: flex; align-items: center; justify-content: center;"><i class="fas fa-times"></i></button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 4px;">
                    ${events.map(e => {
            const isRegistered = data.registrations.some(r => r.eventId === e.id && r.userId === data.session.id);
            return `
                        <div onclick="window.showEventDetails('${e.id}', true); window.closeModal();" style="display: flex; gap: 12px; align-items: center; padding: 12px; background: #f8fafc; border-radius: 12px; cursor: pointer; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                            ${isRegistered ? '<div style="position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: #8b5cf6;"></div>' : ''}
                            <img src="${e.image}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${e.title}</div>
                                <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;"><i class="far fa-clock"></i> ${e.time} • ${e.venue}</div>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #cbd5e1; font-size: 0.8rem;"></i>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
        createModal(modalHtml);
    };



    window.renderSubEventsHtml = (subEvents) => {
        if (!subEvents || subEvents.length === 0) {
            return '<div style="text-align: center; color: #64748b; padding: 2rem; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px;">No sessions added yet. Click "Add Session" to create sub-events.</div>';
        }
        return subEvents.map((sub, idx) => `
                                    <div class="card" style="background: white; padding: 1.5rem; position: relative;">
                                        <button type="button" onclick="window.removeSubEventField(${idx})" style="position: absolute; top: 10px; right: 10px; border: none; background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer;">
                                            <i class="fas fa-times"></i>
                                        </button>

                                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 100px; gap: 1rem; margin-bottom: 1rem;">
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">Session Name</label>
                                                <input type="text" class="smart-input" value="${sub.name}" oninput="window.updateSubEvent(${idx}, 'name', this.value)" required placeholder="e.g. Workshop A">
                                            </div>
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">Start Time</label>
                                                <input type="time" class="smart-input" value="${sub.startTime}" oninput="window.updateSubEvent(${idx}, 'startTime', this.value)" required>
                                            </div>
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">End Time</label>
                                                <input type="time" class="smart-input" value="${sub.endTime}" oninput="window.updateSubEvent(${idx}, 'endTime', this.value)" required>
                                            </div>
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">Type</label>
                                                <select class="smart-input" onchange="window.updateSubEvent(${idx}, 'isPaid', this.value === 'paid')">
                                                    <option value="free" ${!sub.isPaid ? 'selected' : ''}>Free</option>
                                                    <option value="paid" ${sub.isPaid ? 'selected' : ''}>Paid</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">Department</label>
                                                <input type="text" class="smart-input" value="${sub.department || ''}" oninput="window.updateSubEvent(${idx}, 'department', this.value)" required placeholder="Host Department">
                                            </div>
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">Venue / Location</label>
                                                <input type="text" class="smart-input" value="${sub.venue || ''}" oninput="window.updateSubEvent(${idx}, 'venue', this.value)" required placeholder="e.g. Auditorium">
                                            </div>
                                            <div class="input-group" style="margin: 0;">
                                                <label class="input-label" style="font-size: 0.8rem;">Capacity</label>
                                                <input type="number" class="smart-input" value="${sub.capacity || 50}" oninput="window.updateSubEvent(${idx}, 'capacity', parseInt(this.value))" required min="1" placeholder="Max participants">
                                            </div>
                                        </div>

                                        ${sub.isPaid ? `
                <div style="margin-top: 1rem; background: #fef3c7; padding: 1.5rem; border-radius: 8px; border: 1px solid #fbbf24;">
                    <h4 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-rupee-sign"></i> Payment Configuration
                    </h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div class="input-group" style="margin: 0;">
                            <label class="input-label" style="font-size: 0.8rem; color: #92400e;">Fee Amount (₹)</label>
                            <input type="number" class="smart-input" style="margin: 0; background: white;" value="${sub.amount || 0}" oninput="window.updateSubEvent(${idx}, 'amount', parseInt(this.value))" required min="1" placeholder="Amount">
                        </div>
                        
                        <div class="input-group" style="margin: 0;">
                            <label class="input-label" style="font-size: 0.8rem; color: #92400e;">Fee Type</label>
                            <select class="smart-input" style="margin: 0; background: white;" onchange="window.updateSubEvent(${idx}, 'feeType', this.value)">
                                <option value="per_person" ${!sub.feeType || sub.feeType === 'per_person' ? 'selected' : ''}>Per Person</option>
                                <option value="per_team" ${sub.feeType === 'per_team' ? 'selected' : ''}>Per Team</option>
                            </select>
                        </div>
                        
                        <div class="input-group" style="margin: 0; ${!sub.feeType || sub.feeType === 'per_person' ? 'opacity: 0.5; pointer-events: none;' : ''}">
                            <label class="input-label" style="font-size: 0.8rem; color: #92400e;">Team Size</label>
                            <input type="number" class="smart-input" style="margin: 0; background: white;" value="${sub.teamSize || 1}" oninput="window.updateSubEvent(${idx}, 'teamSize', parseInt(this.value))" min="1" max="20" placeholder="Max members">
                        </div>
                    </div>
                    
                    <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.5); border-radius: 6px; font-size: 0.85rem; color: #78350f;">
                        <i class="fas fa-info-circle"></i> 
                        ${!sub.feeType || sub.feeType === 'per_person' ?
                    `<strong>Per Person:</strong> Each participant pays ₹${sub.amount || 0} individually` :
                    `<strong>Per Team:</strong> One payment of ₹${sub.amount || 0} for a team of up to ${sub.teamSize || 1} members`
                }
                    </div>
                </div>
                ` : ''}
                                    </div>
                                    `).join('');
    };

    window.refreshSubEventsList = () => {
        const container = document.getElementById('sub-events-container');
        if (container) {
            container.innerHTML = window.renderSubEventsHtml(window.currentSubEvents);
        }
    };

    window.addSubEventField = () => {
        console.log("Adding sub-event (No Reload)...");
        try {
            // No capture needed for sub-event addition as we don't reload page
            if (!window.currentSubEvents) window.currentSubEvents = [];
            window.currentSubEvents.push({
                id: 'sub' + Date.now() + Math.random().toString(36).substr(2, 4),
                name: '',
                startTime: '10:00',
                endTime: '11:00',
                venue: '',
                capacity: 50,
                department: '',
                isPaid: false,
                amount: 0,
                feeType: 'per_person',
                teamSize: 1
            });

            window.refreshSubEventsList();
            setTimeout(window.checkCapacity, 100);
        } catch (err) {
            console.error("Error adding sub-event:", err);
            alert("Error adding session: " + err.message);
        }
    };

    window.removeSubEventField = (index) => {
        window.currentSubEvents.splice(index, 1);
        window.refreshSubEventsList();
        setTimeout(window.checkCapacity, 100);
    };

    window.updateSubEvent = (index, field, value) => {
        window.currentSubEvents[index][field] = value;

        // Only re-render if structural changes happen
        if (field === 'isPaid' || field === 'feeType') {
            window.refreshSubEventsList();
        }
        if (field === 'capacity') window.checkCapacity();
    };

    window.checkCapacity = () => {
        const mainCapInput = document.getElementById('main-capacity');
        const warningEl = document.getElementById('capacity-warning');

        if (!mainCapInput || !warningEl || !window.currentSubEvents) return;

        const mainCapacity = parseInt(mainCapInput.value) || 0;

        // Calculate max concurrent capacity or total distinct capacity?
        // User asked: "when the subevents capacity is added more then the capacity"
        // This implies sum of all sub-events. 
        const totalSubCapacity = window.currentSubEvents.reduce((sum, sub) => sum + (parseInt(sub.capacity) || 0), 0);

        if (totalSubCapacity > mainCapacity) {
            warningEl.style.display = 'block';
            warningEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Warning: Total sub-event capacity (${totalSubCapacity}) exceeds the main event limit (${mainCapacity}).`;
        } else {
            warningEl.style.display = 'none';
        }
    };

    window.handleSaveDraft = async () => {
        const form = document.getElementById('event-form');
        if (!form) return;

        // Check if ANY field has data to allow saving a draft
        let hasData = false;

        // Check standard inputs (text, number, date, time)
        const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
        for (let input of inputs) {
            if (input.type === 'file') continue;
            if (input.value && input.value.trim() !== '') {
                hasData = true;
                break;
            }
        }

        // Check hidden file inputs
        if (!hasData) {
            const hiddenData = [
                document.getElementById('poster-data'),
                document.getElementById('rules-pdf-url'),
                document.getElementById('payment-qr-data')
            ];
            for (let h of hiddenData) {
                if (h && h.value && h.value.length > 500) {
                    hasData = true;
                    break;
                }
            }
        }

        if (!hasData && window.currentSubEvents && window.currentSubEvents.length > 0) hasData = true;

        if (!hasData) {
            showToast('Draft is empty. Please enter some details to save.', 'warning');
            return;
        }

        const user = Data.getCurrentUser();
        if (!user) {
            showToast('Session expired/invalid. Please login again.', 'error');
            return;
        }
        const formData = new FormData(form);

        // Sanitize capacity
        let capacity = parseInt(formData.get('capacity'));
        if (isNaN(capacity)) capacity = 0; // Backend expects int, use 0 or default if supported

        const title = formData.get('title') || `Draft Event - ${new Date().toLocaleDateString()}`;

        // Map sub-events to snake_case for backend
        const subEvents = (window.currentSubEvents || []).map(s => ({
            name: s.name,
            start_time: s.startTime,
            end_time: s.endTime,
            venue: s.venue,
            capacity: parseInt(s.capacity) || 50,
            is_paid: s.isPaid,
            amount: parseFloat(s.amount) || 0,
            department: s.department,
            fee_type: s.feeType,
            team_size: parseInt(s.teamSize) || 1
        }));

        const eventData = {
            title: title,
            description: formData.get('description'),
            type: formData.get('type'),
            date: formData.get('date'),
            time: formData.get('time'),
            venue: formData.get('venue'),
            capacity: capacity,
            image: formData.get('image') || 'https://via.placeholder.com/800x400',
            admin_id: user.id,
            created_at: new Date().toISOString(),
            status: 'draft',
            is_story: formData.get('is_story') === 'on',
            rules_pdf_url: document.getElementById('rules-pdf-url') ? document.getElementById('rules-pdf-url').value : null,
            payment_qr_url: document.getElementById('payment-qr-data') ? document.getElementById('payment-qr-data').value : null,
            sub_events: subEvents
        };

        try {
            if (window.editingEventId) {
                await Data.updateEvent(window.editingEventId, eventData);
                showToast('Draft updated successfully!');
            } else {
                await Data.addEvent(eventData);
                showToast('Draft saved successfully!');
            }

            window.editingEventId = null;
            window.currentSubEvents = null;
            window.tempEventData = null; // Clear temp data
            window.location.hash = '#admin/events-feed';
        } catch (err) {
            console.error(err);
            showToast('Failed to save draft: ' + err.message, 'error');
        }
    };

    window.handleEventSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = Data.getCurrentUser();
            if (!user) {
                showToast('Session expired. Please login again.', 'error');
                return;
            }

            const formData = new FormData(e.target);

            // Strict Validation for Published Events
            if (!window.currentSubEvents || window.currentSubEvents.length === 0) {
                alert('Please add at least one session/sub-event before creating the event.');
                showToast('Please add at least one session/sub-event.', 'error');
                return;
            }

            let capacity = parseInt(formData.get('capacity'));
            if (isNaN(capacity) || capacity <= 0) {
                showToast('Please enter a valid capacity.', 'error');
                return;
            }

            // Map sub-events to snake_case for backend
            const subEvents = (window.currentSubEvents || []).map(s => ({
                name: s.name,
                start_time: s.startTime,
                end_time: s.endTime,
                venue: s.venue,
                capacity: parseInt(s.capacity),
                is_paid: s.isPaid,
                amount: parseFloat(s.amount),
                department: s.department,
                fee_type: s.feeType,
                team_size: parseInt(s.teamSize)
            }));

            const eventData = {
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                date: formData.get('date'),
                time: formData.get('time'),
                venue: formData.get('venue'),
                capacity: capacity,
                image: formData.get('image') || 'https://via.placeholder.com/800x400',
                admin_id: user.id,
                created_at: new Date().toISOString(),
                status: 'published',
                is_story: formData.get('is_story') === 'on',
                rules_pdf_url: document.getElementById('rules-pdf-url') ? document.getElementById('rules-pdf-url').value : null,
                payment_qr_url: document.getElementById('payment-qr-data') ? document.getElementById('payment-qr-data').value : null,
                sub_events: subEvents
            };

            if (window.editingEventId) {
                await Data.updateEvent(window.editingEventId, eventData);
                showToast('Event updated successfully!');
            } else {
                await Data.addEvent(eventData);
                showToast('Event created successfully!');
            }
        } catch (err) {
            console.error("Submit Error:", err);
            showToast('Error creating event: ' + err.message, 'error');
            return;
        }

        window.editingEventId = null;
        window.currentSubEvents = null;
        window.tempEventData = null; // Clear temp data
        const user = Data.getCurrentUser();
        window.location.hash = user && user.role === 'admin' ? '#admin/events-feed' : '#student/overview';
    };

    // --- ROUTER ---
    // --- ROUTER ---
    async function handleRoute() {
        // Cleanup Scanner if running
        if (window.html5QrcodeScanner) {
            try {
                window.stopQRScanner();
            } catch (e) { console.log('Scanner cleanup error:', e); }
        }

        const hash = window.location.hash || '#';
        const parts = hash.split('/');
        const mainRoute = parts[0];
        const subRoute = parts[1] || 'overview';

        if (mainRoute === '#') await renderLanding();
        else if (mainRoute === '#login') renderLogin();
        else if (mainRoute === '#student') await renderStudentDashboard(subRoute);
        else if (mainRoute === '#admin') await renderAdminDashboard(subRoute);
        else if (mainRoute === '#super') await renderSuperDashboard(subRoute);
        else await renderLanding();
    }
    window.handleRoute = handleRoute;

    window.closeModal = async () => {
        const container = document.getElementById('modal-container');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
        await handleRoute(); // Refresh current view
    };

    // --- GLOBAL HANDLERS ---
    window.handleLogout = () => {
        if (confirm("Are you sure you want to logout?")) {
            Data.logout();
            window.location.hash = '#login';
        }
    };

    // --- STUDENT NOTIFICATION HELPERS ---
    window.toggleStudentNotifications = () => {
        const dropdown = document.getElementById('student-notif-dropdown');
        if (!dropdown) return;

        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            Data.markNotificationsAsRead('student');
            updateStudentNotifUI();
        }
    };

    window.clearStudentNotifs = async () => {
        if (confirm('Clear all notifications?')) {
            await Data.clearNotifications('student');
            await updateStudentNotifUI();
        }
    };

    async function updateStudentNotifUI() {
        const badge = document.getElementById('student-notif-badge');
        const list = document.getElementById('student-notif-list');
        if (!badge || !list) return;

        const user = Data.getCurrentUser();
        if (!user) return;

        const notifs = await Data.getNotifications(user.role);
        const unreadCount = notifs.filter(n => !n.is_read).length;

        if (unreadCount > 0) {
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }

        if (notifs.length === 0) {
            list.innerHTML = '<div style="padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">No new notifications</div>';
        } else {
            list.innerHTML = notifs.map(n => `
                <div style="padding: 1rem; border-bottom: 1px solid #f1f5f9; background: ${n.is_read ? 'white' : '#f0f9ff'};">
                    <div style="font-size: 0.85rem; color: #1e293b; line-height: 1.4; margin-bottom: 4px;">${n.text}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">From: <strong>${n.sender_name || 'System'}</strong></div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `).join('');
        }
    }

    // Auto-update student notifications
    setInterval(() => {
        const user = Data.getCurrentUser();
        if (user && user.role === 'student' && window.location.hash.includes('profile')) {
            updateStudentNotifUI();
        }
    }, 30000);

    // Initial check
    setTimeout(updateStudentNotifUI, 1000);

    // --- ADMIN NOTIFICATION HELPERS ---
    window.toggleAdminNotifications = () => {
        const dropdown = document.getElementById('admin-notif-dropdown');
        if (!dropdown) return;

        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            // Mark as read when opening
            Data.markNotificationsAsRead('admin');
            updateAdminNotifUI();
        }
    };

    window.clearAdminNotifs = async () => {
        if (confirm('Clear all admin notifications?')) {
            await Data.clearNotifications('admin');
            await updateAdminNotifUI();
            // Also refresh if on overview
            if (window.location.hash.includes('overview')) await handleRoute();
        }
    };

    async function updateAdminNotifUI() {
        const badge = document.getElementById('admin-notif-badge');
        const list = document.getElementById('admin-notif-list');
        if (!badge || !list) return;

        const notifs = await Data.getNotifications('admin');
        const unreadCount = notifs.filter(n => !n.is_read).length;

        if (unreadCount > 0) {
            badge.style.display = 'block';
            badge.textContent = unreadCount;
        } else {
            badge.style.display = 'none';
        }

        if (notifs.length === 0) {
            list.innerHTML = '<div style="padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">No new notifications</div>';
        } else {
            list.innerHTML = notifs.map(n => `
                <div style="padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; background: ${n.read ? 'white' : '#f0f9ff'};">
                    <div style="font-size: 0.85rem; color: #1e293b; line-height: 1.4; margin-bottom: 4px;">${n.text}</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">From: <strong>${n.from || 'System'}</strong></div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `).join('');
        }
    }

    // Auto-update notifications every 30 seconds if on admin pages
    setInterval(() => {
        if (window.location.hash.includes('#admin')) {
            updateAdminNotifUI();
        }
    }, 30000);

    // Initial check
    setTimeout(updateAdminNotifUI, 500);


    window.deleteEvent = async (eventId) => {
        const user = Data.getCurrentUser();
        const data = await Data.get();
        const event = data.events.find(e => e.id == eventId);

        if (!event) return;

        // 2-hour permission check
        const created = new Date(event.createdAt || event.date);
        const diffHrs = (new Date() - created) / (1000 * 60 * 60);

        if (event.status !== 'draft' && diffHrs >= 2 && user.role !== 'super') {
            alert('Permission Denied: Events can only be deleted within 2 hours of creation.');
            return;
        }

        const executeDelete = async () => {
            if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                await Data.deleteEvent(eventId);
                showToast('Event deleted successfully.');
                await handleRoute(); // Refresh
            }
        };

        if (user.role === 'admin') {
            window.verifyAction('delete', executeDelete);
        } else {
            await executeDelete();
        }
    };

    window.editEvent = async (eventId) => {
        const user = Data.getCurrentUser();
        const data = await Data.get();
        const event = data.events.find(e => e.id == eventId);

        if (!event) return;

        // 2-hour permission check
        const created = new Date(event.createdAt || event.date);
        const diffHrs = (new Date() - created) / (1000 * 60 * 60);

        if (event.status !== 'draft' && diffHrs >= 2 && user.role !== 'super') {
            alert('Permission Denied: Events can only be edited within 2 hours of creation.');
            return;
        }

        const executeEdit = () => {
            window.editingEventId = eventId;
            window.location.hash = user.role === 'admin' ? `#admin/add-event` : `#student/add-event`;
        };

        if (user.role === 'admin') {
            window.verifyAction('edit', executeEdit);
        } else {
            executeEdit();
        }
    };

    window.handleRulesUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate PDF
        if (file.type !== 'application/pdf') {
            showToast('Please upload a valid PDF file.', 'error');
            e.target.value = ''; // Reset
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('PDF size should be less than 5MB.', 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const base64Pdf = evt.target.result;
            const hiddenInput = document.getElementById('rules-pdf-url');
            if (hiddenInput) hiddenInput.value = base64Pdf;

            const status = document.getElementById('rules-upload-status');
            if (status) {
                status.style.display = 'inline-block';
                status.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} ready`;
            }
            showToast('Rules PDF uploaded successfully!');
        };
        reader.onerror = () => showToast('Failed to read PDF file.', 'error');
        reader.readAsDataURL(file);
    };

    window.verifyAction = (actionName, callback) => {
        const user = Data.getCurrentUser();
        const modalHtml = `
                                    <div class="modal-content" style="background:white; padding:2.5rem; border-radius:12px; max-width:400px; margin: 10% auto; position:relative; box-shadow: 0 15px 35px rgba(0,0,0,0.25);">
                                        <button onclick="document.getElementById('modal-container').innerHTML = ''" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;"><i class="fas fa-times"></i></button>
                                        <div style="text-align: center; margin-bottom: 1.5rem;">
                                            <div style="width: 60px; height: 60px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                                <i class="fas fa-shield-alt" style="font-size: 1.5rem; color: var(--primary);"></i>
                                            </div>
                                            <h3 style="color: var(--text-main); font-size: 1.5rem; font-weight: 700;">Confirm Identity</h3>
                                            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.5rem;">Please re-authenticate to ${actionName} this event.</p>
                                        </div>

                                        <form id="verify-creds-form">
                                            <div class="input-group">
                                                <label class="input-label">Email (Username)</label>
                                                <input type="email" id="verify-email" class="smart-input" required value="${user.email}" readonly style="background: #f8fafc; cursor: not-allowed;">
                                            </div>
                                            <div class="input-group" style="margin-bottom: 2rem;">
                                                <label class="input-label">Password</label>
                                                <input type="password" id="verify-password" class="smart-input" required placeholder="Enter your password">
                                            </div>
                                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem;">Verify & Continue</button>
                                                <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn" style="width: 100%; padding: 0.8rem; background: transparent; color: var(--text-muted);">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                    `;
        createModal(modalHtml);

        document.getElementById('verify-creds-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('verify-password').value;
            const result = Data.login(user.email, password);
            if (result.success) {
                document.getElementById('modal-container').innerHTML = '';
                callback();
            } else {
                showToast('Verification failed. Invalid password.', 'error');
            }
        });
    };

    window.resetEventForm = () => {
        window.editingEventId = null;
        window.currentSubEvents = null;
    };

    window.initiateRegistration = async (eventId, subEventId = null) => {
        const user = Data.getCurrentUser();
        if (!user) {
            showToast('Please login to register.', 'error');
            setTimeout(() => window.location.hash = '#login', 1500);
            return;
        }

        const result = await Data.registerForEvent(user.id, eventId, subEventId);
        if (result.success) {
            showToast(result.message);
            // Refresh modal if open
            if (document.querySelector('.event-modal-content')) {
                await window.showEventDetails(eventId);
            } else {
                await handleRoute();
            }
        } else {
            showToast(result.message, 'error');
        }
    };

    window.handleRegister = async (eventId) => {
        const user = Data.getCurrentUser();
        if (!user) {
            showToast('Please login to register.', 'error');
            return;
        }
        const result = await Data.registerForEvent(user.id, eventId);
        if (result.success) {
            showToast(result.message);
            await handleRoute();
        } else {
            showToast(result.message, 'error');
        }
    };

    window.handleUpdateProfile = async (e) => {
        e.preventDefault();
        const user = Data.getCurrentUser();
        const formData = new FormData(e.target);
        const name = formData.get('userName');
        const phone = formData.get('userPhone');
        const theme = formData.get('userTheme');

        const updateData = { name, phone };
        if (theme) {
            updateData.theme = theme;
        }

        const result = await Data.updateUser(user.id, updateData);
        if (result.success) {
            if (theme) {
                window.applyTheme(theme);
            }
            showToast(result.message);
            await handleRoute();
        } else {
            showToast(result.message, 'error');
        }
    };

    window.handleChangePassword = async (e) => {
        e.preventDefault();
        const user = Data.getCurrentUser();
        const formData = new FormData(e.target);
        const currentPass = formData.get('currentPassword');
        const newPass = formData.get('newPassword');
        const confirmPass = formData.get('confirmPassword');

        if (newPass !== confirmPass) {
            showToast('New passwords do not match.', 'error');
            return;
        }

        const result = await Data.updatePassword(user.id, currentPass, newPass);
        if (result.success) {
            showToast(result.message);
            e.target.reset(); // Clear password fields
        } else {
            showToast(result.message, 'error');
        }
    };

    // Theme update handler for Student/Admin
    window.handleUpdateTheme = async (e) => {
        e.preventDefault();
        const user = Data.getCurrentUser();
        const formData = new FormData(e.target);
        const theme = formData.get('userTheme');

        const result = await Data.updateUser(user.id, { theme });
        if (result.success) {
            window.applyTheme(theme);
            showToast('Theme preference saved successfully!');
        } else {
            showToast(result.message, 'error');
        }
    };

    // Theme update handler for Super Admin
    window.handleSuperUpdateTheme = async (e) => {
        e.preventDefault();
        const user = Data.getCurrentUser();
        const theme = document.getElementById('settings-theme').value;

        const result = await Data.updateUser(user.id, { theme });
        if (result.success) {
            window.applyTheme(theme);
            showToast('Theme preference saved successfully!');
        } else {
            showToast(result.message, 'error');
        }
    };

    // --- CHAT HANDLERS ---
    window.activeConversationId = null;

    window.selectConversation = (userId) => {
        window.activeConversationId = userId;
        handleRoute(); // Re-render to show conversation
    };

    window.handleSendMessage = async (e) => {
        e.preventDefault();
        const text = e.target.messageText.value.trim();
        if (!text || !window.activeConversationId) return;

        const user = Data.getCurrentUser();
        const receiverId = window.activeConversationId;

        // Optimistic UI update
        const container = document.getElementById('chat-messages');
        if (container) {
            const tempMsgId = 'temp-' + Date.now();
            const tempMsgHtml = `
                <div id="${tempMsgId}" style="max-width: 80%; align-self: flex-end; display: flex; flex-direction: column; margin-bottom: 12px; opacity: 0.6; transform: translateY(10px); transition: all 0.3s ease;">
                    <div style="padding: 0.8rem 1.2rem; border-radius: 20px; font-size: 0.95rem; line-height: 1.5; background: linear-gradient(135deg, #0095f6, #3797f0); color: white; border-bottom-right-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <div style="word-break: break-word;">${text}</div>
                    </div>
                    <span style="font-size: 0.75rem; color: #adb5bd; margin-top: 4px; align-self: flex-end; margin-right: 4px;">Sending...</span>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', tempMsgHtml);
            container.scrollTop = container.scrollHeight;

            setTimeout(() => {
                const el = document.getElementById(tempMsgId);
                if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
            }, 10);
        }

        const form = e.target;
        form.reset();

        try {
            await Data.sendMessage(user.id, receiverId, text);

            // Notify receiver
            await Data.addNotification(
                `New message from ${user.name}: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
                'info',
                'all',
                user.name
            );

            if (window.refreshChatMessages) {
                await window.refreshChatMessages();
            }
        } catch (err) {
            console.error("Send Error:", err);
            showToast("Failed to send message", "error");
        }
    };

    window.handleChatSearch = async (query) => {
        const contactList = document.getElementById('chat-contact-list');
        if (!contactList) return;

        const data = await Data.get();
        const allUsers = data.users;
        const currentUser = Data.getCurrentUser();
        query = query.toLowerCase();

        const filtered = allUsers.filter(u => {
            if (u.id === currentUser.id) return false;
            return (u.name.toLowerCase().includes(query) || (u.college && u.college.toLowerCase().includes(query)));
        });

        if (filtered.length === 0) {
            contactList.innerHTML = '<div style="padding:1rem; color:#8e8e8e; text-align:center;">No users found.</div>';
            return;
        }

        contactList.innerHTML = filtered.map(c => `
                                    <div onclick="window.selectConversation('${c.id}')" style="
                padding: 0.8rem 1.25rem; 
                cursor: pointer; 
                display: flex; 
                align-items: center; 
                gap: 12px; 
                transition: background 0.2s; 
                background: white;
            "
                                        onmouseover="this.style.background='#fafafa'"
                                        onmouseout="this.style.background='white'"
                                    >
                                        <div style="position: relative;">
                                            <img onclick="event.stopPropagation(); window.showChatUserProfile('${c.id}')" src="${c.profilePic || 'https://ui-avatars.com/api/?name=' + c.name}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 1px solid #dbdbdb; cursor: pointer;">
                                        </div>
                                        <div style="flex: 1; overflow: hidden;">
                                            <div style="font-weight: 600; font-size: 0.95rem; color: #262626; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
                                            <div style="font-size: 0.85rem; color: #8e8e8e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                ${c.role === 'admin' ? 'Campus Admin' : 'Student'} • ${c.college || 'Smart Campus'}
                                            </div>
                                        </div>
                                    </div>
                                    `).join('');
    };

    window.openDirectChat = async (targetUserId, eventTitle = null) => {
        const currentUser = Data.getCurrentUser();
        if (!currentUser) {
            showToast('Please login to message organizers', 'error');
            return;
        }

        // If we want to send an initial message context
        if (eventTitle) {
            // Check if last message was already this context to avoid spamming
            const msgs = await Data.getMessagesBetween(currentUser.id, targetUserId);
            const exists = msgs.some(m => m.text.includes(eventTitle) && (Date.now() - new Date(m.timestamp).getTime() < 60000));
            if (!exists) {
                await Data.sendMessage(currentUser.id, targetUserId, `I have a question regarding the event: ${eventTitle}`);
            }
        }

        window.activeConversationId = targetUserId;
        const data = await Data.get();
        const contact = data.users.find(u => u.id == targetUserId);

        if (!contact) {
            showToast('Organizer details not found', 'error');
            return;
        }

        const modalHtml = `
            <div class="chat-modal-content" style="background: white; border-radius: 16px; overflow: hidden; width: 500px; max-width: 95%; height: 600px; max-height: 85vh; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
                <div style="padding: 1rem 1.5rem; background: var(--primary); color: white; display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                    <img src="${contact.profilePic || 'https://ui-avatars.com/api/?name=' + contact.name}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 1.1rem;">${contact.name}</div>
                        <div style="font-size: 0.75rem; opacity: 0.9;">${contact.role === 'admin' ? 'Event Organizer' : 'Campus User'} • ${contact.college || 'Smart Campus'}</div>
                    </div>
                    <button onclick="window.closeModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fas fa-times"></i></button>
                </div>
                
                <div id="modal-chat-messages" style="flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; background: #f8fafc;">
                    <div style="text-align: center; color: #94a3b8; font-size: 0.8rem; margin: 10px 0;">Loading messages...</div>
                </div>

                <div style="padding: 1rem; background: white; border-top: 1px solid #e2e8f0; flex-shrink: 0;">
                    <div style="display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; white-space: nowrap; padding-bottom: 5px;" class="hide-scrollbar">
                         <button onclick="window.shareMyIdentity('${targetUserId}')" class="btn" style="font-size: 0.7rem; padding: 5px 12px; display: flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 20px;">
                            <i class="fas fa-id-card" style="color: var(--primary);"></i> Share My ID
                         </button>
                         <button onclick="window.openShareEventModal('${targetUserId}')" class="btn" style="font-size: 0.7rem; padding: 5px 12px; display: flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 20px;">
                            <i class="fas fa-calendar-alt" style="color: var(--secondary);"></i> Share Event
                         </button>
                         <button onclick="window.shareCampusHelp('${targetUserId}')" class="btn" style="font-size: 0.7rem; padding: 5px 12px; display: flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 20px;">
                            <i class="fas fa-question-circle" style="color: #6366f1;"></i> Need Help
                         </button>
                    </div>
                    <form onsubmit="window.handleModalSendMessage(event, '${targetUserId}')" style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" name="messageText" placeholder="Type your message..." autocomplete="off" class="smart-input" required style="flex: 1; border-radius: 25px; height: 45px; padding: 0 20px; border: 1px solid #e2e8f0;">
                        <button type="submit" class="btn btn-primary" style="border-radius: 50%; width: 45px; height: 45px; min-width: 45px; padding: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px var(--primary-light);">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;

        createModal(modalHtml);

        // Start live polling for the modal
        const pollInterval = setInterval(async () => {
            if (!document.getElementById('modal-chat-messages')) {
                clearInterval(pollInterval);
                return;
            }
            await window.refreshModalChat(currentUser.id, targetUserId);
        }, 3000);

        await window.refreshModalChat(currentUser.id, targetUserId);
    };

    window.refreshModalChat = async (myId, targetId) => {
        const messages = await Data.getMessagesBetween(myId, targetId);
        const container = document.getElementById('modal-chat-messages');
        if (!container) return;

        const currentHtml = container.innerHTML;
        const newHtml = messages.length === 0 ?
            '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; height: 100%;"><i class="far fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i><p>No messages yet. Say hello!</p></div>' :
            messages.map(m => {
                const isMe = m.senderId === myId;
                return `
                    <div style="max-width: 85%; ${isMe ? 'align-self: flex-end;' : 'align-self: flex-start;'} display: flex; flex-direction: column;">
                        <div style="padding: 0.8rem 1.1rem; border-radius: 18px; font-size: 0.92rem; line-height: 1.5; ${isMe ? 'background: var(--primary); color: white; border-bottom-right-radius: 4px;' : 'background: white; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);'}">
                            <div style="word-break: break-word;">${m.text}</div>
                            ${m.attachment && m.attachment.type === 'event' ? `
                                <div style="background: rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; margin-top: 10px; border: 1px solid rgba(0,0,0,0.1); background: ${isMe ? 'white' : '#f8fafc'}; color: #1e293b;">
                                    <img src="${m.attachment.image}" style="width: 100%; height: 110px; object-fit: cover;">
                                    <div style="padding: 10px;">
                                        <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.attachment.title}</div>
                                        <button onclick="window.showEventDetails('${m.attachment.eventId}')" class="btn btn-primary" style="padding: 4px 10px; font-size: 0.75rem; width: 100%; margin-top: 5px; height: auto;">View Details</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <span style="font-size: 0.65rem; color: #94a3b8; margin-top: 4px; ${isMe ? 'text-align: right;' : 'text-align: left;'} padding: 0 4px;">
                            ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                `;
            }).join('');

        if (currentHtml !== newHtml) {
            const wasAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 10;
            container.innerHTML = newHtml;
            if (wasAtBottom) container.scrollTop = container.scrollHeight;
        }
    };

    window.handleModalSendMessage = async (e, targetId) => {
        e.preventDefault();
        const input = e.target.messageText;
        const text = input.value.trim();
        if (!text) return;

        const user = Data.getCurrentUser();
        try {
            await Data.sendMessage(user.id, targetId, text);
            input.value = '';
            await window.refreshModalChat(user.id, targetId);
        } catch (err) {
            showToast('Failed to send message: ' + err.message, 'error');
        }
    };

    window.renderSingleMessage = (m, userId) => {
        const isMe = String(m.senderId) === String(userId);
        return `
            <div class="message-bubble" style="max-width: 80%; ${isMe ? 'align-self: flex-end;' : 'align-self: flex-start;'} display: flex; flex-direction: column; margin-bottom: 12px; animation: fadeIn 0.3s ease; opacity: 1; transform: translateY(0);">
                <div style="padding: 0.8rem 1.2rem; border-radius: 20px; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 2px 5px rgba(0,0,0,0.05); ${isMe ? 'background: linear-gradient(135deg, #0095f6, #3797f0); color: white; border-bottom-right-radius: 4px;' : 'background: #f1f3f5; color: #212529; border-bottom-left-radius: 4px;'}">
                    <div style="word-break: break-word;">${m.text}</div>
                    ${m.attachment && m.attachment.type === 'event' ? `
                    <div style="background: rgba(255,255,255,0.15); border-radius: 12px; overflow: hidden; margin-top: 10px; border: 1px solid rgba(0,0,0,0.1);">
                        <img src="${m.attachment.image}" style="width: 100%; height: 140px; object-fit: cover;">
                        <div style="padding: 12px; background: ${isMe ? 'rgba(0,0,0,0.1)' : '#fff'};">
                            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; color: ${isMe ? '#fff' : '#262626'};">${m.attachment.title}</div>
                            <button onclick="window.showEventDetails('${m.attachment.eventId}')" style="background: ${isMe ? '#fff' : '#0095f6'}; color: ${isMe ? '#0095f6' : '#fff'}; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; width: 100%; font-weight: 600;">View Details</button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <span style="font-size: 0.75rem; color: #adb5bd; margin-top: 4px; ${isMe ? 'align-self: flex-end; margin-right: 4px;' : 'align-self: flex-start; margin-left: 4px;'}">
                    ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>`;
    };

    window.shareMyIdentity = async (targetId) => {
        const user = Data.getCurrentUser();
        const text = `Hi, I'm ${user.name} from ${user.college || 'Smart Campus'}. I'm interested in your event and would like to connect. [Identity Shared]`;
        await Data.sendMessage(user.id, targetId, text);
        await window.refreshModalChat(user.id, targetId);
        showToast('Identity shared with organizer');
    };

    window.shareCampusHelp = async (targetId) => {
        const user = Data.getCurrentUser();
        const text = `Hello, I need some help regarding the registration process or event details for one of your upcoming events. Could you please assist?`;
        await Data.sendMessage(user.id, targetId, text);
        await window.refreshModalChat(user.id, targetId);
        showToast('Internal help request sent');
    };

    window.showChatUserProfile = async (userId) => {
        const data = await Data.get();
        const user = data.users.find(u => String(u.id) === String(userId));
        if (!user) return;

        const modalHtml = `
            <div class="modal-content" style="background: white; width: 350px; border-radius: 16px; padding: 2rem; text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <button onclick="window.closeModal()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-times"></i>
                </button>
                <div style="width: 100px; height: 100px; margin: 0 auto 1.5rem; position: relative;">
                    <img src="${user.profilePic || 'https://ui-avatars.com/api/?name=' + user.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); padding: 3px;">
                    <div style="position: absolute; bottom: 5px; right: 5px; background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>
                </div>

                <h2 style="color: #1e293b; margin-bottom: 0.5rem; font-size: 1.5rem;">${user.name}</h2>
                <div style="display: inline-block; padding: 4px 12px; background: #f1f5f9; border-radius: 20px; color: #64748b; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem;">
                    ${user.role === 'admin' ? 'Campus Admin' : 'Student'}
                </div>

                <div style="text-align: left; background: #f8fafc; padding: 1.5rem; border-radius: 12px;">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Full Name</label>
                        <div style="color: #334155; font-weight: 700; font-size: 1rem;">${user.name}</div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">College Name</label>
                        <div style="color: #334155; font-weight: 500;"><i class="fas fa-university" style="color: var(--primary); margin-right: 8px;"></i> ${user.college || 'Smart Campus'}</div>
                    </div>

                    <div style="margin-bottom: 0;">
                        <label style="display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">${user.role === 'admin' ? 'Phone Number' : 'Mobile Number'}</label>
                        <div style="color: #334155; font-weight: 500;"><i class="fas fa-phone-alt" style="color: #10b981; margin-right: 8px;"></i> ${user.phone || 'Not Shared'}</div>
                    </div>
                </div>

                <button onclick="window.closeModal()" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">Close Profile</button>
            </div>
        `;
        createModal(modalHtml);
    };

    window.renderChatView = async function (user, activeContactId) {
        const contacts = await Data.getChatContacts(user.id);
        let activeContact = null;
        let messages = [];

        if (activeContactId) {
            const allUsers = (await Data.get()).users;
            activeContact = allUsers.find(u => String(u.id) === String(activeContactId));
            if (activeContact) {
                messages = await Data.getMessagesBetween(user.id, activeContactId);
                if (!contacts.find(c => String(c.id) === String(activeContactId))) {
                    contacts.unshift(activeContact);
                }
            }
        }

        window.refreshChatMessages = async () => {
            if (!window.activeConversationId) return;
            const container = document.getElementById('chat-messages');
            if (!container) return;

            const latestMessages = await Data.getMessagesBetween(user.id, window.activeConversationId);
            const wasAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;

            const newMsgHtml = latestMessages.map(m => window.renderSingleMessage(m, user.id)).join('');

            if (container.innerHTML !== newMsgHtml) {
                container.innerHTML = newMsgHtml;
                if (wasAtBottom) {
                    container.style.scrollBehavior = 'smooth';
                    container.scrollTop = container.scrollHeight;
                }
            }
        };

        if (!window.chatPollingInterval) {
            window.chatPollingInterval = setInterval(async () => {
                const hash = window.location.hash;
                if (!hash.includes('/messages') || !window.activeConversationId) {
                    clearInterval(window.chatPollingInterval);
                    window.chatPollingInterval = null;
                    return;
                }
                if (window.refreshChatMessages) await window.refreshChatMessages();
            }, 3000);
        }

        return `
            <div class="chat-container box-shadow" style="display: grid; grid-template-columns: 320px 1fr; height: 700px; max-height: 85vh; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #dbdbdb;">
                <div class="chat-sidebar" style="border-right: 1px solid #dbdbdb; display: flex; flex-direction: column;">
                    <div style="padding: 1.25rem; border-bottom: 1px solid #dbdbdb; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; font-size: 1.1rem;">${user.name}</div>
                            <div style="font-size: 0.8rem; color: #8e8e8e;">${user.role === 'admin' ? 'Campus Admin' : 'Student'} • ${user.college || 'Smart Campus'}</div>
                        </div>
                    </div>
                    <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #dbdbdb;">
                        <input type="text" oninput="window.handleChatSearch(this.value)" placeholder="Search contacts..." style="width: 100%; height: 35px; border-radius: 8px; border: 1px solid #dbdbdb; padding: 0 12px; background: #f8fafc;">
                    </div>
                    <div id="chat-contact-list" style="flex: 1; overflow-y: auto;">
                        ${contacts.map(c => `
                            <div onclick="window.selectConversation('${c.id}')" style="padding: 1rem; cursor: pointer; display: flex; align-items: center; gap: 12px; ${String(c.id) === String(activeContactId) ? 'background: #efefef;' : ''}">
                                <img src="${c.profilePic || 'https://ui-avatars.com/api/?name=' + c.name}" onclick="event.stopPropagation(); window.showChatUserProfile('${c.id}')" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
                                <div style="flex: 1; overflow: hidden;">
                                    <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
                                    <div style="font-size: 0.75rem; color: #8e8e8e;">${c.college || 'Smart Campus'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="chat-main" style="display: flex; flex-direction: column; background: white; height: 100%; overflow: hidden;">
                    ${activeContact ? `
                        <div style="padding: 1rem; border-bottom: 1px solid #dbdbdb; display: flex; align-items: center; gap: 12px;">
                            <img src="${activeContact.profilePic || 'https://ui-avatars.com/api/?name=' + activeContact.name}" onclick="window.showChatUserProfile('${activeContact.id}')" style="width: 40px; height: 40px; border-radius: 50%; cursor: pointer;">
                            <div style="font-weight: 600;">${activeContact.name}</div>
                        </div>
                        <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; background: #fff;">
                            ${messages.map(m => window.renderSingleMessage(m, user.id)).join('')}
                        </div>
                        <div style="padding: 1rem; border-top: 1px solid #dbdbdb;">
                            <form onsubmit="window.handleSendMessage(event)" style="display: flex; gap: 10px;">
                                <input type="text" name="messageText" placeholder="Write a message..." style="flex: 1; height: 40px; border-radius: 20px; border: 1px solid #dbdbdb; padding: 0 15px; outline: none;">
                                <button type="submit" class="btn btn-primary" style="border-radius: 20px; padding: 0 20px;">Send</button>
                            </form>
                        </div>
                    ` : `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8e8e8e;">
                            <i class="fab fa-facebook-messenger" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                            <p>Select a contact to start chatting</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    };

    window.deleteRegistration = async (regId) => {
        const user = Data.getCurrentUser();
        const executeDelete = async () => {
            if (confirm('Are you sure you want to cancel this registration?')) {
                await Data.deleteRegistration(regId);
                showToast('Registration cancelled successfully.');
                await handleRoute();
                document.getElementById('modal-container').innerHTML = '';
            }
        };

        if (user.role === 'student') {
            window.verifyAction('cancel registration', executeDelete);
        } else {
            await executeDelete();
        }
    };



    function convertTo12Hour(time) {
        if (!time) return '';
        let [hours, minutes] = time.split(':');
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm} `;
    }

    window.showEventDetails = async (eventId, isInline = false) => {
        const data = await Data.get();
        const user = Data.getCurrentUser();
        const event = data.events.find(e => e.id == eventId);
        if (!event) { showToast('Event not found', 'error'); return; }
        const myRegs = data.registrations.filter(r => r.userId === user.id && r.eventId === eventId);
        const organizer = data.users.find(u => String(u.id) === String(event.adminId || 'admin1'));
        const modalHtml = `
                                    <div class="event-modal-content" style="position: relative; ${isInline ? '' : 'max-width: 850px; margin: 2rem auto;'} border-radius: 16px; overflow-y: auto; max-height: ${isInline ? 'none' : '90vh'}; background: #f8fafc; color: #1e293b; ${isInline ? '' : 'box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);'}" >
                                        <button onclick="${isInline ? 'window.handleRoute()' : 'window.closeModal()'}" style="position: absolute; top: 20px; right: 20px; z-index: 100; background: rgba(255,255,255,0.9); color: #1e293b; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; border:none; cursor:pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                                            <i class="fas ${isInline ? 'fa-arrow-left' : 'fa-times'}"></i>
                                        </button>

                                        <!--Hero Header-->
                                        <div style="height: 300px; overflow: hidden; position: relative;">
                                            <img src="${event.image}" style="width: 100%; height: 100%; object-fit: cover;">
                                                <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(15, 23, 42, 0.9));"></div>
                                                <div style="position: absolute; bottom: 30px; left: 40px; right: 40px; color: white;">
                                                    <span style="background: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${event.type}</span>
                                                    <h1 style="font-size: 2.5rem; font-weight: 800; margin-top: 10px; line-height: 1.1;">${event.title}</h1>
                                                </div>
                                        </div>

                                        <div style="display: grid; grid-template-columns: 1.8fr 1fr; gap: 2rem; padding: 1.5rem 2.5rem 0rem;">
                                            <!-- Left Column: Details -->
                                            <div>
                                                <div style="margin-bottom: 1rem;">
                                                    <h3 style="font-size: 1.1rem; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 1rem;">Full Description</h3>
                                                    <p style="color: #475569; line-height: 1.7; font-size: 1rem;">${event.description}</p>
                                                    ${event.rulesPdfUrl ? `
                            <div style="margin-top: 1.5rem; text-align: center;">
                                <a href="${event.rulesPdfUrl}" download="Event_Rules_${event.title.replace(/\s+/g, '_')}.pdf" class="btn" style="background: white; border: 1px solid #cbd5e1; color: #475569; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <i class="fas fa-file-pdf" style="color: #ef4444;"></i> Download Event Rules
                                </a>
                            </div>
                            ` : ''}
                                                </div>

                                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                                    <div onclick="window.showChatUserProfile('${organizer ? organizer.id : 'admin1'}')" style="background: white; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.3s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='#e2e8f0'">
                                                        <div style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Organized By</div>
                                                        <div style="font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--primary);">
                                                            <i class="fas fa-user-tie"></i> ${organizer ? organizer.name : 'College Admin'}
                                                        </div>
                                                        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 4px;">${event.department || 'Campus Department'}</div>
                                                    </div>
                                                    <div style="background: white; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                                                        <div style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Classification</div>
                                                        <div style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                                            <i class="fas fa-tags" style="color: var(--secondary);"></i> ${event.type}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button onclick="window.openDirectChat('${event.adminId || 'admin1'}', '${event.title}');" class="btn" style="width: 100%; margin-bottom: 0.75rem; background: white; border: 1px solid var(--primary); color: var(--primary); font-weight: 600; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;" onmouseover="this.style.background='var(--primary)'; this.style.color='white'" onmouseout="this.style.background='white'; this.style.color='var(--primary)'">
                                                    <i class="fas fa-comment-alt"></i> Contact Organizer
                                                </button>
                                                <button onclick="window.openShareThisEventModal('${event.id}');" class="btn" style="width: 100%; margin-bottom: 1.5rem; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                                    <i class="fas fa-share-alt"></i> Share with Someone
                                                </button>
                                            </div>

                                            <!-- Right Column: Quick Info -->
                                            <div>
                                                <div style="background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 1.5rem; position: sticky; top: 0;">
                                                    <div style="margin-bottom: 1.5rem;">
                                                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
                                                            <div style="width: 40px; height: 40px; background: rgba(99, 102, 241, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                                                <i class="far fa-calendar-alt"></i>
                                                            </div>
                                                            <div>
                                                                <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Date</div>
                                                                <div style="font-weight: 700;">${new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                            </div>
                                                        </div>
                                                        <div style="display: flex; align-items: center; gap: 12px;">
                                                            <div style="width: 40px; height: 40px; background: rgba(6, 182, 212, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--secondary);">
                                                                <i class="fas fa-university"></i>
                                                            </div>
                                                            <div>
                                                                <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Host College</div>
                                                                <div style="font-weight: 700;">${event.venue}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style="border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-bottom: 1.5rem;">
                                                        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Attendance Limit</div>
                                                        <div style="display: flex; align-items: center; justify-content: space-between;">
                                                            <div style="font-weight: 700;">${event.capacity} Students</div>
                                                            <span style="font-size: 0.7rem; background: #f1f5f9; padding: 2px 8px; border-radius: 20px;">Open for Registration</span>
                                                        </div>
                                                    </div>

                                                    ${user.role !== 'admin' ? `
                            <button onclick="document.getElementById('event-reg-form').scrollIntoView({behavior: 'smooth'})" class="btn btn-primary" style="width: 100%; padding: 0.8rem;">
                                Register for Tracks
                            </button>` : `
                            <div style="text-align: center; padding: 0.8rem; background: #f1f5f9; color: #64748b; border-radius: 8px; font-size: 0.9rem;">
                                <i class="fas fa-eye"></i> Admin View Only
                            </div>`}
                                                </div>
                                            </div>
                                        </div>

                                        <!--Registration Form Section-->
                                        <!--Registration Form / Sub-Events Section-->
                                        <div style="padding: 0 2.5rem 1.5rem;">
                                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem 2rem 2rem;">
                                                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;">
                                                    <i class="fas fa-clipboard-list" style="color: var(--primary);"></i> Available Tracks & Sessions
                                                </h3>

                                                ${user.role !== 'admin' ? `
                <!-- Participant Quick Info -->
                <div style="display: flex; gap: 2rem; padding: 1rem; background: #f8fafc; border-radius: 12px; margin-bottom: 1rem; border: 1px solid #f1f5f9;">
                    <div>
                        <label style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; display: block;">Participant</label>
                        <span style="font-weight: 600;">${user.name}</span>
                    </div>
                    <div>
                        <label style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; display: block;">Identity</label>
                        <span style="font-weight: 600;">${user.email}</span>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; display: block;">Your College <span style="color: #ef4444;">*</span></label>
                        <input type="text" form="event-reg-form" name="college_name" class="smart-input" placeholder="Organization name" value="${user.college || ''}" required style="border: none; background: transparent; padding: 0; font-weight: 600; border-bottom: 1px solid #e2e8f0; border-radius: 0; width: 100%;">
                    </div>
                </div>
                ` : ''}

                                                <form id="event-reg-form">
                                                    <div class="sub-event-list" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                                                        ${event.subEvents && event.subEvents.length > 0 ? event.subEvents.map((sub, index) => {
            const isRegistered = myRegs.find(r => r.subEventId === sub.id);
            const timeString = (sub.startTime && sub.endTime) ?
                `${convertTo12Hour(sub.startTime)} - ${convertTo12Hour(sub.endTime)}` : 'Time TBD';

            const dataAttrs = (sub.startTime && sub.endTime) ?
                `data-start="${sub.startTime.replace(':', '')}" data-end="${sub.endTime.replace(':', '')}"` : '';

            return `
                                    <div class="sub-option" style="border: 2px solid #f1f5f9; border-radius: 12px; padding: 1.25rem; transition: all 0.2s; background: ${isRegistered ? '#f0fdf4' : 'white'};">
                                        <label style="display: flex; align-items: flex-start; gap: 1.25rem; ${user.role !== 'admin' ? 'cursor: pointer;' : ''} width: 100%;">
                                            <div style="padding-top: 4px;">
                                                ${user.role !== 'admin' ? (isRegistered ?
                    `<div style="width: 24px; height: 24px; background: #10b981; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-check"></i></div>` :
                    `<input type="checkbox" name="selected_sub_events" value="${sub.id}" ${dataAttrs}
                                                        style="width: 20px; height: 20px; accent-color: var(--primary);" 
                                                        onchange="window.handleSelectionChange(this, '${sub.id}', ${!!sub.isPaid})">`
                ) : `<div style="width: 24px; height: 24px; background: #f1f5f9; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center;"><i class="fas fa-info-circle"></i></div>`}
                                            </div>
                                            <div style="flex: 1;">
                                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                                    <span style="font-weight: 700; font-size: 1.1rem; color: #1e293b;">${sub.name}</span>
                                                    <span style="font-size: 0.8rem; background: ${sub.isPaid ? '#fef3c7' : '#dcfce7'}; color: ${sub.isPaid ? '#92400e' : '#166534'}; padding: 4px 12px; border-radius: 20px; font-weight: 700; text-transform: uppercase;">
                                                        ${sub.isPaid ? '₹' + sub.amount : 'Free'}
                                                    </span>
                                                </div>
                                                <div style="display: flex; gap: 1.5rem; font-size: 0.9rem; color: #64748b;">
                                                    <span><i class="far fa-clock" style="color: var(--primary);"></i> ${timeString}</span>
                                                    <span><i class="fas fa-map-marker-alt" style="color: var(--secondary);"></i> ${sub.venue}</span>
                                                    <span><i class="fas fa-building" style="color: #6366f1;"></i> ${sub.department || 'N/A'}</span>
                                                </div>
                                                ${user.role !== 'admin' && isRegistered ? `
                                                <div style="margin-top: 8px;">
                                                    <div style="color: #10b981; font-weight: 600; font-size: 0.85rem; margin-bottom: 5px;"><i class="fas fa-id-badge"></i> You are registered for this track</div>
                                                    <button onclick="event.preventDefault(); document.getElementById('ticket-qr-container-${isRegistered.id}').style.display = 'flex'; window.generateQR('qrcode-target-${isRegistered.id}', '${isRegistered.id}', 220)" style="background: transparent; color: var(--primary); border: 1px solid var(--primary); padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; margin-right: 8px;">
                                                        <i class="fas fa-qrcode"></i> Attendance Scanner
                                                    </button>
                                                    ${isRegistered.certificateUrl ? `
                                                    <button onclick="event.preventDefault(); window.downloadFile('${isRegistered.certificateUrl}', '${event.title.replace(/\s+/g, '_')}_Certificate.pdf')" style="background: #e0e7ff; color: #4338ca; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 600;">
                                                        <i class="fas fa-certificate"></i> Certificate
                                                    </button>
                                                    ` : ''}
                                                    
                                                    <div id="ticket-qr-container-${isRegistered.id}" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; cursor: default;" onclick="event.stopPropagation()">
                                                        <div style="background: white; padding: 2rem; border-radius: 16px; text-align: center; max-width: 90%; position: relative; width: 320px; margin: auto;">
                                                            <button onclick="event.preventDefault(); document.getElementById('ticket-qr-container-${isRegistered.id}').style.display = 'none'" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;"><i class="fas fa-times"></i></button>
                                                            
                                                            <h4 style="color: #1e293b; margin-bottom: 1rem; font-size: 1.2rem;">Attendance Code</h4>
                                                            <div id="qrcode-target-${isRegistered.id}" style="display: flex; justify-content: center; margin-bottom: 1rem; border: 4px solid #e2e8f0; border-radius: 8px; padding: 10px; background: white;"></div>
                                                            <p style="color: #64748b; font-size: 0.9rem;">Show this to the event organizer</p>
                                                            <div style="font-family: monospace; background: #f1f5f9; padding: 6px 12px; border-radius: 4px; display: inline-block; margin-top: 12px; font-size: 0.9rem; color: #475569; font-weight: 600;">ID: ${isRegistered.id}</div>
                                                            
                                                            <button onclick="event.preventDefault(); document.getElementById('ticket-qr-container-${isRegistered.id}').style.display = 'none'" class="btn" style="background: #f1f5f9; color: #475569; width: 100%; margin-top: 1.5rem;">Close</button>
                                                        </div>
                                                    </div>
                                                </div>` : ''}
                                                <div id="conflict-msg-${sub.id}" style="color: #ef4444; font-size: 0.85rem; display: none; margin-top: 0.5rem; font-weight: 600;">
                                                    <i class="fas fa-exclamation-triangle"></i> Time conflict with another selection.
                                                </div>

                                                <div id="payment-section-${sub.id}" style="display: none; margin-top: 1.5rem; background: #fffbeb; padding: 1.5rem; border-radius: 12px; border: 1px solid #fde68a;">
                                                    <div style="display: flex; gap: 1.5rem; align-items: center;">
                                                        ${(event.payment_qr_url) ?
                    `<div style="text-align: center;">
                        <img src="${event.payment_qr_url}" style="width: 120px; height: 120px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); object-fit: contain; background: white; padding: 5px; cursor: pointer;" onclick="event.preventDefault(); window.viewPaymentQR('${event.payment_qr_url}')">
                        <div style="margin-top: 5px; font-size: 0.7rem; color: var(--primary); font-weight: 600; cursor: pointer;" onclick="event.preventDefault(); window.viewPaymentQR('${event.payment_qr_url}')"><i class="fas fa-search-plus"></i> View Full Size</div>
                    </div>` :
                    `<div style="width: 120px; height: 120px; border-radius: 8px; background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; text-align: center; font-size: 0.7rem; color: #92400e; border: 1px dashed #f59e0b; padding: 0.5rem;">No QR Uploaded</div>`
                }
                                                        <div style="flex: 1;">
                                                            <h4 style="color: #92400e; margin-bottom: 5px;">Payment Required</h4>
                                                            <p style="font-size: 0.85rem; color: #b45309; margin-bottom: 1rem;">Please scan the QR code to pay ₹${sub.amount} and upload the transaction screenshot.</p>
                                                            <input type="file" name="screenshot_${sub.id}" accept="image/*" style="font-size: 0.85rem; width: 100%;">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>`;
        }).join('') : '<div style="padding: 2rem; text-align: center; color: #64748b; background: #f8fafc; border-radius: 12px; border: 2px dashed #e2e8f0;">No specific sessions listed for this event.</div>'}
                                                    </div>

                                                    ${user.role !== 'admin' ? `
                    <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                        <button type="button" onclick="${isInline ? 'window.handleRoute()' : 'window.closeModal()'}" class="btn" style="background: transparent; color: #64748b;">Discard</button>
                        <button type="submit" class="btn btn-primary" style="padding: 0.8rem 2.5rem; font-weight: 700;">Confirm Registration</button>
                    </div>` : ''}
                                                </form>
                                            </div>
                                        </div>
                                        `;

        if (isInline) {
            const contentArea = document.querySelector('.content');
            if (contentArea) {
                contentArea.innerHTML = modalHtml;
                contentArea.scrollTop = 0;
            }
        } else {
            createModal(modalHtml);
        }

        // Handle Form Submit
        setTimeout(() => {
            const form = document.getElementById('event-reg-form');
            if (form) form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selected = formData.getAll('selected_sub_events');

                if (selected.length === 0 && (!event.subEvents || event.subEvents.length === 0)) {
                    window.handleRegister(event.id);
                    document.getElementById('modal-container').innerHTML = '';
                    return;
                }

                if (selected.length === 0) {
                    showToast('Please select at least one session.', 'error');
                    return;
                }

                const regPromises = selected.map(subId => {
                    return new Promise((resolve) => {
                        const fileInput = form.querySelector(`input[name = "screenshot_${subId}"]`);
                        if (fileInput && fileInput.files && fileInput.files.length > 0) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                                resolve({ subId, screenshot: evt.target.result });
                            };
                            reader.readAsDataURL(fileInput.files[0]);
                        } else {
                            resolve({ subId, screenshot: null });
                        }
                    });
                });

                Promise.all(regPromises).then(async results => {
                    let successCount = 0;
                    for (const { subId, screenshot } of results) {
                        const result = await Data.registerForEvent(user.id, eventId, subId, screenshot, formData.get('college_name'));
                        if (result.success) successCount++;
                    }

                    if (successCount > 0) {
                        showToast(`Registration submitted for ${successCount} sessions!`);
                        document.getElementById('modal-container').innerHTML = '';
                        await handleRoute();
                    } else {
                        showToast('No new registrations were added.', 'warning');
                    }
                });
            });
        }, 0);
    };

    window.showMyRegistrationDetails = async (regId) => {
        const data = await Data.get();
        const reg = data.registrations.find(r => r.id === regId);
        if (!reg) return;
        const evt = data.events.find(e => e.id === reg.eventId);
        if (!evt) return;
        const sub = evt.subEvents ? evt.subEvents.find(s => s.id === reg.subEventId) : null;

        const now = new Date();
        const regTime = new Date(reg.timestamp || Date.now());
        const diffHrs = (now - regTime) / (1000 * 60 * 60);
        const canManage = diffHrs < 2;

        const modalHtml = `
                                        < div class="modal-content event-modal-content" style="background: #0f172a; border-radius: 16px; width: 500px; max-width: 95%;" >
                                            <div class="event-modal-header" style="background-image: url('${evt.image}'); height: 200px; position: relative; background-size: cover; background-position: center;">
                                                <div style="position: absolute; top: 15px; right: 15px; z-index: 20;">
                                                    <button onclick="window.closeModal()" style="background: rgba(0,0,0,0.5); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="event-modal-body" style="padding: 2rem; color: white;">
                                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                                                    <div>
                                                        <span style="color: var(--primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                                                            Registration Confirmed
                                                        </span>
                                                        <h2 style="font-size: 1.75rem; margin-top: 5px;">${sub ? sub.name : evt.title}</h2>
                                                        <p style="color: #94a3b8; font-size: 0.95rem;">Part of: <strong>${evt.title}</strong></p>
                                                    </div>
                                                    <span class="badge badge-${reg.status}" style="font-size: 0.9rem; padding: 0.5rem 1rem;">${reg.status}</span>
                                                </div>

                                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                                                    <div>
                                                        <label style="display: block; color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">College Name</label>
                                                        <p><i class="fas fa-university" style="color: var(--secondary);"></i> ${evt.venue}</p>
                                                    </div>
                                                    <div>
                                                        <label style="display: block; color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Attendance</label>
                                                        <p style="color: ${reg.attendance === 'Present' ? '#10b981' : '#f59e0b'}; font-weight: 600;">
                                                            <i class="fas ${reg.attendance === 'Present' ? 'fa-check-circle' : 'fa-clock'}"></i> ${reg.attendance || 'Pending'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label style="display: block; color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Date Added</label>
                                                        <p><i class="far fa-calendar-alt"></i> ${new Date(reg.timestamp).toLocaleDateString()}</p>
                                                    </div>
                                                    <label style="display: block; color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 5px;">Event Category</label>
                                                    <p><i class="fas fa-tag"></i> ${evt.type}</p>
                                                </div>

                                                <div style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; text-align: center; color: #1e293b;">
                                                    <h4 style="margin-bottom: 1rem; font-size: 1rem; color: #64748b; text-transform: uppercase;">Attendance QR Code</h4>
                                                    <div id="reg-detail-qr" style="display: flex; justify-content: center; margin-bottom: 1rem; background: white; padding: 10px; border-radius: 8px; border: 2px solid #f1f5f9;"></div>
                                                    <p style="color: #64748b; font-size: 0.85rem;">Organizers will scan this code to mark your attendance</p>
                                                    <div style="font-family: monospace; background: #f8fafc; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; margin-top: 10px; color: #475569;">ID: ${reg.id}</div>
                                                </div>
                                            </div>


                                            <div style="margin-top: 1rem; margin-bottom: 2rem; background: ${reg.certificateUrl ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' : 'rgba(255,255,255,0.05)'}; padding: 1.5rem; border-radius: 12px; border: 1px solid ${reg.certificateUrl ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.1)'}; text-align: center;">
                                                ${reg.certificateUrl ? `
                            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 1rem;">
                                <i class="fas fa-file-pdf" style="font-size: 2rem; color: #ef4444;"></i>
                                <div style="text-align: left;">
                                    <h4 style="margin: 0; color: white; font-size: 1.1rem;">${reg.certificateType || 'Participation'} Certificate</h4>
                                    <p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Format: PDF Document</p>
                                </div>
                            </div>
                            <button onclick="window.downloadFile('${reg.certificateUrl}', '${(sub ? sub.name : evt.title).replace(/\s+/g, '_')}_Certificate.pdf')" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700;">
                                <i class="fas fa-cloud-download-alt"></i> Download Official Certificate
                            </button>
                        ` : `
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #64748b;">
                                <i class="fas fa-certificate" style="font-size: 1.5rem; opacity: 0.5;"></i>
                                <div style="text-align: left;">
                                    <h4 style="margin: 0; font-size: 1rem; color: #94a3b8;">Certificate Status</h4>
                                    <p style="margin: 0; font-size: 0.8rem; opacity: 0.7;">Not yet issued by admin.</p>
                                </div>
                            </div>
                        `}
                                            </div>

                                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                                <button onclick="window.showEventDetails('${evt.id}', true);" class="btn btn-secondary" style="flex: 1; min-width: 140px;">
                                                    ${canManage ? '<i class="fas fa-edit"></i> Edit Selection' : 'View Event Info'}
                                                </button>
                                                ${canManage ? `
                            <button onclick="window.deleteRegistration('${reg.id}')" class="btn" style="flex: 1; min-width: 140px; background: #ef4444; color: white;">
                                <i class="fas fa-trash"></i> Cancel Registration
                            </button>
                        ` : ''}
                                                <button onclick="window.closeModal()" class="btn" style="${canManage ? 'width: 100%;' : 'flex: 1;'} background: transparent; color: #94a3b8; border: 1px solid #334155;">
                                                    Close
                                                </button>
                                            </div>
                                        </div >
                                    </div >
                                    `;
        createModal(modalHtml);

        // Generate the QR code after the modal is in the DOM
        setTimeout(() => {
            window.generateQR('reg-detail-qr', reg.id, 180);
        }, 50);
    };

    window.handleSelectionChange = async (checkbox, id, isPaid) => {
        try {
            const container = document.getElementById('payment-section-' + id);
            const conflictMsg = document.getElementById('conflict-msg-' + id);

            // 0. Reset UI for this item
            if (conflictMsg) {
                conflictMsg.style.display = 'none';
                conflictMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Time conflict detected.';
            }

            if (!checkbox.checked) {
                if (container) container.style.display = 'none';
                return;
            }

            // 1. Get current item time
            const startRaw = checkbox.getAttribute('data-start');
            const endRaw = checkbox.getAttribute('data-end');

            if (!startRaw || !endRaw) {
                // If no time, just toggle payment
                if (isPaid && container) container.style.display = 'block';
                return;
            }

            const currentStart = parseInt(startRaw);
            const currentEnd = parseInt(endRaw);

            // 2. Check against OTHER SELECTED checkboxes
            const allCheckboxes = document.querySelectorAll('input[name="selected_sub_events"]:checked');
            let conflictFound = false;
            let conflictName = '';

            allCheckboxes.forEach(cb => {
                if (cb === checkbox) return; // skip self

                const otherStart = parseInt(cb.getAttribute('data-start'));
                const otherEnd = parseInt(cb.getAttribute('data-end'));

                if (!isNaN(otherStart) && !isNaN(otherEnd)) {
                    // Overlap: StartA < EndB && EndA > StartB
                    if (currentStart < otherEnd && currentEnd > otherStart) {
                        conflictFound = true;
                        conflictName = 'another selected session';
                    }
                }
            });

            // 3. (Removed check against already registered events as per user request)

            // 4. Handle Conflict
            if (conflictFound) {
                checkbox.checked = false; // Disallow selection
                if (container) container.style.display = 'none'; // Hide payment if it was shown

                // Visual warning removed as per user request

                showToast(`Time conflict detected with ${conflictName} !`, 'error');
                return;
            }

            // 5. No conflict - Show payment if needed
            if (isPaid && container) container.style.display = 'block';

        } catch (e) {
            console.error('Error in handleSelectionChange', e);
        }
    };

    window.toggleSubEventPayment = (subId, isPaid) => {
        if (!isPaid) return;
        const checkbox = document.querySelector(`input[value = "${subId}"]`);
        const section = document.getElementById(`payment - section - ${subId} `);
        if (checkbox && checkbox.checked) {
            section.style.display = 'block';
            section.querySelector('input[type="file"]').setAttribute('required', 'true');
        } else {
            section.style.display = 'none';
            section.querySelector('input[type="file"]').removeAttribute('required');
        }
    };

    window.handleApproval = async (regId, status) => {
        const result = await Data.updateRegistrationStatus(regId, status);
        if (result) {
            showToast(`Registration ${status}.`);
            await handleRoute();
        }
    };

    window.openAttendanceModal = async (regId) => {
        const data = await Data.get();
        const reg = data.registrations.find(r => r.id === regId);
        const user = data.users.find(u => u.id === reg.userId) || { name: 'Student' };

        const modalHtml = `
                                    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem;">
                                        <div class="modal-card" style="width: 100%; max-width: 440px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); position: relative; animation: slideUp 0.3s ease-out;">

                                            <!-- Close Button -->
                                            <button onclick="window.closeModal()" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: 0.3s;">
                                                <i class="fas fa-times"></i>
                                            </button>

                                            <!-- Header -->
                                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 1.5rem 1.5rem 1.25rem; color: white; text-align: center;">
                                                <div style="width: 60px; height: 60px; background: white; color: #10b981; border-radius: 18px; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-weight: 800; transform: rotate(-5deg); box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
                                                    <i class="fas fa-award"></i>
                                                </div>
                                                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.3px;">Certificate of Completion</h2>
                                                <p style="margin: 5px 0 0; opacity: 0.9; font-size: 0.85rem;">Marking attendance for <strong>${user.name}</strong></p>
                                            </div>

                                            <!-- Body -->
                                            <div style="padding: 1.5rem; background: #f8fafc;">
                                                <form onsubmit="window.submitAttendance(event, '${regId}')">
                                                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem;">
                                                        <div class="input-group" style="margin-bottom: 1rem;">
                                                            <label class="input-label" style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Achievement Type</label>
                                                            <select id="cert-type-${regId}" class="smart-input" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid #d1d5db;">
                                                                <option value="Participation">Participation Certificate</option>
                                                                <option value="Winner">Winner / First Place</option>
                                                                <option value="Runner-Up">Runner-Up Certificate</option>
                                                                <option value="Merit">Certificate of Merit</option>
                                                            </select>
                                                        </div>

                                                        <div class="input-group">
                                                            <label class="input-label" style="font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block;">Upload Document</label>
                                                            <div style="position: relative;">
                                                                <input type="file" id="cert-file-${regId}" class="smart-input" accept="application/pdf,image/*" required style="width: 100%; border: 2px dashed #cbd5e1; padding: 1.5rem 1rem; text-align: center; border-radius: 12px; cursor: pointer; background: #f9fafb;">
                                                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; color: #94a3b8; font-size: 0.8rem; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                                                                        <i class="fas fa-cloud-upload-alt" style="font-size: 1.2rem;"></i>
                                                                        <span>Click to browse files</span>
                                                                    </div>
                                                            </div>
                                                            <p style="margin-top: 8px; font-size: 0.7rem; color: #94a3b8; text-align: center;">PDF or Image formats only (Max 5MB)</p>
                                                        </div>
                                                    </div>

                                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                                        <button type="button" onclick="window.closeModal()" style="padding: 0.8rem; background: #f1f5f9; color: #475569; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
                                                            Dismiss
                                                        </button>
                                                        <button type="submit" style="padding: 0.8rem; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);">
                                                            Issue Certificate
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>

                                    <style>
                                        @keyframes slideUp {
                                            from {opacity: 0; transform: translateY(30px) scale(0.97); }
                                        to {opacity: 1; transform: translateY(0) scale(1); }
                }
                                    </style>
                                    `;
        createModal(modalHtml);
    };

    window.submitAttendance = (e, regId) => {
        e.preventDefault();
        const fileInput = document.getElementById(`cert-file-${regId}`);
        const typeSelect = document.getElementById(`cert-type-${regId}`);
        const certType = typeSelect ? typeSelect.value : 'Participation';

        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = async function (evt) {
                const certUrl = evt.target.result;
                const result = await Data.markAttendance(regId, certUrl, certType);
                if (result) {
                    showToast('Attendance marked and certificate uploaded!');
                    window.closeModal();
                    // Refresh results if in manual search view
                    const searchQuery = document.getElementById('manual-att-search')?.value;
                    if (searchQuery) await window.manualSearchAttendance(searchQuery);
                } else {
                    showToast('Failed to update.', 'error');
                }
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    };

    window.markAbsent = async (regId) => {
        if (confirm('Mark this student as Absent?')) {
            const result = await Data.updateAttendance(regId, 'Absent');
            if (result) {
                showToast('Marked as Absent.');
                await handleRoute();
            }
        }
    };

    window.resetRegistration = async (regId) => {
        if (confirm('Reset this registration to Pending?')) {
            await Data.updateRegistrationStatus(regId, 'pending');
            showToast('Registration reset to Pending.');
            await handleRoute();
        }
    };


    // --- SCANNER LOGIC ---
    window.handleScanEventChange = (eventId) => {
        window.selectedQrEventId = eventId;
        window.handleRoute(); // Re-render to update view
    };

    window.initQRScanner = () => {
        if (window.html5QrcodeScanner) {
            // Already running
            return;
        }

        // We only start if event is selected (enforced by UI, but double check)
        if (!window.selectedQrEventId) {
            showToast('Please select an event to scan for.', 'warning');
            return;
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        window.html5QrcodeScanner = new Html5Qrcode("qr-reader");

        window.html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            window.onScanSuccess,
            (errorMessage) => {
                // parse error, ignore per library recommendation
            }
        ).catch(err => {
            console.error("Error starting scanner", err);
            showToast('Failed to start camera: ' + err, 'error');
        });
    };

    window.stopQRScanner = async () => {
        if (window.html5QrcodeScanner) {
            try {
                await window.html5QrcodeScanner.stop();
                window.html5QrcodeScanner = null;
            } catch (e) {
                console.error("Failed to stop scanner", e);
            }
        }
    };

    window.onScanSuccess = async (decodedText, decodedResult) => {
        // Debounce
        if (window.isScanningProcessing) return;
        window.isScanningProcessing = true;

        // Visual feedback
        const overlay = document.querySelector('#scanner-overlay div');
        if (overlay) overlay.style.borderColor = '#10b981';

        try {
            // Check if ID is just a number (Registration ID)
            const regId = decodedText.trim();

            // Or if it matches our format from generateQR
            // const data = JSON.parse(decodedText); ... if we used JSON

            const data = await Data.get();
            const reg = data.registrations.find(r => r.id == regId);

            if (!reg) {
                showToast('Registration Not Found', 'error');
                if (overlay) overlay.style.borderColor = '#ef4444';
            } else {
                // Check if it belongs to the Selected Event
                if (window.selectedQrEventId && reg.eventId != window.selectedQrEventId) {
                    showToast('Warning: Student registered for a DIFFERENT event.', 'warning');
                    // We might still allow them to check in or not? Let's block it for safety.
                    if (overlay) overlay.style.borderColor = '#f59e0b';
                } else {
                    // Mark Attendance
                    await Data.markAttendance(reg.id, 'Present');
                    showToast(`Verified: Student Marked Present!`);
                    // Audio feedback beep?
                }
            }
        } catch (e) {
            console.error(e);
            showToast('Invalid QR Code', 'error');
            if (overlay) overlay.style.borderColor = '#ef4444';
        }

        setTimeout(() => {
            window.isScanningProcessing = false;
            if (overlay) overlay.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }, 2000);
    };

    window.handleManualScan = async () => {
        const input = document.getElementById('manual-scan-input');
        if (!input || !input.value) return;

        // Check if input is a Reg ID (e.g. 123) or a full object
        let scanValue = input.value;
        if (!isNaN(scanValue)) {
            // It's a plain ID, try to mark it
            try {
                await Data.markAttendance(scanValue);
                showToast('Attendance marked successfully', 'success');
                handleRoute();
            } catch (e) {
                showToast(e.message || 'Failed to mark attendance', 'error');
            }
        } else {
            await window.onScanSuccess(scanValue, null);
        }
        input.value = '';
    };

    window.filterRegGird = (query) => {
        const q = query.toLowerCase();
        const cards = document.querySelectorAll('.reg-pill');
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(q) ? '' : 'none';
        });
    };

    window.filterManualList = (query) => {
        const q = query.toLowerCase();
        const rows = document.querySelectorAll('#manual-attendance-record-body tr'); // We should add this ID
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    };

    window.toggleManualAttendance = async (regId, status) => {
        try {
            await Data.updateAttendance(regId, status);
            showToast(`Attendance marked as ${status}`, 'success');
            handleRoute();
        } catch (e) {
            showToast('Failed to update attendance', 'error');
        }
    };

    window.viewRegistrationQR = (regId, title) => {
        const qrData = JSON.stringify({ id: regId, type: 'registration' });
        const modalHtml = `
            <div class="card" style="max-width: 350px; text-align: center; padding: 2rem; animation: slideUp 0.3s;">
                <h3 style="margin-bottom: 1.5rem; color: #1e293b;">My Check-in ID</h3>
                <div style="background: white; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; display: inline-block; margin-bottom: 1.5rem;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" style="width: 200px; height: 200px; display: block;">
                </div>
                <div style="font-weight: 700; color: #1e293b; margin-bottom: 5px;">${title}</div>
                <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem;">Show this to the event administrator</div>
                <button onclick="document.getElementById('modal-container').innerHTML=''" class="btn btn-primary" style="width: 100%;">Close</button>
            </div>
        `;
        createModal(modalHtml);
    };

    window.downloadFile = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Downloading certificate...', 'success');
    };

    // --- INIT ---
    window.applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    const initialHandleRoute = async () => {
        const user = Data.getCurrentUser();
        if (user && user.theme) window.applyTheme(user.theme);
        await handleRoute();
    }

    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('DOMContentLoaded', initialHandleRoute);
    window.addEventListener('storage', () => {
        // Auto-refresh when localStorage changes in another tab
        handleRoute();
    });


    window.openShareThisEventModal = async (eventId) => {
        const data = await Data.get();
        const users = data.users.filter(u => u.id !== data.session.id);

        const modalHtml = `
            <div class="modal-content" style="background: white; width: 500px; max-width: 95%; border-radius: 12px; padding: 0; overflow: hidden; height: 600px; display: flex; flex-direction: column;">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #dbdbdb; display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0; font-size: 1.1rem; text-align: center; flex: 1;">Share with Connections</h3>
                    <button onclick="document.getElementById('modal-container').innerHTML=''" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #dbdbdb;">
                    <div style="background: #efefef; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-search" style="color: #8e8e8e;"></i>
                        <input type="text" oninput="window.updateShareUserList(this.value, '${eventId}')" placeholder="Search people..." style="background: transparent; border: none; outline: none; flex: 1; font-size: 0.9rem;">
                    </div>
                </div>
                <div id="share-user-list" style="flex: 1; overflow-y: auto; padding: 0.5rem;">
                    ${renderShareUserList(users, eventId)}
                </div>
            </div>
        `;
        createModal(modalHtml);
    };

    window.renderShareUserList = (users, eventId) => {
        if (users.length === 0) return '<div style="padding: 2rem; text-align: center; color: #8e8e8e;">No people found.</div>';
        return users.map(u => `
            <div onclick="window.sendSharedEvent('${u.id}', '${eventId}')" style="display: flex; gap: 12px; padding: 10px 15px; cursor: pointer; align-items: center; border-radius: 8px;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='white'">
                <img src="${u.profilePic || 'https://ui-avatars.com/api/?name=' + u.name}" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid #dbdbdb; object-fit: cover;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.95rem; color: #262626;">${u.name}</div>
                    <div style="font-size: 0.8rem; color: #8e8e8e;">${u.role === 'admin' ? 'Admin' : 'Student'} • ${u.college || 'Smart Campus'}</div>
                </div>
                <button class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 4px;">Send</button>
            </div>
        `).join('');
    };

    window.updateShareUserList = async (query, eventId) => {
        const data = await Data.get();
        query = query.toLowerCase();
        const filtered = data.users.filter(u => u.id !== data.session.id && (u.name.toLowerCase().includes(query) || (u.college && u.college.toLowerCase().includes(query))));
        const listContainer = document.getElementById('share-user-list');
        if (listContainer) listContainer.innerHTML = window.renderShareUserList(filtered, eventId);
    };

    window.sendSharedEvent = async (receiverId, eventId) => {
        const data = await Data.get();
        const event = data.events.find(e => e.id == eventId);
        if (!event) return;

        const user = Data.getCurrentUser();
        await Data.sendMessage(user.id, receiverId, `Check out this event: ${event.title}`, {
            type: 'event',
            eventId: event.id,
            title: event.title,
            image: event.image
        });

        showToast('Event shared successfully!');
        document.getElementById('modal-container').innerHTML = '';
    };

    window.searchEvents = async (query) => {
        const data = await Data.get();
        const events = data.events;
        if (!query) return events.filter(e => new Date(e.date) >= new Date());
        query = query.toLowerCase();
        return events.filter(e =>
            (e.title.toLowerCase().includes(query) || e.venue.toLowerCase().includes(query)) &&
            new Date(e.date) >= new Date()
        );
    };

    window.openShareEventModal = async (receiverId) => {
        const events = await window.searchEvents('');

        const modalHtml = `
            <div class="modal-content" style="background: white; width: 500px; max-width: 95%; border-radius: 12px; padding: 0; overflow: hidden; height: 600px; display: flex; flex-direction: column;">
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #dbdbdb; display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0; font-size: 1.1rem; text-align: center; flex: 1;">Share an Event</h3>
                    <button onclick="document.getElementById('modal-container').innerHTML=''" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid #dbdbdb;">
                    <div style="background: #efefef; border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-search" style="color: #8e8e8e;"></i>
                        <input type="text" oninput="window.updateShareEventList(this.value, '${receiverId}')" placeholder="Search events..." style="background: transparent; border: none; outline: none; flex: 1; font-size: 0.9rem;">
                    </div>
                </div>
                <div id="share-event-list" style="flex: 1; overflow-y: auto; padding: 0.5rem;">
                    ${renderShareEventList(events, receiverId)}
                </div>
            </div>
        `;
        createModal(modalHtml);
    };

    window.renderShareEventList = (events, receiverId) => {
        if (events.length === 0) return '<div style="padding: 2rem; text-align: center; color: #8e8e8e;">No events found.</div>';
        return events.map(e => `
            <div onclick="window.shareEventToChat('${e.id}', '${receiverId}')" style="display: flex; gap: 12px; padding: 10px 15px; cursor: pointer; align-items: center; border-radius: 8px;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='white'">
                <img src="${e.image}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.95rem; color: #262626;">${e.title}</div>
                    <div style="font-size: 0.8rem; color: #8e8e8e;">${new Date(e.date).toLocaleDateString()} • ${e.venue}</div>
                </div>
                <button style="background: #0095f6; color: white; border: none; padding: 6px 16px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">Send</button>
            </div>
        `).join('');
    };

    window.updateShareEventList = async (query, receiverId) => {
        const events = await window.searchEvents(query);
        const listContainer = document.getElementById('share-event-list');
        if (listContainer) listContainer.innerHTML = window.renderShareEventList(events, receiverId);
    };

    window.shareEventToChat = async (eventId, receiverId) => {
        const data = await Data.get();
        const event = data.events.find(e => e.id == eventId);
        if (!event) return;

        const user = Data.getCurrentUser();
        // Send message with attachment
        await Data.sendMessage(user.id, receiverId, 'Check out this event!', {
            type: 'event',
            eventId: event.id,
            title: event.title,
            image: event.image
        });

        document.getElementById('modal-container').innerHTML = '';
        if (window.location.hash.includes('/messages')) {
            handleRoute();
        } else {
            // If sharing from event list, go to chat
            window.location.hash = user.role === 'admin' ? '#admin/messages' : '#student/messages';
        }
    };

    window.filterAdminEvents = (query) => {
        query = query.toLowerCase();
        const cards = document.querySelectorAll('.ott-card');
        cards.forEach(card => {
            const title = card.querySelector('.ott-title').textContent.toLowerCase();
            const dept = card.querySelector('.ott-dept') ? card.querySelector('.ott-dept').textContent.toLowerCase() : '';
            const meta = card.querySelector('.ott-meta') ? card.querySelector('.ott-meta').textContent.toLowerCase() : '';

            if (title.includes(query) || dept.includes(query) || meta.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };

    // --- ROUTING ---
    async function handleRoute() {
        const hash = window.location.hash || '#';
        const user = Data.getCurrentUser();

        // Public routes
        if (hash === '#' || hash === '#landing') {
            await renderLanding();
            return;
        }

        if (hash === '#login') {
            renderLogin();
            return;
        }

        // Protected routes - require authentication
        if (!user) {
            window.location.hash = '#login';
            return;
        }

        // Student routes
        if (hash.startsWith('#student/')) {
            const page = hash.split('/')[1];
            await renderStudentDashboard(page);
            return;
        }

        // Admin routes
        if (hash.startsWith('#admin/')) {
            if (user.role !== 'admin' && user.role !== 'super') {
                window.location.hash = '#student/overview';
                return;
            }
            const page = hash.split('/')[1];
            await renderAdminDashboard(page);
            return;
        }

        // Super admin routes
        if (hash.startsWith('#super/')) {
            if (user.role !== 'super') {
                window.location.hash = user.role === 'admin' ? '#admin/overview' : '#student/overview';
                return;
            }
            const page = hash.split('/')[1];
            await renderSuperDashboard(page);
            return;
        }

        // Default fallback
        window.location.hash = '#landing';
    }

    // Initialize routing
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('DOMContentLoaded', handleRoute);

    // If DOM is already loaded, run immediately
    if (document.readyState === 'loading') {
        // Still loading, event listener will handle it
    } else {
        // DOM is already ready
        handleRoute();
    }

})();
