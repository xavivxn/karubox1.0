/**
 * Testimonios de la landing (sección confianza).
 * Para sumar un cliente: agregar un objeto al array; el layout elige solo carrusel o “historia destacada”.
 */
export type LandingTrustCategory = "lomitería" | "pizzería" | "hamburguesería";

export type LandingTrustTestimonial = {
  name: string;
  business: string;
  category: LandingTrustCategory;
  quote: string;
  /** Ruta en /public; si falta, se muestra avatar degradado */
  imageSrc?: string;
  /** Cargo debajo del nombre, p. ej. «Propietario» */
  role?: string;
  /** Usuario del negocio sin @; se muestra « · @usuario » junto al nombre del negocio */
  businessHandle?: string;
  /**
   * Foto debajo del testimonio (estilo pegatina): el local operando con KarúBox.
   * Ruta en /public. Cada cliente puede tener la suya al sumarse al array.
   */
  operationImageSrc?: string;
  /** Texto alternativo de `operationImageSrc`; si falta, se genera con nombre y negocio. */
  operationImageAlt?: string;
};

export const LANDING_TRUST_CATEGORY_LABEL: Record<LandingTrustCategory, string> = {
  lomitería: "Lomitería",
  pizzería: "Pizzería",
  hamburguesería: "Hamburguesería",
};

export const LANDING_TRUST_TESTIMONIALS: LandingTrustTestimonial[] = [
  {
    name: "Michel Brondell",
    business: "Atlas Burguer",
    category: "hamburguesería",
    quote:
      "KarúBox profesionalizó nuestro local de comidas rápidas y nos dio el orden para crecer. En plena hora pico el sistema vuela y tener ventas e inventario al día es otra cosa. Chau planillas; ahora nos enfocamos 100% en la calidad y en que los clientes siempre vuelvan.",
    imageSrc: "/landing/atlas-burguer.png",
    role: "Propietario",
    businessHandle: "atlas_burguer24",
    operationImageSrc: "/landing/atlas-burguer-operando.png",
    operationImageAlt:
      "Michel Brondell usando KarúBox con notebook e impresora de tickets en el local",
  },
];
