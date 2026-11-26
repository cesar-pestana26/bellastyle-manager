import type {
  BellaSession, PortalRol, ServicioBella, FotoServicio, EstilistaBella, ProductoBella,
  CitaBella, PagoBella, DatosCobroSalon, PedidoBella, ItemCarritoBella, FotoVitrina,
} from '../../domain/model/BellaModels';
import type { SessionStore } from '../../domain/ports/out/SessionStore';
import { DomainError } from '../../domain/exceptions/errors';
import { HttpClient } from '../../adapters/http/HttpClient';

interface Respuesta<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class BellaApplicationService {
  constructor(
    private readonly http: HttpClient,
    private readonly sessions: SessionStore,
    private readonly origen: string
  ) {}

  apiBaseUrl(): string {
    return this.http.getBaseUrl();
  }

  imagen(ruta: string): string {
    return `${this.origen}${ruta}`;
  }

  currentSession(): BellaSession | null {
    return this.sessions.get();
  }

  esClienta(): boolean {
    return this.currentSession()?.rol === 'Clienta';
  }

  logout(): void {
    this.sessions.clear();
  }

  async login(params: { username: string; password: string; rol: PortalRol }): Promise<BellaSession> {
    const res = await this.http.request<{ token: string; user: Omit<BellaSession, 'token'>; message?: string }>(
      '/login', 'POST', params, false);
    if (!res.token || !res.user) throw new DomainError(res.message || 'No se pudo iniciar sesión.');
    const sesion: BellaSession = { ...res.user, token: res.token };
    this.sessions.save(sesion);
    return sesion;
  }

  async registrarClienta(params: { nombre: string; username: string; password: string; telefono: string; email: string }): Promise<string> {
    const res = await this.http.request<Respuesta<never>>('/register', 'POST', { ...params, rol: 'cliente' }, false);
    return res.message || 'Cuenta creada.';
  }

  async cambiarPassword(actual: string, nueva: string): Promise<string> {
    const res = await this.http.request<Respuesta<never>>('/mi-cuenta/password', 'PUT', { actual, nueva });
    return res.message || 'Contraseña actualizada.';
  }

  async listarServicios(): Promise<ServicioBella[]> {
    return (await this.http.request<Respuesta<ServicioBella[]>>('/servicios', 'GET', undefined, false)).data || [];
  }

  async listarFotosServicios(): Promise<FotoServicio[]> {
    return (await this.http.request<Respuesta<FotoServicio[]>>('/fotos-servicios', 'GET', undefined, false)).data || [];
  }

  async listarEstilistas(): Promise<EstilistaBella[]> {
    return (await this.http.request<Respuesta<EstilistaBella[]>>('/estilistas', 'GET', undefined, false)).data || [];
  }

  async listarProductos(): Promise<ProductoBella[]> {
    return (await this.http.request<Respuesta<ProductoBella[]>>('/productos', 'GET', undefined, false)).data || [];
  }

  async listarVitrina(): Promise<FotoVitrina[]> {
    return (await this.http.request<Respuesta<FotoVitrina[]>>('/vitrina', 'GET', undefined, false)).data || [];
  }

  async horasLibres(idServicio: number, fecha: string, idEstilista?: number): Promise<string[]> {
    const q = new URLSearchParams({ idServicio: String(idServicio), fecha });
    if (idEstilista) q.set('idEstilista', String(idEstilista));
    const sesion = this.currentSession();
    if (sesion) q.set('idUsuario', String(sesion.id));
    const res = await this.http.request<Respuesta<{ horas: string[] }>>(`/disponibilidad?${q}`, 'GET', undefined, false);
    return res.data?.horas || [];
  }

  async crearCita(params: { idServicio: number; fecha: string; hora: string; idEstilista?: number; observaciones?: string }): Promise<string> {
    const sesion = this.currentSession();
    if (!sesion) throw new DomainError('Inicia sesión para agendar tu cita.');
    const res = await this.http.request<Respuesta<never>>('/citas', 'POST', { idUsuario: sesion.id, ...params });
    return res.message || 'Cita agendada.';
  }

  async listarCitas(): Promise<CitaBella[]> {
    return (await this.http.request<Respuesta<CitaBella[]>>('/citas')).data || [];
  }

  async cancelarCita(idCita: number): Promise<string> {
    const res = await this.http.request<Respuesta<never>>(`/citas/${idCita}/estado`, 'PUT', { estado: 'Cancelada' });
    return res.message || 'Cita cancelada.';
  }

  async calificarCita(idCita: number, estrellas: number, comentario: string): Promise<string> {
    const res = await this.http.request<Respuesta<never>>(`/citas/${idCita}/calificacion`, 'POST', { estrellas, comentario });
    return res.message || '¡Gracias por tu calificación!';
  }

  async listarPagos(): Promise<PagoBella[]> {
    return (await this.http.request<Respuesta<PagoBella[]>>('/pagos')).data || [];
  }

  async datosCobroSalon(): Promise<DatosCobroSalon | null> {
    return (await this.http.request<Respuesta<DatosCobroSalon | null>>('/pago-salon', 'GET', undefined, false)).data;
  }

  async pagarCita(idCita: number, metodo: 'Bre-B' | 'Efectivo / Salón', comprobante?: string): Promise<string> {
    const res = await this.http.request<Respuesta<PagoBella>>('/pagos', 'POST', { idCita, metodo, comprobante });
    return res.message || 'Pago registrado.';
  }

  obtenerCarrito(): ItemCarritoBella[] {
    return this.sessions.getCart();
  }

  private guardarCarrito(items: ItemCarritoBella[]): void {
    this.sessions.saveCart(items);
    window.dispatchEvent(new Event('cart-changed'));
  }

  agregarAlCarrito(producto: ProductoBella): void {
    const carrito = this.obtenerCarrito();
    const item = carrito.find((it) => it.id_producto === producto.id_producto);
    if (item) {
      if (item.cantidad < Math.min(producto.stock, 20)) item.cantidad += 1;
    } else if (producto.stock > 0) {
      carrito.push({ id_producto: producto.id_producto, cantidad: 1 });
    }
    this.guardarCarrito(carrito);
  }

  cambiarCantidad(idProducto: number, delta: number, stock: number): void {
    let carrito = this.obtenerCarrito();
    const item = carrito.find((it) => it.id_producto === idProducto);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) carrito = carrito.filter((it) => it.id_producto !== idProducto);
    else if (nueva <= Math.min(stock, 20)) item.cantidad = nueva;
    this.guardarCarrito(carrito);
  }

  vaciarCarrito(): void {
    this.guardarCarrito([]);
  }

  async hacerPedido(): Promise<string> {
    const items = this.obtenerCarrito();
    if (items.length === 0) throw new DomainError('Tu carrito está vacío.');
    const res = await this.http.request<Respuesta<{ id: number; total: number }>>('/pedidos', 'POST', {
      items: items.map((it) => ({ id: it.id_producto, cantidad: it.cantidad })),
    });
    this.vaciarCarrito();
    return res.message || 'Pedido recibido.';
  }

  async listarPedidos(): Promise<PedidoBella[]> {
    return (await this.http.request<Respuesta<PedidoBella[]>>('/pedidos')).data || [];
  }
}
