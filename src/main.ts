/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);

registerLocaleData(localeEsPe);
