// ============================================================
// js/maps.js — Manejo de mapas Leaflet
// ============================================================

const Maps = (() => {
  let mapHero       = null;
  let mapOrder      = null;
  let mapAdminPrev  = null;
  let vehicleMarker = null;
  let orderMarker   = null;
  let adminMarker   = null;

  const TILE_URL    = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const TILE_ATTRIB = '&copy; OpenStreetMap';

  function markerIcon(color) {
    return L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:${color};border:3px solid #0e0e0e;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  function popupContent(desc) {
    return `<strong style="font-family:monospace;font-size:12px;">Cafe Movil</strong><br>
            <span style="font-size:11px;">${desc}</span>`;
  }

  function initHero(location) {
    if (mapHero) {
      mapHero.setView([location.lat, location.lng], 14);
      vehicleMarker?.setLatLng([location.lat, location.lng]);
      return;
    }
    mapHero = L.map('map-hero', { zoomControl: true, scrollWheelZoom: false })
      .setView([location.lat, location.lng], 14);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIB }).addTo(mapHero);
    vehicleMarker = L.marker([location.lat, location.lng], { icon: markerIcon('#d9b945') })
      .addTo(mapHero)
      .bindPopup(popupContent(location.descripcion))
      .openPopup();
  }

  function initOrder(location) {
    const textEl = document.getElementById('vehicle-location-text');
    if (mapOrder) {
      mapOrder.setView([location.lat, location.lng], 15);
      orderMarker?.setLatLng([location.lat, location.lng]);
      if (textEl) textEl.textContent = location.descripcion;
      return;
    }
    mapOrder = L.map('map-order', { zoomControl: true, scrollWheelZoom: false })
      .setView([location.lat, location.lng], 15);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIB }).addTo(mapOrder);
    orderMarker = L.marker([location.lat, location.lng], { icon: markerIcon('#d9b945') })
      .addTo(mapOrder)
      .bindPopup(popupContent(location.descripcion))
      .openPopup();
    if (textEl) textEl.textContent = location.descripcion;
  }

  function initAdminPreview(location, enableClick = false) {
    if (mapAdminPrev) {
      mapAdminPrev.setView([location.lat, location.lng], 14);
      adminMarker?.setLatLng([location.lat, location.lng]);
      return;
    }
    mapAdminPrev = L.map('map-admin-preview', { zoomControl: true, scrollWheelZoom: false })
      .setView([location.lat, location.lng], 14);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIB }).addTo(mapAdminPrev);
    adminMarker = L.marker([location.lat, location.lng], {
      icon: markerIcon('#d9b945'),
      draggable: true,
    }).addTo(mapAdminPrev);

    // Click en el mapa mueve el marcador
    if (enableClick) {
      mapAdminPrev.on('click', function(e) {
        const { lat, lng } = e.latlng;
        adminMarker.setLatLng([lat, lng]);
        // Notifica a app.js
        if (typeof onAdminMapClick === 'function') onAdminMapClick(lat, lng);
      });

      // Arrastrar el marcador tambien actualiza los inputs
      adminMarker.on('dragend', function(e) {
        const { lat, lng } = e.target.getLatLng();
        if (typeof onAdminMapClick === 'function') onAdminMapClick(lat, lng);
      });

      // Tooltip de ayuda
      mapAdminPrev.attributionControl.setPrefix(
        '<span style="font-size:11px;">Haz clic en el mapa para mover la ubicacion</span>'
      );
    }
  }

  function moveAdminMarker(lat, lng) {
    if (adminMarker) adminMarker.setLatLng([lat, lng]);
    if (mapAdminPrev) mapAdminPrev.setView([lat, lng], 14);
  }

  function updateAll(location) {
    if (mapHero) {
      mapHero.setView([location.lat, location.lng], 14);
      vehicleMarker?.setLatLng([location.lat, location.lng])
        .setPopupContent(popupContent(location.descripcion));
    }
    if (mapOrder) {
      mapOrder.setView([location.lat, location.lng], 15);
      orderMarker?.setLatLng([location.lat, location.lng])
        .setPopupContent(popupContent(location.descripcion));
      const textEl = document.getElementById('vehicle-location-text');
      if (textEl) textEl.textContent = location.descripcion;
    }
    if (mapAdminPrev) {
      mapAdminPrev.setView([location.lat, location.lng], 14);
      adminMarker?.setLatLng([location.lat, location.lng]);
    }
  }

  return { initHero, initOrder, initAdminPreview, moveAdminMarker, updateAll };
})();
