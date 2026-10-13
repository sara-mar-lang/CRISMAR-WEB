/**
 * CRISTAMAR - Producción de Eventos Corporativos, Bodas de Autor & Logística
 * Script Principal (script.js)
 * 
 * Funcionalidades:
 * 1. Cotizador Inteligente en Tiempo Real (Cálculos dinámicos, desglose, reactividad)
 * 2. Integración y Derivación a WhatsApp con mensaje pre-elaborado
 * 3. Conmutador de Enfoque en Nosotros (Corporativo vs. Bodas & Sociales)
 * 4. Filtro Interactivo de Servicios y Preselección en Cotizador
 * 5. Filtro de Locaciones por Zona y Enlace Automático con Cotizador
 * 6. Navegación Móvil, Scroll Spy y Sistema de Notificaciones Toast
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // CONSTANTES Y CONFIGURACIÓN
  // =========================================================================
  const WHATSAPP_PHONE = '573152292638'; // Número oficial CRISTAMAR: 3152292638

  // Tarifas Oficiales 2026 en COP (Ajustadas y Accesibles)
  const PRICING = {
    basePerPerson: {
      corporativo: 75000,
      boda: 120000,
      social: 90000
    },
    locationZone: {
      sabana: 12000, // Recargo por logística en Chía, Sopó, Tenjo, Cajicá
      bogota: 0      // Base metropolitana
    },
    addons: {
      catering: 28000,     // Por persona
      audiovisual: 1200000,// Fijo
      decor: 20000         // Por persona
    }
  };

  // Nombres legibles para el resumen y mensaje de WhatsApp
  const EVENT_NAMES = {
    corporativo: 'Corporativo / BTL / Congreso',
    boda: 'Boda de Autor Campestre',
    social: 'Fiesta Social VIP / 15 Años'
  };

  const ZONE_NAMES = {
    sabana: 'Hacienda en la Sabana (Chía, Sopó, Tenjo, Cajicá)',
    bogota: 'Salón / Hotel VIP en Bogotá (Chicó, Usaquén)'
  };

  // Estado global de locación específica vinculada
  let selectedSpecificLocation = null;

  // Formateador de moneda en pesos colombianos (COP)
  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  // =========================================================================
  // 1. COTIZADOR INTELIGENTE EN TIEMPO REAL
  // =========================================================================
  const eventTypeSelect = document.getElementById('event-type');
  const guestsRangeInput = document.getElementById('guests-range');
  const guestsNumberInput = document.getElementById('guests-count');
  const guestsDisplayBadge = document.getElementById('guests-display');
  const locationZoneSelect = document.getElementById('location-zone');
  const checkCatering = document.getElementById('check-catering');
  const checkAudiovisual = document.getElementById('check-audiovisual');
  const checkDecor = document.getElementById('check-decor');

  // Elementos de resumen y ticket
  const summaryEventType = document.getElementById('summary-event-type');
  const summaryGuests = document.getElementById('summary-guests');
  const summaryLocation = document.getElementById('summary-location');

  const breakdownBaseName = document.getElementById('breakdown-base-name');
  const breakdownBaseVal = document.getElementById('breakdown-base-val');

  const breakdownZoneRow = document.getElementById('breakdown-zone-row');
  const breakdownZoneName = document.getElementById('breakdown-zone-name');
  const breakdownZoneVal = document.getElementById('breakdown-zone-val');

  const breakdownCateringRow = document.getElementById('breakdown-catering-row');
  const breakdownCateringName = document.getElementById('breakdown-catering-name');
  const breakdownCateringVal = document.getElementById('breakdown-catering-val');

  const breakdownAudioRow = document.getElementById('breakdown-audio-row');
  const breakdownAudioName = document.getElementById('breakdown-audio-name');
  const breakdownAudioVal = document.getElementById('breakdown-audio-val');

  const breakdownDecorRow = document.getElementById('breakdown-decor-row');
  const breakdownDecorName = document.getElementById('breakdown-decor-name');
  const breakdownDecorVal = document.getElementById('breakdown-decor-val');

  const totalPriceDisplay = document.getElementById('total-price-display');
  const perGuestDisplay = document.getElementById('per-guest-display');
  const btnWhatsappQuote = document.getElementById('btn-whatsapp-quote');

  const locSelectedAlert = document.getElementById('loc-selected-alert');
  const locSelectedNameSpan = document.getElementById('loc-selected-name');
  const btnClearLoc = document.getElementById('btn-clear-loc');

  /**
   * Calcula y actualiza el desglose financiero en tiempo real
   */
  function calculateQuote() {
    const eventType = eventTypeSelect.value;
    let guests = parseInt(guestsNumberInput.value, 10);
    if (isNaN(guests) || guests < 20) guests = 20;
    if (guests > 1000) guests = 1000;

    const zone = locationZoneSelect.value;
    const hasCatering = checkCatering.checked;
    const hasAudio = checkAudiovisual.checked;
    const hasDecor = checkDecor.checked;

    // Precios unitarios
    const baseRate = PRICING.basePerPerson[eventType] || 180000;
    const zoneRate = PRICING.locationZone[zone] || 0;
    const cateringRate = hasCatering ? PRICING.addons.catering : 0;
    const decorRate = hasDecor ? PRICING.addons.decor : 0;
    const audioFixedCost = hasAudio ? PRICING.addons.audiovisual : 0;

    // Subtotales
    const baseSubtotal = baseRate * guests;
    const zoneSubtotal = zoneRate * guests;
    const cateringSubtotal = cateringRate * guests;
    const decorSubtotal = decorRate * guests;

    // Gran Total
    const totalAmount = baseSubtotal + zoneSubtotal + cateringSubtotal + decorSubtotal + audioFixedCost;
    const perPersonCost = Math.round(totalAmount / guests);

    // Actualizar Encabezado del Ticket
    summaryEventType.textContent = EVENT_NAMES[eventType];
    summaryGuests.textContent = `${guests.toLocaleString('es-CO')} invitados`;
    summaryLocation.textContent = selectedSpecificLocation 
      ? `${selectedSpecificLocation} (${zone === 'sabana' ? 'Sabana' : 'Bogotá'})`
      : ZONE_NAMES[zone];

    // Actualizar Filas del Desglose
    breakdownBaseName.textContent = `Producción Base (${guests} personas × ${currencyFormatter.format(baseRate)}):`;
    breakdownBaseVal.textContent = currencyFormatter.format(baseSubtotal);

    // Zona Sabana
    if (zone === 'sabana') {
      breakdownZoneRow.classList.remove('d-none');
      breakdownZoneName.textContent = `Logística Sabana (${guests} personas × $12.000):`;
      breakdownZoneVal.textContent = currencyFormatter.format(zoneSubtotal);
    } else {
      breakdownZoneRow.classList.remove('d-none');
      breakdownZoneName.textContent = `Logística Bogotá VIP:`;
      breakdownZoneVal.textContent = `Incluida en Base`;
    }

    // Catering
    if (hasCatering) {
      breakdownCateringRow.classList.remove('d-none');
      breakdownCateringName.textContent = `Catering VIP (${guests} personas × $28.000):`;
      breakdownCateringVal.textContent = currencyFormatter.format(cateringSubtotal);
    } else {
      breakdownCateringRow.classList.add('d-none');
    }

    // Audiovisual
    if (hasAudio) {
      breakdownAudioRow.classList.remove('d-none');
      breakdownAudioName.textContent = `Iluminación & Sonido Pro (Fijo):`;
      breakdownAudioVal.textContent = currencyFormatter.format(audioFixedCost);
    } else {
      breakdownAudioRow.classList.add('d-none');
    }

    // Decoración
    if (hasDecor) {
      breakdownDecorRow.classList.remove('d-none');
      breakdownDecorName.textContent = `Decoración Temática (${guests} personas × $20.000):`;
      breakdownDecorVal.textContent = currencyFormatter.format(decorSubtotal);
    } else {
      breakdownDecorRow.classList.add('d-none');
    }

    // Actualizar Totales
    totalPriceDisplay.textContent = currencyFormatter.format(totalAmount);
    perGuestDisplay.textContent = currencyFormatter.format(perPersonCost);

    // Actualizar Enlace Dinámico de WhatsApp
    updateWhatsAppLink({
      eventType: EVENT_NAMES[eventType],
      guests,
      zone: selectedSpecificLocation ? `${selectedSpecificLocation} (${ZONE_NAMES[zone]})` : ZONE_NAMES[zone],
      hasCatering,
      hasAudio,
      hasDecor,
      totalAmount: currencyFormatter.format(totalAmount),
      perPersonCost: currencyFormatter.format(perPersonCost)
    });
  }

  /**
   * Construye el mensaje estructurado y URL de WhatsApp
   */
  function updateWhatsAppLink(quoteData) {
    const addonsSelected = [];
    if (quoteData.hasCatering) addonsSelected.push('• Banquetes & Catering VIP');
    if (quoteData.hasAudio) addonsSelected.push('• Iluminación & Sonido Profesional');
    if (quoteData.hasDecor) addonsSelected.push('• Decoración & Escenografía Temática');

    const addonsText = addonsSelected.length > 0 
      ? `\n*Servicios Adicionales Seleccionados:*\n${addonsSelected.join('\n')}`
      : '\n*Servicios Adicionales:* Ninguno (Solo producción base)';

    const message = 
`¡Hola equipo CRISTAMAR! 👋
Acabo de utilizar el *Cotizador Inteligente en Tiempo Real* en su sitio web y deseo formalizar y reservar la siguiente propuesta para mi evento:

📋 *DETALLES DE LA COTIZACIÓN:*
• *Tipo de Evento:* ${quoteData.eventType}
• *Cantidad de Invitados:* ${quoteData.guests} personas
• *Ubicación / Espacio:* ${quoteData.zone}
${addonsText}

💰 *PRESUPUESTO PRELIMINAR ESTIMADO:*
• *Total Estimado:* ${quoteData.totalAmount} COP
• *Promedio por Persona:* ${quoteData.perPersonCost} COP

Quisiera agendar una asesoría técnica y conocer la disponibilidad de fechas para este montaje. ¿Podrían orientarme con los siguientes pasos? ¡Muchas gracias!`;

    const encodedMsg = encodeURIComponent(message);
    btnWhatsappQuote.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;
  }

  // Sincronización bidireccional de los controles de invitados
  guestsRangeInput.addEventListener('input', (e) => {
    const val = e.target.value;
    guestsNumberInput.value = val;
    guestsDisplayBadge.textContent = val;
    calculateQuote();
  });

  guestsNumberInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 20;
    if (val > 1000) val = 1000;
    guestsRangeInput.value = val;
    guestsDisplayBadge.textContent = val;
    calculateQuote();
  });

  // Escuchar cambios en selects y checkboxes
  eventTypeSelect.addEventListener('change', calculateQuote);
  locationZoneSelect.addEventListener('change', () => {
    // Si el usuario cambia manualmente la zona, limpiamos la locación específica
    clearSpecificLocation(false);
    calculateQuote();
  });

  checkCatering.addEventListener('change', calculateQuote);
  checkAudiovisual.addEventListener('change', calculateQuote);
  checkDecor.addEventListener('change', calculateQuote);

  // Botón para limpiar locación específica
  if (btnClearLoc) {
    btnClearLoc.addEventListener('click', () => {
      clearSpecificLocation(true);
      calculateQuote();
      showToast('Se restableció la zona general sin locación fija.', 'info');
    });
  }

  function clearSpecificLocation(shouldRecalc = true) {
    selectedSpecificLocation = null;
    if (locSelectedAlert) locSelectedAlert.classList.add('d-none');
    if (shouldRecalc) calculateQuote();
  }


  // =========================================================================
  // 2. CONMUTADOR DE ENFOQUE EN NOSOTROS (#nosotros)
  // =========================================================================
  const btnFocusCorp = document.getElementById('btn-focus-corp');
  const btnFocusBodas = document.getElementById('btn-focus-bodas');
  const focusBadge = document.getElementById('focus-badge');
  const focusTitle = document.getElementById('focus-title');
  const focusDesc = document.getElementById('focus-desc');
  const focusPillars = document.getElementById('focus-pillars');
  const focusCtaBtn = document.getElementById('focus-cta-btn');
  const focusStat = document.getElementById('focus-stat');
  const focusImg = document.getElementById('focus-img');
  const focusFloatingBadge = document.getElementById('focus-floating-badge');
  const focusDisplayCard = document.getElementById('focus-display');

  // Datos para los enfoques
  const FOCUS_DATA = {
    corp: {
      badge: 'ENFOQUE CORPORATIVO & BTL',
      title: 'Precisión Cronometrada al Segundo & Rider Técnico de Clase Mundial',
      desc: 'Entendemos que la reputación de tu marca está en juego. Gestionamos convenciones, cumbres empresariales, activaciones de marca y lanzamientos de producto con protocolos de contingencia redundante (doble fuente de poder, sonido en array estéreo y dirección de cámaras HD multicanal).',
      pillars: [
        {
          icon: 'fas fa-stopwatch',
          title: 'Rigor de Escala Minuto a Minuto',
          desc: 'Coordinación de oradores, iluminación protocolaria y señalización visual sin retrasos.'
        },
        {
          icon: 'fas fa-network-wired',
          title: 'Infraestructura Audiovisual Pro',
          desc: 'Pantallas LED micro-pitch, microfonía Shure inalámbrica y streaming simultáneo sin latencia.'
        },
        {
          icon: 'fas fa-file-contract',
          title: 'Gestión BTL de Alto Impacto',
          desc: 'Experiencias inmersivas que cautivan a tus clientes corporativos y stakeholders.'
        }
      ],
      btnText: 'Cotizar Producción Corporativa',
      eventTypeTarget: 'corporativo',
      stat: '<strong>+80</strong> Marcas Líderes Confían en Nosotros',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
      floatingBadgeIcon: 'fas fa-shield-alt',
      floatingBadgeText: 'Cero margen de error logístico'
    },
    bodas: {
      badge: 'ENFOQUE BODAS DE AUTOR & SOCIALES VIP',
      title: 'Sensibilidad Estética Inolvidable con Coordinación Silenciosa',
      desc: 'Diseñamos atmósferas mágicas donde cada momento fluye de forma orgánica y conmovedora. Desde la llegada de los invitados a la hacienda campestre hasta el último compás de la fiesta, tu celebración está orquestada por wedding planners y directores de arte dedicados.',
      pillars: [
        {
          icon: 'fas fa-heart',
          title: 'Diseño Floral y Escenografía de Autor',
          desc: 'Curaduría botánica estacional, iluminación arquitectónica cálida y carpas de ensueño en la Sabana.'
        },
        {
          icon: 'fas fa-utensils',
          title: 'Alta Cocina & Coctelería de Autor',
          desc: 'Menús de 3 o 4 tiempos maridados con vinos selectos, mesas de postres y barra libre personalizada.'
        },
        {
          icon: 'fas fa-glass-cheers',
          title: 'Producción de Fiesta & DJ de Gala',
          desc: 'Pistas infinitas de cristal, shows de chispas frías, iluminación robótica y diversión sin límite.'
        }
      ],
      btnText: 'Cotizar Boda o Fiesta Social',
      eventTypeTarget: 'boda',
      stat: '<strong>+120</strong> Parejas y Familias Felices',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
      floatingBadgeIcon: 'fas fa-gem',
      floatingBadgeText: 'Experiencias mágicas sin estrés'
    }
  };

  function switchFocus(focusKey) {
    const data = FOCUS_DATA[focusKey];
    if (!data) return;

    // Actualizar botones de pestañas
    if (focusKey === 'corp') {
      btnFocusCorp.classList.add('active');
      btnFocusCorp.setAttribute('aria-selected', 'true');
      btnFocusBodas.classList.remove('active');
      btnFocusBodas.setAttribute('aria-selected', 'false');
    } else {
      btnFocusBodas.classList.add('active');
      btnFocusBodas.setAttribute('aria-selected', 'true');
      btnFocusCorp.classList.remove('active');
      btnFocusCorp.setAttribute('aria-selected', 'false');
    }

    // Efecto sutil de fade
    focusDisplayCard.style.opacity = '0.4';
    focusDisplayCard.style.transform = 'translateY(6px)';

    setTimeout(() => {
      // Actualizar datos
      focusBadge.textContent = data.badge;
      focusTitle.textContent = data.title;
      focusDesc.textContent = data.desc;

      // Renderizar pilares
      focusPillars.innerHTML = data.pillars.map(p => `
        <div class="pillar-item">
          <div class="pillar-icon"><i class="${p.icon}"></i></div>
          <div>
            <h4>${p.title}</h4>
            <p>${p.desc}</p>
          </div>
        </div>
      `).join('');

      focusCtaBtn.innerHTML = `<i class="fas fa-calculator"></i> ${data.btnText}`;
      focusCtaBtn.onclick = () => {
        eventTypeSelect.value = data.eventTypeTarget;
        calculateQuote();
      };

      focusStat.innerHTML = data.stat;
      focusImg.src = data.image;
      focusFloatingBadge.innerHTML = `<i class="${data.floatingBadgeIcon}"></i> <span>${data.floatingBadgeText}</span>`;

      focusDisplayCard.style.opacity = '1';
      focusDisplayCard.style.transform = 'translateY(0)';
    }, 180);
  }

  if (btnFocusCorp && btnFocusBodas) {
    btnFocusCorp.addEventListener('click', () => switchFocus('corp'));
    btnFocusBodas.addEventListener('click', () => switchFocus('bodas'));
  }


  // =========================================================================
  // 3. FILTRO DE SERVICIOS Y PRESELECCIÓN EN COTIZADOR
  // =========================================================================
  const serviceFilterBtns = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  serviceFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Activar botón
      serviceFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (filterVal === 'all' || cardCat === filterVal) {
          card.classList.remove('hide');
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
          card.classList.add('hide');
        }
      });
    });
  });

  // Botón "Agregar a Cotización" dentro de cada tarjeta de servicio
  const btnAddQuotes = document.querySelectorAll('.btn-add-quote');
  btnAddQuotes.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetCategory = btn.getAttribute('data-category');
      const targetAddon = btn.getAttribute('data-addon');
      const serviceTitle = btn.getAttribute('data-service-title') || 'Servicio';

      if (targetCategory === 'corporativo' || targetCategory === 'boda' || targetCategory === 'social') {
        eventTypeSelect.value = targetCategory;
      }

      if (targetAddon === 'audiovisual') {
        checkAudiovisual.checked = true;
      } else if (targetAddon === 'decor') {
        checkDecor.checked = true;
      }

      calculateQuote();
      showToast(`¡"${serviceTitle}" agregado a tu cotización!`, 'success');

      // Scroll suave hacia el cotizador
      const cotizadorSec = document.getElementById('cotizador');
      if (cotizadorSec) {
        cotizadorSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // =========================================================================
  // 4. FILTRO DE LOCACIONES Y VINCULACIÓN AL COTIZADOR
  // =========================================================================
  const locFilterBtns = document.querySelectorAll('.loc-filter-btn');
  const locationCards = document.querySelectorAll('.location-card');

  locFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      locFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const zoneFilter = btn.getAttribute('data-zone');

      locationCards.forEach(card => {
        const cardZone = card.getAttribute('data-zone');
        if (zoneFilter === 'all' || cardZone === zoneFilter) {
          card.classList.remove('hide');
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
          card.classList.add('hide');
        }
      });
    });
  });

  // Botón "Cotizar en esta Locación" dentro de cada tarjeta
  const btnSelectLocations = document.querySelectorAll('.btn-select-location');
  btnSelectLocations.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const zone = btn.getAttribute('data-zone'); // 'sabana' o 'bogota'
      const locName = btn.getAttribute('data-location-name');

      // Asignar en el cotizador
      locationZoneSelect.value = zone;
      selectedSpecificLocation = locName;

      // Mostrar alerta en el cotizador
      if (locSelectedAlert && locSelectedNameSpan) {
        locSelectedNameSpan.textContent = locName;
        locSelectedAlert.classList.remove('d-none');
      }

      calculateQuote();
      showToast(`Locación vinculada: ${locName}`, 'success');

      // Scroll suave hacia el cotizador
      const cotizadorSec = document.getElementById('cotizador');
      if (cotizadorSec) {
        cotizadorSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // =========================================================================
  // 5. NAVEGACIÓN, MENÚ MÓVIL Y HEADER STICKY
  // =========================================================================
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Menú hamburguesa móvil
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    // Cerrar menú al hacer clic en cualquier enlace o botón del menú
    const allNavClickables = mainNav.querySelectorAll('a');
    allNavClickables.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
  }

  // Header background blur al hacer scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Active Link Spy según la sección visible
  const sections = document.querySelectorAll('section[id], header[id]');
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });


  // =========================================================================
  // 6. SISTEMA DE TOAST NOTIFICATIONS
  // =========================================================================
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'gold') iconClass = 'fas fa-gem';

    toast.innerHTML = `
      <i class="${iconClass} toast-icon"></i>
      <span class="toast-msg">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto eliminar a los 3.5 segundos con animación de salida
    setTimeout(() => {
      toast.classList.add('toast-leave');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 3500);
  }


  // =========================================================================
  // 7. INICIALIZACIÓN
  // =========================================================================
  // Ejecutar el primer cálculo para sincronizar valores al cargar
  calculateQuote();

});
