import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { RouterModule } from '@angular/router';
import {
  MatDrawer,
  MatSidenav,
  MatSidenavModule,
} from '@angular/material/sidenav';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule, SidenavComponent, MatSidenavModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  edgeHoverZone = 15; // px desde el borde izquierdo

  // checkEdgeHover(event: MouseEvent, drawer: MatSidenav) {
  //   if (event.clientX < this.edgeHoverZone && !drawer.opened) {
  //     drawer.open();
  //   }
  // }

  // openDrawer(drawer: MatDrawer) {
  //   drawer.open();
  // }

  // closeDrawer(drawer: MatDrawer) {
  //   drawer.close();
  // }

  openDrawer(sidenav: MatSidenav) {
    sidenav.open();
  }

  closeDrawer(sidenav: MatSidenav) {
    sidenav.close();
  }

  checkEdgeHover(event: MouseEvent, sidenav: MatSidenav) {
    const threshold = 10; // px desde el borde izquierdo
    if (event.clientX <= threshold && !sidenav.opened) {
      sidenav.open();
    }
  }
}
