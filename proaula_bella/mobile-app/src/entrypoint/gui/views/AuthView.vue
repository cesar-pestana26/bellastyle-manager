<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage } from '../context';
import type { PortalRol } from '../../../domain/model/BellaModels';

const app = useApplication();
const router = useRouter();
const route = useRoute();

const modo = ref<'login' | 'registro'>('login');
const rol = ref<PortalRol>('cliente');
const username = ref('');
const password = ref('');
const verPassword = ref(false);
const regNombre = ref('');
const regTelefono = ref('');
const regEmail = ref('');
const busy = ref(false);
const error = ref('');

onIonViewWillEnter(() => {
  password.value = '';
  error.value = '';
});

async function entrar() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await app.login({ username: username.value.trim().toLowerCase(), password: password.value, rol: rol.value });
    password.value = '';
    window.dispatchEvent(new Event('session-changed'));
    const destino = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/mis-citas';
    await router.replace(destino);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}

async function registrarse() {
  if (busy.value) return;
  // Mismas reglas que la web: nombre solo letras y teléfono de 10 dígitos
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{3,80}$/.test(regNombre.value.trim())) {
    error.value = 'El nombre solo puede tener letras y espacios.';
    return;
  }
  if (regTelefono.value && !/^\d{10}$/.test(regTelefono.value.trim())) {
    error.value = 'El teléfono debe tener 10 dígitos.';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    await app.registrarClienta({
      nombre: regNombre.value.trim(),
      username: username.value.trim().toLowerCase(),
      password: password.value,
      telefono: regTelefono.value.trim(),
      email: regEmail.value.trim(),
    });
    rol.value = 'cliente';
    busy.value = false;
    await entrar();
  } catch (e) {
    error.value = errorMessage(e);
    busy.value = false;
  }
}
</script>

<template>
  <IonPage>
    <IonContent class="auth-content">
      <main class="auth-card">
        <RouterLink to="/" class="enlace">← Volver al inicio</RouterLink>
        <div class="logo" style="margin-top:12px;">
          <img src="/logo.webp" alt="" />
          <strong>Bella<span>Style</span></strong>
        </div>
        <p class="eyebrow">App móvil · Vue + Ionic + Capacitor</p>
        <h1>{{ modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta de clienta' }}</h1>

        <p v-if="route.query.expired" class="notice" role="alert">Tu sesión venció. Inicia sesión nuevamente.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <template v-if="modo === 'login'">
          <div class="role-tabs" role="tablist">
            <button type="button" :class="{ active: rol === 'cliente' }" @click="rol = 'cliente'">Clienta</button>
            <button type="button" :class="{ active: rol === 'estilista' }" @click="rol = 'estilista'">Estilista</button>
            <button type="button" :class="{ active: rol === 'admin' }" @click="rol = 'admin'">Administradora</button>
          </div>
          <form class="form" @submit.prevent="entrar">
            <div class="campo">
              <label for="usuario">Usuario</label>
              <input id="usuario" v-model="username" autocomplete="username" autocapitalize="none" required />
            </div>
            <div class="campo">
              <label for="clave">Contraseña</label>
              <div class="row" style="flex-wrap:nowrap;">
                <input id="clave" v-model="password" :type="verPassword ? 'text' : 'password'" autocomplete="current-password" required />
                <button type="button" class="button secondary" style="min-width:64px;" @click="verPassword = !verPassword">
                  {{ verPassword ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>
            <button class="button primary full" :disabled="busy">{{ busy ? 'Verificando…' : 'Entrar' }}</button>
          </form>
          <p class="muted small" style="margin-top:12px;">Por seguridad, después de 3 intentos fallidos la cuenta se bloquea 3 minutos.</p>
          <button type="button" class="button ghost full" style="margin-top:6px;" @click="modo = 'registro'; error = ''">
            ¿No tienes cuenta? Regístrate
          </button>
        </template>

        <template v-else>
          <form class="form" @submit.prevent="registrarse">
            <div class="campo">
              <label for="rnombre">Nombre completo</label>
              <input id="rnombre" v-model="regNombre" required />
            </div>
            <div class="campo">
              <label for="rusuario">Usuario</label>
              <input id="rusuario" v-model="username" autocapitalize="none" required />
            </div>
            <div class="campo">
              <label for="rclave">Contraseña (mínimo 6)</label>
              <input id="rclave" v-model="password" type="password" minlength="6" required />
            </div>
            <div class="campo">
              <label for="rtel">Teléfono (10 dígitos)</label>
              <input id="rtel" v-model="regTelefono" type="tel" inputmode="numeric" maxlength="10" />
            </div>
            <div class="campo">
              <label for="rcorreo">Correo electrónico</label>
              <input id="rcorreo" v-model="regEmail" type="email" />
            </div>
            <p class="muted small">Escribe al menos el teléfono o el correo: con ellos recuperas tu contraseña.</p>
            <button class="button primary full" :disabled="busy">{{ busy ? 'Creando cuenta…' : 'Crear cuenta y entrar' }}</button>
            <button type="button" class="button secondary full" @click="modo = 'login'; error = ''">← Volver</button>
          </form>
        </template>
      </main>
    </IonContent>
  </IonPage>
</template>
