<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { useApplication, errorMessage } from '../context';

const app = useApplication();
const router = useRouter();
const session = app.currentSession();
const servidor = app.apiBaseUrl();

const actual = ref('');
const nueva = ref('');
const repetir = ref('');
const ocupado = ref(false);
const error = ref('');
const exito = ref('');

async function cambiar() {
  error.value = '';
  exito.value = '';
  if (nueva.value !== repetir.value) {
    error.value = 'Las contraseñas nuevas no coinciden.';
    return;
  }
  ocupado.value = true;
  try {
    exito.value = await app.cambiarPassword(actual.value, nueva.value);
    actual.value = nueva.value = repetir.value = '';
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    ocupado.value = false;
  }
}

function salir() {
  app.logout();
  window.dispatchEvent(new Event('session-changed'));
  void router.replace('/login');
}
</script>

<template>
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Mi cuenta</IonTitle></IonToolbar></IonHeader>
    <IonContent>
      <main class="page-content">
        <p class="eyebrow">Perfil</p>
        <h1>{{ session?.nombre }}</h1>
        <section class="panel">
          <div class="row between">
            <b>@{{ session?.username }}</b>
            <span class="badge">{{ session?.rol }}</span>
          </div>
          <p class="muted small" style="margin-top:8px;">Servidor: <code>{{ servidor }}</code></p>
        </section>

        <section class="panel">
          <h2>Cambiar contraseña</h2>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <p v-if="exito" class="success" role="status">{{ exito }}</p>
          <form class="form" @submit.prevent="cambiar">
            <div class="campo"><label for="pa">Contraseña actual</label><input id="pa" v-model="actual" type="password" autocomplete="current-password" required /></div>
            <div class="campo"><label for="pn">Nueva contraseña (mínimo 6)</label><input id="pn" v-model="nueva" type="password" minlength="6" autocomplete="new-password" required /></div>
            <div class="campo"><label for="pr">Repite la nueva</label><input id="pr" v-model="repetir" type="password" minlength="6" autocomplete="new-password" required /></div>
            <button class="button primary full" :disabled="ocupado">{{ ocupado ? 'Guardando…' : 'Cambiar contraseña' }}</button>
          </form>
        </section>

        <button type="button" class="button danger full" @click="salir">Cerrar sesión</button>
      </main>
    </IonContent>
  </IonPage>
</template>
