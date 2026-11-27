<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ fotos: string[]; nombre: string }>();

const pista = ref<HTMLElement | null>(null);
const actual = ref(0);
const visor = ref<HTMLDialogElement | null>(null);
const enVisor = ref(0);

function alDeslizar() {
  const el = pista.value;
  if (!el || !el.clientWidth) return;
  actual.value = Math.round(el.scrollLeft / el.clientWidth);
}

function irA(i: number) {
  const el = pista.value;
  if (!el) return;
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
}

function abrir(i: number) {
  enVisor.value = i;
  visor.value?.showModal();
}

function mover(paso: number) {
  const total = props.fotos.length;
  enVisor.value = (enVisor.value + paso + total) % total;
}

function cerrar() {
  visor.value?.close();
  irA(enVisor.value);
}

let inicioX = 0;
function tocar(e: TouchEvent) {
  inicioX = e.touches[0].clientX;
}
function soltar(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - inicioX;
  if (Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1);
}
</script>

<template>
  <div class="carrusel">
    <div ref="pista" class="carrusel-pista" @scroll.passive="alDeslizar">
      <button v-for="(url, i) in fotos" :key="url" type="button" class="carrusel-item" :aria-label="`Ver foto ${i + 1} de ${fotos.length}`" @click="abrir(i)">
        <img :src="url" :alt="`${nombre} (foto ${i + 1})`" loading="lazy" />
      </button>
    </div>
    <template v-if="fotos.length > 1">
      <span class="carrusel-contador">{{ actual + 1 }}/{{ fotos.length }}</span>
      <button v-if="actual > 0" type="button" class="carrusel-flecha izq" aria-label="Foto anterior" @click="irA(actual - 1)">‹</button>
      <button v-if="actual < fotos.length - 1" type="button" class="carrusel-flecha der" aria-label="Foto siguiente" @click="irA(actual + 1)">›</button>
      <div class="carrusel-puntos">
        <button v-for="(url, i) in fotos" :key="url" type="button" :class="{ activo: i === actual }" :aria-label="`Ir a la foto ${i + 1}`" @click="irA(i)"></button>
      </div>
    </template>

    <dialog ref="visor" class="visor" @click.self="cerrar" @cancel.prevent="cerrar">
      <div class="visor-caja" @touchstart.passive="tocar" @touchend.passive="soltar">
        <img :src="fotos[enVisor]" :alt="`${nombre} (foto ${enVisor + 1})`" />
        <div class="visor-barra">
          <button v-if="fotos.length > 1" type="button" aria-label="Foto anterior" @click="mover(-1)">‹</button>
          <span>{{ nombre }} · {{ enVisor + 1 }} de {{ fotos.length }}</span>
          <button v-if="fotos.length > 1" type="button" aria-label="Foto siguiente" @click="mover(1)">›</button>
        </div>
        <button type="button" class="button primary full" @click="cerrar">Cerrar</button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.carrusel { position: relative; margin-bottom: 10px; }
.carrusel-pista { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 14px; background: var(--card-2); }
.carrusel-pista::-webkit-scrollbar { display: none; }
.carrusel-item { flex: 0 0 100%; scroll-snap-align: start; padding: 0; border: 0; background: none; aspect-ratio: 4 / 3; cursor: zoom-in; }
.carrusel-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.carrusel-contador { position: absolute; top: 8px; right: 8px; padding: 2px 8px; border-radius: 999px; background: rgba(15, 12, 21, 0.75); color: #fff; font-size: 12px; font-weight: 600; }
.carrusel-flecha { position: absolute; top: calc(50% - 18px); width: 32px; height: 32px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.25); background: rgba(15, 12, 21, 0.75); color: #fff; font-size: 20px; line-height: 1; display: grid; place-items: center; }
.carrusel-flecha.izq { left: 8px; }
.carrusel-flecha.der { right: 8px; }
.carrusel-puntos { position: absolute; bottom: 8px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
.carrusel-puntos button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 999px; background: rgba(255, 255, 255, 0.45); }
.carrusel-puntos button.activo { width: 18px; background: #fff; }
.visor { padding: 0; border: 0; border-radius: 16px; background: #0f0c15; color: #f6f1f7; width: min(94vw, 560px); max-height: 92vh; }
.visor::backdrop { background: rgba(0, 0, 0, 0.8); }
.visor-caja { padding: 12px; display: grid; gap: 10px; }
.visor-caja img { width: 100%; max-height: 68vh; object-fit: contain; border-radius: 12px; }
.visor-barra { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 14px; }
.visor-barra span { flex: 1; text-align: center; }
.visor-barra button { width: 40px; height: 40px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.25); background: rgba(255, 255, 255, 0.08); color: #fff; font-size: 22px; line-height: 1; }
</style>
