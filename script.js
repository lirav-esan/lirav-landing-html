document.addEventListener('DOMContentLoaded', function () {
	inicializarCarruselFila5({ selector: '.carrusel-fila-5', autoplay: true, intervalo: 4000, mostrarDesktop: 2, mostrarTablet: 2, mostrarMovil: 1 });
});

function inicializarCarruselFila5(opts) {
	const root = document.querySelector(opts.selector);
	if (!root) return;


	const pista = root.querySelector('.carrusel-pista');
	let items = Array.from(pista.querySelectorAll('.carrusel-item'));
	const originalCount = items.length;
	const prevBtn = root.querySelector('.carrusel-prev');
	const nextBtn = root.querySelector('.carrusel-next');
	const indicadores = root.querySelector('.carrusel-indicadores');

	let index = 0;
	let timer = null;

	function itemsPorVista() {
		const w = window.innerWidth;
		if (w < 768) return opts.mostrarMovil || 1;
		if (w < 1024) return opts.mostrarTablet || opts.mostrarDesktop || 2;
		return opts.mostrarDesktop || 2;
	}

	function prepararLoop() {
		// prepararLoop eliminado: usamos wrap-around sin clonar
		items = Array.from(pista.querySelectorAll('.carrusel-item'));
		index = 0;
	}

	function actualizarPista() {
		const porVista = itemsPorVista();
		const gap = parseFloat(getComputedStyle(pista).gap) || 0;
		const itemAncho = (root.clientWidth - gap * (porVista - 1)) / porVista;
		items.forEach(i => i.style.width = itemAncho + 'px');

		const distancia = -index * (itemAncho + gap);

		// ensure transition applies
		void pista.offsetWidth;
		requestAnimationFrame(() => {
			pista.style.transition = 'transform 450ms cubic-bezier(.22,.9,.36,1)';
			pista.style.transform = `translateX(${distancia}px)`;
		});
		actualizarIndicadores();
	}

	function siguiente() {
		const porVista = itemsPorVista();
		const maxIndex = Math.max(0, originalCount - porVista);
		if (index >= maxIndex) index = 0; else index++;
		actualizarPista();
	}

	function anterior() {
		const porVista = itemsPorVista();
		const maxIndex = Math.max(0, originalCount - porVista);
		if (index <= 0) index = maxIndex; else index--;
		actualizarPista();
	}

	function reiniciarAutoplay() {
		if (!opts.autoplay) return;
		pararAutoplay();
		timer = setInterval(() => {
			const porVista = itemsPorVista();
			const maxIndex = Math.max(0, originalCount - porVista);
			if (index >= maxIndex) index = 0; else index++;
			actualizarPista();
		}, opts.intervalo || 4000);
	}

	function pararAutoplay() {
		if (timer) { clearInterval(timer); timer = null; }
	}

	// Indicadores (basados en originalCount)
	function crearIndicadores() {
		indicadores.innerHTML = '';
		const porVista = itemsPorVista();
		const pasos = Math.max(1, originalCount - porVista + 1);
		for (let i = 0; i < pasos; i++) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.setAttribute('aria-label', 'Ir al slide ' + (i + 1));
			btn.addEventListener('click', () => { index = i; actualizarPista(); reiniciarAutoplay(); });
			indicadores.appendChild(btn);
		}
		actualizarIndicadores();
	}

	function actualizarIndicadores() {
		const porVista = itemsPorVista();
		const pasos = Math.max(1, originalCount - porVista + 1);
		const botones = Array.from(indicadores.children);
		const logicalIndex = Math.min(Math.max(0, index), pasos - 1);
		botones.forEach((b, i) => {
			b.removeAttribute('aria-current');
			if (i === logicalIndex) b.setAttribute('aria-current', 'true');
		});
	}

	// Eventos
	nextBtn.addEventListener('click', () => { siguiente(); reiniciarAutoplay(); });
	prevBtn.addEventListener('click', () => { anterior(); reiniciarAutoplay(); });

	// teclado
	root.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowLeft') { anterior(); reiniciarAutoplay(); }
		if (e.key === 'ArrowRight') { siguiente(); reiniciarAutoplay(); }
	});
	root.tabIndex = 0;

	// tactil
	let startX = 0, deltaX = 0, dragging = false;
	pista.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; pista.setPointerCapture(e.pointerId); pararAutoplay(); });
	pista.addEventListener('pointermove', (e) => { if (!dragging) return; deltaX = e.clientX - startX; });
	pista.addEventListener('pointerup', (e) => { if (!dragging) return; dragging = false; if (Math.abs(deltaX) > 40) { if (deltaX < 0) { // swipe left
			siguiente();
		} else { anterior(); } } deltaX = 0; reiniciarAutoplay(); });

	// pausa en hover/focus
	root.addEventListener('mouseenter', pararAutoplay);
	root.addEventListener('mouseleave', reiniciarAutoplay);
	root.addEventListener('focusin', pararAutoplay);
	root.addEventListener('focusout', reiniciarAutoplay);

	// ya no usamos transitionend para clonaje — el comportamiento es wrap-around simple

	// resize
	window.addEventListener('resize', () => { items = Array.from(pista.querySelectorAll('.carrusel-item')); crearIndicadores(); actualizarPista(); });

	// inicialización
	prepararLoop();
	crearIndicadores();
	actualizarPista();
	reiniciarAutoplay();

	return { next: siguiente, prev: anterior, goTo: (i) => { index = i; actualizarPista(); } };
}
