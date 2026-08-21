/* ═══════════════════════════════════════════════════════════════════
   Cabañas Los Reales de los Siete Lagos — comportamiento
   Un IIFE. Sin librerías, sin build. Si este archivo no carga, la
   página se sigue leyendo entera: el contenido está en el HTML.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var raiz = document.documentElement;

  /* El script del <head> puso .js y programó quitarla a los 4 s por si
     este archivo nunca llegaba. Llegó, así que se cancela ese rescate —
     sin el clearTimeout la clase se cae igual a los cuatro segundos y
     las animaciones se apagan solas a media página. */
  if (window.rescateJS) { clearTimeout(window.rescateJS); window.rescateJS = null; }
  raiz.classList.add('js');

  /* La portada no se toca desde acá. Entra con @keyframes en el CSS,
     sin pasar por este archivo ni por el observer: el primer pantallazo
     no puede quedar colgando de que un script dispare. */

  /* ── 1 · Reveals de scroll ──────────────────────────────────────
     La clase .revelar se pone desde acá, no en el HTML. Así, si este
     archivo no carga, nada queda oculto: el CSS sólo esconde lo que
     el script alcanzó a marcar.                                     */
  var candidatos = document.querySelectorAll(
    '.titular, .aguas__principal > *, .aguas__mosaico > *,' +
    '.boleta, .diferencia, .remate, .cabana, .subtitulo,' +
    '.rejilla-interior > *, .hueco-foto,' +
    '.tabla-marco, .letra-chica, .ficha, .friso, .siete__item,' +
    '.lagos__doble > .foto, .ruta,' +
    '.llegar__nota, .caja--doble > .foto, .form, .contacto,' +
    '.hablemos__titulo, .hablemos__rejilla > div, .hablemos__acciones'
  );

  function mostrar(el) { el.classList.add('visible'); }

  /* ¿Ya está dentro de la ventana en este instante? Los observers no
     siempre notifican lo que estaba visible desde el principio, y un
     elemento que nunca recibe su notificación se queda invisible para
     siempre.
     Se mira SÓLO el borde de arriba a propósito: si además se exigiera
     que el elemento siguiera en pantalla, todo lo que quedó más arriba
     —al recargar a media altura, cosa que Chrome hace solo al volver
     atrás— se quedaría oculto por el resto de la visita. */
  function enPantalla(el) {
    var r = el.getBoundingClientRect();
    var alto = window.innerHeight || document.documentElement.clientHeight;
    return r.top < alto * 0.94;
  }

  if ('IntersectionObserver' in window) {
    var mirador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        mostrar(e.target);
        mirador.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(candidatos, function (el) {
      el.classList.add('revelar');

      /* El retardo se cuenta entre hermanos, no sobre toda la página:
         si no, los últimos elementos esperarían segundos. */
      var pos = 0, prev = el.previousElementSibling;
      while (prev && pos < 6) { pos++; prev = prev.previousElementSibling; }
      if (pos > 0) el.classList.add('retardo-' + pos);

      if (enPantalla(el)) { mostrar(el); return; }
      mirador.observe(el);
    });

    /* Cinturón de seguridad, en dos tiempos.

       A los 6 s se destapa lo que esté en pantalla en ese instante.
       Pero eso solo no basta: si el observer no dispara nunca, todo lo
       que viene más abajo sigue invisible por el resto de la visita.
       Por eso, si quedó algo pendiente, se engancha un oyente de scroll
       que va destapando a medida que se baja, y se desengancha solo
       cuando no queda nada. Prefiero perder una animación antes que
       entregarle al cliente una sección en blanco que yo no vi fallar. */
    setTimeout(function () {
      var barrido = function () {
        var pendientes = document.querySelectorAll('.revelar:not(.visible)');
        Array.prototype.forEach.call(pendientes, function (el) {
          if (enPantalla(el)) mostrar(el);
        });
        return document.querySelectorAll('.revelar:not(.visible)').length;
      };

      if (barrido() === 0) return;

      var alDesplazar = function () {
        if (barrido() === 0) {
          window.removeEventListener('scroll', alDesplazar);
          window.removeEventListener('resize', alDesplazar);
        }
      };
      window.addEventListener('scroll', alDesplazar, { passive: true });
      window.addEventListener('resize', alDesplazar, { passive: true });
    }, 6000);
  }

  /* ── 2 · Formulario de reserva → WhatsApp ───────────────────────── */
  var FONO = '56959019124';
  var form = document.getElementById('form-reserva');
  var resumen = document.getElementById('resumen');

  if (form && resumen) {
    var campos = {
      nombre:   document.getElementById('f-nombre'),
      cabana:   document.getElementById('f-cabana'),
      llegada:  document.getElementById('f-llegada'),
      salida:   document.getElementById('f-salida'),
      personas: document.getElementById('f-personas'),
      nota:     document.getElementById('f-nota')
    };

    /* Las fechas no pueden ser de ayer. */
    var hoy = new Date().toISOString().slice(0, 10);
    campos.llegada.min = hoy;
    campos.salida.min = hoy;

    function noches() {
      var a = campos.llegada.value, b = campos.salida.value;
      if (!a || !b) return 0;
      var dif = (new Date(b) - new Date(a)) / 86400000;
      return dif > 0 ? Math.round(dif) : 0;
    }

    function fecha(iso) {
      if (!iso) return '';
      var p = iso.split('-');
      return p[2] + '-' + p[1] + '-' + p[0];
    }

    function pintarResumen() {
      var n = noches();
      var gente = (parseInt(campos.personas.value, 10) || 1);
      var txt = gente + (gente === 1 ? ' persona' : ' personas');

      if (n > 0) {
        txt += ', ' + n + (n === 1 ? ' noche' : ' noches');
        txt += ' — del ' + fecha(campos.llegada.value) + ' al ' + fecha(campos.salida.value);
      } else if (campos.llegada.value && campos.salida.value) {
        txt += ', la salida debe ser posterior a la llegada.';
      } else {
        txt += ', sin fechas elegidas todavía.';
      }

      if (campos.cabana.value) txt += ' · Cabaña ' + campos.cabana.value;
      resumen.textContent = txt;
    }

    Object.keys(campos).forEach(function (k) {
      campos[k].addEventListener('input', pintarResumen);
      campos[k].addEventListener('change', pintarResumen);
    });

    /* La llegada empuja la salida: no se puede pedir salir antes de entrar. */
    campos.llegada.addEventListener('change', function () {
      campos.salida.min = campos.llegada.value || hoy;
      if (campos.salida.value && campos.salida.value <= campos.llegada.value) {
        campos.salida.value = '';
      }
      pintarResumen();
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      /* Si escribió las dos fechas y quedaron al revés, no se manda un
         mensaje que diga "fechas por confirmar" tragándose lo que la
         persona sí escribió: se le devuelve el foco al campo malo y el
         resumen —que es un role="status"— ya explica el problema. */
      if (campos.llegada.value && campos.salida.value && noches() === 0) {
        campos.salida.focus();
        return;
      }

      var l = [];
      l.push('Hola, quiero reservar directo en Cabañas Los Reales de los Siete Lagos.');
      l.push('');
      if (campos.nombre.value.trim()) l.push('Nombre: ' + campos.nombre.value.trim());
      l.push('Personas: ' + (parseInt(campos.personas.value, 10) || 1));
      if (campos.cabana.value) l.push('Cabaña: ' + campos.cabana.value);

      var n = noches();
      if (n > 0) {
        l.push('Llegada: ' + fecha(campos.llegada.value));
        l.push('Salida: ' + fecha(campos.salida.value));
        l.push('Noches: ' + n);
      } else {
        l.push('Fechas: por confirmar');
      }
      if (campos.nota.value.trim()) { l.push(''); l.push(campos.nota.value.trim()); }

      window.open('https://wa.me/' + FONO + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
    });

    pintarResumen();
  }

  /* ── 3 · Sección activa en el menú y pastilla deslizante ───────── */
  var cabecera = document.querySelector('.cabecera');
  var pastilla = document.querySelector('.nav__pastilla');
  var enlaces = document.querySelectorAll('.nav a[href^="#"]');
  var destinos = [];
  Array.prototype.forEach.call(enlaces, function (a) {
    var s = document.querySelector(a.getAttribute('href'));
    if (s) destinos.push({ enlace: a, seccion: s });
  });

  /* La pastilla se para debajo del enlace que se le pase. No se toca si
     el CSS la tiene escondida —en el teléfono lo está—, porque ahí
     offsetLeft se mide dentro de un contenedor que además se desliza de
     lado y el cálculo se desfasa. */
  function moverPastilla(a) {
    if (!pastilla || pastilla.offsetParent === null) return;
    if (!a || a.classList.contains('nav__cta')) { pastilla.style.opacity = '0'; return; }
    pastilla.style.width = a.offsetWidth + 'px';
    pastilla.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    pastilla.style.opacity = '1';
  }

  function enlaceActivo() {
    for (var i = 0; i < destinos.length; i++) {
      if (destinos[i].enlace.getAttribute('aria-current') === 'true') return destinos[i].enlace;
    }
    return null;
  }

  if (destinos.length && 'IntersectionObserver' in window) {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var d = destinos.filter(function (x) { return x.seccion === e.target; })[0];
        if (d) d.enlace.setAttribute('aria-current', e.isIntersecting ? 'true' : 'false');
      });
      moverPastilla(enlaceActivo());
    }, { rootMargin: '-45% 0px -45% 0px' });

    destinos.forEach(function (d) { vigia.observe(d.seccion); });
  }

  /* Con el cursor encima, la pastilla sigue al enlace de abajo; al
     salir del menú vuelve al de la sección que se está leyendo. El
     'focus' está incluido para que el recorrido con teclado se vea
     igual que el del mouse. */
  var menu = document.querySelector('.nav');
  if (menu && pastilla) {
    Array.prototype.forEach.call(enlaces, function (a) {
      a.addEventListener('mouseenter', function () { moverPastilla(a); });
      a.addEventListener('focus', function () { moverPastilla(a); });
    });
    menu.addEventListener('mouseleave', function () { moverPastilla(enlaceActivo()); });
    window.addEventListener('resize', function () { moverPastilla(enlaceActivo()); }, { passive: true });
  }

  /* ── 4 · La isla se encoge al despegar del tope ─────────────────
     Un oyente de scroll pasivo que sólo compara un booleano y toca el
     DOM cuando el estado cambia de verdad. Más barato que un observer
     y, a diferencia de él, acá la notificación llega igual. */
  if (cabecera) {
    var pegada = false;
    var revisarCabecera = function () {
      var ahora = window.scrollY > 40;
      if (ahora === pegada) return;
      pegada = ahora;
      cabecera.classList.toggle('cabecera--pegada', pegada);
    };
    window.addEventListener('scroll', revisarCabecera, { passive: true });
    revisarCabecera();
  }

  /* ── 5 · El borde de las tarjetas se enciende bajo el cursor ─────
     Un solo oyente delegado en el documento, no uno por tarjeta, y
     sólo con puntero fino: en una pantalla táctil no hay cursor que
     seguir y sería trabajo tirado a la basura. Lo único que hace es
     escribir dos variables CSS; el dibujo lo pone la hoja de estilo. */
  var TARJETAS = '.cabana, .ficha, .diferencia, .tabla-marco, .form,' +
                 ' .hueco-foto__marco, .hablemos__rejilla > div, .contacto__item';

  if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.addEventListener('pointermove', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest(TARJETAS) : null;
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      t.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    }, { passive: true });
  }

})();
