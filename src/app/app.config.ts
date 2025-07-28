import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const MAT_FORM_FIELD_CONFIG = {
  provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
  useValue: {
    hideRequiredMarker: true, // 👈 oculta el asterisco
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    MAT_FORM_FIELD_CONFIG,
  ],
};
